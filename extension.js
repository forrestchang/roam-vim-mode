/**
 * Roam Vim Mode Extension
 *
 * A standalone Roam Research extension that provides Vim-like keyboard navigation
 * for blocks. Ported from roam-toolkit.
 */

// ============== Constants ==============
const EXTENSION_ID = 'roam-vim-mode';
const BLUR_PIXEL_ID = `${EXTENSION_ID}--unfocus-pixel`;
const SELECTED_BLOCK_CSS_CLASS = `${EXTENSION_ID}--highlight`;
const HINT_CSS_CLASS = `${EXTENSION_ID}--hint`;
const PANEL_CSS_CLASS = `${EXTENSION_ID}--panel`;

// ============== Selectors ==============
const Selectors = {
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
    escapeHtmlId: (htmlId) => htmlId.replace('.', '\\.').replace('@', '\\@'),
};

const PANEL_SELECTOR = `.${PANEL_CSS_CLASS}`;

// ============== Utility Functions ==============
function delay(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

async function repeatAsync(n, callbackFn) {
    for (let i = 0; i < n; i++) {
        await callbackFn();
    }
}

function assumeExists(x, errorMessage = 'Assumed that variable exists, but it does not') {
    if (!x) {
        throw new Error(errorMessage);
    }
    return x;
}

function relativeItem(xs, index, relativeIndex) {
    let destinationIndex;
    if (Math.sign(relativeIndex) > 0) {
        destinationIndex = Math.min(index + relativeIndex, xs.length - 1);
    } else {
        destinationIndex = Math.max(0, index + relativeIndex);
    }
    return xs[destinationIndex];
}

function isMacOS() {
    return window.navigator.platform === 'MacIntel';
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function findLast(array, predicate) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i])) {
            return array[i];
        }
    }
    return undefined;
}

// ============== CSS Injection ==============
function injectStyle(css, tagId) {
    if (document.getElementById(tagId)) {
        document.getElementById(tagId).innerHTML = css;
        return;
    }
    const style = document.createElement('style');
    style.id = tagId;
    style.innerHTML = css;
    document.getElementsByTagName('head')[0].appendChild(style);
}

function removeStyle(tagId) {
    const style = document.getElementById(tagId);
    if (style) {
        style.remove();
    }
}

// ============== DOM Utilities ==============
function getActiveEditElement() {
    let element = document.activeElement;
    while (element?.shadowRoot) {
        if (element.shadowRoot.activeElement) {
            element = element.shadowRoot.activeElement;
        } else {
            const subElement = element.shadowRoot.querySelector('input, textarea, select');
            if (subElement) {
                element = subElement;
            }
            break;
        }
    }
    if (!element || !isEditElement(element)) {
        return null;
    }
    return element;
}

function isEditElement(element) {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT';
}

function getInputEvent() {
    return new Event('input', {
        bubbles: true,
        cancelable: true,
    });
}

function isElementVisible(element) {
    if (!element) {
        return false;
    }
    const { x, y } = element.getBoundingClientRect();
    return x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
}

// ============== Keyboard Utilities ==============
const Keyboard = {
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    BASE_DELAY: 20,

    async simulateKey(code, delayOverride = 0, opts) {
        ['keydown', 'keyup'].forEach(eventType =>
            document?.activeElement?.dispatchEvent(getKeyboardEvent(eventType, code, opts))
        );
        return delay(delayOverride || this.BASE_DELAY);
    },
    async pressEnter(delayOverride = 0) {
        return this.simulateKey(13, delayOverride);
    },
    async pressEsc(delayOverride = 0) {
        return this.simulateKey(27, delayOverride);
    },
    async pressBackspace(delayOverride = 0) {
        return this.simulateKey(8, delayOverride);
    },
    async pressTab(delayOverride = 0) {
        return this.simulateKey(9, delayOverride);
    },
    async pressShiftTab(delayOverride = 0) {
        return this.simulateKey(9, delayOverride, { shiftKey: true });
    },
};

function getKeyboardEvent(type, code, opts) {
    return new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        keyCode: code,
        ...opts,
    });
}

const KEY_TO_CODE = {
    ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40,
    '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
    ';': 59, '=': 187, ',': 188, '-': 189, '.': 190, '/': 191, '[': 219, '\\': 220, ']': 221, "'": 222,
    a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71, h: 72, i: 73, j: 74, k: 75, l: 76, m: 77,
    n: 78, o: 79, p: 80, q: 81, r: 82, s: 83, t: 84, u: 85, v: 86, w: 87, x: 88, y: 89, z: 90,
};

