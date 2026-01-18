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
        { key: 'gg', description: 'Jump to first block' },
        { key: 'G', description: 'Jump to last block' },
    ],
    'Editing': [
        { key: 'i', description: 'Enter insert mode (start)' },
        { key: 'a', description: 'Enter insert mode (end)' },
        { key: 'o', description: 'Insert block below' },
        { key: 'O', description: 'Insert block above' },
        { key: 'V', description: 'Enter visual mode (line)' },
        { key: 'dd', description: 'Delete block' },
        { key: 'u', description: 'Undo' },
        { key: 'Ctrl+r', description: 'Redo' },
        { key: 'z', description: 'Toggle fold' },
        { key: 'c', description: 'Center current block' },
    ],
    'Search': [
        { key: '/', description: 'Search in visible blocks' },
        { key: 'n', description: 'Go to next match' },
        { key: 'N', description: 'Go to previous match' },
    ],
    'Hints': [
        { key: 'q/w/e/r/t/b', description: 'Click link in block' },
        { key: 'Shift + hint', description: 'Shift-click link' },
    ],
    'Other': [
        { key: 'Esc', description: 'Return to normal mode' },
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
