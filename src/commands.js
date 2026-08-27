/**
 * Vim commands for Roam Vim Mode
 *
 * Every exported command is reachable from a keybinding or the leader menu —
 * see `keybindings.js` and `leader-config.js`.
 */

import { BLOCK_ACTIVATION_TIMEOUT_MS, BLOCK_ID_PREFIX, Selectors } from './constants.js';
import { delay, Keyboard, Mouse, repeatAsync, waitForSelectorToExist } from './utils.js';
import {
    Roam,
    RoamHighlight,
    RoamNode,
    copyBlockReference,
    copyBlockEmbed,
    writeToClipboard,
} from './roam.js';
import { RoamBlock, VimRoamPanel } from './panel.js';
import { Mode, getMode } from './mode.js';
import { getBlockUid, getWindowId, moveBlock, pullBlock } from './roam-api.js';
import { getRegister, setRegister } from './register.js';
import { debugLog, logError, warnFallback } from './logger.js';
import { blurEverything, getHint, updateVimView, viewMoreDailyLogIfPossible } from './view.js';

/** How many synthetic Escapes to spend converging on NORMAL before giving up. */
const MAX_NORMAL_MODE_NUDGES = 6;

// ============== Return to Normal Mode ==============
/**
 * Escape always lands in NORMAL, in one press.
 *
 * Roam answers Escape-while-editing by turning the block into a blue selection —
 * its own intermediate step, which reads as VISUAL mode here. If Roam's handler
 * wins the race with ours, we dismiss that selection so the user doesn't have to
 * press Escape twice.
 */
export async function returnToNormalMode() {
    blurEverything();
    // Roam sometimes re-focuses the textarea within the same tick; blur again
    // once the microtask queue has drained.
    await delay(0);
    blurEverything();

    // Then converge: whatever intermediate state Roam lands in — still editing,
    // or a leftover blue block selection — another Escape moves it one step
    // closer to NORMAL. The events are marked synthetic, so our own handler
    // ignores them and this can't recurse.
    for (let attempt = 0; attempt < MAX_NORMAL_MODE_NUDGES; attempt++) {
        await delay(16);

        const mode = getMode();
        if (mode === Mode.NORMAL) {
            debugLog('commands', `returnToNormalMode: reached NORMAL after ${attempt} nudge(s)`);
            return;
        }

        debugLog('commands', `returnToNormalMode: still ${mode}, nudging`, {
            attempt,
            blockSelections: document.querySelectorAll(Selectors.highlight).length,
        });
        await Keyboard.pressEsc();
    }

    logError('commands', `returnToNormalMode: gave up, mode is still ${getMode()}`);
}

// ============== RoamVim Core ==============
export const RoamVim = {
    async jumpBlocksInFocusedPanel(blocksToJump) {
        const mode = getMode();
        if (mode === Mode.NORMAL) {
            VimRoamPanel.selected().selectRelativeBlock(blocksToJump);
            updateVimView();
            return;
        }
        if (mode === Mode.VISUAL) {
            await repeatAsync(Math.abs(blocksToJump), () =>
                Keyboard.pressArrow(blocksToJump > 0 ? 'down' : 'up', { shiftKey: true })
            );
            const edge = blocksToJump > 0 ? RoamHighlight.last() : RoamHighlight.first();
            if (edge) {
                VimRoamPanel.selected().scrollUntilBlockIsVisible(edge);
            }
        }
    },
};

// ============== Navigation Commands ==============
export async function selectBlockUp() {
    await RoamVim.jumpBlocksInFocusedPanel(-1);
}

export async function selectBlockDown() {
    await RoamVim.jumpBlocksInFocusedPanel(1);
}

export function selectFirstBlock() {
    VimRoamPanel.selected().selectFirstBlock();
    updateVimView();
}

export function selectLastBlock() {
    VimRoamPanel.selected().selectLastBlock();
    updateVimView();
    // Reaching the bottom is the one moment where nudging Roam to load more of
    // the daily log is what the user actually wants.
    viewMoreDailyLogIfPossible();
}

export function centerCurrentBlock() {
    const panel = VimRoamPanel.selected();
    const block = panel.selectedBlock().element;

    const panelRect = panel.element.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();

    // How far the block's centre sits from the panel's centre.
    const blockCenterRelativeToPanel = blockRect.top + blockRect.height / 2 - panelRect.top;
    const panelCenter = panelRect.height / 2;

    panel.element.scrollTop += blockCenterRelativeToPanel - panelCenter;

    updateVimView();
}

