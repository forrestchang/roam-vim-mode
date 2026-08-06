/**
 * Panel management for Roam Vim Mode
 */

import { Selectors, PANEL_CSS_CLASS, PANEL_SELECTOR, SCROLL_PADDING } from './constants.js';
import { assumeExists, relativeItem, clamp, findLast } from './utils.js';
import { Roam } from './roam.js';
import { debugLog } from './logger.js';

// ============== Panel State ==============
export const panelState = {
    /** @type {Element[]} main panel first, then sidebar panels in visual order. */
    panelOrder: [],
    /** @type {Map<Element, VimRoamPanel>} */
    panels: new Map(),
    focusedPanel: 0,
};

// ============== RoamBlock ==============
export class RoamBlock {
    constructor(element) {
        this.element = element;
    }

    get id() {
        return this.element.id;
    }

    async edit() {
        return Roam.activateBlock(this.element);
    }

    async toggleFold() {
        return Roam.toggleFoldBlock(this.element);
    }

    static get(blockId) {
        return new RoamBlock(assumeExists(document.getElementById(blockId), `No block with id ${blockId}`));
    }

    static selected() {
        return VimRoamPanel.selected().selectedBlock();
    }
}

// ============== VimRoamPanel ==============
export class VimRoamPanel {
    constructor(element) {
        this.element = element;
        this._selectedBlockId = null;
        this.blockIndex = 0;
    }

    blocks() {
        return Array.from(this.element.querySelectorAll(`${Selectors.block}, ${Selectors.blockInput}`));
    }

    relativeBlockId(blockId, blocksToJump) {
        return relativeItem(this.blocks(), this.indexOf(blockId), blocksToJump)?.id ?? blockId;
    }

    indexOf(blockId) {
        return this.blocks().findIndex(({ id }) => id === blockId);
    }

    /**
     * The currently selected block id, re-resolving it if the block has gone
     * away (Roam re-rendered, page changed, block deleted).
     *
     * Deliberately free of side effects beyond updating internal state — the
     * previous version scrolled the page from inside a property getter.
     */
    get selectedBlockId() {
        if (this._selectedBlockId && document.getElementById(this._selectedBlockId)) {
            return this._selectedBlockId;
        }

        const blocks = this.blocks();
        if (blocks.length === 0) {
            this._selectedBlockId = null;
            this.blockIndex = 0;
            return null;
        }

        this.blockIndex = clamp(this.blockIndex, 0, blocks.length - 1);
        this._selectedBlockId = blocks[this.blockIndex].id;
        return this._selectedBlockId;
    }

    selectedBlock() {
        const blockId = this.selectedBlockId;
        if (!blockId) {
            throw new Error('This panel has no blocks to select');
        }
        return RoamBlock.get(blockId);
    }

    /** @param {{scroll?: boolean}} [options] */
    selectBlock(blockId, { scroll = true } = {}) {
        if (!blockId) return;
        const index = this.indexOf(blockId);
        if (index === -1) return;

        this._selectedBlockId = blockId;
        this.blockIndex = index;

        if (scroll) {
            const element = document.getElementById(blockId);
            if (element) {
                this.scrollUntilBlockIsVisible(element);
            }
        }
    }

    selectRelativeBlock(blocksToJump) {
        const blockId = this.selectedBlockId;
        if (!blockId) return;
        this.selectBlock(this.relativeBlockId(blockId, blocksToJump));
    }

    selectFirstBlock() {
        const first = this.firstBlock();
        if (!first) return;
        this.element.scrollTop = 0;
        this.selectBlock(first.id);
    }

    selectLastBlock() {
        const last = this.lastBlock();
        if (last) this.selectBlock(last.id);
    }

    selectLastVisibleBlock() {
        const last = this.lastVisibleBlock();
        if (last) this.selectBlock(last.id);
    }

    selectFirstVisibleBlock() {
        const first = this.firstVisibleBlock();
        if (first) this.selectBlock(first.id);
    }

    scrollUntilBlockIsVisible(block) {
        block?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }

    /**
     * The first block in the panel.
     *
     * Uses `blocks()` rather than a `.roam-block` query so that a block which is
     * currently being edited (and therefore rendered as a `.rm-block-input`
     * textarea) still counts — otherwise `gg` skipped past it.
     *
     * @returns {Element|undefined}
     */
    firstBlock() {
        return this.blocks()[0];
    }

    /** @returns {Element|undefined} */
    lastBlock() {
        const blocks = this.blocks();
        return blocks[blocks.length - 1];
    }

