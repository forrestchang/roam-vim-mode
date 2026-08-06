/**
 * Search functionality for Roam Vim Mode (`/` command)
 *
 * Matches are rendered with the native CSS Custom Highlight API, which paints
 * ranges without touching the DOM. The previous implementation spliced <span>
 * elements into Roam's React-managed block markup, which could corrupt
 * reconciliation and silently lose edits.
 */

import {
    Selectors,
    SEARCH_INPUT_ID,
    SEARCH_HIGHLIGHT_NAME,
    SEARCH_CURRENT_HIGHLIGHT_NAME,
    SEARCH_MAX_MATCHES,
} from './constants.js';
import { isElementVisible } from './utils.js';
import { VimRoamPanel } from './panel.js';
import { notifyModeChange } from './mode-events.js';
import { debugLog } from './logger.js';

// ============== Search State ==============
export const searchState = {
    active: false,
    query: '',
    /** @type {{range: Range, block: Element}[]} */
    matches: [],
    currentIndex: -1,
    /** Remembered so `n`/`N` keep working after the input is dismissed. */
    lastQuery: '',
    truncated: false,
};

let inputListeners = null;

// ============== Highlight API support ==============
function highlightRegistry() {
    return typeof CSS !== 'undefined' && CSS.highlights ? CSS.highlights : null;
}

let warnedAboutHighlightSupport = false;
function warnOnceAboutHighlights() {
    if (warnedAboutHighlightSupport) return;
    warnedAboutHighlightSupport = true;
    console.warn(
        '[Roam Vim Mode] CSS Custom Highlight API unavailable; ' +
        'search will navigate between matches without highlighting them.'
    );
}

// ============== Enter / Exit ==============
export function enterSearchMode() {
    if (searchState.active) return;

    searchState.active = true;
    searchState.query = '';
    searchState.matches = [];
    searchState.currentIndex = -1;
    searchState.truncated = false;

    const input = document.createElement('input');
    input.id = SEARCH_INPUT_ID;
    input.type = 'text';
    input.placeholder = '/';
    input.autocomplete = 'off';
    input.spellcheck = false;
    document.body.appendChild(input);

    // Incremental search, like vim's `incsearch`.
    const onInput = () => {
        performSearch(input.value);
        if (searchState.matches.length > 0) {
            navigateToMatch(0, { scroll: true });
        }
    };
    // Clicking away must not strand us in SEARCH mode with no way back.
    const onBlur = () => exitSearchMode(true);

    input.addEventListener('input', onInput);
    input.addEventListener('blur', onBlur);
    inputListeners = { input, onInput, onBlur };

    // Focus after the current keydown finishes propagating.
    setTimeout(() => input.focus(), 0);
    debugLog('search', 'entered search mode');
    notifyModeChange();
}

export function exitSearchMode(clearHighlights = true) {
    if (!searchState.active && !document.getElementById(SEARCH_INPUT_ID)) {
        if (clearHighlights) clearSearchHighlights();
        return;
    }

    searchState.active = false;

    if (inputListeners) {
        const { input, onInput, onBlur } = inputListeners;
        input.removeEventListener('input', onInput);
        input.removeEventListener('blur', onBlur);
        inputListeners = null;
    }

    document.getElementById(SEARCH_INPUT_ID)?.remove();

    if (clearHighlights) {
        clearSearchHighlights();
        searchState.matches = [];
        searchState.currentIndex = -1;
    }
    notifyModeChange();
}

/**
 * Whether the search input is genuinely on screen.
 *
 * `mode.js` uses this instead of the raw `active` flag: if the input disappears
 * (page navigation, extension reload) a stale `active` flag used to swallow every
 * keystroke, including Escape, until the tab was reloaded.
 */
export function isSearchInputOpen() {
    const open = !!document.getElementById(SEARCH_INPUT_ID);
    if (searchState.active && !open) {
        // Self-heal rather than stay wedged.
        searchState.active = false;
        notifyModeChange();
    }
    return searchState.active && open;
}

// ============== Handle Search Input ==============
/** @returns {boolean} whether the key was consumed */
export function handleSearchInput(event) {
    const input = document.getElementById(SEARCH_INPUT_ID);

    if (event.key === 'Escape') {
        exitSearchMode(true);
        return true;
    }

    if (event.key === 'Enter') {
        const value = input?.value ?? searchState.query;
        searchState.lastQuery = value;
        if (value) {
            performSearch(value);
            if (searchState.matches.length > 0) {
                navigateToMatch(0, { scroll: true });
            }
        }
        // Keep highlights so `n` / `N` can walk them.
        exitSearchMode(false);
        return true;
    }

    return false;
}

// ============== Perform Search ==============
/**
 * Collect matches for `query` and paint them.
 *
 * Scoped to the focused panel — `/` is documented as searching the blocks you
 * are looking at, not every block mounted anywhere in the app.
 */
