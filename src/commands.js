/**
 * Vim commands for Roam Vim Mode
 */

import { Selectors } from './constants.js';
import { delay, Keyboard, Mouse, repeatAsync, KEY_TO_CODE } from './utils.js';
import { Roam, RoamHighlight, copyBlockReference, copyBlockEmbed } from './roam.js';
import { RoamBlock, VimRoamPanel } from './panel.js';
import { Mode } from './mode.js';
import { blurEverything, getHint } from './view.js';

// ============== Internal State ==============
export let yankRegister = '';

export function setYankRegister(value) {
    yankRegister = value;
}

// ============== Return to Normal Mode ==============
export async function returnToNormalMode() {
    blurEverything();
    await delay(0);
    blurEverything();
}

// ============== RoamVim Core ==============
export const RoamVim = {
    async jumpBlocksInFocusedPanel(blocksToJump) {
        const mode = getMode();
        if (mode === Mode.NORMAL) {
            VimRoamPanel.selected().selectRelativeBlock(blocksToJump);
        }
        if (mode === Mode.VISUAL) {
            await repeatAsync(Math.abs(blocksToJump), () =>
                Keyboard.simulateKey(blocksToJump > 0 ? Keyboard.DOWN_ARROW : Keyboard.UP_ARROW, 0, { shiftKey: true })
            );
            VimRoamPanel.selected().scrollUntilBlockIsVisible(
                blocksToJump > 0 ? RoamHighlight.last() : RoamHighlight.first()
            );
        }
    },
};

// Import getMode here to avoid circular dependency
import { getMode } from './mode.js';

// ============== Navigation Commands ==============
export async function selectBlockUp() {
    await RoamVim.jumpBlocksInFocusedPanel(-1);
}

export async function selectBlockDown() {
    await RoamVim.jumpBlocksInFocusedPanel(1);
}

export async function selectFirstVisibleBlock() {
    VimRoamPanel.selected().selectFirstVisibleBlock();
}

export async function selectLastVisibleBlock() {
    VimRoamPanel.selected().selectLastVisibleBlock();
}

export async function selectFirstBlock() {
    VimRoamPanel.selected().selectFirstBlock();
}

export async function selectLastBlock() {
    VimRoamPanel.selected().selectLastBlock();
}

export async function selectManyBlocksUp() {
    await RoamVim.jumpBlocksInFocusedPanel(-8);
}

export async function selectManyBlocksDown() {
    await RoamVim.jumpBlocksInFocusedPanel(8);
}

export async function scrollUp() {
    VimRoamPanel.selected().scrollAndReselectBlockToStayVisible(-50);
}

export async function scrollDown() {
    VimRoamPanel.selected().scrollAndReselectBlockToStayVisible(50);
}

// ============== Insert Commands ==============
export async function insertBlockAfter() {
    await Roam.activateBlock(RoamBlock.selected().element);
    await Roam.createBlockBelow();
}

export async function editBlock() {
    await Roam.activateBlock(RoamBlock.selected().element);
    await Roam.moveCursorToStart();
}

export async function editBlockFromEnd() {
    await Roam.activateBlock(RoamBlock.selected().element);
    await Roam.moveCursorToEnd();
}

export async function insertBlockBefore() {
    await Roam.activateBlock(RoamBlock.selected().element);
    await Roam.moveCursorToStart();
    await Keyboard.pressEnter();
}

// ============== Panel Commands ==============
export function selectPanelLeft() {
    VimRoamPanel.previousPanel().select();
}

export function selectPanelRight() {
    VimRoamPanel.nextPanel().select();
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
export function highlightSelectedBlock() {
    Roam.highlight(RoamBlock.selected().element);
}

export async function growHighlightUp(mode) {
    if (mode === Mode.NORMAL) {
        await Roam.highlight(RoamBlock.selected().element);
    }
    await Keyboard.simulateKey(Keyboard.UP_ARROW, 0, { shiftKey: true });
}

export async function growHighlightDown(mode) {
    if (mode === Mode.NORMAL) {
        await Roam.highlight(RoamBlock.selected().element);
    }
    await Keyboard.simulateKey(Keyboard.DOWN_ARROW, 0, { shiftKey: true });
}

// ============== Clipboard Commands ==============
async function getBlockText(blockElement) {
    await Roam.activateBlock(blockElement);
    const textarea = Roam.getRoamBlockInput();
    if (textarea) {
        return textarea.value;
    }
    return '';
}

export async function cutAndGoBackToNormal() {
    const textarea = Roam.getRoamBlockInput();
    if (textarea) {
        yankRegister = textarea.value;
    }
    document.execCommand('cut');
    await delay(0);
    await returnToNormalMode();
}

export async function paste() {
    await insertBlockAfter();
    if (yankRegister) {
        const textarea = Roam.getRoamBlockInput();
        if (textarea) {
            textarea.value = yankRegister;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        document.execCommand('paste');
    }
    await returnToNormalMode();
}

export async function pasteBefore() {
    await RoamVim.jumpBlocksInFocusedPanel(-1);
    await insertBlockAfter();
    if (yankRegister) {
        const textarea = Roam.getRoamBlockInput();
        if (textarea) {
            textarea.value = yankRegister;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        document.execCommand('paste');
    }
    await returnToNormalMode();
}

export async function copySelectedBlock(mode) {
    const blockElement = RoamBlock.selected().element;
    const text = await getBlockText(blockElement);
    yankRegister = text;
    try {
        await navigator.clipboard.writeText(text);
    } catch (e) {
        document.execCommand('copy');
    }
    await returnToNormalMode();
}

export function copySelectedBlockReference() {
    copyBlockReference(VimRoamPanel.selected().selectedBlock().id);
}

export function copySelectedBlockEmbed() {
    copyBlockEmbed(VimRoamPanel.selected().selectedBlock().id);
}

export async function enterOrCutInVisualMode(mode) {
    if (mode === Mode.NORMAL) {
        return Roam.highlight(RoamBlock.selected().element);
    }
    const highlightedBlock = RoamHighlight.first();
    if (highlightedBlock) {
        const text = await getBlockText(highlightedBlock);
        yankRegister = text;
    }
    await cutAndGoBackToNormal();
}

// ============== History Commands ==============
export async function undo() {
    await Keyboard.simulateKey(KEY_TO_CODE['z'], 0, { key: 'z', metaKey: true });
    await returnToNormalMode();
}

export async function redo() {
    await Keyboard.simulateKey(KEY_TO_CODE['z'], 0, { key: 'z', shiftKey: true, metaKey: true });
    await returnToNormalMode();
}

// ============== Block Manipulation Commands ==============
export async function moveBlockUp() {
    RoamBlock.selected().edit();
    await Keyboard.simulateKey(Keyboard.UP_ARROW, 0, { metaKey: true, shiftKey: true });
}

export async function moveBlockDown() {
    RoamBlock.selected().edit();
    await Keyboard.simulateKey(Keyboard.DOWN_ARROW, 0, { metaKey: true, shiftKey: true });
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

export function ctrlShiftClickHint(n) {
    const hint = getHint(n);
    if (hint) {
        Mouse.leftClick(hint, { shiftKey: true, metaKey: true });
    }
}

// ============== Toggle Fold ==============
export function toggleFold() {
    RoamBlock.selected().toggleFold();
}
