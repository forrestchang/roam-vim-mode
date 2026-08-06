import test from 'node:test';
import assert from 'node:assert/strict';

import { installDomStub, setPresent } from './helpers/dom-stub.js';

installDomStub();

const { keyEventTarget } = await import('../src/utils.js');
const { Selectors } = await import('../src/constants.js');

test.afterEach(() => {
    document.activeElement = null;
    setPresent();
});

test('key events go to the focused element when there is one', () => {
    const textarea = { tagName: 'TEXTAREA' };
    document.activeElement = textarea;

    assert.equal(keyEventTarget(), textarea);
});

test('key events fall back to the React root, not document.body', () => {
    // Regression: once Roam takes a block out of edit mode, focus lands on
    // <body>. Dispatching there bubbles to html/document and never crosses the
    // container React listens on, so Roam never saw our synthetic keys.
    setPresent([Selectors.appRoot]);
    document.activeElement = document.body;

    const target = keyEventTarget();
    assert.notEqual(target, document.body);
    assert.equal(target.selector, Selectors.appRoot);
});

test('with nothing focused it still aims at the React root', () => {
    setPresent([Selectors.appRoot]);
    document.activeElement = null;

    assert.equal(keyEventTarget().selector, Selectors.appRoot);
});

test('without a React root it degrades to document.body', () => {
    document.activeElement = null;

    assert.equal(keyEventTarget(), document.body);
});
