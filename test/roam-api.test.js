import test from 'node:test';
import assert from 'node:assert/strict';

import { parseBlockElementId, getBlockUid, getWindowId } from '../src/roam-api.js';

const MAIN_WINDOW = 'ZBt6MZk9BJPjXHNTVzTgYEqRSyz2-body-outline-11-13-2021';

test('splits a block element id into window id and uid', () => {
    const id = `block-input-${MAIN_WINDOW}-Ck8dGBmuQ`;
    assert.deepEqual(parseBlockElementId(id), {
        windowId: MAIN_WINDOW,
        uid: 'Ck8dGBmuQ',
    });
});

test('handles sidebar window ids, which contain their own dashes', () => {
    const sidebarWindow = 'sidebar-outline-Xk2p-QQ1z';
    const id = `block-input-${sidebarWindow}-aB3dEfGhI`;
    assert.deepEqual(parseBlockElementId(id), {
        windowId: sidebarWindow,
        uid: 'aB3dEfGhI',
    });
});

test('rejects ids that are not Roam block ids', () => {
    assert.equal(parseBlockElementId('some-random-id'), null);
    assert.equal(parseBlockElementId('block-input-short'), null);
    assert.equal(parseBlockElementId(''), null);
    assert.equal(parseBlockElementId(undefined), null);
    assert.equal(parseBlockElementId(null), null);
});

test('accepts either an element or a raw id string', () => {
    const id = `block-input-${MAIN_WINDOW}-Ck8dGBmuQ`;
    assert.equal(getBlockUid(id), 'Ck8dGBmuQ');
    assert.equal(getBlockUid({ id }), 'Ck8dGBmuQ');
    assert.equal(getWindowId({ id }), MAIN_WINDOW);
});

test('returns null rather than throwing on missing input', () => {
    assert.equal(getBlockUid(null), null);
    assert.equal(getBlockUid(undefined), null);
    assert.equal(getWindowId({}), null);
});
