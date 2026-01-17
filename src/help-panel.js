/**
 * Help panel UI for Roam Vim Mode
 */

import { HELP_PANEL_ID } from './constants.js';

// ============== Keybindings Reference ==============
const KEYBINDINGS = {
    'Navigation': [
        { key: 'j', description: 'Move down' },
        { key: 'k', description: 'Move up' },
        { key: 'h', description: 'Switch to left panel' },
        { key: 'l', description: 'Switch to right panel' },
        { key: 'H', description: 'Jump to first visible block' },
        { key: 'L', description: 'Jump to last visible block' },
        { key: 'gg', description: 'Jump to first block' },
        { key: 'G', description: 'Jump to last block' },
        { key: 'Ctrl+u', description: 'Page up (8 blocks)' },
        { key: 'Ctrl+d', description: 'Page down (8 blocks)' },
        { key: 'Ctrl+y', description: 'Scroll up' },
        { key: 'Ctrl+e', description: 'Scroll down' },
    ],
    'Editing': [
        { key: 'i', description: 'Enter insert mode (start)' },
        { key: 'a', description: 'Enter insert mode (end)' },
        { key: 'o', description: 'Insert block below' },
        { key: 'O', description: 'Insert block above' },
        { key: 'u', description: 'Undo' },
        { key: 'Ctrl+r', description: 'Redo' },
        { key: 'za', description: 'Toggle fold' },
        { key: 'zz', description: 'Center current block' },
    ],
    'Visual Mode': [
        { key: 'v', description: 'Enter visual mode' },
        { key: 'd', description: 'Enter visual mode / Cut' },
        { key: 'J', description: 'Grow selection down' },
        { key: 'K', description: 'Grow selection up' },
    ],
    'Clipboard': [
        { key: 'y', description: 'Copy block' },
        { key: 'Alt+y', description: 'Copy block reference' },
        { key: 'Y', description: 'Copy block embed' },
        { key: 'p', description: 'Paste below' },
        { key: 'P', description: 'Paste above' },
    ],
    'Block Movement': [
        { key: 'Cmd+Shift+k', description: 'Move block up' },
        { key: 'Cmd+Shift+j', description: 'Move block down' },
    ],
    'Hints (click links)': [
        { key: 'q/w/e/r/t/b', description: 'Click hint in block' },
        { key: 'Shift + hint', description: 'Shift-click hint' },
        { key: 'Ctrl+Shift + hint', description: 'Open in sidebar' },
        { key: 'f', description: 'Show page-wide hints' },
        { key: 'F', description: 'Open page hint in sidebar' },
        { key: 'gf', description: 'Show block hints to edit' },
    ],
    'Leader Key (SPC) - Block': [
        { key: 'SPC b y', description: 'Copy block' },
        { key: 'SPC b r', description: 'Copy block reference' },
        { key: 'SPC b e', description: 'Copy block embed' },
        { key: 'SPC b p/P', description: 'Paste after/before' },
        { key: 'SPC b d', description: 'Delete block' },
        { key: 'SPC b x', description: 'Cut block' },
        { key: 'SPC b n/N', description: 'New block below/above' },
        { key: 'SPC b o', description: 'Open block in sidebar' },
        { key: 'SPC b m', description: 'Show block mentions' },
        { key: 'SPC b z', description: 'Zoom into block' },
    ],
    'Leader Key (SPC) - Goto': [
        { key: 'SPC g g/G', description: 'First/Last block' },
        { key: 'SPC g d/h', description: 'Daily Notes / Home' },
        { key: 'SPC g p', description: 'Go to page...' },
        { key: 'SPC g b', description: 'Go to block...' },
        { key: 'SPC g l', description: 'Go to linked refs' },
    ],
    'Leader Key (SPC) - Window': [
        { key: 'SPC w h/l', description: 'Panel left/right' },
        { key: 'SPC w o/c', description: 'Open/Close right sidebar' },
        { key: 'SPC w d', description: 'Close sidebar page' },
        { key: 'SPC w L', description: 'Toggle left sidebar' },
        { key: 'SPC w a', description: 'Add block to sidebar' },
        { key: 'SPC w m', description: 'Add mentions to sidebar' },
        { key: 'SPC w g', description: 'Add graph to sidebar' },
        { key: 'SPC w s', description: 'Search in sidebar' },
    ],
    'Leader Key (SPC) - Search': [
        { key: 'SPC s s', description: 'Command palette' },
        { key: 'SPC s p', description: 'Find page' },
        { key: 'SPC s /', description: 'Browser find (Cmd+F)' },
        { key: 'SPC s r', description: 'Search in sidebar' },
        { key: 'SPC s g', description: 'Graph search' },
    ],
    'Leader Key (SPC) - Page': [
        { key: 'SPC p n', description: 'New page' },
        { key: 'SPC p d', description: 'Delete page' },
        { key: 'SPC p r', description: 'Rename page' },
        { key: 'SPC p o', description: 'Open page in sidebar' },
        { key: 'SPC p m', description: 'Show page mentions' },
        { key: 'SPC p g', description: 'Show page graph' },
    ],
    'Leader Key (SPC) - Other': [
        { key: 'SPC t f', description: 'Toggle fold' },
        { key: 'SPC t l/r', description: 'Toggle left/right sidebar' },
        { key: 'SPC f f', description: 'Focus first block' },
        { key: 'SPC f b', description: 'Focus current block' },
        { key: 'SPC u', description: 'Undo' },
        { key: 'SPC r', description: 'Redo' },
        { key: 'SPC ?', description: 'Help' },
    ],
    'Search': [
        { key: '/', description: 'Search in visible blocks' },
        { key: 'n', description: 'Go to next match' },
        { key: 'N', description: 'Go to previous match' },
    ],
    'Other': [
        { key: 'Esc', description: 'Return to normal mode' },
        { key: 'Ctrl+w', description: 'Close sidebar page' },
        { key: '?', description: 'Toggle this help panel' },
    ],
};

