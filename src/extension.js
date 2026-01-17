/**
 * Roam Vim Mode Extension
 *
 * A standalone Roam Research extension that provides Vim-like keyboard navigation
 * for blocks. Ported from roam-toolkit.
 */

import { EXTENSION_ID, Selectors, BLUR_PIXEL_ID } from './constants.js';
import { delay, injectStyle, removeStyle, waitForSelectorToExist } from './utils.js';
import { RoamEvent } from './roam.js';
import { VimRoamPanel } from './panel.js';
import { updateVimView, clearVimView } from './view.js';
import { hidePageHints } from './page-hints.js';
import { handleKeydown } from './keybindings.js';
import { VIM_MODE_STYLES } from './styles.js';
import { createModeIndicator, removeModeIndicator } from './mode-indicator.js';
import { hideHelpPanel } from './help-panel.js';

// ============== Vim Mode State ==============
let disconnectHandlers = [];
let keydownHandler = null;

// ============== Vim Mode Initialization ==============
function startVimMode() {
    waitForSelectorToExist(Selectors.mainContent).then(async () => {
        await delay(300);

        disconnectHandlers = [
            RoamEvent.onEditBlock(blockElement => {
                VimRoamPanel.fromBlock(blockElement).select();
                VimRoamPanel.selected().selectBlock(blockElement.id);
                updateVimView();
            }),

            RoamEvent.onBlurBlock(updateVimView),

            RoamEvent.onSidebarToggle(isRightPanelOn => {
                if (!isRightPanelOn) {
                    VimRoamPanel.mainPanel().select();
                }
                VimRoamPanel.updateSidePanels();
                updateVimView();
            }),

            RoamEvent.onSidebarChange(() => {
                VimRoamPanel.updateSidePanels();
                updateVimView();
            }),

            RoamEvent.onChangePage(() => {
                VimRoamPanel.updateSidePanels();
                VimRoamPanel.mainPanel().selectFirstBlock();
                updateVimView();
            }),
        ];

        VimRoamPanel.updateSidePanels();
        updateVimView();

        keydownHandler = handleKeydown;
        document.addEventListener('keydown', keydownHandler, true);
    });
}

function stopVimMode() {
    disconnectHandlers.forEach(disconnect => disconnect());
    disconnectHandlers = [];
    clearVimView();

    if (keydownHandler) {
        document.removeEventListener('keydown', keydownHandler, true);
        keydownHandler = null;
    }

    const blurPixel = document.getElementById(BLUR_PIXEL_ID);
    if (blurPixel) {
        blurPixel.remove();
    }
}

// ============== Extension Entry Points ==============
function onload({ extensionAPI }) {
    console.log('Roam Vim Mode extension loaded');

    injectStyle(VIM_MODE_STYLES, `${EXTENSION_ID}--styles`);
    createModeIndicator();
    startVimMode();
}

function onunload() {
    console.log('Roam Vim Mode extension unloaded');

    stopVimMode();
    removeStyle(`${EXTENSION_ID}--styles`);
    removeModeIndicator();
    hideHelpPanel();
    hidePageHints();
}

export default {
    onload,
    onunload,
};
