/**
 * Utility functions for Roam Vim Mode
 */

import { Selectors } from './constants.js';

// ============== General Utilities ==============
export function delay(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

export async function repeatAsync(n, callbackFn) {
    for (let i = 0; i < n; i++) {
        await callbackFn();
    }
}

export function assumeExists(x, errorMessage = 'Assumed that variable exists, but it does not') {
    if (!x) {
        throw new Error(errorMessage);
    }
    return x;
}

export function relativeItem(xs, index, relativeIndex) {
    let destinationIndex;
    if (Math.sign(relativeIndex) > 0) {
        destinationIndex = Math.min(index + relativeIndex, xs.length - 1);
    } else {
        destinationIndex = Math.max(0, index + relativeIndex);
    }
    return xs[destinationIndex];
}

/**
 * Whether the primary "command" modifier is Cmd (macOS) rather than Ctrl.
 * `navigator.platform` is deprecated but still the most reliable signal inside
 * Roam's Electron builds; `userAgentData` is preferred when present.
 */
export function isMacOS() {
    const platform =
        window.navigator.userAgentData?.platform || window.navigator.platform || '';
    return /mac/i.test(platform);
}

/** Modifier flags for the platform's "command" key, e.g. `{ metaKey: true }`. */
export function commandModifier() {
    return isMacOS() ? { metaKey: true } : { ctrlKey: true };
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function findLast(array, predicate) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i])) {
            return array[i];
        }
    }
    return undefined;
}

// ============== CSS Injection ==============
export function injectStyle(css, tagId) {
    if (document.getElementById(tagId)) {
        document.getElementById(tagId).innerHTML = css;
        return;
    }
    const style = document.createElement('style');
    style.id = tagId;
    style.innerHTML = css;
    document.getElementsByTagName('head')[0].appendChild(style);
}

export function removeStyle(tagId) {
    const style = document.getElementById(tagId);
    if (style) {
        style.remove();
    }
}

// ============== DOM Utilities ==============
export function getActiveEditElement() {
    let element = document.activeElement;
    while (element?.shadowRoot) {
        if (element.shadowRoot.activeElement) {
            element = element.shadowRoot.activeElement;
        } else {
            const subElement = element.shadowRoot.querySelector('input, textarea, select');
            if (subElement) {
                element = subElement;
            }
            break;
        }
    }
    if (!element || !isEditElement(element)) {
        return null;
    }
    return element;
}

/**
 * Whether `element` accepts typed text.
 *
 * `contenteditable` matters as much as the form tags: Roam renders code blocks
 * with CodeMirror, whose editing surface is a contenteditable div. Treating it as
 * non-editable made the whole block look like NORMAL mode, so vim bindings ate
 * keystrokes meant for the code (`/` opened search instead of typing a slash).
 */
export function isEditElement(element) {
    if (!element) return false;

    const tagName = element.tagName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return true;
    }

    // `isContentEditable` is also true for descendants of a contenteditable root.
    return element.isContentEditable === true;
}

export function getInputEvent() {
    return new Event('input', {
        bubbles: true,
        cancelable: true,
    });
}

/**
 * Whether any part of `element` is inside the viewport and actually rendered.
 *
 * Note this is an intersection test, not a containment test: an element that is
 * only partly scrolled into view still counts as visible.
 */
export function isElementVisible(element) {
    if (!element) {
        return false;
    }
    const { top, left, bottom, right, width, height } = element.getBoundingClientRect();
    if (width <= 0 || height <= 0) {
        return false;
    }
    return bottom > 0 && right > 0 && top < window.innerHeight && left < window.innerWidth;
}

/** Whether `element` is fully inside the viewport (used for hint placement). */
export function isElementFullyVisible(element) {
    if (!element) {
        return false;
    }
    const { top, left, bottom, right, width, height } = element.getBoundingClientRect();
    return (
        width > 0 &&
        height > 0 &&
        top >= 0 &&
        left >= 0 &&
        bottom <= window.innerHeight &&
        right <= window.innerWidth
    );
}

