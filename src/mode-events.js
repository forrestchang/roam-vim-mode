/**
 * Tiny pub/sub for "the vim mode may have changed".
 *
 * Lives in its own module so that state owners (search, page hints) can announce
 * transitions without importing `mode.js`, which imports them back.
 */

const subscribers = new Set();

/** @param {() => void} handler @returns {() => void} unsubscribe */
export function subscribeModeChange(handler) {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
}

export function notifyModeChange() {
    subscribers.forEach(handler => {
        try {
            handler();
        } catch (error) {
            console.warn('[Roam Vim Mode] mode change subscriber failed', error);
        }
    });
}

export function clearModeSubscribers() {
    subscribers.clear();
}