// ============== Help Panel Functions ==============
export function showHelpPanel() {
    if (document.getElementById(HELP_PANEL_ID)) {
        hideHelpPanel();
        return;
    }

    const panel = document.createElement('div');
    panel.id = HELP_PANEL_ID;

    const header = document.createElement('div');
    header.className = `${HELP_PANEL_ID}--header`;
    header.innerHTML = `
        <span class="${HELP_PANEL_ID}--title">Vim Mode Keybindings</span>
        <span class="${HELP_PANEL_ID}--close">Press ? or Esc to close</span>
    `;
    panel.appendChild(header);

    const content = document.createElement('div');
    content.className = `${HELP_PANEL_ID}--content`;

    for (const [category, bindings] of Object.entries(KEYBINDINGS)) {
        const section = document.createElement('div');
        section.className = `${HELP_PANEL_ID}--section`;

        const categoryTitle = document.createElement('h3');
        categoryTitle.className = `${HELP_PANEL_ID}--category`;
        categoryTitle.textContent = category;
        section.appendChild(categoryTitle);

        const list = document.createElement('div');
        list.className = `${HELP_PANEL_ID}--list`;

        for (const binding of bindings) {
            const item = document.createElement('div');
            item.className = `${HELP_PANEL_ID}--item`;

            const keySpan = document.createElement('span');
            keySpan.className = `${HELP_PANEL_ID}--key`;
            keySpan.textContent = binding.key;

            const descSpan = document.createElement('span');
            descSpan.className = `${HELP_PANEL_ID}--desc`;
            descSpan.textContent = binding.description;

            item.appendChild(keySpan);
            item.appendChild(descSpan);
            list.appendChild(item);
        }

        section.appendChild(list);
        content.appendChild(section);
    }

    panel.appendChild(content);
    document.body.appendChild(panel);
}

export function hideHelpPanel() {
    const panel = document.getElementById(HELP_PANEL_ID);
    if (panel) {
        panel.remove();
    }
}

export function isHelpPanelOpen() {
    return !!document.getElementById(HELP_PANEL_ID);
}