// ============== Keyboard Utilities ==============
/**
 * Marks key events this extension synthesised.
 *
 * Our own keydown listener sits in the capture phase on `document`, so events we
 * dispatch come straight back to us. Without this flag, `Keyboard.pressEsc()`
 * inside a command re-enters the handler and runs the command again.
 */
export const SYNTHETIC_KEY_FLAG = '__roamVimModeSynthetic';

/** Legacy `keyCode` values for the named keys we synthesise. */
const NAMED_KEY_CODES = {
    Backspace: 8,
    Tab: 9,
    Enter: 13,
    Escape: 27,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
};

/**
 * Build the init dictionary for a key, filling in `key`, `code` and `keyCode`.
 *
 * All three matter: modern handlers (React, and therefore Roam) read `event.key`,
 * while older code paths still read `keyCode`. Dispatching `keyCode` alone left
 * `event.key` as an empty string, so Roam ignored the event entirely — which is
 * why `o` opened the block for editing but never created one.
 */
export function keyDescriptor(key) {
    const namedCode = NAMED_KEY_CODES[key];
    if (namedCode) {
        return { key, code: key, keyCode: namedCode, which: namedCode };
    }

    if (key.length === 1) {
        const upper = key.toUpperCase();
        const keyCode = upper.charCodeAt(0);
        return {
            key,
            code: /[a-z]/i.test(key) ? `Key${upper}` : undefined,
            keyCode,
            which: keyCode,
        };
    }

    return { key };
}

function getKeyboardEvent(type, init) {
    const event = new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        ...init,
    });
    event[SYNTHETIC_KEY_FLAG] = true;
    return event;
}

/**
 * Where to dispatch a synthesised key event.
 *
 * Normally the focused element, but once focus falls back to `<body>` (which is
 * what happens as soon as Roam takes a block out of edit mode) we must aim at
 * Roam's React root instead: an event dispatched on `body` bubbles to `html` and
 * `document`, never passing through the container React listens on.
 */
export function keyEventTarget() {
    const active = document?.activeElement;
    if (active && active !== document.body) {
        return active;
    }
    return document?.querySelector(Selectors.appRoot) ?? document?.body ?? null;
}

export const Keyboard = {
    BASE_DELAY: 20,

    /**
     * Dispatch a keydown/keyup pair for `key`.
     * @param {string} key a `KeyboardEvent.key` value, e.g. 'Enter' or 'z'
     * @param {{target?: Element}} [opts] extra event init; `target` overrides where it lands
     */
    async press(key, opts = {}, delayOverride = 0) {
        const { target, ...eventInit } = opts;
        const node = target ?? keyEventTarget();
        if (!node) return;

        const init = { ...keyDescriptor(key), ...eventInit };
        ['keydown', 'keyup'].forEach(eventType =>
            node.dispatchEvent(getKeyboardEvent(eventType, init))
        );
        return delay(delayOverride || this.BASE_DELAY);
    },

    async pressEnter(delayOverride = 0) {
        return this.press('Enter', {}, delayOverride);
    },
    async pressEsc(delayOverride = 0) {
        return this.press('Escape', {}, delayOverride);
    },
    async pressBackspace(delayOverride = 0) {
        return this.press('Backspace', {}, delayOverride);
    },
    async pressArrow(direction, opts = {}, delayOverride = 0) {
        return this.press(direction === 'up' ? 'ArrowUp' : 'ArrowDown', opts, delayOverride);
    },

    /**
     * Send a "command key" combo using the right modifier for the platform:
     * Cmd on macOS, Ctrl everywhere else.
     */
    async simulateKeyCombo(key, opts = {}, delayOverride = 0) {
        return this.press(key, { ...commandModifier(), ...opts }, delayOverride);
    },
};

// ============== Mouse Utilities ==============
const POINTER_EVENT_TYPES = new Set(['pointerdown', 'pointerup', 'pointermove', 'pointerover']);

