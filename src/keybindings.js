/**
 * Keyboard bindings and handler for Roam Vim Mode
 */

import { DEFAULT_HINT_KEYS, HINT_CHARS, PAGE_HINT_CSS_CLASS, Selectors } from './constants.js';
import { Mode, getMode } from './mode.js';
import { pageHintState, hidePageHints, filterPageHints } from './page-hints.js';
import { showHelpPanel, hideHelpPanel, isHelpPanelOpen } from './help-panel.js';
import { showWhichKey, showWhichKeyImmediate, hideWhichKey } from './which-key.js';
import { DEFAULT_LEADER_CONFIG, LEADER_COMMAND_REGISTRY } from './leader-config.js';
import { enterSearchMode, exitSearchMode, handleSearchInput, nextMatch, previousMatch } from './search.js';
import { isSpacemacsEnabled } from './settings.js';
import {
    returnToNormalMode,
    selectBlockUp,
    selectBlockDown,
    selectFirstBlock,
    selectLastBlock,
    centerCurrentBlock,
    insertBlockAfter,
    editBlock,
    editBlockFromEnd,
    insertBlockBefore,
    selectPanelLeft,
    selectPanelRight,
    highlightSelectedBlock,
    undo,
    redo,
    clickHint,
    shiftClickHint,
    toggleFold,
    deleteBlock,
} from './commands.js';

// ============== Sequence State ==============
let sequenceBuffer = '';
let sequenceTimeout = null;

// Keys that start multi-key sequences - when pressed, wait for next key instead of triggering single-key commands
const SEQUENCE_PREFIXES = ['g', 'd'];

// ============== Leader Key State ==============
let leaderConfig = DEFAULT_LEADER_CONFIG;

let leaderState = {
    active: false,
    currentNode: leaderConfig,
    path: [],
};

/**
 * Set the leader key configuration (for user customization)
 */
export function setLeaderConfig(config) {
    leaderConfig = config;
    leaderState.currentNode = leaderConfig;
}

function enterLeaderMode() {
    leaderState.active = true;
    leaderState.currentNode = leaderConfig;
    leaderState.path = ['SPC'];
    showWhichKey(leaderConfig, ['SPC']);
}

function resetLeaderState() {
    leaderState.active = false;
    leaderState.currentNode = leaderConfig;
    leaderState.path = [];
    hideWhichKey();
}

function handleLeaderSequence(key, event) {
    const currentNode = leaderState.currentNode;

    // Check if key exists in current node
    if (currentNode.keys && currentNode.keys[key]) {
        const nextNode = currentNode.keys[key];

        if (nextNode.keys) {
            // It's a group - descend into it
            leaderState.currentNode = nextNode;
            leaderState.path.push(key);
            showWhichKeyImmediate(nextNode, [...leaderState.path]);
            return true;
        } else if (nextNode.action) {
            // It's a user-defined action (direct function)
            try {
                nextNode.action();
            } catch (error) {
                console.error('[Roam Vim Mode] Error executing action:', error);
            }
            resetLeaderState();
            return true;
        } else if (nextNode.command) {
            // It's a predefined command
            const commandFn = LEADER_COMMAND_REGISTRY[nextNode.command];
            if (commandFn) {
                commandFn();
            }
            resetLeaderState();
            return true;
        }
    }

    // Key not found - cancel leader mode
    resetLeaderState();
    return false;
}

export function isLeaderModeActive() {
    return leaderState.active;
}

// ============== Keydown Handler ==============
export function handleKeydown(event) {
    const mode = getMode();
    const key = event.key.toLowerCase();
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

    // Handle search mode specially
    if (mode === Mode.SEARCH) {
        // Only intercept escape and enter for search mode control
        if (key === 'escape' || key === 'enter') {
            event.preventDefault();
            event.stopPropagation();
            handleSearchInput(event);
        }
        // Let other keys pass through to the search input
        return;
    }

    // Handle hint mode specially
    if (mode === Mode.HINT) {
        event.preventDefault();
        event.stopPropagation();

        if (key === 'escape') {
            hidePageHints();
        } else if (key === 'backspace') {
            if (pageHintState.inputBuffer.length > 0) {
                pageHintState.inputBuffer = pageHintState.inputBuffer.slice(0, -1);
                const buffer = pageHintState.inputBuffer;
                pageHintState.hints.forEach(hint => {
                    if (hint.label.startsWith(buffer)) {
                        hint.hintEl.style.display = '';
                        const matched = buffer;
                        const remaining = hint.label.substring(buffer.length);
                        hint.hintEl.innerHTML = matched ?
                            `<span class="${PAGE_HINT_CSS_CLASS}--matched">${matched}</span>${remaining}` :
                            hint.label;
                    } else {
                        hint.hintEl.style.display = 'none';
                    }
                });
            }
        } else if (HINT_CHARS.includes(key) && !hasModifier) {
            filterPageHints(key);
        }
        return;
    }

    // Don't intercept when in insert mode unless it's Escape
    if (mode === Mode.INSERT && key !== 'escape') {
        return;
    }

    // Let ESC pass through to Roam when command bar (Cmd+P) or search dialog (Cmd+U) is open
    if (key === 'escape' && (document.querySelector(Selectors.commandBar) || document.querySelector('.bp3-overlay'))) {
        return;
    }

    // Handle leader key mode
    if (leaderState.active) {
        event.preventDefault();
        event.stopPropagation();

        if (key === 'escape') {
            resetLeaderState();
            return;
        }

        // Use the actual key for case-sensitive matching (e.g., 'P' vs 'p')
        const leaderKey = event.shiftKey && event.key.length === 1 ? event.key : key;
        handleLeaderSequence(leaderKey, event);
        return;
    }

    // Enter leader mode with Space in Normal mode (no modifiers) - only if Spacemacs mode is enabled
    if (mode === Mode.NORMAL && event.key === ' ' && !hasModifier && isSpacemacsEnabled()) {
        event.preventDefault();
        event.stopPropagation();
        enterLeaderMode();
        return;
    }

    // Let native Cmd shortcuts pass through
    if (event.metaKey) {
        return;
    }

    // Build sequence for multi-key commands (like 'gg')
    const sequence = buildSequence(key, event);

    // Match commands
    const command = matchCommand(sequence, mode, event);

    if (command) {
        event.preventDefault();
        event.stopPropagation();
        command();
        clearSequence();
    }
}

