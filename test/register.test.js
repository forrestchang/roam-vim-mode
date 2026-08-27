import test from 'node:test';
import assert from 'node:assert/strict';

import { installDomStub, keyEvent } from './helpers/dom-stub.js';

installDomStub();

const { getRegister, setRegister, clearRegister } = await import('../src/register.js');
const { matchCommand, PENDING, CONSUME } = await import('../src/keybindings.js');
const { yankBlock, pasteBlockAbove, pasteBlockBelow } = await import('../src/commands.js');
const { Mode } = await import('../src/mode.js');

const match = (sequence, key, modifiers) =>
    matchCommand(sequence, Mode.NORMAL, keyEvent(key, modifiers));

test.afterEach(() => clearRegister());

test('the register holds the last yank', () => {
    setRegister(['hello']);
    assert.deepEqual(getRegister(), ['hello']);

    clearRegister();
    assert.deepEqual(getRegister(), []);
});

test('the register keeps yanked blocks apart', () => {
    // One entry per block, so deleting three and pasting them back gives three
    // blocks again rather than one with two line breaks in it.
    setRegister(['first', 'second', 'third']);
    assert.deepEqual(getRegister(), ['first', 'second', 'third']);
});

test('the register only ever holds strings', () => {
    // Callers feed it `getBlockText`, which returns '' for a block Roam has
    // already dropped — but nothing stops a future caller passing undefined.
    setRegister(undefined);
    assert.deepEqual(getRegister(), []);

    setRegister(['kept', undefined, 'also kept']);
    assert.deepEqual(getRegister(), ['kept', 'also kept']);
});

test('`yy` yanks and `p`/`P` paste', () => {
    assert.equal(match('y y', 'y'), yankBlock);
    assert.equal(match('p', 'p'), pasteBlockBelow);
    assert.equal(match('p', 'P', { shiftKey: true }), pasteBlockAbove);
});

test('`y` waits for a second key instead of firing on its own', () => {
    assert.equal(match('y', 'y'), PENDING);
    // `yj` is not a binding: swallow it rather than letting `j` move the cursor.
    assert.equal(match('y j', 'j'), CONSUME);
});

test('pasting an empty register does nothing at all', async () => {
    clearRegister();
    // Returns before touching the panel — under the stub DOM, reaching
    // `VimRoamPanel.selected()` would throw.
    await pasteBlockBelow();
    await pasteBlockAbove();
});
