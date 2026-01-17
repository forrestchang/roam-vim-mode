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
    scrollHandler: null,
    openInSidebar: false,
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

// ============== Scroll Handling ==============
function updateHintPositions() {
    pageHintState.hints.forEach(hint => {
        const rect = hint.element.getBoundingClientRect();
        // Hide hints for elements that scrolled out of view
        if (rect.width > 0 && rect.height > 0 &&
            rect.top >= 0 && rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth) {
            hint.hintEl.style.left = `${rect.left}px`;
            hint.hintEl.style.top = `${rect.top}px`;
            hint.hintEl.style.visibility = 'visible';
        } else {
            hint.hintEl.style.visibility = 'hidden';
        }
    });
}

function addScrollListeners() {
    // Create scroll handler
    pageHintState.scrollHandler = () => {
        requestAnimationFrame(updateHintPositions);
    };

    // Listen on window and Roam's scrollable containers
    window.addEventListener('scroll', pageHintState.scrollHandler, true);
}

function removeScrollListeners() {
    if (pageHintState.scrollHandler) {
        window.removeEventListener('scroll', pageHintState.scrollHandler, true);
        pageHintState.scrollHandler = null;
    }
}

// ============== Show/Hide Hints ==============
export function showPageHints(openInSidebar = false) {
    hidePageHints();
    pageHintState.openInSidebar = openInSidebar;

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
        hintEl.style.left = `${rect.left}px`;
        hintEl.style.top = `${rect.top}px`;

        overlay.appendChild(hintEl);
        pageHintState.hints.push({ element, label, hintEl });
    });

    pageHintState.active = true;
    pageHintState.inputBuffer = '';
    addScrollListeners();
}

export function hidePageHints() {
    removeScrollListeners();
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
        const clickOptions = pageHintState.openInSidebar ? { shiftKey: true } : {};
        Mouse.leftClick(exactMatch.element, clickOptions);
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

export function enterPageHintMode(openInSidebar = false) {
    showPageHints(openInSidebar);
}
