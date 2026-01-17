/**
 * Leader key configuration for Spacemacs-style key bindings
 */

import { Mode } from './mode.js';
import {
    selectFirstBlock,
    selectLastBlock,
    selectPanelLeft,
    selectPanelRight,
    closeSidebarPage,
    copySelectedBlock,
    copySelectedBlockReference,
    copySelectedBlockEmbed,
    paste,
    pasteBefore,
    enterOrCutInVisualMode,
    toggleFold,
    undo,
    redo,
} from './commands.js';
import { showHelpPanel } from './help-panel.js';

/**
 * Leader key configuration tree
 * Each node can be:
 * - A group: { name: string, keys: { [key]: node } }
 * - A command: { name: string, command: string }
 */
export const DEFAULT_LEADER_CONFIG = {
    name: '+leader',
    keys: {
        'b': {
            name: '+block',
            keys: {
                'y': { name: 'Copy block', command: 'copyBlock' },
                'r': { name: 'Copy reference', command: 'copyBlockReference' },
                'e': { name: 'Copy embed', command: 'copyBlockEmbed' },
                'p': { name: 'Paste after', command: 'paste' },
                'P': { name: 'Paste before', command: 'pasteBefore' },
                'd': { name: 'Cut/Delete', command: 'cutBlock' },
            }
        },
        'w': {
            name: '+window',
            keys: {
                'h': { name: 'Panel left', command: 'selectPanelLeft' },
                'l': { name: 'Panel right', command: 'selectPanelRight' },
                'd': { name: 'Close sidebar', command: 'closeSidebarPage' },
            }
        },
        'g': {
            name: '+goto',
            keys: {
                'g': { name: 'First block', command: 'selectFirstBlock' },
                'G': { name: 'Last block', command: 'selectLastBlock' },
                'd': { name: 'Daily Notes', command: 'gotoDailyNotes' },
            }
        },
        's': {
            name: '+search',
            keys: {
                's': { name: 'Search', command: 'openSearch' },
            }
        },
        't': {
            name: '+toggle',
            keys: {
                'f': { name: 'Fold', command: 'toggleFold' },
            }
        },
        'u': { name: 'Undo', command: 'undo' },
        'r': { name: 'Redo', command: 'redo' },
        '?': { name: 'Help', command: 'showHelpPanel' },
    }
};

/**
 * Command registry: maps command strings to actual functions
 */
export const LEADER_COMMAND_REGISTRY = {
    // Block operations
    copyBlock: () => copySelectedBlock(Mode.NORMAL),
    copyBlockReference: copySelectedBlockReference,
    copyBlockEmbed: copySelectedBlockEmbed,
    paste: paste,
    pasteBefore: pasteBefore,
    cutBlock: () => enterOrCutInVisualMode(Mode.VISUAL),

    // Panel/Window operations
    selectPanelLeft: selectPanelLeft,
    selectPanelRight: selectPanelRight,
    closeSidebarPage: closeSidebarPage,

    // Navigation
    selectFirstBlock: selectFirstBlock,
    selectLastBlock: selectLastBlock,
    gotoDailyNotes: () => {
        // Navigate to Daily Notes using Roam's navigation
        // Click the Daily Notes icon in the left sidebar or navigate via URL
        const dailyNotesLink = document.querySelector('.rm-topbar .bp3-icon-calendar');
        if (dailyNotesLink) {
            dailyNotesLink.click();
        } else {
            // Fallback: use roamAlphaAPI if available
            if (window.roamAlphaAPI?.ui?.mainWindow?.openDailyNotes) {
                window.roamAlphaAPI.ui.mainWindow.openDailyNotes();
            } else {
                // Last resort: clear hash to go to daily notes
                window.location.hash = '';
            }
        }
    },

    // Search
    openSearch: () => {
        // Trigger Roam's search using roamAlphaAPI or click search button
        if (window.roamAlphaAPI?.ui?.commandPalette?.open) {
            window.roamAlphaAPI.ui.commandPalette.open();
        } else {
            // Fallback: click the search icon in topbar
            const searchButton = document.querySelector('.rm-topbar .bp3-icon-search');
            if (searchButton) {
                searchButton.click();
            } else {
                // Try simulating Cmd+U on document
                document.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'u',
                    code: 'KeyU',
                    keyCode: 85,
                    metaKey: true,
                    bubbles: true,
                    cancelable: true,
                }));
            }
        }
    },

    // Toggle
    toggleFold: toggleFold,

    // History
    undo: undo,
    redo: redo,

    // Help
    showHelpPanel: showHelpPanel,
};
