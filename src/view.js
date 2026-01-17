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
    try {
        const block = RoamBlock.selected().element;
        clearVimView();
        block.classList.add(SELECTED_BLOCK_CSS_CLASS);
        updateVimHints(block);
        viewMoreDailyLogIfPossible();
    } catch (e) {
        // Silently ignore errors when no block is available
    }
    return null;
}

export function clearVimView() {
    const priorSelections = document.querySelectorAll(`.${SELECTED_BLOCK_CSS_CLASS}`);
    priorSelections.forEach(selection => selection.classList.remove(SELECTED_BLOCK_CSS_CLASS));
    clearVimHints();
}

function viewMoreDailyLogIfPossible() {
    const viewMore = document.querySelector(Selectors.viewMore);
    if (isElementVisible(viewMore)) {
        Mouse.hover(viewMore);
    }
}

export function blurEverything() {
    let blurPixel = document.getElementById(BLUR_PIXEL_ID);
    if (!blurPixel) {
        blurPixel = document.createElement('div');
        blurPixel.id = BLUR_PIXEL_ID;
        document.body.appendChild(blurPixel);
    }
    Mouse.leftClick(blurPixel);
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
    links.forEach((link, i) => {
        if (i < HINT_IDS.length) {
            link.classList.add(HINT_CSS_CLASS, hintCssClass(i));
        }
    });
}

function clearVimHints() {
    const priorHints = document.querySelectorAll(`.${HINT_CSS_CLASS}`);
    priorHints.forEach(selection => selection.classList.remove(HINT_CSS_CLASS, ...HINT_CSS_CLASSES));
}

export function getHint(n) {
    return document.querySelector(`.${hintCssClass(n)}`);
}
