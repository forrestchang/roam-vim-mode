import test from 'node:test';
import assert from 'node:assert/strict';

import { installDomStub, keyEvent } from './helpers/dom-stub.js';

installDomStub();

const {
    matchCommand,
    handleKeydown,
    clearSequence,
    getSequenceBuffer,
    PENDING,
    CONSUME,
} = await import('../src/keybindings.js');

const {
    selectFirstBlock,
    selectLastBlock,
    selectBlockDown,
    selectBlockUp,
    deleteBlock,
    editBlock,
    editBlockFromEnd,
    insertBlockAfter,
    insertBlockBefore,
    redo,
    undo,
    returnToNormalMode,
} = await import('../src/commands.js');

const { Mode } = await import('../src/mode.js');

const match = (sequence, key, modifiers, mode = Mode.NORMAL) =>
    matchCommand(sequence, mode, keyEvent(key, modifiers));

test('a bare sequence prefix stays pending instead of resolving', () => {
    assert.equal(match('g', 'g'), PENDING);
    assert.equal(match('d', 'd'), PENDING);
});

test('two-key sequences resolve to their command', () => {
    assert.equal(match('g g', 'g'), selectFirstBlock);
    assert.equal(match('d d', 'd'), deleteBlock);
});

test('an unmatched key mid-sequence is swallowed, not executed', () => {
    // `g` then `j` must not scroll down — it aborts the sequence.
    assert.equal(match('g j', 'j'), CONSUME);
    assert.equal(match('d k', 'k'), CONSUME);
});

test('handleKeydown accumulates a sequence across two key presses', () => {
    // Regression: `matchCommand` returning a no-op for a bare prefix used to be
    // truthy, so the handler cleared the buffer after every key and `gg`/`dd`
    // could never accumulate.
    clearSequence();

    const first = keyEvent('g');
    handleKeydown(first);
    assert.equal(first.defaultPrevented, true, 'the prefix key is consumed');
    assert.equal(getSequenceBuffer(), 'g ', 'the buffer survives the prefix key');

    // The command does fire, and fails against the stub DOM (there is no Roam
    // panel). That failure being contained is itself the behaviour we want.
    const warnings = [];
    const realWarn = console.warn;
    console.warn = (...args) => warnings.push(args);

    const second = keyEvent('g');
    handleKeydown(second);

    console.warn = realWarn;

    assert.equal(second.defaultPrevented, true);
    assert.equal(getSequenceBuffer(), '', 'the buffer is cleared once the command fires');
    assert.equal(warnings.length, 1, 'the command ran and its failure was contained');

    clearSequence();
});

test('Shift+A does not trigger the `a` binding', () => {
    assert.equal(match('a', 'a'), editBlockFromEnd);
    assert.equal(match('a', 'A', { shiftKey: true }), null);
});

test('shifted bindings are distinct from their unshifted counterparts', () => {
    assert.equal(match('g', 'G', { shiftKey: true }), selectLastBlock);
    assert.equal(match('o', 'o'), insertBlockAfter);
    assert.equal(match('o', 'O', { shiftKey: true }), insertBlockBefore);
    assert.equal(match('i', 'i'), editBlock);
});

test('navigation and history bindings', () => {
    assert.equal(match('j', 'j'), selectBlockDown);
    assert.equal(match('k', 'k'), selectBlockUp);
    assert.equal(match('u', 'u'), undo);
    assert.equal(match('ctrl+r', 'r', { ctrlKey: true }), redo);
});

test('Escape always returns to normal mode', () => {
    assert.equal(match('escape', 'Escape'), returnToNormalMode);
    assert.equal(match('escape', 'Escape', {}, Mode.VISUAL), returnToNormalMode);
});

test('hint keys resolve to a click, and Ctrl+R is not treated as a hint', () => {
    const hint = match('r', 'r');
    assert.equal(typeof hint, 'function');
    assert.notEqual(hint, redo);

    assert.equal(match('ctrl+r', 'r', { ctrlKey: true }), redo);
});

test('VISUAL mode only grows the selection', () => {
    assert.equal(match('j', 'j', {}, Mode.VISUAL), selectBlockDown);
    assert.equal(match('k', 'k', {}, Mode.VISUAL), selectBlockUp);
    // Editing bindings must not fire while a block selection is active.
    assert.equal(match('i', 'i', {}, Mode.VISUAL), null);
    assert.equal(match('d d', 'd', {}, Mode.VISUAL), null);
});

test('unknown keys are left for Roam to handle', () => {
    assert.equal(match('x', 'x'), null);
    assert.equal(match('9', '9'), null);
});
