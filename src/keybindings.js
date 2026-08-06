/**
 * Keyboard bindings and handler for Roam Vim Mode
 */

import {
    DEFAULT_HINT_KEYS,
    HINT_CHARS,
    SEQUENCE_TIMEOUT_MS,
    Selectors,
} from './constants.js';
import { Mode, getMode } from './mode.js';
import { SYNTHETIC_KEY_FLAG } from './utils.js';
import { debugLog, logError } from './logger.js';
import {
    hidePageHints,
    filterPageHints,
    backspacePageHints,
    enterPageHintMode,
} from './page-hints.js';
import { showHelpPanel, hideHelpPanel, isHelpPanelOpen } from './help-panel.js';
import { showWhichKey, showWhichKeyImmediate, hideWhichKey } from './which-key.js';
import { DEFAULT_LEADER_CONFIG, LEADER_COMMAND_REGISTRY } from './leader-config.js';
import { enterSearchMode, handleSearchInput, nextMatch, previousMatch } from './search.js';
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

// ============== Match Results ==============
// Exported so `test/keybindings.test.js` can assert on sequence resolution.
/** Swallow the key and keep the pending sequence buffer intact. */
export const PENDING = Symbol('roam-vim-pending-sequence');
/** Swallow the key and drop the pending sequence buffer. */
export const CONSUME = Symbol('roam-vim-consume');

// ============== Sequence State ==============
let sequenceBuffer = '';
let sequenceTimeout = null;

// Keys that start multi-key sequences: pressing one waits for the next key
// rather than firing a single-key command.
const SEQUENCE_PREFIXES = ['g', 'd'];

// ============== Leader Key State ==============
let leaderConfig = DEFAULT_LEADER_CONFIG;

const leaderState = {
    active: false,
    currentNode: leaderConfig,
    path: [],
};

/** Replace the leader tree (for user customisation). */
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

function handleLeaderSequence(key) {
    const nextNode = leaderState.currentNode.keys?.[key];

    if (nextNode?.keys) {
        // A group — descend into it.
        leaderState.currentNode = nextNode;
        leaderState.path.push(key);
        showWhichKeyImmediate(nextNode, [...leaderState.path]);
        return true;
    }

    if (nextNode?.action) {
        runCommand(nextNode.action);
        resetLeaderState();
        return true;
    }

    if (nextNode?.command) {
        const commandFn = LEADER_COMMAND_REGISTRY[nextNode.command];
        if (commandFn) {
            runCommand(commandFn);
        } else {
            console.warn(`[Roam Vim Mode] Unknown leader command: ${nextNode.command}`);
        }
        resetLeaderState();
        return true;
    }

    // Unknown key — cancel, like which-key does.
    resetLeaderState();
    return false;
}

/**
 * Whether focus currently sits inside Roam UI that should handle Escape itself.
 *
 * Deliberately a focus test, not an existence test. Roam keeps several
 * `.bp3-overlay-open` elements mounted permanently, so asking "is an overlay
 * open?" answered yes forever and every Escape got handed straight to Roam.
 */
function isRoamModalFocused() {
    return !!document.activeElement?.closest?.(Selectors.roamModal);
}

// ============== Command Execution ==============
/**
 * Run a command, containing both synchronous throws and rejected promises.
 *
 * Commands routinely touch DOM that Roam may have just re-rendered away; an
 * uncontained failure here used to surface as an unhandled promise rejection.
 */
function runCommand(command) {
    const name = command.name || '(anonymous)';
    debugLog('command', `running ${name}`);
    try {
        const result = command();
        if (result && typeof result.catch === 'function') {
            result.catch(error => logError('command', `"${name}" failed`, error));
        }
    } catch (error) {
        logError('command', `"${name}" failed`, error);
    }
}

/**
 * Claim a key entirely.
 *
 * `stopImmediatePropagation` matters as much as the other two: Roam has its own
 * global key handlers, and merely stopping propagation still lets any listener
 * registered on the same node run. Escape is the case that bites — Roam answers
 * it by turning the edited block into a blue selection, which lands the user in
 * VISUAL instead of NORMAL.
 */