// ============== Insert Commands ==============
export async function insertBlockAfter() {
    await Roam.createBlockBelow(RoamBlock.selected().element);
}

export async function insertBlockBefore() {
    await Roam.createBlockAbove(RoamBlock.selected().element);
}

export async function editBlock() {
    await Roam.activateBlock(RoamBlock.selected().element, { start: 0 });
}

export async function editBlockFromEnd() {
    await Roam.activateBlock(RoamBlock.selected().element);
    await Roam.moveCursorToEnd();
}

// ============== Panel Commands ==============
export function selectPanelLeft() {
    VimRoamPanel.previousPanel()?.select();
    updateVimView();
}

export function selectPanelRight() {
    VimRoamPanel.nextPanel()?.select();
    updateVimView();
}

export function closeSidebarPage() {
    const block = RoamBlock.selected().element;
    const pageContainer = block.closest(`${Selectors.sidebarContent} > div`);
    const closeButton = pageContainer?.querySelector(Selectors.closeButton);
    if (closeButton) {
        Mouse.leftClick(closeButton);
    }
}

// ============== Visual Commands ==============
export async function highlightSelectedBlock() {
    await Roam.highlight(RoamBlock.selected().element);
}

// ============== Clipboard Commands ==============
/**
 * Yank blocks: into the register, which is what `p` reads, and out to the system
 * clipboard, which is what everything outside Roam reads.
 *
 * @param {string[]} texts one per block
 */
async function yankBlocks(texts) {
    setRegister(texts);
    await writeToClipboard(texts.join('\n'));
}

export async function copySelectedBlock() {
    await yankBlocks([await Roam.getBlockText(RoamBlock.selected().element)]);
    await returnToNormalMode();
}

/** `yy` — yank the selected block without leaving NORMAL. */
export async function yankBlock() {
    await yankBlocks([await Roam.getBlockText(RoamBlock.selected().element)]);
}

export function copySelectedBlockReference() {
    return copyBlockReference(VimRoamPanel.selected().selectedBlockId);
}

export function copySelectedBlockEmbed() {
    return copyBlockEmbed(VimRoamPanel.selected().selectedBlockId);
}

// ============== History Commands ==============
export async function undo() {
    await Roam.undo();
    await returnToNormalMode();
}

export async function redo() {
    await Roam.redo();
    await returnToNormalMode();
}

// ============== Block Manipulation Commands ==============
/** Reorder the selected block among its siblings. `offset` is -1 (up) or +1 (down). */
async function reorderSelectedBlock(offset) {
    const element = RoamBlock.selected().element;

    try {
        const uid = getBlockUid(element);
        const block = uid ? pullBlock(uid) : null;

        if (block?.parentUid) {
            const order = Math.max(0, block.order + offset);
            if (order === block.order) return;
            await moveBlock({ uid, parentUid: block.parentUid, order });
            updateVimView();
            return;
        }
    } catch (error) {
        warnFallback('moveBlock via roamAlphaAPI failed', error);
    }

    // Fallback: Roam's own move shortcut, with the platform's command modifier.
    await Roam.activateBlock(element);
    await Keyboard.simulateKeyCombo(offset < 0 ? 'ArrowUp' : 'ArrowDown', { shiftKey: true });
}

export async function moveBlockUp() {
    await reorderSelectedBlock(-1);
}

export async function moveBlockDown() {
    await reorderSelectedBlock(1);
}

// ============== Hint Commands ==============
export function clickHint(n) {
    const hint = getHint(n);
    if (hint) {
        Mouse.leftClick(hint);
    }
}

export function shiftClickHint(n) {
    const hint = getHint(n);
    if (hint) {
        Mouse.leftClick(hint, { shiftKey: true });
    }
}

// ============== Toggle Fold ==============
export async function toggleFold() {
    await RoamBlock.selected().toggleFold();
}

/**
 * Fold or unfold the whole page — vim's `zM` and `zR` on a single key — down to
 * the deepest block and across the Linked References headers.
 *
 * Scoped to the focused panel, so `Z` in the sidebar leaves the main page alone.
 */
