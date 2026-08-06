/**
 * The bare minimum `document`/`window` needed to exercise the pure keyboard
 * logic under `node:test`. Anything that actually manipulates Roam's DOM is out
 * of scope here — those paths are guarded by `runCommand` at runtime.
 */

/** Selectors that `document.querySelector` should report as present. */
const presentSelectors = new Set();
/** Element ids that `document.getElementById` should report as present. */
const presentIds = new Set();

export function setPresent(selectors = [], ids = []) {
    presentSelectors.clear();
    presentIds.clear();
    selectors.forEach(selector => presentSelectors.add(selector));
    ids.forEach(id => presentIds.add(id));
}

/** Minimal stand-ins so code that synthesises events can run under Node. */
class StubUIEvent extends Event {
    constructor(type, init = {}) {
        // `bubbles`/`cancelable`/`composed` are getter-only on Event, so they go
        // through the constructor; everything else (key, keyCode, shiftKey, …)
        // is copied on as a plain property.
        const { bubbles, cancelable, composed, ...rest } = init;
        super(type, { bubbles, cancelable, composed });
        Object.assign(this, rest);
    }
}

export function installDomStub() {
    const noop = () => {};

    globalThis.KeyboardEvent = StubUIEvent;
    globalThis.MouseEvent = StubUIEvent;

    const makeElement = () => ({
        style: {},
        classList: { add: noop, remove: noop, contains: () => false },
        appendChild: noop,
        remove: noop,
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => true,
        scrollIntoView: noop,
    });

    globalThis.document = {
        activeElement: null,
        body: { appendChild: noop, ...makeElement() },
        getElementById: id => (presentIds.has(id) ? { id, ...makeElement() } : null),
        querySelector: selector =>
            presentSelectors.has(selector) ? { selector, ...makeElement() } : null,
        querySelectorAll: () => [],
        addEventListener: noop,
        removeEventListener: noop,
        createElement: makeElement,
    };

    globalThis.window = {
        innerWidth: 1280,
        innerHeight: 800,
        navigator: { platform: 'MacIntel' },
        addEventListener: noop,
        removeEventListener: noop,
    };
    // Note: `globalThis.navigator` is read-only in modern Node, and nothing under
    // test reads it — `isMacOS()` goes through `window.navigator`.
}

/** A KeyboardEvent-shaped object that records whether it was consumed. */
export function keyEvent(key, modifiers = {}) {
    return {
        key,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        ...modifiers,
        target: null,
        defaultPrevented: false,
        propagationStopped: false,
        immediatePropagationStopped: false,
        preventDefault() {
            this.defaultPrevented = true;
        },
        stopPropagation() {
            this.propagationStopped = true;
        },
        stopImmediatePropagation() {
            this.propagationStopped = true;
            this.immediatePropagationStopped = true;
        },
    };
}
