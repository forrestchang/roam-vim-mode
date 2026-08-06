import test from 'node:test';
import assert from 'node:assert/strict';

import { installDomStub } from './helpers/dom-stub.js';

installDomStub();

const { pullBlock } = await import('../src/roam-api.js');

/** Install a fake `roamAlphaAPI.pull` that returns `result` for any entity. */
function stubPull(result) {
    window.roamAlphaAPI = { pull: () => result };
}

test.afterEach(() => {
    delete window.roamAlphaAPI;
});

test('reads the parent uid when pull returns a bare map', () => {
    // `:block/children` is a component attribute, so Datomic pull returns the
    // reverse reference as a single map rather than a vector. Indexing it with
    // [0] silently produced parentUid: null, which broke every command that
    // needs a parent (o, O, block moves).
    stubPull({
        ':block/uid': 'Ck8dGBmuQ',
        ':block/string': 'hello',
        ':block/order': 2,
        ':block/_children': { ':block/uid': 'parent123' },
    });

    assert.equal(pullBlock('Ck8dGBmuQ').parentUid, 'parent123');
});

test('also reads the parent uid when pull returns a vector', () => {
    stubPull({
        ':block/uid': 'Ck8dGBmuQ',
        ':block/_children': [{ ':block/uid': 'parent123' }],
    });

    assert.equal(pullBlock('Ck8dGBmuQ').parentUid, 'parent123');
});

test('a block with no parent reports null rather than throwing', () => {
    stubPull({ ':block/uid': 'Ck8dGBmuQ' });

    const block = pullBlock('Ck8dGBmuQ');
    assert.equal(block.parentUid, null);
    assert.equal(block.childCount, 0);
    assert.equal(block.string, '');
    assert.equal(block.order, 0);
});

test('`open` defaults to true and only false when explicitly collapsed', () => {
    stubPull({ ':block/uid': 'a' });
    assert.equal(pullBlock('a').open, true, 'absent means never collapsed');

    stubPull({ ':block/uid': 'a', ':block/open': false });
    assert.equal(pullBlock('a').open, false);
});

test('childCount reflects the children vector', () => {
    stubPull({
        ':block/uid': 'a',
        ':block/children': [{ ':block/uid': 'c1' }, { ':block/uid': 'c2' }],
    });
    assert.equal(pullBlock('a').childCount, 2);
});

test('a throwing pull degrades to null instead of propagating', () => {
    window.roamAlphaAPI = {
        pull: () => {
            throw new Error('bad pattern');
        },
    };

    const warn = console.warn;
    console.warn = () => {};
    assert.equal(pullBlock('a'), null);
    console.warn = warn;
});
