/**
 * Panel management for Roam Vim Mode
 */

import { Selectors, PANEL_CSS_CLASS, PANEL_SELECTOR, SCROLL_PADDING } from './constants.js';
import { assumeExists, relativeItem, clamp, findLast } from './utils.js';
import { Roam } from './roam.js';

// ============== Panel State ==============
export const panelState = {
    panelOrder: [],
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
        block.scrollIntoView({ block: 'nearest', behavior: 'instant' });
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

// ============== Block Visibility Utilities ==============
export function blockScrollOverflow(block) {
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

export function blockIsVisible(block) {
    return blockScrollOverflow(block) === 0;
}

export function tagPanels() {
    const DEFAULT_SCROLL_PANELS = `${Selectors.mainBody} > div:first-child, ${Selectors.sidebarScrollContainer}`;
    document.querySelectorAll(DEFAULT_SCROLL_PANELS).forEach(el => {
        el.classList.add(PANEL_CSS_CLASS);
    });
}