function consume(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
}

// ============== Logging helpers ==============
function describeKeyPress(event) {
    const mods = [
        event.ctrlKey && 'Ctrl',
        event.metaKey && 'Cmd',
        event.altKey && 'Alt',
        event.shiftKey && 'Shift',
    ].filter(Boolean);
    return [...mods, event.key === ' ' ? 'Space' : event.key].join('+');
}

function describeMatch(match) {
    if (!match) return 'no match (passed to Roam)';
    if (match === PENDING) return 'PENDING (waiting for next key)';
    if (match === CONSUME) return 'CONSUME (swallowed)';
    return `command ${match.name || '(anonymous)'}`;
}

// ============== Keydown Handler ==============
export function handleKeydown(event) {
    // Never react to key events we dispatched ourselves.
    if (event[SYNTHETIC_KEY_FLAG]) {
        return;
    }

    const mode = getMode();
    const key = event.key.toLowerCase();
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

    debugLog('keys', `keydown ${describeKeyPress(event)} in ${mode}`, {
        target: event.target,
        activeElement: document.activeElement,
        blockSelections: document.querySelectorAll(Selectors.highlight).length,
    });

    // --- Search mode: the input owns the keyboard, we only handle control keys.
    if (mode === Mode.SEARCH) {
        if (key === 'escape' || key === 'enter') {
            consume(event);
            handleSearchInput(event);
        }
        return;
    }

    // --- Hint mode.
    if (mode === Mode.HINT) {
        if (key === 'escape') {
            consume(event);
            hidePageHints();
            return;
        }
        if (key === 'backspace') {
            consume(event);
            backspacePageHints();
            return;
        }
        if (HINT_CHARS.includes(key) && !hasModifier) {
            consume(event);
            filterPageHints(key);
            return;
        }
        // Anything else (Cmd+K, arrow keys, …) cancels hinting and passes through.
        hidePageHints();
        return;
    }

    // --- Insert mode: hands off, except for Escape.
    if (mode === Mode.INSERT && key !== 'escape') {
        return;
    }

    // Let Escape reach Roam when one of its own overlays is open (command bar,
    // search dialog, dialogs) so it can close them — but only when none of our
    // own modal UI is up, which we must always be able to dismiss.
    if (key === 'escape' && !isHelpPanelOpen() && !leaderState.active && isRoamModalFocused()) {
        debugLog('keys', 'escape handed to Roam: focus is inside its own modal UI');
        return;
    }

    // --- Leader mode.
    if (leaderState.active) {
        consume(event);

        if (key === 'escape') {
            resetLeaderState();
            return;
        }
        // Case-sensitive so `F` and `f` can differ.
        const leaderKey = event.shiftKey && event.key.length === 1 ? event.key : key;
        handleLeaderSequence(leaderKey);
        return;
    }

    if (mode === Mode.NORMAL && event.key === ' ' && !hasModifier && isSpacemacsEnabled()) {
        consume(event);
        enterLeaderMode();
        return;
    }

    // Let native Cmd shortcuts through.
    if (event.metaKey) {
        return;
    }

    const sequence = buildSequence(key, event);
    const match = matchCommand(sequence, mode, event);
    debugLog('keys', `sequence "${sequence}" -> ${describeMatch(match)}`);

    if (!match) {
        // Unrecognised key: hand it to Roam and start the next sequence clean.
        clearSequence();
        return;
    }

    consume(event);

    if (match === PENDING) {
        // Keep the buffer so the next key can complete the sequence. This is the
        // whole reason `gg` and `dd` work: the old code cleared the buffer after
        // every match, so a two-key sequence could never accumulate.
        return;
    }

    clearSequence();
    if (match !== CONSUME) {
        runCommand(match);
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
    // Shift on a plain letter is conveyed by the binding checking `event.shiftKey`,
    // so it doesn't get a prefix; shift on anything else does.
    if (event.shiftKey && !(key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey)) {
        prefix += 'shift+';
    }

    sequenceBuffer += prefix + key + ' ';

    sequenceTimeout = setTimeout(clearSequence, SEQUENCE_TIMEOUT_MS);

    return sequenceBuffer.trim();
}

export function clearSequence() {
    sequenceBuffer = '';
    if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
        sequenceTimeout = null;
    }
}

