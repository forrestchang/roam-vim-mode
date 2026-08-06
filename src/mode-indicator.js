/**
 * Mode indicator UI for Roam Vim Mode
 */

import { MODE_INDICATOR_ID } from './constants.js';
import { Mode, onModeChange } from './mode.js';
import { debugLog } from './logger.js';

let unsubscribeModeChange = null;

/** Label and colour per mode. Keep every `Mode` member represented. */
const MODE_APPEARANCE = {
    [Mode.NORMAL]: { label: '-- NORMAL --', background: '#2196F3' },
    [Mode.INSERT]: { label: '-- INSERT --', background: '#4CAF50' },
    [Mode.VISUAL]: { label: '-- VISUAL --', background: '#FF9800' },
    [Mode.HINT]: { label: '-- HINT --', background: '#9C27B0' },
    [Mode.SEARCH]: { label: '-- SEARCH --', background: '#607D8B' },
};

export function createModeIndicator() {
    if (document.getElementById(MODE_INDICATOR_ID)) return;

    const indicator = document.createElement('div');
    indicator.id = MODE_INDICATOR_ID;
    document.body.appendChild(indicator);

    // Event-driven: the old 100ms setInterval ran getMode() ten times a second
    // for the entire lifetime of the tab, even while completely idle.
    unsubscribeModeChange = onModeChange(updateModeIndicator);
}

function updateModeIndicator(mode) {
    debugLog('mode', `-> ${mode}`);
    const indicator = document.getElementById(MODE_INDICATOR_ID);
    if (!indicator) return;

    const appearance = MODE_APPEARANCE[mode];
    if (!appearance) {
        console.warn('[Roam Vim Mode] No indicator appearance for mode', mode);
        return;
    }

    indicator.textContent = appearance.label;
    indicator.style.backgroundColor = appearance.background;
    indicator.style.color = 'white';
}

export function removeModeIndicator() {
    document.getElementById(MODE_INDICATOR_ID)?.remove();
    if (unsubscribeModeChange) {
        unsubscribeModeChange();
        unsubscribeModeChange = null;
    }
}
