/**
 * Vim commands for Roam Vim Mode
 *
 * Every exported command is reachable from a keybinding or the leader menu —
 * see `keybindings.js` and `leader-config.js`.
 */

import { Selectors } from './constants.js';
import { delay, Keyboard, Mouse, repeatAsync } from './utils.js';
import { Roam, RoamHighlight, copyBlockReference, copyBlockEmbed, writeToClipboard } from './roam.js';
import { RoamBlock, VimRoamPanel } from './panel.js';
import { Mode, getMode } from './mode.js';
import { getBlockUid, moveBlock, pullBlock } from './roam-api.js';
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
export async function copySelectedBlock() {
    const text = await Roam.getBlockText(RoamBlock.selected().element);
    await writeToClipboard(text);
    await returnToNormalMode();
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

// ============== Delete Block ==============
export async function deleteBlock() {
    const element = RoamBlock.selected().element;

    // Yank to the clipboard first, like vim's `dd`. Reading via the datastore
    // means we no longer have to focus the block (which would flip us into
    // INSERT mode) just to grab its text.
    await writeToClipboard(await Roam.getBlockText(element));

    await Roam.deleteBlock(element);
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
