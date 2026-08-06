/**
 * Page-wide hints (Vimium-style F command) for Roam Vim Mode
 */

import {
    Selectors,
    HINT_CHARS,
    PAGE_HINT_CSS_CLASS,
    PAGE_HINT_OVERLAY_ID,
} from './constants.js';
import { Mouse, isElementFullyVisible } from './utils.js';
import { notifyModeChange } from './mode-events.js';
import { debugLog } from './logger.js';

// ============== Page Hints State ==============
export const pageHintState = {
    active: false,
    hints: [],
    inputBuffer: '',
    scrollHandler: null,
    openInSidebar: false,
    editBlock: false, // When true, hints target blocks for editing instead of links
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
    // Only target content links: page references, external links, block references, tags
    // Other elements like buttons, checkboxes, fold buttons are not supported
    const clickableSelectors = [
        Selectors.link,           // .rm-page-ref - page references and tags
        Selectors.blockReference, // .rm-block-ref - block references
    ];

    const elements = document.querySelectorAll(clickableSelectors.join(', '));

    // Also find external links - anchor elements with href that are not buttons
    const externalLinks = document.querySelectorAll('a[href]');
    const allElements = [...Array.from(elements)];

    externalLinks.forEach(link => {
        // Skip if it's a button or within a button
        if (link.classList.contains('bp3-button') ||
            link.closest('.bp3-button') ||
            link.classList.contains('bp3-menu-item') ||
            link.closest('.bp3-popover') ||
            link.closest('.rm-topbar') ||
            link.closest('.roam-sidebar-container')) {
            return;
        }
        // Skip if it's already matched by other selectors (page refs, block refs)
        if (link.classList.contains('rm-page-ref') ||
            link.classList.contains('rm-block-ref')) {
            return;
        }
        allElements.push(link);
    });

    return allElements.filter(isElementFullyVisible);
}

// ============== Block Elements ==============
function getBlockElements() {
    // Target all visible blocks for editing
    return Array.from(document.querySelectorAll(Selectors.block)).filter(isElementFullyVisible);
}

// ============== Scroll Handling ==============
function updateHintPositions() {
    pageHintState.hints.forEach(hint => {
        // Hide hints for elements that scrolled out of view
        if (isElementFullyVisible(hint.element)) {
            const rect = hint.element.getBoundingClientRect();
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
export function showPageHints(options = {}) {
    hidePageHints();
    pageHintState.openInSidebar = options.openInSidebar || false;
    pageHintState.editBlock = options.editBlock || false;

    const elements = pageHintState.editBlock ? getBlockElements() : getClickableElements();
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
        hintEl.textContent = label;
        hintEl.dataset.label = label;
        hintEl.style.left = `${rect.left}px`;
        hintEl.style.top = `${rect.top}px`;

        overlay.appendChild(hintEl);
        pageHintState.hints.push({ element, label, hintEl });
    });

    pageHintState.active = true;
    pageHintState.inputBuffer = '';
    addScrollListeners();
    debugLog('hints', `showing ${pageHintState.hints.length} hints`, {
        editBlock: pageHintState.editBlock,
        openInSidebar: pageHintState.openInSidebar,
    });
    notifyModeChange();

    // Nothing to click — don't strand the user in an empty HINT mode.
    if (pageHintState.hints.length === 0) {
        hidePageHints();
    }
}

export function hidePageHints() {
    removeScrollListeners();
    document.getElementById(PAGE_HINT_OVERLAY_ID)?.remove();
    const wasActive = pageHintState.active;
    pageHintState.active = false;
    pageHintState.hints = [];
    pageHintState.inputBuffer = '';
    if (wasActive) {
        notifyModeChange();
    }
}

// ============== Hint Label Rendering ==============
/**
 * Show only the hints still matching `buffer`, with the typed prefix emphasised.
 *
 * Labels come from `HINT_CHARS`, so building them with innerHTML is safe; the
 * `textContent` assignments keep it that way even if that ever changes.
 *
 * @returns {boolean} whether any hint still matches
 */
export function renderHintLabels(buffer) {
    let hasMatches = false;

    pageHintState.hints.forEach(hint => {
        if (!hint.label.startsWith(buffer)) {
            hint.hintEl.style.display = 'none';
            return;
        }

        hint.hintEl.style.display = '';
        hint.hintEl.textContent = '';
        if (buffer) {
            const matched = document.createElement('span');
            matched.className = `${PAGE_HINT_CSS_CLASS}--matched`;
            matched.textContent = buffer;
            hint.hintEl.appendChild(matched);
        }
        hint.hintEl.appendChild(document.createTextNode(hint.label.substring(buffer.length)));
        hasMatches = true;
    });

    return hasMatches;
}

// ============== Filter Hints ==============
export function filterPageHints(char) {
    pageHintState.inputBuffer += char.toLowerCase();
    const buffer = pageHintState.inputBuffer;

    const exactMatch = pageHintState.hints.find(h => h.label === buffer);
    if (exactMatch) {
        // For block editing, just click to enter edit mode.
        // For links, optionally shift-click to open in the sidebar.
        const clickOptions = pageHintState.editBlock
            ? {}
            : pageHintState.openInSidebar
                ? { shiftKey: true }
                : {};
        const target = exactMatch.element;
        hidePageHints();
        Mouse.leftClick(target, clickOptions);
        return true;
    }

    const hasMatches = renderHintLabels(buffer);
    if (!hasMatches) {
        hidePageHints();
    }
    return hasMatches;
}

/** Remove the last typed character and re-render. */
export function backspacePageHints() {
    if (pageHintState.inputBuffer.length === 0) return;
    pageHintState.inputBuffer = pageHintState.inputBuffer.slice(0, -1);
    renderHintLabels(pageHintState.inputBuffer);
}

export function enterPageHintMode(options = {}) {
    // Support legacy boolean argument for openInSidebar
    if (typeof options === 'boolean') {
        options = { openInSidebar: options };
    }
    showPageHints(options);
}

export function enterBlockHintMode() {
    showPageHints({ editBlock: true });
}
