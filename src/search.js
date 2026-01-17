/**
 * Search functionality for Roam Vim Mode (/ command)
 */

import {
    Selectors,
    SEARCH_INPUT_ID,
    SEARCH_HIGHLIGHT_CSS_CLASS,
    SEARCH_CURRENT_CSS_CLASS,
} from './constants.js';

// ============== Search State ==============
export const searchState = {
    active: false,
    query: '',
    matches: [],       // Array of { element, textNode, startIndex, endIndex }
    currentIndex: -1,  // Current match index
    lastQuery: '',     // Remember last search for n/N commands
};

// ============== Enter Search Mode ==============
export function enterSearchMode() {
    if (searchState.active) return;

    searchState.active = true;
    searchState.query = '';
    searchState.matches = [];
    searchState.currentIndex = -1;

    // Create search input
    const input = document.createElement('input');
    input.id = SEARCH_INPUT_ID;
    input.type = 'text';
    input.placeholder = '/';
    input.autocomplete = 'off';
    input.spellcheck = false;
    document.body.appendChild(input);

    // Focus the input
    setTimeout(() => input.focus(), 0);
}

// ============== Exit Search Mode ==============
export function exitSearchMode(clearHighlights = true) {
    searchState.active = false;

    // Remove search input
    const input = document.getElementById(SEARCH_INPUT_ID);
    if (input) {
        input.remove();
    }

    // Clear highlights if requested
    if (clearHighlights) {
        clearSearchHighlights();
        searchState.matches = [];
        searchState.currentIndex = -1;
    }
}

// ============== Handle Search Input ==============
export function handleSearchInput(event) {
    const input = document.getElementById(SEARCH_INPUT_ID);
    if (!input) return;

    const key = event.key;

    if (key === 'Escape') {
        exitSearchMode(true);
        return true;
    }

    if (key === 'Enter') {
        // Perform search and exit input mode, keep highlights
        searchState.lastQuery = input.value;
        if (input.value) {
            performSearch(input.value);
            if (searchState.matches.length > 0) {
                navigateToMatch(0);
            }
        }
        exitSearchMode(false);
        return true;
    }

    // Let the input handle the keypress naturally
    return false;
}

// ============== Perform Search ==============
export function performSearch(query) {
    clearSearchHighlights();
    searchState.query = query;
    searchState.matches = [];
    searchState.currentIndex = -1;

    if (!query) return;

    const queryLower = query.toLowerCase();

    // Get all visible blocks
    const blocks = getVisibleBlocks();

    blocks.forEach(block => {
        // Get the text content of the block
        const textNodes = getTextNodes(block);

        textNodes.forEach(textNode => {
            const text = textNode.nodeValue;
            const textLower = text.toLowerCase();
            let startIndex = 0;

            while (true) {
                const index = textLower.indexOf(queryLower, startIndex);
                if (index === -1) break;

                searchState.matches.push({
                    element: block,
                    textNode,
                    startIndex: index,
                    endIndex: index + query.length,
                });

                startIndex = index + 1;
            }
        });
    });

    // Highlight all matches
    highlightMatches();
}

// ============== Get Visible Blocks ==============
function getVisibleBlocks() {
    const blocks = document.querySelectorAll(Selectors.block);
    return Array.from(blocks).filter(block => {
        const rect = block.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    });
}