// ============== Mouse Utilities ==============
const Mouse = {
    BASE_DELAY: 20,
    simulateClick(buttons, element, modifiers = {}, delayOverride = 0) {
        const mouseClickEvents = ['mousedown', 'click', 'mouseup'];
        mouseClickEvents.forEach(mouseEventType => {
            element.dispatchEvent(getMouseEvent(mouseEventType, buttons, modifiers));
        });
        return delay(delayOverride || this.BASE_DELAY);
    },
    hover(element, delayOverride = 0) {
        element.dispatchEvent(getMouseEvent('mouseover', 1));
        element.dispatchEvent(getMouseEvent('mousemove', 1));
        return delay(delayOverride || this.BASE_DELAY);
    },
    leftClick(element, modifiers = {}, additionalDelay = 0) {
        return this.simulateClick(1, element, modifiers, additionalDelay);
    },
};

function getMouseEvent(mouseEventType, buttons, modifiers = {}) {
    return new MouseEvent(mouseEventType, {
        shiftKey: modifiers.shiftKey || false,
        metaKey: modifiers.metaKey || false,
        ctrlKey: modifiers.ctrlKey || false,
        view: window,
        bubbles: true,
        cancelable: true,
        buttons,
    });
}

// ============== Mutation Observer Utilities ==============
function observeElement(observeInside, handleChange, observeChildren = false, observeAttributes = false) {
    const waitForLoad = new MutationObserver(mutations => {
        handleChange(mutations[0].target);
    });

    waitForLoad.observe(observeInside, {
        childList: true,
        attributes: observeAttributes,
        subtree: observeChildren,
    });

    return () => waitForLoad.disconnect();
}

function onSelectorChange(selector, handleChange, observeChildren = false, observeAttributes = false) {
    const element = document.querySelector(selector);
    if (!element) return () => {};
    return observeElement(element, handleChange, observeChildren, observeAttributes);
}

function waitForSelectorToExist(selector, observeInside = document.body) {
    return waitForSelectionToExist(element => element.querySelector(selector), observeInside);
}

function waitForSelectionToExist(selectionFn, observeInside = document.body) {
    return new Promise(resolve => {
        const resolveIfElementExists = () => {
            const element = selectionFn(observeInside);
            if (element) {
                resolve(element);
                return true;
            }
            return false;
        };

        if (resolveIfElementExists()) return;

        const disconnect = observeElement(
            observeInside,
            () => {
                if (resolveIfElementExists()) {
                    disconnect();
                }
            },
            true
        );
    });
}

// ============== Event Utilities ==============
function listenToEvent(event, handler) {
    window.addEventListener(event, handler, true);
    return () => window.removeEventListener(event, handler, true);
}

// ============== RoamNode ==============
class RoamNode {
    constructor(text, selection = new Selection(0, 0)) {
        this.text = text;
        this.selection = selection;
    }

    textBeforeSelection() {
        return this.text.substring(0, this.selection.start);
    }

    textAfterSelection() {
        return this.text.substring(this.selection.end);
    }

    selectedText() {
        return this.text.substring(this.selection.start, this.selection.end);
    }

    withCursorAtTheStart() {
        return this.withSelection(new Selection(0, 0));
    }

    withCursorAtTheEnd() {
        return this.withSelection(new Selection(this.text.length, this.text.length));
    }

    withSelection(selection) {
        return new RoamNode(this.text, selection);
    }
}

class Selection {
    constructor(start = 0, end = 0) {
        this.start = start;
        this.end = end;
    }
}