export function performSearch(query, root = searchRoot()) {
    clearSearchHighlights();
    searchState.query = query;
    searchState.matches = [];
    searchState.currentIndex = -1;
    searchState.truncated = false;

    if (!query) return;

    const queryLower = query.toLowerCase();
    const blocks = getVisibleBlocks(root);

    outer: for (const block of blocks) {
        for (const textNode of getTextNodes(block)) {
            const textLower = textNode.nodeValue.toLowerCase();
            let searchFrom = 0;

            while (true) {
                const index = textLower.indexOf(queryLower, searchFrom);
                if (index === -1) break;

                if (searchState.matches.length >= SEARCH_MAX_MATCHES) {
                    searchState.truncated = true;
                    break outer;
                }

                const range = document.createRange();
                range.setStart(textNode, index);
                range.setEnd(textNode, index + query.length);
                searchState.matches.push({ range, block });

                // Advance past this match so overlapping hits aren't reported twice.
                searchFrom = index + query.length;
            }
        }
    }

    if (searchState.truncated) {
        console.warn(
            `[Roam Vim Mode] Search stopped at ${SEARCH_MAX_MATCHES} matches; refine your query.`
        );
    }

    debugLog('search', `"${query}" matched ${searchState.matches.length} in ${blocks.length} blocks`, {
        truncated: searchState.truncated,
        highlightApi: !!highlightRegistry(),
    });
    applyHighlights();
}

function searchRoot() {
    try {
        return VimRoamPanel.selected().element;
    } catch {
        return document.body;
    }
}

// ============== Get Visible Blocks ==============
function getVisibleBlocks(root) {
    return Array.from(root.querySelectorAll(Selectors.block)).filter(isElementVisible);
}

// ============== Get Text Nodes ==============
function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: node =>
            node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });

    let node;
    while ((node = walker.nextNode())) {
        textNodes.push(node);
    }
    return textNodes;
}

// ============== Highlighting ==============
function applyHighlights() {
    const registry = highlightRegistry();
    if (!registry) {
        warnOnceAboutHighlights();
        return;
    }

    const current = searchState.matches[searchState.currentIndex];
    const others = searchState.matches
        .filter((_, i) => i !== searchState.currentIndex)
        .map(match => match.range);

    if (others.length > 0) {
        registry.set(SEARCH_HIGHLIGHT_NAME, new Highlight(...others));
    } else {
        registry.delete(SEARCH_HIGHLIGHT_NAME);
    }

    if (current) {
        const highlight = new Highlight(current.range);
        // Paint the active match on top of the plain ones.
        highlight.priority = 1;
        registry.set(SEARCH_CURRENT_HIGHLIGHT_NAME, highlight);
    } else {
        registry.delete(SEARCH_CURRENT_HIGHLIGHT_NAME);
    }
}

export function clearSearchHighlights() {
    const registry = highlightRegistry();
    if (!registry) return;
    registry.delete(SEARCH_HIGHLIGHT_NAME);
    registry.delete(SEARCH_CURRENT_HIGHLIGHT_NAME);
}

// ============== Staleness ==============
/** Ranges are invalidated by any Roam re-render; detect that instead of scrolling nowhere. */
function matchesAreStale() {
    return searchState.matches.some(
        match => !match.range.startContainer.isConnected || !match.block.isConnected
    );
}

function ensureFreshMatches() {
    if (searchState.matches.length > 0 && !matchesAreStale()) {
        return true;
    }
    const query = searchState.query || searchState.lastQuery;
    if (!query) return false;

    const previousIndex = searchState.currentIndex;
    performSearch(query);
    if (searchState.matches.length === 0) return false;

    searchState.currentIndex = Math.min(Math.max(previousIndex, -1), searchState.matches.length - 1);
    return true;
}

// ============== Navigate to Match ==============
export function navigateToMatch(index, { scroll = true } = {}) {
    if (searchState.matches.length === 0) return;

    // Wrap around, vim style.
    const count = searchState.matches.length;
    searchState.currentIndex = ((index % count) + count) % count;

    applyHighlights();

    if (!scroll) return;
    const match = searchState.matches[searchState.currentIndex];
    const target = match.range.startContainer.parentElement ?? match.block;
    if (target?.isConnected) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ============== Next / Previous Match ==============
export function nextMatch() {
    if (!ensureFreshMatches()) return;
    navigateToMatch(searchState.currentIndex + 1);
}

export function previousMatch() {
    if (!ensureFreshMatches()) return;
    navigateToMatch(searchState.currentIndex - 1);
}

// ============== Teardown ==============
export function resetSearch() {
    exitSearchMode(true);
    searchState.query = '';
    searchState.lastQuery = '';
    searchState.matches = [];
    searchState.currentIndex = -1;
}