// ============== Get Text Nodes ==============
function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                // Skip empty text nodes
                if (!node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Skip nodes inside our highlight spans
                if (node.parentElement.classList.contains(SEARCH_HIGHLIGHT_CSS_CLASS) ||
                    node.parentElement.classList.contains(SEARCH_CURRENT_CSS_CLASS)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    return textNodes;
}

// ============== Highlight Matches ==============
function highlightMatches() {
    // Group matches by text node (in reverse order to not affect indices)
    const matchesByNode = new Map();

    searchState.matches.forEach((match, index) => {
        if (!matchesByNode.has(match.textNode)) {
            matchesByNode.set(match.textNode, []);
        }
        matchesByNode.get(match.textNode).push({ ...match, originalIndex: index });
    });

    // Process each text node
    matchesByNode.forEach((nodeMatches, textNode) => {
        // Sort matches by position in reverse order
        nodeMatches.sort((a, b) => b.startIndex - a.startIndex);

        const parent = textNode.parentNode;
        let currentNode = textNode;

        nodeMatches.forEach(match => {
            const text = currentNode.nodeValue;

            // Split the text node
            const before = text.substring(0, match.startIndex);
            const matchText = text.substring(match.startIndex, match.endIndex);
            const after = text.substring(match.endIndex);

            // Create the highlight span
            const highlightSpan = document.createElement('span');
            highlightSpan.className = SEARCH_HIGHLIGHT_CSS_CLASS;
            highlightSpan.textContent = matchText;
            highlightSpan.dataset.matchIndex = match.originalIndex;

            // Replace the text node
            if (after) {
                const afterNode = document.createTextNode(after);
                parent.insertBefore(afterNode, currentNode.nextSibling);
            }
            parent.insertBefore(highlightSpan, currentNode.nextSibling);
            currentNode.nodeValue = before;

            // Update the match reference to point to the span
            searchState.matches[match.originalIndex].highlightSpan = highlightSpan;
        });
    });
}

// ============== Clear Search Highlights ==============
function clearSearchHighlights() {
    const highlights = document.querySelectorAll(`.${SEARCH_HIGHLIGHT_CSS_CLASS}, .${SEARCH_CURRENT_CSS_CLASS}`);

    highlights.forEach(span => {
        const text = span.textContent;
        const textNode = document.createTextNode(text);
        span.parentNode.replaceChild(textNode, span);
    });

    // Normalize text nodes (merge adjacent ones)
    const blocks = document.querySelectorAll(Selectors.block);
    blocks.forEach(block => block.normalize());
}

// ============== Navigate to Match ==============
export function navigateToMatch(index) {
    if (searchState.matches.length === 0) return;

    // Wrap around
    if (index < 0) {
        index = searchState.matches.length - 1;
    } else if (index >= searchState.matches.length) {
        index = 0;
    }

    // Remove current highlight from previous match
    if (searchState.currentIndex >= 0 && searchState.matches[searchState.currentIndex]) {
        const prevSpan = searchState.matches[searchState.currentIndex].highlightSpan;
        if (prevSpan) {
            prevSpan.classList.remove(SEARCH_CURRENT_CSS_CLASS);
            prevSpan.classList.add(SEARCH_HIGHLIGHT_CSS_CLASS);
        }
    }

    searchState.currentIndex = index;
    const match = searchState.matches[index];

    if (match && match.highlightSpan) {
        // Update highlight style
        match.highlightSpan.classList.remove(SEARCH_HIGHLIGHT_CSS_CLASS);
        match.highlightSpan.classList.add(SEARCH_CURRENT_CSS_CLASS);

        // Scroll into view
        match.highlightSpan.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }
}

// ============== Next/Previous Match ==============
export function nextMatch() {
    if (searchState.matches.length === 0) {
        // If no matches but we have a last query, re-search
        if (searchState.lastQuery) {
            performSearch(searchState.lastQuery);
            if (searchState.matches.length > 0) {
                navigateToMatch(0);
            }
        }
        return;
    }
    navigateToMatch(searchState.currentIndex + 1);
}

export function previousMatch() {
    if (searchState.matches.length === 0) {
        // If no matches but we have a last query, re-search
        if (searchState.lastQuery) {
            performSearch(searchState.lastQuery);
            if (searchState.matches.length > 0) {
                navigateToMatch(searchState.matches.length - 1);
            }
        }
        return;
    }
    navigateToMatch(searchState.currentIndex - 1);
}
