/**
 * Roam API wrapper and related utilities
 *
 * Destructive or state-changing operations go through `roam-api.js`
 * (`window.roamAlphaAPI`) whenever it is available, and only fall back to
 * simulated clicks / key events when it is not.
 */

import { Selectors, BLOCK_ACTIVATION_TIMEOUT_MS, MAX_FOLD_ALL_CLICKS } from './constants.js';
import { debugLog, warnFallback } from './logger.js';
import {
    delay,
    getActiveEditElement,
    getInputEvent,
    Keyboard,
    Mouse,
    onSelectorChange,
    waitForSelectorToExist,
} from './utils.js';
import {
    createBlock as apiCreateBlock,
    deleteBlock as apiDeleteBlock,
    focusBlock,
    getBlockUid,
    getFocusedBlock,
    getWindowId,
    isApiAvailable,
    pullBlock,
    pullBlockTree,
    redo as apiRedo,
    undo as apiUndo,
    updateBlock as apiUpdateBlock,
} from './roam-api.js';

// ============== RoamNode ==============
export class Selection {
    constructor(start = 0, end = 0) {
        this.start = start;
        this.end = end;
    }
}

export class RoamNode {
    constructor(text, selection = new Selection(0, 0)) {
        this.text = text;
        this.selection = selection;
    }

    withCursorAtTheStart() {
        return this.withSelection(new Selection(0, 0));
    }

    withCursorAtTheEnd() {
        return this.withSelection(new Selection(this.text.length, this.text.length));
    }

    withSelection(selection) {
        return new RoamNode(this.text, selection);
    }
}

// ============== Fold button lookup ==============
/**
 * Walk up from `element` looking for the nearest fold caret.
 *
 * Bounded by `document.body`: blocks without children render no caret, and the
 * previous recursive version walked past `<html>` and threw on `null.parentElement`.
 *
 * @returns {Element|null}
 */
export function nearestFoldButton(element) {
    let current = element;
    while (current && current !== document.body) {
        const foldButton = current.querySelector?.(Selectors.foldButton);
        if (foldButton) {
            return foldButton;
        }
        current = current.parentElement;
    }
    return null;
}

/**
 * Where a new block goes relative to `block`.
 *
 * Below mirrors Roam's own Enter-at-end rule: a block that has children and is
 * expanded gets a new *first child*, anything else gets a sibling directly
 * below. Above is always a sibling — there is no "above" inside a children list
 * — and inserting at the current order pushes this block, and the rest, down.
 *
 * @returns {{parentUid: string|null, order: number}}
 */
function insertionPoint(block, { above }) {
    if (above) {
        return { parentUid: block.parentUid, order: block.order };
    }
    return block.open && block.childCount > 0
        ? { parentUid: block.uid, order: 0 }
        : { parentUid: block.parentUid, order: block.order + 1 };
}

/**
 * The collapse carets on the Linked References page headers.
 *
 * Anchored on the title rather than on an ancestor section: the header is
 * `.rm-title-arrow-wrapper > [caret, .rm-ref-page-view-title]`, so walking up
 * from the title is both exact and safe — it can never match the caret that
 * would collapse the page the user is actually reading.
 *
 * @returns {Element[]}
 */
function referenceHeaderCarets(panelElement) {
    return Array.from(panelElement.querySelectorAll(Selectors.pageReferenceTitle))
        .map(title => title.parentElement?.querySelector(Selectors.foldButton))
        .filter(Boolean);
}

/**
 * Click carets until `nextCaret` stops producing them.
 *
 * Asking again every iteration is the point: each click re-renders the subtree,
 * so a list captured up front goes stale — folding drops descendants, unfolding
 * reveals more folded blocks below.
 *
 * @param {() => Element|undefined} nextCaret
 * @returns {Promise<number>} how many carets were clicked
 */
async function clickCaretsUntilDone(nextCaret) {
    let clicks = 0;
    while (clicks < MAX_FOLD_ALL_CLICKS) {
        const caret = nextCaret();
        if (!caret) break;
        await Mouse.hover(caret);
        await Mouse.leftClick(caret);
        clicks++;
    }
    return clicks;
}

/** The caret state that disagrees with where we're trying to end up. */
function caretsFacingTheWrongWay(open) {
    return open ? Selectors.foldButtonClosed : Selectors.foldButtonOpen;
}