// ============== Roam API Wrapper ==============
const Roam = {
    async save(roamNode) {
        const roamElement = this.getRoamBlockInput();
        if (roamElement) {
            roamElement.value = roamNode.text;
            roamElement.dispatchEvent(getInputEvent());
            await delay(1);
            roamElement.setSelectionRange(roamNode.selection.start, roamNode.selection.end);
        }
    },

    getRoamBlockInput() {
        const element = getActiveEditElement();
        if (element?.tagName.toLocaleLowerCase() !== 'textarea') {
            return null;
        }
        return element;
    },

    getActiveRoamNode() {
        const element = this.getRoamBlockInput();
        if (!element) return null;
        return new RoamNode(element.value, new Selection(element.selectionStart, element.selectionEnd));
    },

    async applyToCurrent(action) {
        const node = this.getActiveRoamNode();
        if (!node) return;
        await this.save(action(node));
    },

    async highlight(element) {
        if (element) {
            await this.activateBlock(element);
        }
        if (this.getRoamBlockInput()) {
            return Keyboard.pressEsc();
        } else {
            return Promise.reject("We're not inside a block");
        }
    },

    async activateBlock(element) {
        if (element.classList.contains('roam-block')) {
            await Mouse.leftClick(element);
        }
        return this.getRoamBlockInput();
    },

    async deleteBlock() {
        return this.highlight().then(() => Keyboard.pressBackspace());
    },

    async copyBlock() {
        await this.highlight();
        document.execCommand('copy');
    },

    async moveCursorToStart() {
        await this.applyToCurrent(node => node.withCursorAtTheStart());
    },

    async moveCursorToEnd() {
        await this.applyToCurrent(node => node.withCursorAtTheEnd());
    },

    async createBlockBelow() {
        await this.moveCursorToEnd();
        await Keyboard.pressEnter();
    },

    async toggleFoldBlock(block) {
        const foldButton = nearestFoldButton(block);
        await Mouse.hover(foldButton);
        await Mouse.leftClick(foldButton);
    },
};

function nearestFoldButton(element) {
    const foldButton = element.querySelector(Selectors.foldButton);
    if (foldButton) {
        return foldButton;
    }
    return nearestFoldButton(assumeExists(element.parentElement));
}

// ============== Block Utilities ==============
function getBlockUid(htmlBlockId) {
    const UID_LENGTH = 9;
    return htmlBlockId.substr(htmlBlockId?.length - UID_LENGTH);
}

function copyBlockReference(htmlBlockId) {
    if (!htmlBlockId) return;
    return navigator.clipboard.writeText(`((${getBlockUid(htmlBlockId)}))`);
}

function copyBlockEmbed(htmlBlockId) {
    if (!htmlBlockId) return;
    return navigator.clipboard.writeText(`{{embed: ((${getBlockUid(htmlBlockId)}))}}`);
}

// ============== Roam Events ==============
const RoamEvent = {
    onSidebarToggle(handler) {
        const isSidebarShowing = () => !!document.querySelector(Selectors.sidebarContent);
        return onSelectorChange(Selectors.sidebar, () => {
            handler(isSidebarShowing());
        });
    },

    onSidebarChange(handler) {
        let _stopObservingInside = null;
        const isSidebarShowing = () => !!document.querySelector(Selectors.sidebarContent);
        const observeSidebarPages = () => {
            if (isSidebarShowing()) {
                _stopObservingInside = _stopObservingInside || onSelectorChange(Selectors.sidebarContent, handler);
            } else {
                stopObservingInside();
            }
        };
        const stopObservingInside = () => {
            if (_stopObservingInside) {
                _stopObservingInside();
                _stopObservingInside = null;
            }
        };
        observeSidebarPages();
        const stopObserving = RoamEvent.onSidebarToggle(observeSidebarPages);
        return () => {
            stopObserving();
            stopObservingInside();
        };
    },

    onEditBlock(handler) {
        const handleBlockEvent = (event) => {
            const element = event.target;
            if (element.classList.contains('rm-block-input')) {
                handler(element);
            }
        };
        document.addEventListener('focusin', handleBlockEvent);
        return () => document.removeEventListener('focusin', handleBlockEvent);
    },

    onBlurBlock(handler) {
        const handleBlockEvent = (event) => {
            const element = event.target;
            if (element.classList.contains('rm-block-input')) {
                const container = assumeExists(element.closest(Selectors.blockContainer));
                waitForSelectorToExist(`${Selectors.block}#${Selectors.escapeHtmlId(element.id)}`, container).then(handler);
            }
        };
        document.addEventListener('focusout', handleBlockEvent);
        return () => document.removeEventListener('focusout', handleBlockEvent);
    },

    onChangePage(handler) {
        let stopObservingContent = () => {};
        const reobserveContent = () => {
            stopObservingContent();
            stopObservingContent = onSelectorChange(Selectors.mainContent, handler);
        };
        let stopObservingMain = () => {};
        const reobserveMain = () => {
            stopObservingMain();
            stopObservingMain = onSelectorChange(Selectors.main, () => {
                reobserveContent();
                handler();
            });
        };
        reobserveContent();
        reobserveMain();
        return () => {
            stopObservingContent();
            stopObservingMain();
        };
    },
};

// ============== RoamBlock ==============
class RoamBlock {
    constructor(element) {
        this.element = element;
    }

