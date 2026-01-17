/**
 * Mode management for Roam Vim Mode
 */

import { Selectors } from './constants.js';
import { getActiveEditElement } from './utils.js';
import { pageHintState } from './page-hints.js';

// ============== Mode Enum ==============
export const Mode = {
    INSERT: 'INSERT',
    VISUAL: 'VISUAL',
    NORMAL: 'NORMAL',
    HINT: 'HINT',
};

// ============== Get Current Mode ==============
export function getMode() {
    if (pageHintState.active) {
        return Mode.HINT;
    }
    // Don't consider command bar (Cmd+P) as INSERT mode
    if (getActiveEditElement() && !document.querySelector(Selectors.commandBar)) {
        return Mode.INSERT;
    }
    if (document.querySelector(Selectors.highlight)) {
        return Mode.VISUAL;
    }
    return Mode.NORMAL;
}
