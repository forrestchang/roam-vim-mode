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

export const Selectors = {
    link: '.rm-page-ref',
    hiddenSection: '.rm-block__part--equals',
    block: '.roam-block',
    blockInput: '.rm-block-input',
    blockContainer: '.roam-block-container',
    blockReference: '.rm-block-ref',
    blockBulletView: '.block-bullet-view',
    title: '.rm-title-display',
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
    highlight: '.block-highlight-blue',
    button: '.bp3-button',
    closeButton: '.bp3-icon-cross',
    dailyNotes: '#rm-log-container',
    viewMore: '.roam-log-preview',
    checkbox: '.check-container',
    externalLink: 'a',
    referenceItem: '.rm-reference-item',
    inlineReference: '.rm-inline-reference',
    zoomPath: '.rm-zoom-path',
    zoomItemContent: '.rm-zoom-item-content',
    breadcrumbsContainer: '.zoom-mentions-view',
    pageReferenceItem: '.rm-ref-page-view',
    pageReferenceLink: '.rm-ref-page-view-title a span',
    filterButton: '.bp3-icon.bp3-icon-filter',
    commandBar: '.bp3-omnibar',
    escapeHtmlId: (htmlId) => htmlId.replace('.', '\\.').replace('@', '\\@'),
};

// Hint configuration
export const HINT_IDS = [0, 1, 2, 3, 4, 5];
export const DEFAULT_HINT_KEYS = ['q', 'w', 'e', 'r', 't', 'b'];
export const HINT_CHARS = 'asdfghjkl';
export const SCROLL_PADDING = 50;