    select() {
        const index = panelState.panelOrder.indexOf(this.element);
        if (index === -1) {
            // The panel isn't tagged yet (e.g. a sidebar page that just opened).
            // Re-tag and retry rather than storing -1, which used to poison
            // `panelState.panels` with an element-less panel.
            VimRoamPanel.updateSidePanels();
            const retryIndex = panelState.panelOrder.indexOf(this.element);
            if (retryIndex === -1) return;
            panelState.focusedPanel = retryIndex;
        } else {
            panelState.focusedPanel = index;
        }
        this.element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /** @returns {VimRoamPanel} @throws if no panel is currently mounted */
    static selected() {
        if (panelState.panelOrder.length === 0) {
            VimRoamPanel.updateSidePanels();
        }
        const element = panelState.panelOrder[
            clamp(panelState.focusedPanel, 0, panelState.panelOrder.length - 1)
        ];
        return VimRoamPanel.get(assumeExists(element, 'No Roam panel is currently mounted'));
    }

    static fromBlock(blockElement) {
        let panelElement = blockElement.closest(PANEL_SELECTOR);
        if (!panelElement) {
            // A freshly opened sidebar page hasn't been tagged yet.
            VimRoamPanel.updateSidePanels();
            panelElement = blockElement.closest(PANEL_SELECTOR);
        }
        return panelElement ? VimRoamPanel.get(panelElement) : null;
    }

    static at(panelIndex) {
        if (panelState.panelOrder.length === 0) return null;
        const element = panelState.panelOrder[clamp(panelIndex, 0, panelState.panelOrder.length - 1)];
        return element ? VimRoamPanel.get(element) : null;
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
        // Rebuild the map from the previous one so panels that survived the
        // re-render keep their selected block, and detached ones get dropped.
        const previous = panelState.panels;
        panelState.panels = new Map(
            panelState.panelOrder.map(el => [el, previous.get(el) ?? new VimRoamPanel(el)])
        );
        panelState.focusedPanel = clamp(
            panelState.focusedPanel,
            0,
            Math.max(0, panelState.panelOrder.length - 1)
        );
        debugLog('panel', `${panelState.panelOrder.length} panel(s), focused #${panelState.focusedPanel}`);
    }

    /** @param {Element} panelElement */
    static get(panelElement) {
        assumeExists(panelElement, 'Cannot get a panel without an element');
        let panel = panelState.panels.get(panelElement);
        if (!panel) {
            panel = new VimRoamPanel(panelElement);
            panelState.panels.set(panelElement, panel);
        }
        return panel;
    }

    static reset() {
        panelState.panelOrder = [];
        panelState.panels = new Map();
        panelState.focusedPanel = 0;
    }

    scrollAndReselectBlockToStayVisible(scrollPx) {
        this.scroll(scrollPx);
        const blockId = this.selectedBlockId;
        if (blockId) {
            this.selectClosestVisibleBlock(document.getElementById(blockId));
        }
    }

    scroll(scrollPx) {
        this.element.scrollTop += scrollPx;
    }

    selectClosestVisibleBlock(block) {
        if (!block) return;
        const scrollOverflow = blockScrollOverflow(block);
        if (scrollOverflow < 0) {
            this.selectFirstVisibleBlock();
        }
        if (scrollOverflow > 0) {
            this.selectLastVisibleBlock();
        }
    }

    /** @returns {Element|undefined} */
    firstVisibleBlock() {
        return this.blocks().find(blockIsVisible);
    }

    /** @returns {Element|undefined} */
    lastVisibleBlock() {
        return findLast(this.blocks(), blockIsVisible);
    }
}

// ============== Block Visibility Utilities ==============
export function blockScrollOverflow(block) {
    const { top, height, width } = block.getBoundingClientRect();
    const bottom = top + height;
    // offsetWidth is 0 for detached/hidden blocks; guard against dividing by it.
    const scale = block.offsetWidth ? width / block.offsetWidth : 1;
    const scaledPadding = scale * SCROLL_PADDING;

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

export function blockIsVisible(block) {
    return blockScrollOverflow(block) === 0;
}

export function tagPanels() {
    const DEFAULT_SCROLL_PANELS = `${Selectors.mainBody} > div:first-child, ${Selectors.sidebarScrollContainer}`;
    document.querySelectorAll(DEFAULT_SCROLL_PANELS).forEach(el => {
        el.classList.add(PANEL_CSS_CLASS);
    });
}
