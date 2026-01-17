/**
 * Mode management for Roam Vim Mode
 */

import { Selectors } from './constants.js';
import { getActiveEditElement } from './utils.js';
import { pageHintState } from './page-hints.js';
import { searchState } from './search.js';

// ============== Mode Enum ==============
export const Mode = {
    INSERT: 'INSERT',
    VISUAL: 'VISUAL',
    NORMAL: 'NORMAL',
    HINT: 'HINT',
    SEARCH: 'SEARCH',
};

// ============== Get Current Mode ==============
export function getMode() {
    if (searchState.active) {
        return Mode.SEARCH;
    }
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
