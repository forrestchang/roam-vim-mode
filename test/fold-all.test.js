import test from 'node:test';
import assert from 'node:assert/strict';

import { installDomStub, keyEvent } from './helpers/dom-stub.js';

installDomStub();

const { pullBlockTree } = await import('../src/roam-api.js');
const { Roam } = await import('../src/roam.js');
const { matchCommand } = await import('../src/keybindings.js');
const { toggleFold, toggleFoldAll } = await import('../src/commands.js');
const { Mode } = await import('../src/mode.js');

/**
 * A fake datastore. `blocks` maps uid -> { open?, children? }.
 *
 * The stubbed `pull` always answers with the nested shape: the recursive pattern
 * needs it, and the flat one only reads `:block/children`'s length, so one
 * builder serves both callers.
 *
 * @returns {{uid: string, open: boolean}[]} the updates the code under test made
 */
function stubDatastore(blocks) {
    const updates = [];
    const build = uid => {
        const block = blocks[uid];
        if (!block) return null;
        const node = { ':block/uid': uid };
        if (block.open === false) node[':block/open'] = false;
        if (block.children?.length) {
            node[':block/children'] = block.children.map(build).filter(Boolean);
        }
        return node;
    };

    window.roamAlphaAPI = {
        pull: (_pattern, [, uid]) => build(uid),
        data: {
            block: {
                update: async ({ block }) => {
                    updates.push(block);
                    blocks[block.uid].open = block.open;
                },
            },
        },
    };
    return updates;
}

/** An element stub carrying the id Roam gives a rendered block. */
const blockElement = uid => ({ id: `block-input-main-window-${uid}` });

const ROOT_A = 'aaaaaaaa1';
const CHILD_A = 'aaaaaaaa2';
const GRANDCHILD_A = 'aaaaaaaa3';
const ROOT_B = 'bbbbbbbb1';

/** root-a > child-a > grandchild-a, plus a childless root-b. */
function samplePage(overrides = {}) {
    return {
        [ROOT_A]: { children: [CHILD_A] },
        [CHILD_A]: { children: [GRANDCHILD_A] },
        [GRANDCHILD_A]: {},
        [ROOT_B]: {},
        ...overrides,
    };
}

const roots = [blockElement(ROOT_A), blockElement(ROOT_B)];
/** A panel with no carets at all — the datastore path needs nothing else. */
const panel = { querySelector: () => null, querySelectorAll: () => [] };

/**
 * A caret stub that flips its own class on click, the way Roam re-renders one.
 * @param {'open'|'closed'} state
 */
function caretElement(state, inReferences = false) {
    const caret = {
        state,
        clicks: 0,
        matches: selector => selector === `.rm-caret-${caret.state}`,
        closest: selector =>
            inReferences && selector.includes('.rm-ref-page-view') ? {} : null,
        dispatchEvent: event => {
            if (event.type === 'click') {
                caret.clicks++;
                caret.state = caret.state === 'open' ? 'closed' : 'open';
            }
            return true;
        },
    };
    return caret;
}

/** A panel whose only carets are the Linked References page headers. */
function panelWithReferenceHeaders(carets) {
    const titles = carets.map(caret => ({
        parentElement: { querySelector: () => caret },
    }));
    return {
        // A header caret is a caret: a bare `.rm-caret-open` lookup finds it,
        // which is how the no-API path reads the page's state.
        querySelector: selector => carets.find(caret => caret.matches(selector)) ?? null,
        querySelectorAll: selector =>
            selector === '.rm-ref-page-view-title' ? titles : [],
    };
}

test.afterEach(() => {
    delete window.roamAlphaAPI;
});

test('pullBlockTree flattens a whole subtree', () => {
    stubDatastore(samplePage({ [CHILD_A]: { open: false, children: [GRANDCHILD_A] } }));

    assert.deepEqual(pullBlockTree(ROOT_A), [
        { uid: ROOT_A, open: true, hasChildren: true },
        // Collapsed, but its descendants are still reachable through the
        // datastore — which is the whole reason fold-all can't read the DOM.
        { uid: CHILD_A, open: false, hasChildren: true },
        { uid: GRANDCHILD_A, open: true, hasChildren: false },
    ]);
});