// ============== Sequence Building ==============
function buildSequence(key, event) {
    if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
    }

    let prefix = '';
    if (event.ctrlKey) prefix += 'ctrl+';
    if (event.metaKey) prefix += 'cmd+';
    if (event.altKey) prefix += 'alt+';
    if (event.shiftKey && key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // For shift+letter, just use uppercase
    } else if (event.shiftKey) {
        prefix += 'shift+';
    }

    sequenceBuffer += prefix + key + ' ';

    sequenceTimeout = setTimeout(() => {
        clearSequence();
    }, 500);

    return sequenceBuffer.trim();
}

export function clearSequence() {
    sequenceBuffer = '';
    if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
        sequenceTimeout = null;
    }
}

// ============== Command Matching ==============
function matchCommand(sequence, mode, event) {
    const key = event.key.toLowerCase();
    const isNormal = mode === Mode.NORMAL;

    // Check if we started a sequence with a prefix key (e.g., pressed 'g' or 'z')
    const sequencePrefix = SEQUENCE_PREFIXES.find(p => sequence.startsWith(p + ' '));

    // Close help panel if open
    if (isHelpPanelOpen()) {
        if (key === 'escape' || event.key === '?') {
            return hideHelpPanel;
        }
        return () => {};
    }

    // Escape - all modes
    if (key === 'escape') {
        return returnToNormalMode;
    }

    // Normal mode commands
    if (isNormal) {
        // Multi-key sequences (must be checked before single-key commands)
        if (sequence === 'g g') return selectFirstBlock;
        if (sequence === 'd d') return deleteBlock;

        // If we're in a sequence (e.g., pressed 'g' or 'z') but didn't match above,
        // block all other commands and wait for timeout to clear
        if (sequencePrefix) {
            return () => {}; // No-op, wait for sequence to complete or timeout
        }

        // If we just pressed a sequence prefix key alone (no modifiers), wait for next key
        if (SEQUENCE_PREFIXES.includes(key) && sequence === key && !event.shiftKey && !event.ctrlKey && !event.altKey) {
            return () => {}; // No-op, wait for next key in sequence
        }

        // Navigation
        if (key === 'k' && !event.shiftKey && !event.ctrlKey) return selectBlockUp;
        if (key === 'j' && !event.shiftKey && !event.ctrlKey) return selectBlockDown;
        if (key === 'g' && event.shiftKey) return selectLastBlock;

        // Panel navigation
        if (key === 'h' && !event.shiftKey) return selectPanelLeft;
        if (key === 'l' && !event.shiftKey) return selectPanelRight;

        // Insert mode
        if (key === 'i' && !event.shiftKey) return editBlock;
        if (key === 'a') return editBlockFromEnd;
        if (key === 'o' && event.shiftKey) return insertBlockBefore;
        if (key === 'o' && !event.shiftKey) return insertBlockAfter;

        // Visual mode (line-level)
        if (key === 'v' && event.shiftKey) return highlightSelectedBlock;

        // View commands
        if (key === 'z' && !event.shiftKey && !event.ctrlKey) return toggleFold;
        if (key === 'c' && !event.shiftKey && !event.ctrlKey) return centerCurrentBlock;

        // History
        if (key === 'u' && !event.ctrlKey) return undo;
        if (key === 'r' && event.ctrlKey) return redo;

        // Help panel
        if (event.key === '?') return showHelpPanel;

        // Search
        if (event.key === '/') return enterSearchMode;
        if (key === 'n' && !event.shiftKey && !event.ctrlKey) return nextMatch;
        if (key === 'n' && event.shiftKey && !event.ctrlKey) return previousMatch;

        // Hint keys (click links within block)
        for (let i = 0; i < DEFAULT_HINT_KEYS.length; i++) {
            if (key === DEFAULT_HINT_KEYS[i] && !event.shiftKey && !event.ctrlKey) {
                return () => clickHint(i);
            }
            if (key === DEFAULT_HINT_KEYS[i] && event.shiftKey && !event.ctrlKey) {
                return () => shiftClickHint(i);
            }
        }
    }

    return null;
}
