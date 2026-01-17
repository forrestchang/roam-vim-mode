/**
 * Which-key popup component for displaying available keys after leader press
 */

import { WHICH_KEY_PANEL_ID, WHICH_KEY_DELAY } from './constants.js';

// ============== State ==============
let whichKeyState = {
    active: false,
    currentNode: null,
    path: [],
    showTimeout: null,
};

// ============== Public API ==============

/**
 * Show the which-key popup after a delay
 * @param {Object} node - Current config tree node
 * @param {string[]} path - Path of keys pressed (e.g., ['SPC', 'b'])
 */
export function showWhichKey(node, path) {
    if (whichKeyState.showTimeout) {
        clearTimeout(whichKeyState.showTimeout);
    }

    whichKeyState.currentNode = node;
    whichKeyState.path = path;

    whichKeyState.showTimeout = setTimeout(() => {
        renderWhichKeyPopup(node, path);
        whichKeyState.active = true;
    }, WHICH_KEY_DELAY);
}

/**
 * Immediately show the which-key popup (no delay)
 * @param {Object} node - Current config tree node
 * @param {string[]} path - Path of keys pressed
 */
export function showWhichKeyImmediate(node, path) {
    if (whichKeyState.showTimeout) {
        clearTimeout(whichKeyState.showTimeout);
        whichKeyState.showTimeout = null;
    }

    whichKeyState.currentNode = node;
    whichKeyState.path = path;
    renderWhichKeyPopup(node, path);
    whichKeyState.active = true;
}

/**
 * Hide and cleanup the which-key popup
 */
export function hideWhichKey() {
    if (whichKeyState.showTimeout) {
        clearTimeout(whichKeyState.showTimeout);
        whichKeyState.showTimeout = null;
    }

    const panel = document.getElementById(WHICH_KEY_PANEL_ID);
    if (panel) {
        panel.remove();
    }

    whichKeyState.active = false;
    whichKeyState.currentNode = null;
    whichKeyState.path = [];
}

/**
 * Check if which-key is currently active or about to show
 */
export function isWhichKeyActive() {
    return whichKeyState.active || whichKeyState.showTimeout !== null;
}

/**
 * Get current which-key state
 */
export function getWhichKeyState() {
    return { ...whichKeyState };
}

// ============== Rendering ==============

function renderWhichKeyPopup(node, path) {
    // Remove existing popup
    const existing = document.getElementById(WHICH_KEY_PANEL_ID);
    if (existing) {
        existing.remove();
    }

    const panel = document.createElement('div');
    panel.id = WHICH_KEY_PANEL_ID;

    // Header showing current path
    const header = document.createElement('div');
    header.className = `${WHICH_KEY_PANEL_ID}--header`;
    header.textContent = path.join(' ') + ' -';
    panel.appendChild(header);

    // Key grid
    const grid = document.createElement('div');
    grid.className = `${WHICH_KEY_PANEL_ID}--grid`;

    const keys = Object.entries(node.keys || {});
    keys.forEach(([key, value]) => {
        const item = document.createElement('div');
        item.className = `${WHICH_KEY_PANEL_ID}--item`;

        const keySpan = document.createElement('span');
        keySpan.className = `${WHICH_KEY_PANEL_ID}--key`;
        keySpan.textContent = key;

        const nameSpan = document.createElement('span');
        nameSpan.className = `${WHICH_KEY_PANEL_ID}--name`;
        nameSpan.textContent = value.name;

        // If it's a group (has keys), add group indicator
        const isGroup = value.keys !== undefined;
        if (isGroup) {
            nameSpan.classList.add(`${WHICH_KEY_PANEL_ID}--group`);
        }

        item.appendChild(keySpan);
        item.appendChild(nameSpan);
        grid.appendChild(item);
    });

    panel.appendChild(grid);
    document.body.appendChild(panel);
}