test('pullBlockTree returns nothing when the API is unavailable', () => {
    assert.deepEqual(pullBlockTree(ROOT_A), []);
});

test('Z folds every level when the page is expanded', async () => {
    const updates = stubDatastore(samplePage());

    assert.equal(await Roam.toggleFoldAll(roots, panel), true);
    assert.deepEqual(updates, [
        { uid: ROOT_A, open: false },
        { uid: CHILD_A, open: false },
    ]);
});

test('Z unfolds every level when the top level is already collapsed', async () => {
    const updates = stubDatastore(
        samplePage({
            [ROOT_A]: { open: false, children: [CHILD_A] },
            [CHILD_A]: { open: false, children: [GRANDCHILD_A] },
        })
    );

    await Roam.toggleFoldAll(roots, panel);
    assert.deepEqual(updates, [
        { uid: ROOT_A, open: true },
        { uid: CHILD_A, open: true },
    ]);
});

test('the direction comes from the top level, not from hidden blocks', async () => {
    // Expanded root, collapsed child. Judging by "is anything expanded anywhere"
    // would spend the press collapsing the child — invisible to the user.
    const updates = stubDatastore(
        samplePage({ [CHILD_A]: { open: false, children: [GRANDCHILD_A] } })
    );

    await Roam.toggleFoldAll(roots, panel);
    assert.deepEqual(updates, [{ uid: ROOT_A, open: false }], 'folds, and skips the already-folded child');
});

test('leaf blocks are never written to', async () => {
    const updates = stubDatastore({ [ROOT_B]: {} });

    await Roam.toggleFoldAll([blockElement(ROOT_B)], panel);
    assert.deepEqual(updates, []);
});

test('without the API, fold-all falls back to clicking carets', async () => {
    const carets = [caretElement('open'), caretElement('open')];
    const panelWithCarets = {
        querySelector: selector => carets.find(caret => caret.matches(selector)) ?? null,
        querySelectorAll: selector => carets.filter(caret => caret.matches(selector)),
    };

    assert.equal(await Roam.toggleFoldAll(roots, panelWithCarets), true);
    assert.deepEqual(carets.map(caret => caret.state), ['closed', 'closed']);
    // Each caret is clicked once and then leaves the query — no spinning.
    assert.deepEqual(carets.map(caret => caret.clicks), [1, 1]);
});

test('the caret fallback leaves reference blocks alone', async () => {
    // They belong to other pages: collapsing one is a real edit elsewhere.
    const referenceBlock = caretElement('open', true);
    const panelWithCarets = {
        querySelector: () => null,
        querySelectorAll: () => [referenceBlock],
    };

    await Roam.toggleFoldAll([], panelWithCarets);
    assert.equal(referenceBlock.clicks, 0);
});

test('Z collapses the Linked References page headers too', async () => {
    stubDatastore(samplePage());
    const headers = [caretElement('open'), caretElement('closed')];

    await Roam.toggleFoldAll(roots, panelWithReferenceHeaders(headers));

    assert.deepEqual(headers.map(caret => caret.state), ['closed', 'closed']);
    assert.equal(headers[1].clicks, 0, 'an already-collapsed header is left alone');
});

test('reference headers follow the blocks back open', async () => {
    stubDatastore(samplePage({ [ROOT_A]: { open: false, children: [CHILD_A] } }));
    const headers = [caretElement('closed')];

    await Roam.toggleFoldAll(roots, panelWithReferenceHeaders(headers));

    assert.deepEqual(headers.map(caret => caret.state), ['open']);
});

test('a page that is nothing but references still toggles its headers', async () => {
    const headers = [caretElement('open')];

    assert.equal(await Roam.toggleFoldAll([], panelWithReferenceHeaders(headers)), true);
    assert.equal(headers[0].state, 'closed');
});

test('Z is bound to fold-all and z still folds one block', () => {
    const match = (key, modifiers) => matchCommand(key, Mode.NORMAL, keyEvent(key, modifiers));

    assert.equal(match('z'), toggleFold);
    assert.equal(match('Z', { shiftKey: true }), toggleFoldAll);
    assert.equal(match('z', { ctrlKey: true }), null, 'Ctrl+Z stays with Roam');
});
