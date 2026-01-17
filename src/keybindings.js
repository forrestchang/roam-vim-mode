/**
 * Keyboard bindings and handler for Roam Vim Mode
 */

import { DEFAULT_HINT_KEYS, HINT_CHARS, PAGE_HINT_CSS_CLASS, Selectors } from './constants.js';
import { Mode, getMode } from './mode.js';
import { pageHintState, hidePageHints, filterPageHints, enterPageHintMode } from './page-hints.js';
import { showHelpPanel, hideHelpPanel, isHelpPanelOpen } from './help-panel.js';
import {
    returnToNormalMode,
    selectBlockUp,
    selectBlockDown,
    selectFirstVisibleBlock,
    selectLastVisibleBlock,
    selectFirstBlock,
    selectLastBlock,
    selectManyBlocksUp,
    selectManyBlocksDown,
    scrollUp,
    scrollDown,
    insertBlockAfter,
    editBlock,
    editBlockFromEnd,
    insertBlockBefore,
    selectPanelLeft,
    selectPanelRight,
    closeSidebarPage,
    highlightSelectedBlock,
    growHighlightUp,
    growHighlightDown,
    paste,
    pasteBefore,
    copySelectedBlock,
    copySelectedBlockReference,
    copySelectedBlockEmbed,
    enterOrCutInVisualMode,
    undo,
    redo,
    moveBlockUp,
    moveBlockDown,
    clickHint,
    shiftClickHint,
    ctrlShiftClickHint,
    toggleFold,
} from './commands.js';

// ============== Sequence State ==============
let sequenceBuffer = '';
let sequenceTimeout = null;

// ============== Keydown Handler ==============
export function handleKeydown(event) {
    const mode = getMode();
    const key = event.key.toLowerCase();
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

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
                        const matched = buffer.toUpperCase();
                        const remaining = hint.label.substring(buffer.length).toUpperCase();
                        hint.hintEl.innerHTML = matched ?
                            `<span class="${PAGE_HINT_CSS_CLASS}--matched">${matched}</span>${remaining}` :
                            hint.label.toUpperCase();
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

    // Let ESC pass through to Roam when command bar (Cmd+P) is open
    if (key === 'escape' && document.querySelector(Selectors.commandBar)) {
        return;
    }

    // Let native Cmd shortcuts pass through (except our specific Cmd+Shift+K/J for block movement)
    if (event.metaKey && !(event.shiftKey && (key === 'k' || key === 'j'))) {
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
    const isVisual = mode === Mode.VISUAL;
    const isNormalOrVisual = isNormal || isVisual;

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
        // Navigation
        if (key === 'k' && !event.shiftKey && !event.ctrlKey) return selectBlockUp;
        if (key === 'j' && !event.shiftKey && !event.ctrlKey) return selectBlockDown;
        if (key === 'h' && event.shiftKey) return selectFirstVisibleBlock;
        if (key === 'l' && event.shiftKey) return selectLastVisibleBlock;
        if (sequence === 'g g') return selectFirstBlock;
        if (key === 'g' && event.shiftKey) return selectLastBlock;
        if (key === 'u' && event.ctrlKey) return selectManyBlocksUp;
        if (key === 'd' && event.ctrlKey) return selectManyBlocksDown;

        // Panel navigation
        if (key === 'h' && !event.shiftKey) return selectPanelLeft;
        if (key === 'l' && !event.shiftKey) return selectPanelRight;

        // Insert mode
        if (key === 'i' && !event.shiftKey) return editBlock;
        if (key === 'a') return editBlockFromEnd;
        if (key === 'o' && event.shiftKey) return insertBlockBefore;
        if (key === 'o' && !event.shiftKey) return insertBlockAfter;

        // Visual mode
        if (key === 'v' && !event.shiftKey) return highlightSelectedBlock;

        // Clipboard
        if (key === 'p' && !event.shiftKey) return paste;
        if (key === 'p' && event.shiftKey) return pasteBefore;
        if (key === 'y' && !event.shiftKey && !event.altKey) return () => copySelectedBlock(mode);
        if (key === 'y' && event.altKey) return copySelectedBlockReference;
        if (key === 'y' && event.shiftKey) return copySelectedBlockEmbed;
        if (key === 'd' && !event.ctrlKey) return () => enterOrCutInVisualMode(mode);

        // History
        if (key === 'u' && !event.ctrlKey) return undo;
        if (key === 'r' && event.ctrlKey) return redo;

        // Fold
        if (key === 'z' && !event.ctrlKey && !event.metaKey) return toggleFold;

        // Help panel
        if (event.key === '?') return showHelpPanel;

        // Page hints mode (Vimium-style F command)
        if (key === 'f' && event.shiftKey && !event.ctrlKey) return enterPageHintMode;

        // Hint keys (in normal mode only)
        for (let i = 0; i < DEFAULT_HINT_KEYS.length; i++) {
            if (key === DEFAULT_HINT_KEYS[i] && !event.shiftKey && !event.ctrlKey) {
                return () => clickHint(i);
            }
            if (key === DEFAULT_HINT_KEYS[i] && event.shiftKey && !event.ctrlKey) {
                return () => shiftClickHint(i);
            }
            if (key === DEFAULT_HINT_KEYS[i] && event.shiftKey && event.ctrlKey) {
                return () => ctrlShiftClickHint(i);
            }
        }
    }

    // Visual mode commands
    if (isVisual) {
        if (key === 'k' && !event.shiftKey) return selectBlockUp;
        if (key === 'j' && !event.shiftKey) return selectBlockDown;
        if (key === 'k' && event.shiftKey) return () => growHighlightUp(mode);
        if (key === 'j' && event.shiftKey) return () => growHighlightDown(mode);
        if (key === 'y') return () => copySelectedBlock(mode);
        if (key === 'd') return () => enterOrCutInVisualMode(mode);
    }

    // Normal or Visual mode commands
    if (isNormalOrVisual) {
        if (key === 'y' && event.ctrlKey) return scrollUp;
        if (key === 'e' && event.ctrlKey) return scrollDown;
    }

    // Block manipulation (normal and insert)
    if (key === 'k' && event.metaKey && event.shiftKey) return moveBlockUp;
    if (key === 'j' && event.metaKey && event.shiftKey) return moveBlockDown;

    // Close sidebar page
    if (key === 'w' && event.ctrlKey) return closeSidebarPage;

    return null;
}