/**
 * Which way a page-wide fold should go, judged from the top level only.
 *
 * Deciding from every block instead would make `Z` on an already-collapsed page
 * a no-op on screen, because it would spend the press collapsing descendants
 * nobody can see.
 *
 * @param {Element[]} rootBlocks outermost rendered blocks of a panel
 * @param {Element} panelElement scope for the caret fallback
 */
function anyRootExpanded(rootBlocks, panelElement) {
    const pulled = rootBlocks
        .map(element => {
            const uid = getBlockUid(element);
            return uid ? pullBlock(uid) : null;
        })
        .filter(Boolean);

    if (pulled.length > 0) {
        return pulled.some(block => block.open && block.childCount > 0);
    }
    // No datastore to ask: an open caret on screen means something is expanded.
    return !!panelElement?.querySelector(Selectors.foldButtonOpen);
}

// ============== Roam API Wrapper ==============
export const Roam = {
    async save(roamNode) {
        const roamElement = this.getRoamBlockInput();
        if (roamElement) {
            roamElement.value = roamNode.text;
            roamElement.dispatchEvent(getInputEvent());
            await delay(1);
            roamElement.setSelectionRange(roamNode.selection.start, roamNode.selection.end);
        }
    },

    getRoamBlockInput() {
        const element = getActiveEditElement();
        if (element?.tagName.toLocaleLowerCase() !== 'textarea') {
            return null;
        }
        return element;
    },

    getActiveRoamNode() {
        const element = this.getRoamBlockInput();
        if (!element) return null;
        return new RoamNode(element.value, new Selection(element.selectionStart, element.selectionEnd));
    },

    async applyToCurrent(action) {
        const node = this.getActiveRoamNode();
        if (!node) return;
        await this.save(action(node));
    },

    /**
     * Read a block's text without having to focus it.
     *
     * Falls back to activating the block and reading the textarea only when the
     * official API is unavailable — activating has the nasty side effect of
     * dropping the user into INSERT mode.
     */
    async getBlockText(element) {
        const uid = getBlockUid(element);
        const block = uid ? pullBlock(uid) : null;
        if (block) {
            return block.string;
        }
        await this.activateBlock(element);
        return this.getRoamBlockInput()?.value ?? '';
    },

    /**
     * Poll until Roam has swapped in the editing textarea.
     *
     * Replaces the old "click and hope 20ms was enough" timing assumption, which
     * made `i` / `a` / `o` silently do nothing on a slow render.
     */
    async waitForBlockInput(uid, timeout = BLOCK_ACTIVATION_TIMEOUT_MS) {
        const deadline = Date.now() + timeout;
        while (Date.now() < deadline) {
            const input = this.getRoamBlockInput();
            if (input && (!uid || input.id.endsWith(uid))) {
                return input;
            }
            await delay(16);
        }
        return this.getRoamBlockInput();
    },

    /**
     * Put the block into edit mode, optionally placing the cursor.
     * @returns {Promise<HTMLTextAreaElement|null>} the focused textarea
     */
    async activateBlock(element, { start, end } = {}) {
        if (!element) return null;

        const uid = getBlockUid(element);

        if (uid && isApiAvailable()) {
            const focused = await focusBlock({
                uid,
                windowId: getWindowId(element),
                start,
                end,
            });
            if (focused) {
                const input = await this.waitForBlockInput(uid);
                if (input) return input;
            }
        }

        if (element.classList.contains('roam-block')) {
            await Mouse.leftClick(element);
        }
        return this.waitForBlockInput(uid);
    },

    /**
     * Turn the focused block into Roam's blue block-selection (VISUAL mode).
     * @returns {Promise<boolean>} whether we ended up inside a block
     */
    async highlight(element) {
        if (element) {
            await this.activateBlock(element);
        }
        if (!this.getRoamBlockInput()) {
            return false;
        }
        await Keyboard.pressEsc();
        return true;
    },

    async deleteBlock(element) {
        try {
            const uid = getBlockUid(element);
            if (uid && (await apiDeleteBlock(uid))) {
                debugLog('roam', 'deleteBlock via API', { uid });
                return true;
            }
        } catch (error) {
            warnFallback('deleteBlock via roamAlphaAPI failed', error);
        }
        // Fallback: select the block and let Roam's own delete handle it.
        if (await this.highlight(element)) {
            await Keyboard.pressBackspace();
            return true;
        }
        return false;
    },

    async moveCursorToStart() {
        const focused = getFocusedBlock();
        if (focused && (await focusBlock({ ...focused, start: 0 }))) {
            return;
        }
        await this.applyToCurrent(node => node.withCursorAtTheStart());
    },

    async moveCursorToEnd() {
        // `setBlockFocusAndSelection` with no `selection` parks the cursor at the end.
        const focused = getFocusedBlock();
        if (focused && (await focusBlock(focused))) {
            return;
        }
        await this.applyToCurrent(node => node.withCursorAtTheEnd());
    },

    /**
     * Create an empty block below `element` and focus it (vim's `o`).
     *
     * Mirrors Roam's own Enter-at-end rule: a block that has children and is
     * expanded gets a new *first child*, anything else gets a sibling directly
     * below. Doing this through the API rather than by simulating Enter means the
     * result doesn't depend on Roam's keyboard handling or on render timing.
     *
     * @returns {Promise<string|null>} the new block's uid
     */
    async createBlockBelow(element) {
        try {
            const uid = getBlockUid(element);
            const block = uid ? pullBlock(uid) : null;
            debugLog('roam', 'createBlockBelow: resolved block', { uid, block });

            if (block) {
                const { parentUid, order } = insertionPoint(block, { above: false });

                if (parentUid) {
                    const newUid = await apiCreateBlock({ parentUid, order });
                    debugLog('roam', 'createBlockBelow: created via API', { newUid, parentUid, order });
                    if (newUid) {
                        await focusBlock({ uid: newUid, windowId: getWindowId(element) });
                        return newUid;
                    }
                }
            }
        } catch (error) {
            warnFallback('createBlockBelow via roamAlphaAPI failed', error);
        }

        // Fallback: let Roam's own Enter handling do it.
        debugLog('roam', 'createBlockBelow: using Enter fallback');
        await this.activateBlock(element);
        await this.moveCursorToEnd();
        await Keyboard.pressEnter();
        return null;
    },

    /**
     * Create an empty block above `element` and focus it (vim's `O`).
     * Always a sibling — there is no "above" inside the children list.
     *
     * @returns {Promise<string|null>} the new block's uid
     */
    async createBlockAbove(element) {
        try {
            const uid = getBlockUid(element);
            const block = uid ? pullBlock(uid) : null;
            debugLog('roam', 'createBlockAbove: resolved block', { uid, block });

            if (block?.parentUid) {
                const { parentUid, order } = insertionPoint(block, { above: true });
                const newUid = await apiCreateBlock({ parentUid, order });
                if (newUid) {
                    await focusBlock({ uid: newUid, windowId: getWindowId(element) });
                    return newUid;
                }
            }
        } catch (error) {
            warnFallback('createBlockAbove via roamAlphaAPI failed', error);
        }

        // Fallback: Enter at the very start of a block opens one above it.
        debugLog('roam', 'createBlockAbove: using Enter fallback');
        await this.activateBlock(element, { start: 0 });
        await Keyboard.pressEnter();
        return null;
    },

    /**
     * Create a run of blocks around `element`, one per string, in order (`p`).
     *
     * Unlike `createBlockBelow`, nothing is focused and nothing falls back to
     * simulated keys: paste stays in NORMAL, and the Enter fallback cannot
     * reliably chain across several blocks.
     *
     * @param {string[]} strings
     * @returns {Promise<string[]>} the uids created, newest last; empty on failure
     */
    async createBlocks(element, strings, { above = false } = {}) {
        const created = [];
        try {
            const uid = getBlockUid(element);
            const block = uid ? pullBlock(uid) : null;
            if (block) {
                const { parentUid, order } = insertionPoint(block, { above });
                if (parentUid) {
                    for (const [index, string] of strings.entries()) {
                        const newUid = await apiCreateBlock({
                            parentUid,
                            order: order + index,
                            string,
                        });
                        if (!newUid) break;
                        created.push(newUid);
                    }
                }
            }
        } catch (error) {
            warnFallback('createBlocks via roamAlphaAPI failed', error);
        }
        debugLog('roam', 'createBlocks', { wanted: strings.length, created: created.length, above });
        return created;
    },

    /**
     * Delete several blocks at once (VISUAL `d`).
     *
     * A selection can hold both a parent and its children; deleting the parent
     * takes the children with it, so the later uid is simply gone by the time we
     * reach it. Each delete is contained so one such miss can't strand the rest.
     *
     * @returns {Promise<boolean>} whether anything was deleted through the API
     */
    async deleteBlocks(elements) {
        const uids = elements.map(getBlockUid).filter(Boolean);
        let deleted = 0;
        for (const uid of uids) {
            try {
                if (await apiDeleteBlock(uid)) deleted++;
            } catch (error) {
                warnFallback(`deleteBlock via roamAlphaAPI failed for ${uid}`, error);
            }
        }
        debugLog('roam', 'deleteBlocks', { selected: elements.length, deleted });
        return deleted > 0;
    },

    async toggleFoldBlock(block) {
        try {
            const uid = getBlockUid(block);
            const pulled = uid ? pullBlock(uid) : null;
            if (pulled && (await apiUpdateBlock({ uid, open: !pulled.open }))) {
                debugLog('roam', 'toggleFoldBlock via API', { uid, open: !pulled.open });
                return true;
            }
        } catch (error) {
            warnFallback('toggleFoldBlock via roamAlphaAPI failed', error);
        }

        const foldButton = nearestFoldButton(block);
        if (!foldButton) {
            return false;
        }
        await Mouse.hover(foldButton);
        await Mouse.leftClick(foldButton);
        return true;
    },

    /**
     * Fold or unfold a whole page at once (vim's `zM` / `zR`), including the
     * per-page headers in Linked References.
     *
     * @param {Element[]} rootBlocks the panel's outermost rendered blocks
     * @param {Element} panelElement the panel, used to scope the caret clicks
     * @returns {Promise<boolean>} whether anything was folded or unfolded
     */
    async toggleFoldAll(rootBlocks, panelElement) {
        const open = !anyRootExpanded(rootBlocks, panelElement);
        const uids = rootBlocks.map(getBlockUid).filter(Boolean);
        debugLog('roam', 'toggleFoldAll', { roots: uids.length, open });

        const foldedBlocks =
            (await this.setFoldStateDeep(uids, open)) ||
            (await this.clickFoldButtonsUntilDone(panelElement, open)) > 0;

        // Reference headers get clicked either way: they are React view state,
        // not blocks, so there is no `:block/open` to write and no API for them.
        const foldedHeaders = await this.toggleReferenceHeaders(panelElement, open);

        return foldedBlocks || foldedHeaders > 0;
    },

    /**
     * Collapse or expand the page groups in Linked References.
     * @returns {Promise<number>} how many headers were toggled
     */
    async toggleReferenceHeaders(panelElement, open) {
        if (!panelElement) return 0;
        const wrongWay = caretsFacingTheWrongWay(open);
        const clicks = await clickCaretsUntilDone(() =>
            referenceHeaderCarets(panelElement).find(caret => caret.matches?.(wrongWay))
        );
        debugLog('roam', 'toggleReferenceHeaders', { open, clicks });
        return clicks;
    },

    /**
     * Set `:block/open` on `rootUids` and all of their descendants.
     * @returns {Promise<boolean>} whether the datastore path handled it
     */
    async setFoldStateDeep(rootUids, open) {
        try {
            const blocks = rootUids.flatMap(uid => pullBlockTree(uid));
            if (blocks.length === 0) {
                return false;
            }
            // Leaves have no caret and nothing to collapse; skipping them keeps a
            // fold-all on a big page down to the transactions that matter.
            const stale = blocks.filter(block => block.hasChildren && block.open !== open);
            await Promise.all(stale.map(({ uid }) => apiUpdateBlock({ uid, open })));
            debugLog('roam', 'setFoldStateDeep via API', { open, updated: stale.length });
            return true;
        } catch (error) {
            warnFallback('setFoldStateDeep via roamAlphaAPI failed', error);
            return false;
        }
    },

    /**
     * Fallback fold-all: click block carets one at a time until none are left
     * facing the wrong way.
     *
     * Reference blocks are skipped — they belong to other pages, and unlike the
     * headers above them, collapsing one is a real edit to someone else's page.
     *
     * @returns {Promise<number>} how many blocks were toggled
     */
    async clickFoldButtonsUntilDone(panelElement, open) {
        if (!panelElement) return 0;
        const wrongWay = caretsFacingTheWrongWay(open);
        const clicks = await clickCaretsUntilDone(() =>
            Array.from(panelElement.querySelectorAll(wrongWay)).find(
                caret => !caret.closest?.(Selectors.referencesRegion)
            )
        );
        debugLog('roam', 'toggleFoldAll via carets', { open, clicks });
        return clicks;
    },

    async undo() {
        if (await apiUndo()) return true;
        await Keyboard.simulateKeyCombo('z');
        return false;
    },

    async redo() {
        if (await apiRedo()) return true;
        await Keyboard.simulateKeyCombo('z', { shiftKey: true });
        return false;
    },
};