export async function toggleFoldAll() {
    const panel = VimRoamPanel.selected();
    // Empty is legitimate: a page can be nothing but linked references, and
    // those headers are still ours to collapse.
    const roots = panel.topLevelBlocks();
    await Roam.toggleFoldAll(roots, panel.element);
    updateVimView();
}

// ============== Paste ==============
/**
 * Move the selection onto a freshly created block, once Roam has rendered it.
 *
 * The wait is the point: `createBlock` resolves when the datastore has the
 * block, which is a render ahead of the DOM, and `selectBlock` silently does
 * nothing for an id it cannot find.
 */
async function selectRenderedBlock(panel, element, uid) {
    const windowId = getWindowId(element);
    if (!windowId || !uid) return;

    const htmlId = `${BLOCK_ID_PREFIX}${windowId}-${uid}`;
    try {
        await waitForSelectorToExist(`#${Selectors.escapeHtmlId(htmlId)}`, panel.element, {
            timeout: BLOCK_ACTIVATION_TIMEOUT_MS,
        });
        panel.selectBlock(htmlId);
    } catch (error) {
        debugLog('commands', 'paste: new block never rendered, leaving selection put', error);
    }
}

/** Shared body of `p` and `P`. */
async function pasteRegister({ above }) {
    const texts = getRegister();
    if (texts.length === 0) {
        debugLog('commands', 'paste: register is empty');
        return;
    }

    const panel = VimRoamPanel.selected();
    const element = panel.selectedBlock().element;
    const uids = await Roam.createBlocks(element, texts, { above });

    if (uids.length > 0) {
        // vim leaves the cursor on the last pasted line.
        await selectRenderedBlock(panel, element, uids[uids.length - 1]);
    } else {
        // No API to create with, so fall back to Roam's own Enter handling —
        // which only gets us one block, so the yanked blocks arrive joined.
        await (above ? Roam.createBlockAbove(element) : Roam.createBlockBelow(element));
        // Enter leaves us editing whatever Roam focused. Writing there is only
        // safe if it really is a new empty block: `createBlockAbove`'s
        // Enter-at-start keeps the cursor in the *original* text, and
        // clobbering that would lose it.
        const input = Roam.getRoamBlockInput();
        if (input && input.value === '') {
            await Roam.save(new RoamNode(texts.join('\n')).withCursorAtTheEnd());
        }
        await returnToNormalMode();
    }

    updateVimView();
}

export async function pasteBlockBelow() {
    await pasteRegister({ above: false });
}

export async function pasteBlockAbove() {
    await pasteRegister({ above: true });
}

// ============== Delete Block ==============
export async function deleteBlock() {
    const element = RoamBlock.selected().element;

    // Yank first, like vim's `dd`. Reading via the datastore means we no longer
    // have to focus the block (which would flip us into INSERT mode) just to
    // grab its text.
    await yankBlocks([await Roam.getBlockText(element)]);

    await Roam.deleteBlock(element);
    await returnToNormalMode();
    updateVimView();
}

/**
 * `d` in VISUAL mode — delete every block in the blue selection, yanking them
 * first so `p` can put them back.
 *
 * Texts are read straight from the datastore and skipped if that fails, rather
 * than falling back to `getBlockText`: activating a block to read it would clear
 * the very selection we are about to delete.
 */
export async function deleteHighlightedBlocks() {
    const blocks = Array.from(RoamHighlight.highlightedBlocks());
    if (blocks.length === 0) {
        debugLog('commands', 'visual delete: nothing is highlighted');
        return;
    }

    const texts = blocks
        .map(block => {
            const uid = getBlockUid(block);
            return uid ? pullBlock(uid)?.string : null;
        })
        .filter(text => typeof text === 'string');
    if (texts.length > 0) {
        await yankBlocks(texts);
    }

    if (!(await Roam.deleteBlocks(blocks))) {
        // Backspace is what Roam itself does with a blue selection.
        await Keyboard.pressBackspace();
    }

    await returnToNormalMode();
    updateVimView();
}

// ============== Reference Commands ==============
export function expandReferences() {
    const block = RoamBlock.selected().element;
    const footnote = block.querySelector(Selectors.referenceFootnote);
    if (footnote) {
        Mouse.leftClick(footnote);
    }
}
