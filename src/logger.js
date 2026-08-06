/**
 * In-memory ring buffer log with a one-call export.
 *
 * This extension can only really be observed in a live Roam graph, and a browser
 * extension has no filesystem access — so instead of asking anyone to scrape the
 * console, every interesting step is recorded here and can be dumped to a file:
 *
 *     roamVimMode.download()   // saves roam-vim-mode-log.txt
 *     roamVimMode.copy()       // whole log onto the clipboard
 *     roamVimMode.diagnose()   // environment probe, also logged
 *     roamVimMode.verbose = true   // also mirror everything to the console
 *
 * Recording is always on and cheap; only console mirroring is opt-in.
 */

import { Selectors } from './constants.js';

const MAX_ENTRIES = 2000;
const PREFIX = '[Roam Vim Mode]';
const LOG_FILE_NAME = 'roam-vim-mode-log.txt';

/** @type {{t: number, level: string, category: string, message: string, data: string|null}[]} */
const entries = [];
const startedAt = Date.now();

// ============== Value formatting ==============
/** Render a value compactly and without ever throwing on cycles or DOM nodes. */
export function describe(value, depth = 0) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    const type = typeof value;
    if (type === 'string') return depth === 0 ? value : JSON.stringify(value);
    if (type === 'number' || type === 'boolean') return String(value);
    if (type === 'function') return `fn ${value.name || '(anonymous)'}`;
    if (type === 'symbol') return value.toString();

    if (value instanceof Error) {
        return `${value.name}: ${value.message}\n${value.stack ?? ''}`;
    }

    // DOM nodes: identity is what matters, not contents.
    if (typeof Element !== 'undefined' && value instanceof Element) {
        const id = value.id ? `#${value.id}` : '';
        const cls = value.classList?.length ? `.${[...value.classList].join('.')}` : '';
        return `<${value.tagName.toLowerCase()}${id}${cls}>`;
    }

    if (Array.isArray(value)) {
        if (depth > 2) return `[…${value.length}]`;
        return `[${value.slice(0, 20).map(v => describe(v, depth + 1)).join(', ')}]`;
    }

    if (depth > 2) return '{…}';
    try {
        const parts = Object.entries(value).map(([k, v]) => `${k}: ${describe(v, depth + 1)}`);
        return `{ ${parts.join(', ')} }`;
    } catch {
        return String(value);
    }
}

// ============== Recording ==============
function record(level, category, message, data) {
    entries.push({
        t: Date.now() - startedAt,
        level,
        category,
        message,
        data: data === undefined ? null : describe(data, 1),
    });
    if (entries.length > MAX_ENTRIES) {
        entries.splice(0, entries.length - MAX_ENTRIES);
    }

    if (isVerbose() || level === 'error') {
        const method = level === 'error' ? 'warn' : 'log';
        console[method](`${PREFIX} [${category}] ${message}`, data ?? '');
    }
}

export function isVerbose() {
    return (
        typeof window !== 'undefined' &&
        (window.roamVimMode?.verbose === true || window.__roamVimDebug === true)
    );
}

/** Trace a step. Recorded always, printed only when verbose. */
export function debugLog(category, message, data) {
    record('debug', category, message, data);
}

/** Something went wrong. Recorded and always printed. */
export function logError(category, message, error) {
    record('error', category, message, error);
}

/** A preferred path failed and we degraded to another one — always worth seeing. */
export function warnFallback(what, error) {
    record('error', 'fallback', what, error);
}

// ============== Export ==============
export function getLog() {
    const header = [
        `Roam Vim Mode log`,
        `entries: ${entries.length}${entries.length === MAX_ENTRIES ? ' (truncated to newest)' : ''}`,
        `userAgent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a'}`,
        '',
    ];
    const body = entries.map(({ t, level, category, message, data }) => {
        const stamp = String(t).padStart(7, ' ');
        const line = `${stamp}ms ${level.toUpperCase().padEnd(5)} [${category}] ${message}`;
        return data ? `${line}\n${' '.repeat(10)}${data.replace(/\n/g, `\n${' '.repeat(10)}`)}` : line;
    });
    return [...header, ...body].join('\n');
}