    get id() {
        return this.element.id;
    }

    async edit() {
        await Roam.activateBlock(this.element);
    }

    async toggleFold() {
        await Roam.toggleFoldBlock(this.element);
    }

    static get(blockId) {
        return new RoamBlock(assumeExists(document.getElementById(blockId)));
    }

    static selected() {
        return VimRoamPanel.selected().selectedBlock();
    }
}

// ============== RoamHighlight ==============
const RoamHighlight = {
    highlightedBlocks() {
        return document.querySelectorAll(`${Selectors.highlight} ${Selectors.block}`);
    },

    first() {
        return assumeExists(this.highlightedBlocks()[0], 'No block is highlighted');
    },

    last() {
        const blocks = this.highlightedBlocks();
        return assumeExists(blocks[blocks.length - 1], 'No block is highlighted');
    },
};

// ============== Panel State ==============
const panelState = {
    panelOrder: [],
    panels: new Map(),
    focusedPanel: 0,
};

// ============== VimRoamPanel ==============
class VimRoamPanel {
    constructor(element) {
        this.element = element;
        this._selectedBlockId = null;
        this.blockIndex = 0;
    }

    blocks() {
        return Array.from(this.element.querySelectorAll(`${Selectors.block}, ${Selectors.blockInput}`));
    }

    relativeBlockId(blockId, blocksToJump) {
        return relativeItem(this.blocks(), this.indexOf(blockId), blocksToJump).id;
    }

    indexOf(blockId) {
        return this.blocks().findIndex(({ id }) => id === blockId);
    }

    get selectedBlockId() {
        if (!this._selectedBlockId || !document.getElementById(this._selectedBlockId)) {
            const blocks = this.blocks();
            this.blockIndex = clamp(this.blockIndex, 0, blocks.length - 1);
            if (blocks.length > 0) {
                this.selectBlock(blocks[this.blockIndex].id);
            }
        }
        return this._selectedBlockId;
    }

    selectedBlock() {
        return RoamBlock.get(this.selectedBlockId);
    }

    selectBlock(blockId) {
        this._selectedBlockId = blockId;
        this.blockIndex = this.indexOf(blockId);
        this.scrollUntilBlockIsVisible(this.selectedBlock().element);
    }

    selectRelativeBlock(blocksToJump) {
        const block = this.selectedBlock().element;
        this.selectBlock(this.relativeBlockId(block.id, blocksToJump));
    }

    selectFirstBlock() {
        this.selectBlock(this.firstBlock().id);
    }

    selectLastBlock() {
        this.selectBlock(this.lastBlock().id);
    }

    selectLastVisibleBlock() {
        this.selectBlock(this.lastVisibleBlock().id);
    }

    selectFirstVisibleBlock() {
        this.selectBlock(this.firstVisibleBlock().id);
    }

    scrollUntilBlockIsVisible(block) {
        this.scroll(blockScrollOverflow(block));
    }

    firstBlock() {
        return assumeExists(this.element.querySelector(Selectors.block));
    }

    lastBlock() {
        const blocks = this.blocks();
        return assumeExists(blocks[blocks.length - 1]);
    }

    select() {
        panelState.focusedPanel = panelState.panelOrder.indexOf(this.element);
        this.element.scrollIntoView({ behavior: 'smooth' });
    }

    static selected() {
        panelState.focusedPanel = Math.min(panelState.focusedPanel, panelState.panelOrder.length - 1);
        return VimRoamPanel.get(panelState.panelOrder[panelState.focusedPanel]);
    }

    static fromBlock(blockElement) {
        return VimRoamPanel.get(assumeExists(blockElement.closest(PANEL_SELECTOR)));
    }

    static at(panelIndex) {
        panelIndex = clamp(panelIndex, 0, panelState.panelOrder.length - 1);
        return VimRoamPanel.get(panelState.panelOrder[panelIndex]);
    }

    static mainPanel() {
        return VimRoamPanel.at(0);
    }

    static previousPanel() {
        return VimRoamPanel.at(panelState.focusedPanel - 1);
    }

    static nextPanel() {
        return VimRoamPanel.at(panelState.focusedPanel + 1);
    }

    static updateSidePanels() {
        tagPanels();
        panelState.panelOrder = Array.from(document.querySelectorAll(PANEL_SELECTOR));
        panelState.panels = new Map(panelState.panelOrder.map(el => [el, VimRoamPanel.get(el)]));
    }

