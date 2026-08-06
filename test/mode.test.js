import test from 'node:test';
import assert from 'node:assert/strict';

import { installDomStub } from './helpers/dom-stub.js';

installDomStub();

const { isEditElement } = await import('../src/utils.js');
const { Mode, getMode } = await import('../src/mode.js');

/** Build a fake focused element. `codeEditorAncestor` fakes `closest()` matching. */
function focus({ tagName = 'DIV', isContentEditable = false, codeEditorAncestor = false } = {}) {
    document.activeElement = {
        tagName,
        isContentEditable,
        closest: selector => (codeEditorAncestor && selector.includes('cm-editor') ? {} : null),
    };
}

test.afterEach(() => {
    document.activeElement = null;
});

test('isEditElement recognises form fields', () => {
    assert.equal(isEditElement({ tagName: 'TEXTAREA' }), true);
    assert.equal(isEditElement({ tagName: 'INPUT' }), true);
    assert.equal(isEditElement({ tagName: 'SELECT' }), true);
});

test('isEditElement recognises contenteditable surfaces', () => {
    // Regression: CodeMirror's editing surface is a contenteditable div, not a
    // textarea. Missing this made code blocks read as NORMAL mode.
    assert.equal(isEditElement({ tagName: 'DIV', isContentEditable: true }), true);
    assert.equal(isEditElement({ tagName: 'DIV', isContentEditable: false }), false);
});

test('isEditElement tolerates missing input', () => {
    assert.equal(isEditElement(null), false);
    assert.equal(isEditElement(undefined), false);
});

test('a focused code block is INSERT mode, not NORMAL', () => {
    focus({ isContentEditable: true });
    assert.equal(getMode(), Mode.INSERT);
});

test('a code editor that keeps focus on a wrapper is still INSERT mode', () => {
    focus({ isContentEditable: false, codeEditorAncestor: true });
    assert.equal(getMode(), Mode.INSERT);
});

test('a plain focused div is still NORMAL mode', () => {
    focus({ isContentEditable: false });
    assert.equal(getMode(), Mode.NORMAL);
});

test('nothing focused is NORMAL mode', () => {
    assert.equal(getMode(), Mode.NORMAL);
});
