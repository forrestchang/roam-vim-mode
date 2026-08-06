/**
 * Roam Vim Mode Extension
 *
 * A standalone Roam Research extension that provides Vim-like keyboard navigation
 * for blocks. Ported from roam-toolkit.
 */

import { EXTENSION_ID, Selectors, BLUR_PIXEL_ID } from './constants.js';
import { delay, injectStyle, removeStyle, waitForSelectorToExist } from './utils.js';
import { RoamEvent } from './roam.js';
import { VimRoamPanel, panelState } from './panel.js';
import { debugLog, diagnose, installConsoleApi, removeConsoleApi } from './logger.js';
import { updateVimView, clearVimView } from './view.js';
import { hidePageHints } from './page-hints.js';
import { handleKeydown, resetKeybindingState } from './keybindings.js';
import { VIM_MODE_STYLES } from './styles.js';
import { createModeIndicator, removeModeIndicator } from './mode-indicator.js';
import { hideHelpPanel } from './help-panel.js';
import { hideWhichKey } from './which-key.js';
import { resetSearch } from './search.js';
import { clearModeSubscribers } from './mode-events.js';
import { setExtensionAPI, SETTING_SPACEMACS_ENABLED } from './settings.js';

// ============== Vim Mode State ==============
let disconnectHandlers = [];
let keydownHandler = null;
/** Cancels the pending "wait for Roam to mount" promise if we unload first. */
let startupController = null;

// ============== Vim Mode Initialization ==============
async function startVimMode() {
    startupController = new AbortController();
    const { signal } = startupController;

    try {
        await waitForSelectorToExist(Selectors.mainContent, document.body, { signal });
        await delay(300);
    } catch {
        // Aborted by onunload — nothing to clean up.
        return;
    }

    // The extension may have been unloaded while we were waiting.
    if (signal.aborted) return;

    disconnectHandlers = [
        RoamEvent.onEditBlock(blockElement => {
            const panel = VimRoamPanel.fromBlock(blockElement);
            if (!panel) return;
            panel.select();
            panel.selectBlock(blockElement.id);
            updateVimView();
        }),

        RoamEvent.onBlurBlock(updateVimView),

        RoamEvent.onSidebarToggle(isRightPanelOn => {
            VimRoamPanel.updateSidePanels();
            if (!isRightPanelOn) {
                VimRoamPanel.mainPanel()?.select();
            }
            updateVimView();
        }),

        RoamEvent.onSidebarChange(() => {
            VimRoamPanel.updateSidePanels();
            updateVimView();
        }),

        RoamEvent.onChangePage(() => {
            VimRoamPanel.updateSidePanels();
            VimRoamPanel.mainPanel()?.selectFirstBlock();
            updateVimView();
        }),
    ];

    VimRoamPanel.updateSidePanels();
    updateVimView();

    keydownHandler = handleKeydown;
    // On `window`, capture phase: this is the earliest point in the event path,
    // ahead of anything Roam can register on `document` or its React root. It has
    // to be, because `stopImmediatePropagation` can only suppress Roam's own
    // handlers if we run first.
    window.addEventListener('keydown', keydownHandler, true);

    debugLog('lifecycle', 'vim mode started', {
        panels: panelState.panelOrder.length,
    });
}

function stopVimMode() {
    startupController?.abort();
    startupController = null;

    disconnectHandlers.forEach(disconnect => disconnect());
    disconnectHandlers = [];

    if (keydownHandler) {
        window.removeEventListener('keydown', keydownHandler, true);
        keydownHandler = null;
    }

    // Every piece of UI and transient state this extension can create.
    clearVimView();
    resetSearch();
    hidePageHints();
    hideHelpPanel();
    hideWhichKey();
    resetKeybindingState();
    VimRoamPanel.reset();

    document.getElementById(BLUR_PIXEL_ID)?.remove();
}

// ============== Extension Entry Points ==============
function onload({ extensionAPI }) {
    setExtensionAPI(extensionAPI);

    extensionAPI.settings.panel.create({
        tabTitle: 'Vim Mode',
        settings: [
            {
                id: SETTING_SPACEMACS_ENABLED,
                name: 'Enable Spacemacs-style Leader Key',
                description:
                    'Press Space in Normal mode to open a command menu with a which-key popup. ' +
                    'Supports multi-key sequences like SPC b y to copy a block reference.',
                action: {
                    type: 'switch',
                },
            },
        ],
    });

    injectStyle(VIM_MODE_STYLES, `${EXTENSION_ID}--styles`);
    createModeIndicator();
    installConsoleApi();
    debugLog('lifecycle', 'onload');
    diagnose();
    startVimMode();
}

function onunload() {
    debugLog('lifecycle', 'onunload');
    stopVimMode();
    removeStyle(`${EXTENSION_ID}--styles`);
    removeModeIndicator();
    clearModeSubscribers();
    removeConsoleApi();
}

export default {
    onload,
    onunload,
};