    static get(panelId) {
        if (!panelState.panels.has(panelId)) {
            panelState.panels.set(panelId, new VimRoamPanel(panelId));
        }
        return assumeExists(panelState.panels.get(panelId));
    }

    scrollAndReselectBlockToStayVisible(scrollPx) {
        this.scroll(scrollPx);
        this.selectClosestVisibleBlock(this.selectedBlock().element);
    }

    scroll(scrollPx) {
        this.element.scrollTop += scrollPx;
    }

    selectClosestVisibleBlock(block) {
        const scrollOverflow = blockScrollOverflow(block);
        if (scrollOverflow < 0) {
            this.selectFirstVisibleBlock();
        }
        if (scrollOverflow > 0) {
            this.selectLastVisibleBlock();
        }
    }

    firstVisibleBlock() {
        return assumeExists(this.blocks().find(blockIsVisible), 'Could not find any visible block');
    }

    lastVisibleBlock() {
        return assumeExists(findLast(this.blocks(), blockIsVisible), 'Could not find any visible block');
    }
}

const SCROLL_PADDING = 50;

function blockScrollOverflow(block) {
    const { top, height, width } = block.getBoundingClientRect();
    const bottom = top + height;
    const scaledPadding = (width / block.offsetWidth) * SCROLL_PADDING;

    const panel = block.closest(PANEL_SELECTOR);
    if (!panel) return 0;

    const { top: panelTop, height: panelHeight } = panel.getBoundingClientRect();
    const panelBottom = panelTop + panelHeight;

    const overflowTop = panelTop - top + scaledPadding;
    if (overflowTop > 0) {
        return -overflowTop;
    }

    const overflowBottom = bottom - panelBottom + scaledPadding;
    if (overflowBottom > 0) {
        return overflowBottom;
    }

    return 0;
}

function blockIsVisible(block) {
    return blockScrollOverflow(block) === 0;
}

function tagPanels() {
    const DEFAULT_SCROLL_PANELS = `${Selectors.mainBody} > div:first-child, ${Selectors.sidebarScrollContainer}`;
    document.querySelectorAll(DEFAULT_SCROLL_PANELS).forEach(el => {
        el.classList.add(PANEL_CSS_CLASS);
    });
}

// ============== Mode Management ==============
const Mode = {
    INSERT: 'INSERT',
    VISUAL: 'VISUAL',
    NORMAL: 'NORMAL',
};

function getMode() {
    if (getActiveEditElement()) {
        return Mode.INSERT;
    }
    if (document.querySelector(Selectors.highlight)) {
        return Mode.VISUAL;
    }
    return Mode.NORMAL;
}

// ============== Vim View ==============
function updateVimView() {
    try {
        const block = RoamBlock.selected().element;
        clearVimView();
        block.classList.add(SELECTED_BLOCK_CSS_CLASS);
        updateVimHints(block);
        viewMoreDailyLogIfPossible();
    } catch (e) {
        // Silently ignore errors when no block is available
    }
    return null;
}

function clearVimView() {
    const priorSelections = document.querySelectorAll(`.${SELECTED_BLOCK_CSS_CLASS}`);
    priorSelections.forEach(selection => selection.classList.remove(SELECTED_BLOCK_CSS_CLASS));
    clearVimHints();
}

function viewMoreDailyLogIfPossible() {
    const viewMore = document.querySelector(Selectors.viewMore);
    if (isElementVisible(viewMore)) {
        Mouse.hover(viewMore);
    }
}

function blurEverything() {
    let blurPixel = document.getElementById(BLUR_PIXEL_ID);
    if (!blurPixel) {
        blurPixel = document.createElement('div');
        blurPixel.id = BLUR_PIXEL_ID;
        document.body.appendChild(blurPixel);
    }
    Mouse.leftClick(blurPixel);
}

// ============== Hint View ==============
const HINT_IDS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_HINT_KEYS = ['q', 'w', 'e', 'r', 't', 'f', 'b'];

function hintCssClass(n) {
    return HINT_CSS_CLASS + n;
}

const HINT_CSS_CLASSES = HINT_IDS.map(hintCssClass);

function updateVimHints(block) {
    const clickableSelectors = [
        Selectors.link,
        Selectors.externalLink,
        Selectors.checkbox,
        Selectors.button,
        Selectors.blockReference,
        Selectors.hiddenSection,
    ];
    const links = block.querySelectorAll(clickableSelectors.join(', '));
    links.forEach((link, i) => {
        if (i < HINT_IDS.length) {
            link.classList.add(HINT_CSS_CLASS, hintCssClass(i));
        }
    });
}

