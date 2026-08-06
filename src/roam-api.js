/**
 * Thin wrapper around Roam's official `window.roamAlphaAPI`.
 *
 * Everything in here is best-effort: each helper returns `null`/`false` when the
 * API (or a specific namespace) is unavailable, so callers can fall back to DOM
 * simulation instead of throwing. Prefer these helpers over synthesised clicks
 * and key events — they are transactional and don't depend on render timing.
 */

import { BLOCK_ID_PREFIX, UID_LENGTH } from './constants.js';

// ============== Availability ==============
export function getRoamAlphaAPI() {
    return (typeof window !== 'undefined' && window.roamAlphaAPI) || null;
}

export function isApiAvailable() {
    return !!getRoamAlphaAPI();
}

/** Newer `data.block.*` namespace, falling back to the legacy top-level methods. */
function blockOp(modernName, legacyName) {
    const api = getRoamAlphaAPI();
    if (!api) return null;
    const modern = api.data?.block?.[modernName];
    if (typeof modern === 'function') return modern.bind(api.data.block);
    const legacy = api[legacyName];
    if (typeof legacy === 'function') return legacy.bind(api);
    return null;
}

// ============== Block id parsing ==============
/**
 * Split a Roam block element id into its window id and block uid.
 *
 * Format: `block-input-<window-id>-<block-uid>`. Both the rendered `.roam-block`
 * div and the `.rm-block-input` textarea carry this same id.
 *
 * @returns {{windowId: string, uid: string}|null}
 */
export function parseBlockElementId(htmlId) {
    if (typeof htmlId !== 'string' || !htmlId.startsWith(BLOCK_ID_PREFIX)) {
        return null;
    }
    const rest = htmlId.slice(BLOCK_ID_PREFIX.length);
    // Need at least `<something>-<9 char uid>`.
    if (rest.length < UID_LENGTH + 2) return null;

    const uid = rest.slice(-UID_LENGTH);
    const windowId = rest.slice(0, -(UID_LENGTH + 1));
    if (!windowId || !uid) return null;
    return { windowId, uid };
}

function toHtmlId(elementOrId) {
    if (!elementOrId) return null;
    return typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
}

export function getBlockUid(elementOrId) {
    return parseBlockElementId(toHtmlId(elementOrId))?.uid ?? null;
}

export function getWindowId(elementOrId) {
    return parseBlockElementId(toHtmlId(elementOrId))?.windowId ?? null;
}

// ============== Reads ==============
const BLOCK_PULL_PATTERN =
    '[:block/uid :block/string :block/order :block/open ' +
    '{:block/children [:block/uid]} {:block/_children [:block/uid]}]';

/**
 * Read a block straight from the datastore.
 * @returns {{uid: string, string: string, order: number, open: boolean,
 *   parentUid: string|null, childCount: number}|null}
 */
export function pullBlock(uid) {
    const api = getRoamAlphaAPI();
    if (!api?.pull || !uid) return null;
    try {
        const result = api.pull(BLOCK_PULL_PATTERN, [':block/uid', uid]);
        if (!result) return null;

        // `:block/_children` is the reverse reference, i.e. the parent. Because
        // `:block/children` is a component attribute, pull returns a single map
        // here rather than a vector — but accept both shapes, since that detail
        // is an implementation choice we shouldn't depend on.
        const reverse = result[':block/_children'];
        const parent = Array.isArray(reverse) ? reverse[0] : reverse;

        return {
            uid: result[':block/uid'],
            string: result[':block/string'] ?? '',
            order: result[':block/order'] ?? 0,
            // `:block/open` is absent for blocks that were never collapsed.
            open: result[':block/open'] !== false,
            parentUid: parent?.[':block/uid'] ?? null,
            childCount: result[':block/children']?.length ?? 0,
        };
    } catch (error) {
        console.warn('[Roam Vim Mode] pull failed for block', uid, error);
        return null;
    }
}

export function getFocusedBlock() {
    const api = getRoamAlphaAPI();
    const focused = api?.ui?.getFocusedBlock?.();
    if (!focused) return null;
    return {
        uid: focused['block-uid'],
        windowId: focused['window-id'],
    };
}

export function generateUid() {
    return getRoamAlphaAPI()?.util?.generateUID?.() ?? null;
}

// ============== Writes ==============
export async function createBlock({ parentUid, order = 0, string = '', uid }) {
    const create = blockOp('create', 'createBlock');
    if (!create || !parentUid) return null;
    const newUid = uid || generateUid();
    await create({
        location: { 'parent-uid': parentUid, order },
        block: newUid ? { string, uid: newUid } : { string },
    });
    return newUid;
}

export async function updateBlock({ uid, string, open }) {
    const update = blockOp('update', 'updateBlock');
    if (!update || !uid) return false;
    const block = { uid };
    if (typeof string === 'string') block.string = string;
    if (typeof open === 'boolean') block.open = open;
    await update({ block });
    return true;
}

export async function deleteBlock(uid) {
    const remove = blockOp('delete', 'deleteBlock');
    if (!remove || !uid) return false;
    await remove({ block: { uid } });
    return true;
}

export async function moveBlock({ uid, parentUid, order }) {
    const move = blockOp('move', 'moveBlock');
    if (!move || !uid || !parentUid) return false;
    await move({
        location: { 'parent-uid': parentUid, order },
        block: { uid },
    });
    return true;
}

// ============== Focus / cursor ==============
/**
 * Focus a block and optionally place the cursor.
 *
 * Omitting `start` leaves the cursor at the end of the string (Roam's default).
 */
export async function focusBlock({ uid, windowId, start, end } = {}) {
    const api = getRoamAlphaAPI();
    if (!api?.ui?.setBlockFocusAndSelection) return false;

    const args = {};
    if (uid) {
        args.location = { 'block-uid': uid, 'window-id': windowId || 'main-window' };
    }
    if (typeof start === 'number') {
        args.selection = typeof end === 'number' ? { start, end } : { start };
    }
    try {
        await api.ui.setBlockFocusAndSelection(args);
        return true;
    } catch (error) {
        console.warn('[Roam Vim Mode] setBlockFocusAndSelection failed', error);
        return false;
    }
}

// ============== Undo / redo ==============
export async function undo() {
    const fn = getRoamAlphaAPI()?.data?.undo;
    if (typeof fn !== 'function') return false;
    await fn();
    return true;
}

export async function redo() {
    const fn = getRoamAlphaAPI()?.data?.redo;
    if (typeof fn !== 'function') return false;
    await fn();
    return true;
}
