/**
 * View management for Roam Vim Mode
 */

import {
    Selectors,
    SELECTED_BLOCK_CSS_CLASS,
    HINT_CSS_CLASS,
    HINT_IDS,
    BLUR_PIXEL_ID,
} from './constants.js';
import { isElementVisible, Mouse } from './utils.js';
import { RoamBlock } from './panel.js';

// ============== Hint CSS Classes ==============
function hintCssClass(n) {
    return HINT_CSS_CLASS + n;
}

const HINT_CSS_CLASSES = HINT_IDS.map(hintCssClass);

// ============== Vim View ==============
export function updateVimView() {
    let block;
    try {
        block = RoamBlock.selected().element;
    } catch {
        // Legitimately happens on an empty page or mid-navigation. Clear the
        // stale highlight rather than leaving it pointing at a dead block.
        clearVimView();
        return;
    }

    try {
        clearVimView();
        block.classList.add(SELECTED_BLOCK_CSS_CLASS);
        updateVimHints(block);
    } catch (error) {
        console.warn('[Roam Vim Mode] Failed to update the vim view', error);
    }
}

export function clearVimView() {
    document
        .querySelectorAll(`.${SELECTED_BLOCK_CSS_CLASS}`)
        .forEach(selection => selection.classList.remove(SELECTED_BLOCK_CSS_CLASS));
    clearVimHints();
}

/**
 * Hovering Roam's "view more" preview makes it load the next chunk of the daily
 * log. Only worth doing when the user has actually scrolled to the bottom —
 * calling it on every j/k made the daily log grow unprompted.
 */
export function viewMoreDailyLogIfPossible() {
    const viewMore = document.querySelector(Selectors.viewMore);
    if (isElementVisible(viewMore)) {
        Mouse.hover(viewMore);
    }
}

/**
 * Take focus out of whatever block is being edited.
 *
 * The invisible click target lives *inside* Roam's React root. Parked on
 * `document.body` it was outside the container React listens on, so the
 * synthetic click never reached a single Roam handler and this function did
 * nothing at all.
 */
export function blurEverything() {
    const host = document.querySelector(Selectors.appRoot) ?? document.body;

    let blurPixel = document.getElementById(BLUR_PIXEL_ID);
    if (!blurPixel || blurPixel.parentElement !== host) {
        blurPixel?.remove();
        blurPixel = document.createElement('div');
        blurPixel.id = BLUR_PIXEL_ID;
        host.appendChild(blurPixel);
    }

    // A real blur too: synthetic mouse events never move focus by themselves.
    document.activeElement?.blur?.();
    return Mouse.leftClick(blurPixel);
}

// ============== Hint View ==============
function updateVimHints(block) {
    const clickableSelectors = [
        Selectors.link,
        Selectors.externalLink,
        Selectors.checkbox,
        Selectors.button,
        Selectors.blockReference,
        Selectors.hiddenSection,
    ];
    const links = block.querySelectorAll(clickableSelectors.join(', '));

    // Nested matches (e.g. a `.rm-page-ref` inside an `<a>`) would otherwise
    // consume two hint slots for one visual target.
    const seen = [];
    for (const link of links) {
        if (seen.length >= HINT_IDS.length) break;
        if (seen.some(other => other.contains(link) || link.contains(other))) continue;
        seen.push(link);
    }

    seen.forEach((link, i) => {
        link.classList.add(HINT_CSS_CLASS, hintCssClass(i));
    });
}

function clearVimHints() {
    document
        .querySelectorAll(`.${HINT_CSS_CLASS}`)
        .forEach(hint => hint.classList.remove(HINT_CSS_CLASS, ...HINT_CSS_CLASSES));
}

export function getHint(n) {
    return document.querySelector(`.${hintCssClass(n)}`);
}