function clearVimHints() {
    const priorHints = document.querySelectorAll(`.${HINT_CSS_CLASS}`);
    priorHints.forEach(selection => selection.classList.remove(HINT_CSS_CLASS, ...HINT_CSS_CLASSES));
}

function getHint(n) {
    return document.querySelector(`.${hintCssClass(n)}`);
}

// ============== Vim Core ==============
async function returnToNormalMode() {
    blurEverything();
    await delay(0);
    blurEverything();
}

const RoamVim = {
    async jumpBlocksInFocusedPanel(blocksToJump) {
        const mode = getMode();
        if (mode === Mode.NORMAL) {
            VimRoamPanel.selected().selectRelativeBlock(blocksToJump);
        }
        if (mode === Mode.VISUAL) {
            await repeatAsync(Math.abs(blocksToJump), () =>
                Keyboard.simulateKey(blocksToJump > 0 ? Keyboard.DOWN_ARROW : Keyboard.UP_ARROW, 0, { shiftKey: true })
            );
            VimRoamPanel.selected().scrollUntilBlockIsVisible(
                blocksToJump > 0 ? RoamHighlight.last() : RoamHighlight.first()
            );
        }
    },
};

// ============== Commands ==============
// Navigation Commands
async function selectBlockUp() {
    await RoamVim.jumpBlocksInFocusedPanel(-1);
}

async function selectBlockDown() {
    await RoamVim.jumpBlocksInFocusedPanel(1);
}

async function selectFirstVisibleBlock() {
    VimRoamPanel.selected().selectFirstVisibleBlock();
}

async function selectLastVisibleBlock() {
    VimRoamPanel.selected().selectLastVisibleBlock();
}

async function selectFirstBlock() {
    VimRoamPanel.selected().selectFirstBlock();
}

async function selectLastBlock() {
    VimRoamPanel.selected().selectLastBlock();
}

async function selectManyBlocksUp() {
    await RoamVim.jumpBlocksInFocusedPanel(-8);
}

async function selectManyBlocksDown() {
    await RoamVim.jumpBlocksInFocusedPanel(8);
}

async function scrollUp() {
    VimRoamPanel.selected().scrollAndReselectBlockToStayVisible(-50);
}

async function scrollDown() {
    VimRoamPanel.selected().scrollAndReselectBlockToStayVisible(50);
}

// Insert Commands
async function insertBlockAfter() {
    await Roam.activateBlock(RoamBlock.selected().element);
    await Roam.createBlockBelow();
}

async function editBlock() {
    await Roam.activateBlock(RoamBlock.selected().element);
    await Roam.moveCursorToStart();
}

async function editBlockFromEnd() {
    await Roam.activateBlock(RoamBlock.selected().element);
    await Roam.moveCursorToEnd();
}

async function insertBlockBefore() {
    await Roam.activateBlock(RoamBlock.selected().element);
    await Roam.moveCursorToStart();
    await Keyboard.pressEnter();
}

// Panel Commands
function selectPanelLeft() {
    VimRoamPanel.previousPanel().select();
}

function selectPanelRight() {
    VimRoamPanel.nextPanel().select();
}

function closeSidebarPage() {
    const block = RoamBlock.selected().element;
    const pageContainer = block.closest(`${Selectors.sidebarContent} > div`);
    const closeButton = pageContainer?.querySelector(Selectors.closeButton);
    if (closeButton) {
        Mouse.leftClick(closeButton);
    }
}

// Visual Commands
function highlightSelectedBlock() {
    Roam.highlight(RoamBlock.selected().element);
}

async function growHighlightUp(mode) {
    if (mode === Mode.NORMAL) {
        await Roam.highlight(RoamBlock.selected().element);
    }
    await Keyboard.simulateKey(Keyboard.UP_ARROW, 0, { shiftKey: true });
}

async function growHighlightDown(mode) {
    if (mode === Mode.NORMAL) {
        await Roam.highlight(RoamBlock.selected().element);
    }
    await Keyboard.simulateKey(Keyboard.DOWN_ARROW, 0, { shiftKey: true });
}

// Clipboard Commands
async function cutAndGoBackToNormal() {
    document.execCommand('cut');
    await delay(0);
    await returnToNormalMode();
}

async function paste() {
    await insertBlockAfter();
    document.execCommand('paste');
    await returnToNormalMode();
}

async function pasteBefore() {
    await RoamVim.jumpBlocksInFocusedPanel(-1);
    await insertBlockAfter();
    document.execCommand('paste');
    await returnToNormalMode();
}

