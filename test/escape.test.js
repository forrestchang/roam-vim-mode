import test from 'node:test';
import assert from 'node:assert/strict';

import { installDomStub, keyEvent, setPresent } from './helpers/dom-stub.js';

installDomStub();

const { handleKeydown, clearSequence } = await import('../src/keybindings.js');
const { SYNTHETIC_KEY_FLAG } = await import('../src/utils.js');
const { HELP_PANEL_ID, Selectors } = await import('../src/constants.js');

const CLOSED_OVERLAY = '.bp3-overlay';
const OPEN_OVERLAY = Selectors.blueprintOverlay;

/** Focus an element that reports itself as living inside Roam's modal UI. */
function focusInsideModal(inside = true) {
    document.activeElement = {
        tagName: 'INPUT',
        closest: selector => (inside && selector === Selectors.roamModal ? {} : null),
    };
}

test.beforeEach(() => {
    setPresent();
    clearSequence();
    document.activeElement = null;
});

test.after(() => {
    setPresent();
    document.activeElement = null;
});

test('Escape is handled by us when only closed Blueprint overlays exist', () => {
    // Regression: Blueprint leaves closed overlay containers mounted, so a
    // `.bp3-overlay` match was true almost always and handed every Escape to
    // Roam — leaving the user to press Escape twice to reach NORMAL.
    setPresent([CLOSED_OVERLAY]);

    const event = keyEvent('Escape');
    handleKeydown(event);

    assert.equal(event.defaultPrevented, true, 'we consume Escape ourselves');
});

test('a key we handle is stopped immediately, not merely prevented', () => {
    // Roam has its own global key handlers. Without stopImmediatePropagation,
    // Escape still reaches them and Roam turns the edited block into a blue
    // selection — landing the user in VISUAL instead of NORMAL.
    const event = keyEvent('Escape');
    handleKeydown(event);

    assert.equal(event.propagationStopped, true);
    assert.equal(event.immediatePropagationStopped, true, 'Roam must not see this key at all');
});

test('mounted-but-idle overlays do not make us surrender Escape', () => {
    // A running Roam keeps ~6 `.bp3-overlay` and ~4 `.bp3-overlay-open` elements
    // mounted permanently. Deciding by presence answered "an overlay is open"
    // forever, so Escape was never handled here at all.
    setPresent([CLOSED_OVERLAY, OPEN_OVERLAY]);

    const event = keyEvent('Escape');
    handleKeydown(event);

    assert.equal(event.defaultPrevented, true, 'we still own Escape');
});

test('Escape is handed to Roam when focus is inside its modal UI', () => {
    setPresent([OPEN_OVERLAY]);
    focusInsideModal(true);

    const event = keyEvent('Escape');
    handleKeydown(event);

    assert.equal(event.defaultPrevented, false, 'Roam gets to close its own overlay');
});

test('Escape closes our help panel even while a Roam modal has focus', () => {
    // Our own modal UI must always be dismissable, otherwise `?` is the only way
    // out of the help panel.
    setPresent([OPEN_OVERLAY], [HELP_PANEL_ID]);
    focusInsideModal(true);

    const event = keyEvent('Escape');
    handleKeydown(event);

    assert.equal(event.defaultPrevented, true);
});

test('the help panel swallows other keys instead of running commands', () => {
    setPresent([], [HELP_PANEL_ID]);

    const event = keyEvent('j');
    handleKeydown(event);

    assert.equal(event.defaultPrevented, true, 'j must not move the selection');
});

test('key events we synthesised are ignored', () => {
    // `returnToNormalMode` dispatches its own Escape; without this guard our
    // capture-phase listener re-enters and recurses.
    const event = keyEvent('Escape', { [SYNTHETIC_KEY_FLAG]: true });
    handleKeydown(event);

    assert.equal(event.defaultPrevented, false);
});
