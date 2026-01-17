/**
 * Utility functions for Roam Vim Mode
 */

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

export function isMacOS() {
    return window.navigator.platform === 'MacIntel';
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

export function isEditElement(element) {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT';
}

export function getInputEvent() {
    return new Event('input', {
        bubbles: true,
        cancelable: true,
    });
}

export function isElementVisible(element) {
    if (!element) {
        return false;
    }
    const { x, y } = element.getBoundingClientRect();
    return x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
}

// ============== Keyboard Utilities ==============
function getKeyboardEvent(type, code, opts) {
    return new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        keyCode: code,
        ...opts,
    });
}

export const Keyboard = {
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    BASE_DELAY: 20,

    async simulateKey(code, delayOverride = 0, opts) {
        ['keydown', 'keyup'].forEach(eventType =>
            document?.activeElement?.dispatchEvent(getKeyboardEvent(eventType, code, opts))
        );
        return delay(delayOverride || this.BASE_DELAY);
    },
    async pressEnter(delayOverride = 0) {
        return this.simulateKey(13, delayOverride);
    },
    async pressEsc(delayOverride = 0) {
        return this.simulateKey(27, delayOverride);
    },
    async pressBackspace(delayOverride = 0) {
        return this.simulateKey(8, delayOverride);
    },
    async pressTab(delayOverride = 0) {
        return this.simulateKey(9, delayOverride);
    },
    async pressShiftTab(delayOverride = 0) {
        return this.simulateKey(9, delayOverride, { shiftKey: true });
    },
};

export const KEY_TO_CODE = {
    ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40,
    '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
    ';': 59, '=': 187, ',': 188, '-': 189, '.': 190, '/': 191, '[': 219, '\\': 220, ']': 221, "'": 222,
    a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71, h: 72, i: 73, j: 74, k: 75, l: 76, m: 77,
    n: 78, o: 79, p: 80, q: 81, r: 82, s: 83, t: 84, u: 85, v: 86, w: 87, x: 88, y: 89, z: 90,
};

// ============== Mouse Utilities ==============
function getMouseEvent(mouseEventType, buttons, modifiers = {}) {
    return new MouseEvent(mouseEventType, {
        shiftKey: modifiers.shiftKey || false,
        metaKey: modifiers.metaKey || false,
        ctrlKey: modifiers.ctrlKey || false,
        view: window,
        bubbles: true,
        cancelable: true,
        buttons,
    });
}

export const Mouse = {
    BASE_DELAY: 20,
    simulateClick(buttons, element, modifiers = {}, delayOverride = 0) {
        const mouseClickEvents = ['mousedown', 'click', 'mouseup'];
        mouseClickEvents.forEach(mouseEventType => {
            element.dispatchEvent(getMouseEvent(mouseEventType, buttons, modifiers));
        });
        return delay(delayOverride || this.BASE_DELAY);
    },
    hover(element, delayOverride = 0) {
        element.dispatchEvent(getMouseEvent('mouseover', 1));
        element.dispatchEvent(getMouseEvent('mousemove', 1));
        return delay(delayOverride || this.BASE_DELAY);
    },
    leftClick(element, modifiers = {}, additionalDelay = 0) {
        return this.simulateClick(1, element, modifiers, additionalDelay);
    },
};

// ============== Mutation Observer Utilities ==============
export function observeElement(observeInside, handleChange, observeChildren = false, observeAttributes = false) {
    const waitForLoad = new MutationObserver(mutations => {
        handleChange(mutations[0].target);
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

export function waitForSelectorToExist(selector, observeInside = document.body) {
    return waitForSelectionToExist(element => element.querySelector(selector), observeInside);
}

export function waitForSelectionToExist(selectionFn, observeInside = document.body) {
    return new Promise(resolve => {
        const resolveIfElementExists = () => {
            const element = selectionFn(observeInside);
            if (element) {
                resolve(element);
                return true;
            }
            return false;
        };

        if (resolveIfElementExists()) return;

        const disconnect = observeElement(
            observeInside,
            () => {
                if (resolveIfElementExists()) {
                    disconnect();
                }
            },
            true
        );
    });
}

// ============== Event Utilities ==============
export function listenToEvent(event, handler) {
    window.addEventListener(event, handler, true);
    return () => window.removeEventListener(event, handler, true);
}
