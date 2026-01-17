/**
 * Page-wide hints (Vimium-style F command) for Roam Vim Mode
 */

import {
    Selectors,
    HINT_CHARS,
    PAGE_HINT_CSS_CLASS,
    PAGE_HINT_OVERLAY_ID,
} from './constants.js';
import { Mouse } from './utils.js';

// ============== Page Hints State ==============
export const pageHintState = {
    active: false,
    hints: [],
    inputBuffer: '',
};

// ============== Hint Label Generation ==============
export function generateHintLabels(count) {
    const labels = [];
    const chars = HINT_CHARS.split('');
    const base = chars.length;

    if (count <= base) {
        for (let i = 0; i < count && i < base; i++) {
            labels.push(chars[i]);
        }
    } else {
        for (let i = 0; i < base && labels.length < count; i++) {
            for (let j = 0; j < base && labels.length < count; j++) {
                labels.push(chars[i] + chars[j]);
            }
        }
    }
    return labels;
}

// ============== Clickable Elements ==============
function getClickableElements() {
    const clickableSelectors = [
        Selectors.link,
        Selectors.externalLink,
        Selectors.checkbox,
        Selectors.button,
        Selectors.blockReference,
        Selectors.hiddenSection,
        Selectors.foldButton,
        Selectors.pageReferenceLink,
    ];

    const elements = document.querySelectorAll(clickableSelectors.join(', '));
    return Array.from(elements).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 &&
               rect.top >= 0 && rect.left >= 0 &&
               rect.bottom <= window.innerHeight &&
               rect.right <= window.innerWidth;
    });
}

// ============== Show/Hide Hints ==============
export function showPageHints() {
    hidePageHints();

    const elements = getClickableElements();
    const labels = generateHintLabels(elements.length);

    const overlay = document.createElement('div');
    overlay.id = PAGE_HINT_OVERLAY_ID;
    document.body.appendChild(overlay);

    pageHintState.hints = [];
    elements.forEach((element, i) => {
        if (i >= labels.length) return;

        const rect = element.getBoundingClientRect();
        const label = labels[i];

        const hintEl = document.createElement('span');
        hintEl.className = PAGE_HINT_CSS_CLASS;
        hintEl.textContent = label.toUpperCase();
        hintEl.dataset.label = label;
        hintEl.style.left = `${rect.left + window.scrollX}px`;
        hintEl.style.top = `${rect.top + window.scrollY}px`;

        overlay.appendChild(hintEl);
        pageHintState.hints.push({ element, label, hintEl });
    });

    pageHintState.active = true;
    pageHintState.inputBuffer = '';
}

export function hidePageHints() {
    const overlay = document.getElementById(PAGE_HINT_OVERLAY_ID);
    if (overlay) {
        overlay.remove();
    }
    pageHintState.active = false;
    pageHintState.hints = [];
    pageHintState.inputBuffer = '';
}

// ============== Filter Hints ==============
export function filterPageHints(char) {
    pageHintState.inputBuffer += char.toLowerCase();
    const buffer = pageHintState.inputBuffer;

    const exactMatch = pageHintState.hints.find(h => h.label === buffer);
    if (exactMatch) {
        Mouse.leftClick(exactMatch.element);
        hidePageHints();
        return true;
    }

    let hasMatches = false;
    pageHintState.hints.forEach(hint => {
        if (hint.label.startsWith(buffer)) {
            hint.hintEl.style.display = '';
            const matched = buffer.toUpperCase();
            const remaining = hint.label.substring(buffer.length).toUpperCase();
            hint.hintEl.innerHTML = `<span class="${PAGE_HINT_CSS_CLASS}--matched">${matched}</span>${remaining}`;
            hasMatches = true;
        } else {
            hint.hintEl.style.display = 'none';
        }
    });

    if (!hasMatches) {
        hidePageHints();
    }

    return hasMatches;
}

export function enterPageHintMode() {
    showPageHints();
}
