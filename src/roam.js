/**
 * Roam API wrapper and related utilities
 *
 * Destructive or state-changing operations go through `roam-api.js`
 * (`window.roamAlphaAPI`) whenever it is available, and only fall back to
 * simulated clicks / key events when it is not.
 */

import { Selectors, BLOCK_ACTIVATION_TIMEOUT_MS } from './constants.js';
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
                const nestIntoChildren = block.open && block.childCount > 0;
                const parentUid = nestIntoChildren ? block.uid : block.parentUid;
                const order = nestIntoChildren ? 0 : block.order + 1;

                if (parentUid) {
                    const newUid = await apiCreateBlock({ parentUid, order });
                    debugLog('roam', 'createBlockBelow: created via API', { newUid, parentUid, order, nestIntoChildren });
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
                // Inserting at the current order pushes this block (and the rest) down.
                const newUid = await apiCreateBlock({
                    parentUid: block.parentUid,
                    order: block.order,
                });
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
