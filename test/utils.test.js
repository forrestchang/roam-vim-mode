import test from 'node:test';
import assert from 'node:assert/strict';

import { clamp, findLast, relativeItem } from '../src/utils.js';
import { escapeHtmlId } from '../src/constants.js';
import { generateHintLabels } from '../src/page-hints.js';

test('clamp keeps a value inside its bounds', () => {
    assert.equal(clamp(5, 0, 10), 5);
    assert.equal(clamp(-3, 0, 10), 0);
    assert.equal(clamp(42, 0, 10), 10);
});

test('relativeItem saturates at both ends instead of wrapping', () => {
    const xs = ['a', 'b', 'c'];
    assert.equal(relativeItem(xs, 0, 1), 'b');
    assert.equal(relativeItem(xs, 0, -1), 'a', 'clamps at the start');
    assert.equal(relativeItem(xs, 2, 5), 'c', 'clamps at the end');
});

test('findLast scans from the end', () => {
    assert.equal(findLast([1, 2, 3, 4], n => n % 2 === 0), 4);
    assert.equal(findLast([1, 3], n => n % 2 === 0), undefined);
});

test('escapeHtmlId escapes every CSS meta-character, not just the first', () => {
    // Regression: the original used String.replace with a string pattern, which
    // only ever replaced the first occurrence.
    const escaped = escapeHtmlId('a.b.c@d');
    assert.equal(escaped.includes('\\.'), true);
    assert.equal((escaped.match(/\\\./g) ?? []).length, 2, 'both dots escaped');
    assert.equal(escaped.includes('\\@'), true);
});

test('escapeHtmlId tolerates non-string input', () => {
    assert.equal(escapeHtmlId(undefined), '');
    assert.equal(escapeHtmlId(null), '');
});

test('hint labels stay unique and grow to two characters when needed', () => {
    const few = generateHintLabels(5);
    assert.equal(few.length, 5);
    assert.equal(new Set(few).size, 5);
    assert.ok(few.every(label => label.length === 1));

    const many = generateHintLabels(30);
    assert.equal(many.length, 30);
    assert.equal(new Set(many).size, 30, 'no duplicate labels');
});
