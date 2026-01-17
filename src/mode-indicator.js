/**
 * Mode indicator UI for Roam Vim Mode
 */

import { MODE_INDICATOR_ID } from './constants.js';
import { Mode, getMode } from './mode.js';

let modeIndicatorInterval = null;

export function createModeIndicator() {
    const indicator = document.createElement('div');
    indicator.id = MODE_INDICATOR_ID;
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 6px 12px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
        transition: all 0.2s ease;
    `;
    document.body.appendChild(indicator);
    updateModeIndicator();

    modeIndicatorInterval = setInterval(updateModeIndicator, 100);
}

function updateModeIndicator() {
    const indicator = document.getElementById(MODE_INDICATOR_ID);
    if (!indicator) return;

    const mode = getMode();
    switch (mode) {
        case Mode.NORMAL:
            indicator.textContent = '-- NORMAL --';
            indicator.style.backgroundColor = '#2196F3';
            indicator.style.color = 'white';
            break;
        case Mode.INSERT:
            indicator.textContent = '-- INSERT --';
            indicator.style.backgroundColor = '#4CAF50';
            indicator.style.color = 'white';
            break;
        case Mode.VISUAL:
            indicator.textContent = '-- VISUAL --';
            indicator.style.backgroundColor = '#FF9800';
            indicator.style.color = 'white';
            break;
        case Mode.HINT:
            indicator.textContent = '-- HINT --';
            indicator.style.backgroundColor = '#9C27B0';
            indicator.style.color = 'white';
            break;
    }
}

export function removeModeIndicator() {
    const indicator = document.getElementById(MODE_INDICATOR_ID);
    if (indicator) {
        indicator.remove();
    }
    if (modeIndicatorInterval) {
        clearInterval(modeIndicatorInterval);
        modeIndicatorInterval = null;
    }
}
