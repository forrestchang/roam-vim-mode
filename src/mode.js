/**
 * Mode management for Roam Vim Mode
 */

import { Selectors } from './constants.js';
import { getActiveEditElement } from './utils.js';
import { pageHintState } from './page-hints.js';
import { isSearchInputOpen } from './search.js';
import { subscribeModeChange } from './mode-events.js';

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
    // `isSearchInputOpen` (rather than the raw flag) also repairs a stale
    // `searchState.active` left behind by a page navigation.
    if (isSearchInputOpen()) {
        return Mode.SEARCH;
    }
    if (pageHintState.active) {
        return Mode.HINT;
    }
    // The command bar (Cmd+P) is an edit element, but it isn't INSERT mode.
    if (isEditingContext()) {
        return document.querySelector(Selectors.commandBar) ? Mode.NORMAL : Mode.INSERT;
    }
    if (document.querySelector(Selectors.highlight)) {
        return Mode.VISUAL;
    }
    return Mode.NORMAL;
}

/**
 * Whether the user is typing into something — a Roam block, an input, or an
 * embedded editor such as a code block.
 *
 * The `closest` check is a safety net for editors that keep focus on a wrapper
 * rather than on the contenteditable surface itself; without it a focused code
 * block reads as NORMAL mode and vim bindings swallow the keystrokes.
 */
function isEditingContext() {
    if (getActiveEditElement()) {
        return true;
    }
    return !!document.activeElement?.closest?.(Selectors.codeEditor);
}

// ============== Mode Change Notifications ==============
// The mode is derived from the DOM, so rather than polling we recompute after
// any interaction that could plausibly have changed it, plus on explicit
// notifications from search / hint mode.
const MODE_TRIGGER_EVENTS = ['keydown', 'keyup', 'mouseup', 'focusin', 'focusout'];

/**
 * Call `handler(mode)` whenever the derived mode actually changes.
 * @param {(mode: string) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onModeChange(handler) {
    let lastMode = null;
    let scheduled = false;

    const check = () => {
        scheduled = false;
        const mode = getMode();
        if (mode === lastMode) return;
        lastMode = mode;
        handler(mode);
    };

    const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(check);
    };

    MODE_TRIGGER_EVENTS.forEach(eventName =>
        document.addEventListener(eventName, schedule, true)
    );
    const unsubscribe = subscribeModeChange(schedule);

    check();

    return () => {
        MODE_TRIGGER_EVENTS.forEach(eventName =>
            document.removeEventListener(eventName, schedule, true)
        );
        unsubscribe();
    };
}