// ============== Block Utilities ==============
export { getBlockUid };

export function copyBlockReference(htmlBlockId) {
    const uid = getBlockUid(htmlBlockId);
    if (!uid) return Promise.resolve(false);
    return writeToClipboard(`((${uid}))`);
}

export function copyBlockEmbed(htmlBlockId) {
    const uid = getBlockUid(htmlBlockId);
    if (!uid) return Promise.resolve(false);
    return writeToClipboard(`{{embed: ((${uid}))}}`);
}

/** Clipboard writes reject when the document isn't focused; never let that escape. */
export async function writeToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.warn('[Roam Vim Mode] Could not write to clipboard', error);
        return false;
    }
}

// ============== Roam Events ==============
export const RoamEvent = {
    onSidebarToggle(handler) {
        const isSidebarShowing = () => !!document.querySelector(Selectors.sidebarContent);
        return onSelectorChange(Selectors.sidebar, () => {
            handler(isSidebarShowing());
        });
    },

    onSidebarChange(handler) {
        let _stopObservingInside = null;
        const isSidebarShowing = () => !!document.querySelector(Selectors.sidebarContent);
        const observeSidebarPages = () => {
            if (isSidebarShowing()) {
                _stopObservingInside = _stopObservingInside || onSelectorChange(Selectors.sidebarContent, handler);
            } else {
                stopObservingInside();
            }
        };
        const stopObservingInside = () => {
            if (_stopObservingInside) {
                _stopObservingInside();
                _stopObservingInside = null;
            }
        };
        observeSidebarPages();
        const stopObserving = RoamEvent.onSidebarToggle(observeSidebarPages);
        return () => {
            stopObserving();
            stopObservingInside();
        };
    },

    onEditBlock(handler) {
        const handleBlockEvent = (event) => {
            const element = event.target;
            if (element.classList?.contains('rm-block-input')) {
                handler(element);
            }
        };
        document.addEventListener('focusin', handleBlockEvent);
        return () => document.removeEventListener('focusin', handleBlockEvent);
    },

    onBlurBlock(handler) {
        const handleBlockEvent = (event) => {
            const element = event.target;
            if (!element.classList?.contains('rm-block-input')) return;

            const container = element.closest(Selectors.blockContainer);
            if (!container) {
                handler(null);
                return;
            }
            const selector = `${Selectors.block}#${Selectors.escapeHtmlId(element.id)}`;
            waitForSelectorToExist(selector, container, { timeout: BLOCK_ACTIVATION_TIMEOUT_MS })
                .then(handler)
                // The block can legitimately vanish (deleted, page navigated away).
                .catch(() => handler(null));
        };
        document.addEventListener('focusout', handleBlockEvent);
        return () => document.removeEventListener('focusout', handleBlockEvent);
    },

    onChangePage(handler) {
        let stopObservingContent = () => {};
        const reobserveContent = () => {
            stopObservingContent();
            stopObservingContent = onSelectorChange(Selectors.mainContent, handler);
        };
        let stopObservingMain = () => {};
        const reobserveMain = () => {
            stopObservingMain();
            stopObservingMain = onSelectorChange(Selectors.main, () => {
                reobserveContent();
                handler();
            });
        };
        reobserveContent();
        reobserveMain();
        return () => {
            stopObservingContent();
            stopObservingMain();
        };
    },
};

// ============== RoamHighlight ==============
// Note: RoamBlock is defined in panel.js to avoid a circular dependency —
// it needs VimRoamPanel, which needs RoamBlock.
export const RoamHighlight = {
    highlightedBlocks() {
        return document.querySelectorAll(`${Selectors.highlight} ${Selectors.block}`);
    },

    /** @returns {Element|null} */
    first() {
        return this.highlightedBlocks()[0] ?? null;
    },

    /** @returns {Element|null} */
    last() {
        const blocks = this.highlightedBlocks();
        return blocks[blocks.length - 1] ?? null;
    },
};