async function copySelectedBlock(mode) {
    if (mode === Mode.NORMAL) {
        await Roam.highlight(RoamBlock.selected().element);
    }
    document.execCommand('copy');
    await returnToNormalMode();
}

function copySelectedBlockReference() {
    copyBlockReference(VimRoamPanel.selected().selectedBlock().id);
}

function copySelectedBlockEmbed() {
    copyBlockEmbed(VimRoamPanel.selected().selectedBlock().id);
}

async function enterOrCutInVisualMode(mode) {
    if (mode === Mode.NORMAL) {
        return Roam.highlight(RoamBlock.selected().element);
    }
    await cutAndGoBackToNormal();
}

// History Commands
async function undo() {
    await Keyboard.simulateKey(KEY_TO_CODE['z'], 0, { key: 'z', metaKey: true });
    await returnToNormalMode();
}

async function redo() {
    await Keyboard.simulateKey(KEY_TO_CODE['z'], 0, { key: 'z', shiftKey: true, metaKey: true });
    await returnToNormalMode();
}

// Block Manipulation Commands
async function moveBlockUp() {
    RoamBlock.selected().edit();
    await Keyboard.simulateKey(Keyboard.UP_ARROW, 0, { metaKey: true, shiftKey: true });
}

async function moveBlockDown() {
    RoamBlock.selected().edit();
    await Keyboard.simulateKey(Keyboard.DOWN_ARROW, 0, { metaKey: true, shiftKey: true });
}

// Hint Commands
function clickHint(n) {
    const hint = getHint(n);
    if (hint) {
        Mouse.leftClick(hint);
    }
}

function shiftClickHint(n) {
    const hint = getHint(n);
    if (hint) {
        Mouse.leftClick(hint, { shiftKey: true });
    }
}

function ctrlShiftClickHint(n) {
    const hint = getHint(n);
    if (hint) {
        Mouse.leftClick(hint, { shiftKey: true, metaKey: isMacOS(), ctrlKey: !isMacOS() });
    }
}

// Toggle Fold
function toggleFold() {
    RoamBlock.selected().toggleFold();
}

// ============== Vim Mode Initialization ==============
let disconnectHandlers = [];
let keydownHandler = null;
let sequenceBuffer = '';
let sequenceTimeout = null;

function startVimMode() {
    waitForSelectorToExist(Selectors.mainContent).then(async () => {
        await delay(300);

        disconnectHandlers = [
            RoamEvent.onEditBlock(blockElement => {
                VimRoamPanel.fromBlock(blockElement).select();
                VimRoamPanel.selected().selectBlock(blockElement.id);
                updateVimView();
            }),

            RoamEvent.onBlurBlock(updateVimView),

            RoamEvent.onSidebarToggle(isRightPanelOn => {
                if (!isRightPanelOn) {
                    VimRoamPanel.mainPanel().select();
                }
                VimRoamPanel.updateSidePanels();
                updateVimView();
            }),

            RoamEvent.onSidebarChange(() => {
                VimRoamPanel.updateSidePanels();
                updateVimView();
            }),

            RoamEvent.onChangePage(() => {
                VimRoamPanel.updateSidePanels();
                VimRoamPanel.mainPanel().selectFirstBlock();
                updateVimView();
            }),
        ];

        VimRoamPanel.updateSidePanels();
        updateVimView();

        // Set up key bindings
        keydownHandler = handleKeydown;
        document.addEventListener('keydown', keydownHandler, true);
    });
}

function stopVimMode() {
    disconnectHandlers.forEach(disconnect => disconnect());
    disconnectHandlers = [];
    clearVimView();

    if (keydownHandler) {
        document.removeEventListener('keydown', keydownHandler, true);
        keydownHandler = null;
    }

    // Remove blur pixel
    const blurPixel = document.getElementById(BLUR_PIXEL_ID);
    if (blurPixel) {
        blurPixel.remove();
    }
}

function handleKeydown(event) {
    const mode = getMode();
    const key = event.key.toLowerCase();
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

    // Don't intercept when in insert mode unless it's Escape
    if (mode === Mode.INSERT && key !== 'escape') {
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
        updateVimView();
        clearSequence();
    }
}