/** The pending multi-key sequence, e.g. `'g '`. Exported for tests. */
export function getSequenceBuffer() {
    return sequenceBuffer;
}

/** Drop all transient keyboard state (used when the extension unloads). */
export function resetKeybindingState() {
    clearSequence();
    resetLeaderState();
}

// ============== Command Matching ==============
/**
 * Resolve a key press to a command, `PENDING`, `CONSUME`, or `null`.
 * Exported for tests.
 */
export function matchCommand(sequence, mode, event) {
    const key = event.key.toLowerCase();
    const isNormal = mode === Mode.NORMAL;
    const isVisual = mode === Mode.VISUAL;
    const plain = !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;

    // The help panel is modal: only `?` and Escape get through.
    if (isHelpPanelOpen()) {
        if (key === 'escape' || event.key === '?') {
            return hideHelpPanel;
        }
        return CONSUME;
    }

    if (key === 'escape') {
        return returnToNormalMode;
    }

    // In VISUAL mode j/k grow the block selection instead of moving it.
    if (isVisual) {
        if (key === 'j' && plain) return selectBlockDown;
        if (key === 'k' && plain) return selectBlockUp;
        return null;
    }

    if (!isNormal) {
        return null;
    }

    // --- Multi-key sequences, checked before any single-key binding.
    if (sequence === 'g g' && !event.shiftKey) return selectFirstBlock;
    if (sequence === 'd d' && !event.shiftKey) return deleteBlock;

    // Mid-sequence but no match: swallow the key and reset rather than firing
    // the second key's own binding.
    if (SEQUENCE_PREFIXES.some(prefix => sequence.startsWith(`${prefix} `))) {
        return CONSUME;
    }

    // A bare prefix key: wait for the next key.
    if (SEQUENCE_PREFIXES.includes(key) && sequence === key && plain) {
        return PENDING;
    }

    // --- Navigation
    if (key === 'k' && plain) return selectBlockUp;
    if (key === 'j' && plain) return selectBlockDown;
    if (key === 'g' && event.shiftKey && !event.ctrlKey && !event.altKey) return selectLastBlock;

    // --- Panel navigation
    if (key === 'h' && plain) return selectPanelLeft;
    if (key === 'l' && plain) return selectPanelRight;

    // --- Insert mode
    if (key === 'i' && plain) return editBlock;
    if (key === 'a' && plain) return editBlockFromEnd;
    if (key === 'o' && event.shiftKey && !event.ctrlKey && !event.altKey) return insertBlockBefore;
    if (key === 'o' && plain) return insertBlockAfter;

    // --- Visual mode (line level)
    if (key === 'v' && event.shiftKey && !event.ctrlKey && !event.altKey) return highlightSelectedBlock;

    // --- View
    if (key === 'z' && plain) return toggleFold;
    if (key === 'c' && plain) return centerCurrentBlock;

    // --- History
    if (key === 'u' && plain) return undo;
    if (key === 'r' && event.ctrlKey && !event.altKey) return redo;

    // --- Help
    if (event.key === '?') return showHelpPanel;

    // --- Search
    if (event.key === '/') return enterSearchMode;
    if (key === 'n' && plain) return nextMatch;
    if (key === 'n' && event.shiftKey && !event.ctrlKey && !event.altKey) return previousMatch;

    // --- Page-wide hints (Vimium style)
    if (key === 'f' && plain) return () => enterPageHintMode();
    if (key === 'f' && event.shiftKey && !event.ctrlKey && !event.altKey) {
        return () => enterPageHintMode({ openInSidebar: true });
    }

    // --- In-block hints
    const hintIndex = DEFAULT_HINT_KEYS.indexOf(key);
    if (hintIndex !== -1 && !event.ctrlKey && !event.altKey) {
        return event.shiftKey ? () => shiftClickHint(hintIndex) : () => clickHint(hintIndex);
    }

    return null;
}
