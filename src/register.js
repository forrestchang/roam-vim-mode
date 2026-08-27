/**
 * Vim's unnamed register.
 *
 * Held in memory rather than read back from the system clipboard:
 * `navigator.clipboard.readText()` needs the clipboard-read permission, which
 * would put a browser prompt in front of every `p`. Yanks still write *out* to
 * the clipboard so the text is usable elsewhere — only the read side is ours.
 *
 * The trade-off is vim's own: text copied in another app is not what `p` pastes.
 *
 * Contents are held one entry per block rather than as a single string, so that
 * deleting five blocks and pasting them back gives five blocks again instead of
 * one with four line breaks in it.
 *
 * @type {string[]}
 */
let unnamedRegister = [];

/** @param {string|string[]} blocks */
export function setRegister(blocks) {
    const texts = Array.isArray(blocks) ? blocks : [blocks];
    unnamedRegister = texts.filter(text => typeof text === 'string');
}

/** @returns {string[]} one entry per yanked block */
export function getRegister() {
    return unnamedRegister;
}

/** Drop the yanked text (used when the extension unloads). */
export function clearRegister() {
    unnamedRegister = [];
}