function buildSequence(key, event) {
    // Reset sequence after timeout
    if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
    }

    // Build modifier prefix
    let prefix = '';
    if (event.ctrlKey) prefix += 'ctrl+';
    if (event.metaKey) prefix += 'cmd+';
    if (event.altKey) prefix += 'alt+';
    if (event.shiftKey && key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // For shift+letter, just use uppercase
        // But for shift+ctrl+letter, use prefix
    } else if (event.shiftKey) {
        prefix += 'shift+';
    }

    sequenceBuffer += prefix + key + ' ';

    sequenceTimeout = setTimeout(() => {
        clearSequence();
    }, 500);

    return sequenceBuffer.trim();
}

function clearSequence() {
    sequenceBuffer = '';
    if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
        sequenceTimeout = null;
    }
}

function matchCommand(sequence, mode, event) {
    const key = event.key.toLowerCase();
    const isNormal = mode === Mode.NORMAL;
    const isVisual = mode === Mode.VISUAL;
    const isNormalOrVisual = isNormal || isVisual;

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

// ============== CSS Styles ==============
const VIM_MODE_STYLES = `
.${SELECTED_BLOCK_CSS_CLASS} {
    border-radius: 5px;
    background-color: #FFF3E2;
}

.bp3-dark .${SELECTED_BLOCK_CSS_CLASS} {
    background-color: #3d3024;
}

.${HINT_CSS_CLASS}::after {
    position: relative;
    top: 5px;
    display: inline-block;
    width: 18px;
    margin-right: -18px;
    height: 18px;
    font-size: 10px;
    font-style: italic;
    font-weight: bold;
    color: darkorchid;
    text-shadow: 1px 1px 0px orange;
    opacity: 0.7;
}

.check-container.${HINT_CSS_CLASS}::after {
    position: absolute;
    top: 3px;
}

.${HINT_CSS_CLASS}0::after { content: "[q]"; }
.${HINT_CSS_CLASS}1::after { content: "[w]"; }
.${HINT_CSS_CLASS}2::after { content: "[e]"; }
.${HINT_CSS_CLASS}3::after { content: "[r]"; }
.${HINT_CSS_CLASS}4::after { content: "[t]"; }
.${HINT_CSS_CLASS}5::after { content: "[f]"; }
.${HINT_CSS_CLASS}6::after { content: "[b]"; }

#${BLUR_PIXEL_ID} {
    position: fixed;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
}

.${PANEL_CSS_CLASS} {
    position: relative;
}
`;

// ============== Mode Indicator ==============
const MODE_INDICATOR_ID = `${EXTENSION_ID}--mode-indicator`;
let modeIndicatorInterval = null;

function createModeIndicator() {
    const indicator = document.createElement('div');
    indicator.id = MODE_INDICATOR_ID;
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 6px 12px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
        transition: all 0.2s ease;
    `;
    document.body.appendChild(indicator);
    updateModeIndicator();

    // Update indicator periodically
    modeIndicatorInterval = setInterval(updateModeIndicator, 100);
}

function updateModeIndicator() {
    const indicator = document.getElementById(MODE_INDICATOR_ID);
    if (!indicator) return;

    const mode = getMode();
    switch (mode) {
        case Mode.NORMAL:
            indicator.textContent = '-- NORMAL --';
            indicator.style.backgroundColor = '#2196F3';
            indicator.style.color = 'white';
            break;
        case Mode.INSERT:
            indicator.textContent = '-- INSERT --';
            indicator.style.backgroundColor = '#4CAF50';
            indicator.style.color = 'white';
            break;
        case Mode.VISUAL:
            indicator.textContent = '-- VISUAL --';
            indicator.style.backgroundColor = '#FF9800';
            indicator.style.color = 'white';
            break;
    }
}

function removeModeIndicator() {
    const indicator = document.getElementById(MODE_INDICATOR_ID);
    if (indicator) {
        indicator.remove();
    }
    if (modeIndicatorInterval) {
        clearInterval(modeIndicatorInterval);
        modeIndicatorInterval = null;
    }
}

// ============== Extension Entry Points ==============
function onload({ extensionAPI }) {
    console.log('Roam Vim Mode extension loaded');

    // Inject styles
    injectStyle(VIM_MODE_STYLES, `${EXTENSION_ID}--styles`);

    // Create mode indicator
    createModeIndicator();

    // Start vim mode
    startVimMode();
}

function onunload() {
    console.log('Roam Vim Mode extension unloaded');

    // Stop vim mode
    stopVimMode();

    // Remove styles
    removeStyle(`${EXTENSION_ID}--styles`);

    // Remove mode indicator
    removeModeIndicator();
}

export default {
    onload,
    onunload,
};