export function clearLog() {
    entries.length = 0;
    return 'cleared';
}

export function downloadLog(fileName = LOG_FILE_NAME) {
    const blob = new Blob([getLog()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the download a tick to start before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return `saved ${fileName} (${entries.length} entries)`;
}

export async function copyLog() {
    try {
        await navigator.clipboard.writeText(getLog());
        return `copied ${entries.length} entries to the clipboard`;
    } catch (error) {
        console.warn(`${PREFIX} clipboard write failed; printing instead`, error);
        console.log(getLog());
        return 'clipboard unavailable — the log was printed above';
    }
}

// ============== Environment probe ==============
const PROBED_SELECTORS = {
    appRoot: Selectors.appRoot,
    roamBlock: Selectors.block,
    blockInput: Selectors.blockInput,
    mainContent: Selectors.mainContent,
    panel: '.roam-vim-mode--panel',
    omnibar: Selectors.commandBar,
    // Note: these two are non-zero in an idle Roam (~6 and ~4). Presence says
    // nothing about whether a modal is really up — see `Selectors.roamModal`.
    overlayAny: '.bp3-overlay',
    overlayOpen: Selectors.blueprintOverlay,
    modalBackdrop: Selectors.modalBackdrop,
    blockHighlight: Selectors.highlight,
    codeMirror5: '.CodeMirror',
    codeMirror6: '.cm-editor',
};

/**
 * Snapshot of everything this extension assumes about its environment.
 * Answers "which of my assumptions about Roam's DOM and API actually hold?".
 */
export function diagnose() {
    const api = typeof window !== 'undefined' ? window.roamAlphaAPI : null;

    const counts = {};
    for (const [name, selector] of Object.entries(PROBED_SELECTORS)) {
        counts[name] = document.querySelectorAll(selector).length;
    }

    const sample = document.querySelector(Selectors.blockInput) ?? document.querySelector(Selectors.block);
    const sampleId = sample?.id ?? null;

    const report = {
        api: {
            present: !!api,
            'data.block': !!api?.data?.block,
            'data.undo': typeof api?.data?.undo,
            pull: typeof api?.pull,
            'ui.getFocusedBlock': typeof api?.ui?.getFocusedBlock,
            'ui.setBlockFocusAndSelection': typeof api?.ui?.setBlockFocusAndSelection,
            'util.generateUID': typeof api?.util?.generateUID,
            legacyCreateBlock: typeof api?.createBlock,
        },
        selectorCounts: counts,
        sampleBlockId: sampleId,
        activeElement: document.activeElement
            ? describe(document.activeElement, 1)
            : null,
        activeIsContentEditable: document.activeElement?.isContentEditable ?? null,
        activeIsInsideRoamModal: !!document.activeElement?.closest?.(Selectors.roamModal),
    };

    // Round-trip a real block through the id parser and the datastore.
    if (sampleId) {
        const uid = sampleId.startsWith('block-input-') ? sampleId.slice(-9) : null;
        report.parsedUid = uid;
        if (uid && api?.pull) {
            try {
                report.pullRoundTrip = api.pull(
                    '[:block/uid :block/string :block/order {:block/_children [:block/uid]}]',
                    [':block/uid', uid]
                );
            } catch (error) {
                report.pullRoundTrip = `threw: ${error.message}`;
            }
        }
    }

    debugLog('diagnose', 'environment probe', report);
    return report;
}

// ============== Console API ==============
export function installConsoleApi(extra = {}) {
    if (typeof window === 'undefined') return;
    window.roamVimMode = {
        verbose: window.roamVimMode?.verbose ?? false,
        logs: getLog,
        print: () => console.log(getLog()),
        download: downloadLog,
        copy: copyLog,
        clear: clearLog,
        diagnose,
        ...extra,
    };
    console.log(
        `${PREFIX} debug tools ready — roamVimMode.download() / .copy() / .diagnose() / .verbose = true`
    );
}

export function removeConsoleApi() {
    if (typeof window !== 'undefined') {
        delete window.roamVimMode;
    }
}