function getMouseEvent(type, buttons, modifiers = {}) {
    const init = {
        shiftKey: modifiers.shiftKey || false,
        metaKey: modifiers.metaKey || false,
        ctrlKey: modifiers.ctrlKey || false,
        view: typeof window !== 'undefined' ? window : undefined,
        bubbles: true,
        cancelable: true,
        composed: true,
        buttons,
        button: 0,
        detail: 1,
    };

    // React and Blueprint both bind pointer events on modern builds; a mouse-only
    // sequence gets ignored by handlers that only listen for those.
    if (POINTER_EVENT_TYPES.has(type) && typeof PointerEvent === 'function') {
        return new PointerEvent(type, { ...init, pointerType: 'mouse', isPrimary: true });
    }
    return new MouseEvent(type, init);
}

/**
 * The real browser order for a click. The previous sequence was
 * `mousedown, click, mouseup` — `click` before `mouseup` — and omitted pointer
 * events entirely, so handlers that key off either were never triggered.
 */
const CLICK_SEQUENCE = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];

export const Mouse = {
    BASE_DELAY: 20,
    simulateClick(buttons, element, modifiers = {}, delayOverride = 0) {
        if (!element) return delay(0);
        CLICK_SEQUENCE.forEach(type => {
            element.dispatchEvent(getMouseEvent(type, buttons, modifiers));
        });
        return delay(delayOverride || this.BASE_DELAY);
    },
    hover(element, delayOverride = 0) {
        if (!element) return delay(0);
        ['pointerover', 'mouseover', 'pointermove', 'mousemove'].forEach(type => {
            element.dispatchEvent(getMouseEvent(type, 0));
        });
        return delay(delayOverride || this.BASE_DELAY);
    },
    leftClick(element, modifiers = {}, additionalDelay = 0) {
        return this.simulateClick(1, element, modifiers, additionalDelay);
    },
};

// ============== Mutation Observer Utilities ==============
export function observeElement(observeInside, handleChange, observeChildren = false, observeAttributes = false) {
    const waitForLoad = new MutationObserver(mutations => {
        handleChange(mutations[mutations.length - 1]?.target ?? observeInside, mutations);
    });

    waitForLoad.observe(observeInside, {
        childList: true,
        attributes: observeAttributes,
        subtree: observeChildren,
    });

    return () => waitForLoad.disconnect();
}

export function onSelectorChange(selector, handleChange, observeChildren = false, observeAttributes = false) {
    const element = document.querySelector(selector);
    if (!element) return () => {};
    return observeElement(element, handleChange, observeChildren, observeAttributes);
}

export function waitForSelectorToExist(selector, observeInside = document.body, options) {
    return waitForSelectionToExist(element => element.querySelector(selector), observeInside, options);
}

/**
 * Resolve once `selectionFn` finds something, or reject on timeout / abort.
 *
 * Both escape hatches matter: without them a caller that navigates away leaves a
 * MutationObserver attached to `document.body` for the lifetime of the tab.
 *
 * @param {{timeout?: number, signal?: AbortSignal}} [options]
 */
export function waitForSelectionToExist(selectionFn, observeInside = document.body, options = {}) {
    const { timeout = 0, signal } = options;

    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }

        let disconnect = () => {};
        let timeoutId = null;

        const cleanup = () => {
            disconnect();
            if (timeoutId !== null) clearTimeout(timeoutId);
            signal?.removeEventListener('abort', onAbort);
        };

        function onAbort() {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        }

        const resolveIfElementExists = () => {
            const element = selectionFn(observeInside);
            if (element) {
                cleanup();
                resolve(element);
                return true;
            }
            return false;
        };

        if (resolveIfElementExists()) return;

        signal?.addEventListener('abort', onAbort, { once: true });

        if (timeout > 0) {
            timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error(`Timed out after ${timeout}ms waiting for element`));
            }, timeout);
        }

        disconnect = observeElement(observeInside, resolveIfElementExists, true);
    });
}
