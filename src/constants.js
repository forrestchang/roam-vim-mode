/**
 * Constants and Selectors for Roam Vim Mode
 */

export const EXTENSION_ID = 'roam-vim-mode';
export const BLUR_PIXEL_ID = `${EXTENSION_ID}--unfocus-pixel`;
export const SELECTED_BLOCK_CSS_CLASS = `${EXTENSION_ID}--highlight`;
export const HINT_CSS_CLASS = `${EXTENSION_ID}--hint`;
export const PANEL_CSS_CLASS = `${EXTENSION_ID}--panel`;
export const PANEL_SELECTOR = `.${PANEL_CSS_CLASS}`;
export const HELP_PANEL_ID = `${EXTENSION_ID}--help-panel`;
export const PAGE_HINT_CSS_CLASS = `${EXTENSION_ID}--page-hint`;
export const PAGE_HINT_OVERLAY_ID = `${EXTENSION_ID}--page-hint-overlay`;
export const MODE_INDICATOR_ID = `${EXTENSION_ID}--mode-indicator`;
export const SEARCH_INPUT_ID = `${EXTENSION_ID}--search-input`;

// Native CSS Custom Highlight API registry names. These are CSS idents, so they
// must not contain the `--` used elsewhere in this file.
export const SEARCH_HIGHLIGHT_NAME = 'roam-vim-search';
export const SEARCH_CURRENT_HIGHLIGHT_NAME = 'roam-vim-search-current';

export const Selectors = {
    link: '.rm-page-ref',
    hiddenSection: '.rm-block__part--equals',
    block: '.roam-block',
    blockInput: '.rm-block-input',
    blockContainer: '.roam-block-container',
    blockReference: '.rm-block-ref',
    blockBulletView: '.block-bullet-view',
    title: '.rm-title-display',
    // Roam's React root. Synthetic events must be dispatched inside this subtree:
    // React attaches its listeners to the root container, so an event dispatched
    // on `document.body` bubbles to `html`/`document` and never reaches Roam.
    appRoot: '#app',
    main: '.roam-main',
    mainContent: '.roam-article',
    mainBody: '.roam-body-main',
    sidebarContent: '.sidebar-content',
    sidebarPage: '.sidebar-content > div > div',
    sidebar: '#right-sidebar',
    sidebarScrollContainer: '#roam-right-sidebar-content',
    leftPanel: '.roam-sidebar-container',
    topBar: '.rm-topbar',
    foldButton: '.rm-caret',
    // Roam marks each caret with its state; blocks without children get
    // `.rm-caret-hidden`, which must never be clicked.
    foldButtonOpen: '.rm-caret-open',
    foldButtonClosed: '.rm-caret-closed',
    highlight: '.block-highlight-blue',
    button: '.bp3-button',
    closeButton: '.bp3-icon-cross',
    dailyNotes: '#rm-log-container',
    viewMore: '.roam-log-preview',
    checkbox: '.check-container',
    externalLink: 'a',
    referenceItem: '.rm-reference-item',
    inlineReference: '.rm-inline-reference',
    referenceFootnote: '.rm-block__ref-count-footnote',
    zoomPath: '.rm-zoom-path',
    zoomItemContent: '.rm-zoom-item-content',
    breadcrumbsContainer: '.zoom-mentions-view',
    pageReferenceItem: '.rm-ref-page-view',
    pageReferenceLink: '.rm-ref-page-view-title a span',
    // The per-page header inside Linked References / Mentions. Its collapse
    // caret is a sibling of the title, under a `.rm-title-arrow-wrapper`.
    pageReferenceTitle: '.rm-ref-page-view-title',
    /**
     * Everything under Linked References / Mentions.
     *
     * Blocks rendered here belong to other pages, so page-wide commands must
     * leave their `:block/open` alone — collapsing them would silently reshape
     * a page the user isn't even looking at.
     */
    referencesRegion: '.rm-reference-item, .rm-ref-page-view, .zoom-mentions-view',
    filterButton: '.bp3-icon.bp3-icon-filter',
    commandBar: '.bp3-omnibar',
    // CodeMirror 5 (`.CodeMirror`) and 6 (`.cm-editor`) roots. Roam renders code
    // blocks with CodeMirror, which owns the keyboard while focused.
    codeEditor: '.CodeMirror, .cm-editor',
    /**
     * Roam UI that owns Escape itself — but only while it actually has focus.
     *
     * Presence alone proves nothing: a running Roam keeps ~6 `.bp3-overlay` and
     * ~4 `.bp3-overlay-open` elements mounted at all times. Testing for either
     * was true permanently, so every Escape was handed to Roam and returning to
     * normal mode in one press was impossible. Always pair this with a
     * `document.activeElement.closest(...)` check.
     */
    roamModal: '.bp3-omnibar, .bp3-dialog, .bp3-overlay-open',
    blueprintOverlay: '.bp3-overlay-open',
    modalBackdrop: '.bp3-overlay-backdrop',
    escapeHtmlId,
};

/**
 * Escape an HTML id for use inside a CSS selector.
 *
 * Roam block ids embed page uids, which can contain `.`, `@` and other CSS
 * meta-characters. `CSS.escape` handles every one of them; the manual fallback
 * exists only for non-browser environments (unit tests).
 */
export function escapeHtmlId(htmlId) {
    if (typeof htmlId !== 'string') return '';
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        return CSS.escape(htmlId);
    }
    return htmlId.replace(/[^a-zA-Z0-9_-]/g, ch => `\\${ch}`);
}

// ============== Block id parsing ==============
// Roam renders the read-only block div and its editing textarea with the same
// id: `block-input-<window-id>-<block-uid>`.
export const BLOCK_ID_PREFIX = 'block-input-';
export const UID_LENGTH = 9;

// ============== In-block hints ==============
export const HINT_IDS = [0, 1, 2, 3, 4, 5];
export const DEFAULT_HINT_KEYS = ['q', 'w', 'e', 'r', 't', 'b'];

// ============== Page-wide hints (Vimium style) ==============
export const HINT_CHARS = 'asdfghjkl';

// ============== Tunables ==============
export const SCROLL_PADDING = 50;
/** How long a partially typed multi-key sequence (`g`, `d`, …) stays pending. */
export const SEQUENCE_TIMEOUT_MS = 500;
/** How long to wait for Roam to swap a block into an editable textarea. */
export const BLOCK_ACTIVATION_TIMEOUT_MS = 1000;
/** Upper bound on search matches, to keep highlighting responsive on big pages. */
export const SEARCH_MAX_MATCHES = 500;
/**
 * Upper bound on caret clicks when folding a whole page without the Roam API.
 * Only a backstop — the loop normally stops when no caret is left to click.
 */
export const MAX_FOLD_ALL_CLICKS = 500;

// ============== Which-key configuration ==============
export const WHICH_KEY_PANEL_ID = `${EXTENSION_ID}--which-key`;
export const WHICH_KEY_DELAY = 400; // ms before showing popup
