import test from 'node:test';
import assert from 'node:assert/strict';

import { keyDescriptor } from '../src/utils.js';

test('named keys carry key, code and the legacy keyCode', () => {
    // Regression: only `keyCode` used to be set, leaving `event.key` empty. Roam
    // reads `event.key`, so synthesised Enter/Escape/Backspace did nothing —
    // which is why `o` opened the block for editing but never created one.
    assert.deepEqual(keyDescriptor('Enter'), {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
    });
    assert.deepEqual(keyDescriptor('Escape'), {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
    });
    assert.deepEqual(keyDescriptor('Backspace'), {
        key: 'Backspace',
        code: 'Backspace',
        keyCode: 8,
        which: 8,
    });
});

test('arrow keys are named keys too', () => {
    assert.equal(keyDescriptor('ArrowUp').key, 'ArrowUp');
    assert.equal(keyDescriptor('ArrowUp').keyCode, 38);
    assert.equal(keyDescriptor('ArrowDown').keyCode, 40);
});

test('single letters get a KeyX code and the uppercase char code', () => {
    assert.deepEqual(keyDescriptor('z'), {
        key: 'z',
        code: 'KeyZ',
        keyCode: 90,
        which: 90,
    });
});

test('every synthesised key sets a non-empty `key`', () => {
    for (const key of ['Enter', 'Escape', 'Backspace', 'Tab', 'ArrowUp', 'ArrowDown', 'z', '/']) {
        assert.equal(keyDescriptor(key).key, key, `${key} must set event.key`);
    }
});
