/**
 * Leader key configuration for Spacemacs-style key bindings
 * Uses roamAlphaAPI for reliable Roam Research integration
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
import { VimRoamPanel } from './panel.js';

// ============== Helper Functions ==============

/**
 * Get the UID of the currently selected block
 */
function getSelectedBlockUid() {
    const panel = VimRoamPanel.selected();
    if (!panel) return null;
    const block = panel.selectedBlock();
    return block?.id || null;
}

/**
 * Get the current page UID
 */
function getCurrentPageUid() {
    if (window.roamAlphaAPI?.ui?.mainWindow?.getOpenPageOrBlockUid) {
        return window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
    }
    // Fallback: extract from URL hash
    const match = window.location.hash.match(/\/page\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

/**
 * Prompt user for input (simple prompt dialog)
 */
function promptUser(message, defaultValue = '') {
    return window.prompt(message, defaultValue);
}

// ============== Leader Key Configuration Tree ==============

/**
 * Leader key configuration tree
 * Each node can be:
 * - A group: { name: string, keys: { [key]: node } }
 * - A command: { name: string, command: string }
 */
export const DEFAULT_LEADER_CONFIG = {
    name: '+leader',
    keys: {
        // Block operations
        'b': {
            name: '+block',
            keys: {
                'y': { name: 'Copy block', command: 'copyBlock' },
                'r': { name: 'Copy reference', command: 'copyBlockReference' },
                'e': { name: 'Copy embed', command: 'copyBlockEmbed' },
                'p': { name: 'Paste after', command: 'paste' },
                'P': { name: 'Paste before', command: 'pasteBefore' },
                'd': { name: 'Delete block', command: 'deleteBlock' },
                'x': { name: 'Cut block', command: 'cutBlock' },
                'n': { name: 'New block below', command: 'createBlockBelow' },
                'N': { name: 'New block above', command: 'createBlockAbove' },
                'o': { name: 'Open in sidebar', command: 'openBlockInSidebar' },
                'm': { name: 'Show mentions', command: 'showBlockMentions' },
                'z': { name: 'Zoom into block', command: 'zoomIntoBlock' },
            }
        },

        // Goto/Navigation
        'g': {
            name: '+goto',
            keys: {
                'g': { name: 'First block', command: 'selectFirstBlock' },
                'G': { name: 'Last block', command: 'selectLastBlock' },
                'd': { name: 'Daily Notes', command: 'gotoDailyNotes' },
                'p': { name: 'Go to page...', command: 'gotoPage' },
                'b': { name: 'Go to block...', command: 'gotoBlock' },
                'h': { name: 'Go home (Daily Notes)', command: 'gotoDailyNotes' },
                'l': { name: 'Go to linked refs', command: 'gotoLinkedRefs' },
            }
        },

        // Window/Panel operations
        'w': {
            name: '+window',
            keys: {
                'h': { name: 'Panel left', command: 'selectPanelLeft' },
                'l': { name: 'Panel right', command: 'selectPanelRight' },
                'o': { name: 'Open right sidebar', command: 'openRightSidebar' },
                'c': { name: 'Close right sidebar', command: 'closeRightSidebar' },
                'd': { name: 'Close sidebar page', command: 'closeSidebarPage' },
                'L': { name: 'Toggle left sidebar', command: 'toggleLeftSidebar' },
                'a': { name: 'Add block to sidebar', command: 'openBlockInSidebar' },
                'm': { name: 'Add mentions to sidebar', command: 'showBlockMentions' },
                'g': { name: 'Add graph to sidebar', command: 'showGraphInSidebar' },
                's': { name: 'Search in sidebar', command: 'searchInSidebar' },
            }
        },

        // Search operations
        's': {
            name: '+search',
            keys: {
                's': { name: 'Command palette', command: 'openCommandPalette' },
                'p': { name: 'Find page', command: 'openSearch' },
                '/': { name: 'Search in page', command: 'searchInPage' },
                'r': { name: 'Search in sidebar', command: 'searchInSidebar' },
                'g': { name: 'Graph search', command: 'graphSearch' },
            }
        },

        // Page operations
        'p': {
            name: '+page',
            keys: {
                'n': { name: 'New page', command: 'createPage' },
                'd': { name: 'Delete page', command: 'deletePage' },
                'r': { name: 'Rename page', command: 'renamePage' },
                'o': { name: 'Open in sidebar', command: 'openPageInSidebar' },
                'm': { name: 'Show mentions', command: 'showPageMentions' },
                'g': { name: 'Show graph', command: 'showPageGraph' },
            }
        },

        // Toggle operations
        't': {
            name: '+toggle',
            keys: {
                'f': { name: 'Fold/Unfold', command: 'toggleFold' },
                'l': { name: 'Left sidebar', command: 'toggleLeftSidebar' },
                'r': { name: 'Right sidebar', command: 'toggleRightSidebar' },
            }
        },

        // Focus operations
        'f': {
            name: '+focus',
            keys: {
                'f': { name: 'Focus first block', command: 'focusFirstBlock' },
                'b': { name: 'Focus current block', command: 'focusCurrentBlock' },
            }
        },

        // History - single key commands
        'u': { name: 'Undo', command: 'undo' },
        'r': { name: 'Redo', command: 'redo' },

        // Help
        '?': { name: 'Help', command: 'showHelpPanel' },
    }
};

// ============== Command Registry ==============

/**
 * Command registry: maps command strings to actual functions
 */
export const LEADER_COMMAND_REGISTRY = {
    // ==================== Block Operations ====================

    copyBlock: () => copySelectedBlock(Mode.NORMAL),
    copyBlockReference: copySelectedBlockReference,
    copyBlockEmbed: copySelectedBlockEmbed,
    paste: paste,
    pasteBefore: pasteBefore,
    cutBlock: () => enterOrCutInVisualMode(Mode.VISUAL),

    deleteBlock: () => {
        const uid = getSelectedBlockUid();
        if (!uid) {
            console.warn('[Vim Mode] No block selected');
            return;
        }
        if (window.roamAlphaAPI?.data?.block?.delete) {
            window.roamAlphaAPI.data.block.delete({ block: { uid } });
        } else {
            // Fallback to cut (which also removes the block)
            enterOrCutInVisualMode(Mode.VISUAL);
        }
    },

    createBlockBelow: () => {
        const uid = getSelectedBlockUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.data?.block?.create) {
            // Get the parent and order
            const blockInfo = window.roamAlphaAPI.data.pull('[{:block/parents [:block/uid :block/order]}]', [':block/uid', uid]);
            if (blockInfo) {
                const parentUid = blockInfo[':block/parents']?.[0]?.[':block/uid'];
                if (parentUid) {
                    window.roamAlphaAPI.data.block.create({
                        location: { 'parent-uid': parentUid, order: 'last' },
                        block: { string: '' }
                    }).then(() => {
                        // Focus the new block
                        window.roamAlphaAPI.ui.mainWindow.focusFirstBlock?.();
                    });
                }
            }
        }
    },

    createBlockAbove: () => {
        const uid = getSelectedBlockUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.data?.block?.create) {
            const blockInfo = window.roamAlphaAPI.data.pull('[{:block/parents [:block/uid]} :block/order]', [':block/uid', uid]);
            if (blockInfo) {
                const parentUid = blockInfo[':block/parents']?.[0]?.[':block/uid'];
                const order = blockInfo[':block/order'] || 0;
                if (parentUid) {
                    window.roamAlphaAPI.data.block.create({
                        location: { 'parent-uid': parentUid, order: order },
                        block: { string: '' }
                    });
                }
            }
        }
    },

    openBlockInSidebar: () => {
        const uid = getSelectedBlockUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
            window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: { type: 'block', 'block-uid': uid }
            });
        }
    },

    showBlockMentions: () => {
        const uid = getSelectedBlockUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
            window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: { type: 'mentions', 'block-uid': uid }
            });
        }
    },

    zoomIntoBlock: () => {
        const uid = getSelectedBlockUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.ui?.mainWindow?.openBlock) {
            window.roamAlphaAPI.ui.mainWindow.openBlock({ block: { uid } });
        }
    },

    // ==================== Navigation ====================

    selectFirstBlock: selectFirstBlock,
    selectLastBlock: selectLastBlock,

    gotoDailyNotes: () => {
        if (window.roamAlphaAPI?.ui?.mainWindow?.openDailyNotes) {
            window.roamAlphaAPI.ui.mainWindow.openDailyNotes();
        } else {
            // Fallback: click the Daily Notes icon
            const dailyNotesLink = document.querySelector('.rm-topbar .bp3-icon-calendar');
            if (dailyNotesLink) {
                dailyNotesLink.click();
            }
        }
    },

    gotoPage: () => {
        const title = promptUser('Enter page title:');
        if (!title) return;
        if (window.roamAlphaAPI?.ui?.mainWindow?.openPage) {
            window.roamAlphaAPI.ui.mainWindow.openPage({ page: { title } });
        }
    },

    gotoBlock: () => {
        const uid = promptUser('Enter block UID:');
        if (!uid) return;
        if (window.roamAlphaAPI?.ui?.mainWindow?.openBlock) {
            window.roamAlphaAPI.ui.mainWindow.openBlock({ block: { uid } });
        }
    },

    gotoLinkedRefs: () => {
        // Scroll to linked references section
        const linkedRefs = document.querySelector('.rm-reference-main');
        if (linkedRefs) {
            linkedRefs.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // ==================== Window/Panel Operations ====================

    selectPanelLeft: selectPanelLeft,
    selectPanelRight: selectPanelRight,
    closeSidebarPage: closeSidebarPage,

    openRightSidebar: () => {
        if (window.roamAlphaAPI?.ui?.rightSidebar?.open) {
            window.roamAlphaAPI.ui.rightSidebar.open();
        }
    },

    closeRightSidebar: () => {
        if (window.roamAlphaAPI?.ui?.rightSidebar?.close) {
            window.roamAlphaAPI.ui.rightSidebar.close();
        }
    },

    toggleLeftSidebar: () => {
        // Check if left sidebar is open by looking at the body class or sidebar element
        const leftSidebar = document.querySelector('.roam-sidebar-container');
        const isOpen = leftSidebar && !leftSidebar.classList.contains('rm-sidebar-closed');

        if (isOpen) {
            if (window.roamAlphaAPI?.ui?.leftSidebar?.close) {
                window.roamAlphaAPI.ui.leftSidebar.close();
            }
        } else {
            if (window.roamAlphaAPI?.ui?.leftSidebar?.open) {
                window.roamAlphaAPI.ui.leftSidebar.open();
            }
        }
    },

    toggleRightSidebar: () => {
        // Check if right sidebar is open
        const rightSidebar = document.getElementById('right-sidebar');
        const isOpen = rightSidebar && rightSidebar.classList.contains('open');

        if (isOpen) {
            if (window.roamAlphaAPI?.ui?.rightSidebar?.close) {
                window.roamAlphaAPI.ui.rightSidebar.close();
            }
        } else {
            if (window.roamAlphaAPI?.ui?.rightSidebar?.open) {
                window.roamAlphaAPI.ui.rightSidebar.open();
            }
        }
    },

    showGraphInSidebar: () => {
        const uid = getCurrentPageUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
            window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: { type: 'graph', 'block-uid': uid }
            });
        }
    },

    searchInSidebar: () => {
        const query = promptUser('Enter search query:');
        if (!query) return;
        if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
            window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: { type: 'search-query', 'search-query-str': query }
            });
        }
    },

    // ==================== Search Operations ====================

    openCommandPalette: () => {
        if (window.roamAlphaAPI?.ui?.commandPalette?.open) {
            window.roamAlphaAPI.ui.commandPalette.open();
        } else {
            // Fallback: simulate Cmd+P
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'p',
                code: 'KeyP',
                keyCode: 80,
                metaKey: true,
                bubbles: true,
                cancelable: true,
            }));
        }
    },

    openSearch: () => {
        // Open the "Find or Create Page" search
        if (window.roamAlphaAPI?.ui?.commandPalette?.open) {
            window.roamAlphaAPI.ui.commandPalette.open();
        } else {
            // Fallback: click search button or simulate Cmd+U
            const searchButton = document.querySelector('.rm-topbar .bp3-icon-search');
            if (searchButton) {
                searchButton.click();
            }
        }
    },

    searchInPage: () => {
        // Use browser's native find (Cmd+F)
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'f',
            code: 'KeyF',
            keyCode: 70,
            metaKey: true,
            bubbles: true,
            cancelable: true,
        }));
    },

    graphSearch: () => {
        // Open graph view search
        const query = promptUser('Enter graph search query:');
        if (!query) return;
        if (window.roamAlphaAPI?.data?.search) {
            const results = window.roamAlphaAPI.data.search({ 'search-str': query, limit: 20 });
            console.log('[Vim Mode] Graph search results:', results);
            // Open first result if available
            if (results && results.length > 0) {
                const firstResult = results[0];
                const uid = firstResult[':block/uid'] || firstResult[':node/title'];
                if (uid && window.roamAlphaAPI?.ui?.mainWindow?.openBlock) {
                    window.roamAlphaAPI.ui.mainWindow.openBlock({ block: { uid } });
                }
            }
        }
    },

    // ==================== Page Operations ====================

    createPage: () => {
        const title = promptUser('Enter new page title:');
        if (!title) return;
        if (window.roamAlphaAPI?.data?.page?.create) {
            window.roamAlphaAPI.data.page.create({ page: { title } })
                .then(() => {
                    // Navigate to the new page
                    if (window.roamAlphaAPI?.ui?.mainWindow?.openPage) {
                        window.roamAlphaAPI.ui.mainWindow.openPage({ page: { title } });
                    }
                });
        }
    },

    deletePage: () => {
        const uid = getCurrentPageUid();
        if (!uid) {
            console.warn('[Vim Mode] No page currently open');
            return;
        }
        const confirmed = window.confirm('Are you sure you want to delete this page?');
        if (!confirmed) return;
        if (window.roamAlphaAPI?.data?.page?.delete) {
            window.roamAlphaAPI.data.page.delete({ page: { uid } });
            // Navigate to daily notes after deletion
            if (window.roamAlphaAPI?.ui?.mainWindow?.openDailyNotes) {
                window.roamAlphaAPI.ui.mainWindow.openDailyNotes();
            }
        }
    },

    renamePage: () => {
        const uid = getCurrentPageUid();
        if (!uid) return;

        // Get current title
        const pageInfo = window.roamAlphaAPI?.data?.pull?.('[:node/title]', [':block/uid', uid]);
        const currentTitle = pageInfo?.[':node/title'] || '';

        const newTitle = promptUser('Enter new page title:', currentTitle);
        if (!newTitle || newTitle === currentTitle) return;

        if (window.roamAlphaAPI?.data?.page?.update) {
            window.roamAlphaAPI.data.page.update({ page: { uid, title: newTitle } });
        }
    },

    openPageInSidebar: () => {
        const uid = getCurrentPageUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
            window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: { type: 'outline', 'block-uid': uid }
            });
        }
    },

    showPageMentions: () => {
        const uid = getCurrentPageUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
            window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: { type: 'mentions', 'block-uid': uid }
            });
        }
    },

    showPageGraph: () => {
        const uid = getCurrentPageUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
            window.roamAlphaAPI.ui.rightSidebar.addWindow({
                window: { type: 'graph', 'block-uid': uid }
            });
        }
    },

    // ==================== Toggle Operations ====================

    toggleFold: toggleFold,

    // ==================== Focus Operations ====================

    focusFirstBlock: () => {
        if (window.roamAlphaAPI?.ui?.mainWindow?.focusFirstBlock) {
            window.roamAlphaAPI.ui.mainWindow.focusFirstBlock();
        }
    },

    focusCurrentBlock: () => {
        const uid = getSelectedBlockUid();
        if (!uid) return;
        if (window.roamAlphaAPI?.ui?.setBlockFocusAndSelection) {
            window.roamAlphaAPI.ui.setBlockFocusAndSelection({
                location: { 'block-uid': uid, 'window-id': 'main-window' }
            });
        }
    },

    // ==================== History ====================

    undo: () => {
        if (window.roamAlphaAPI?.data?.undo) {
            window.roamAlphaAPI.data.undo();
        } else {
            undo();
        }
    },

    redo: () => {
        if (window.roamAlphaAPI?.data?.redo) {
            window.roamAlphaAPI.data.redo();
        } else {
            redo();
        }
    },

    // ==================== Help ====================

    showHelpPanel: showHelpPanel,
};
