/**
 * Roam API wrapper and related utilities
 */

import { Selectors } from './constants.js';
import {
    delay,
    assumeExists,
    getActiveEditElement,
    getInputEvent,
    Keyboard,
    Mouse,
    onSelectorChange,
    waitForSelectorToExist,
} from './utils.js';

// ============== RoamNode ==============
export class Selection {
    constructor(start = 0, end = 0) {
        this.start = start;
        this.end = end;
    }
}

export class RoamNode {
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

// ============== Roam API Wrapper ==============
function nearestFoldButton(element) {
    const foldButton = element.querySelector(Selectors.foldButton);
    if (foldButton) {
        return foldButton;
    }
    return nearestFoldButton(assumeExists(element.parentElement));
}

export const Roam = {
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

// ============== Block Utilities ==============
export function getBlockUid(htmlBlockId) {
    const UID_LENGTH = 9;
    return htmlBlockId.substr(htmlBlockId?.length - UID_LENGTH);
}

export function copyBlockReference(htmlBlockId) {
    if (!htmlBlockId) return;
    return navigator.clipboard.writeText(`((${getBlockUid(htmlBlockId)}))`);
}

export function copyBlockEmbed(htmlBlockId) {
    if (!htmlBlockId) return;
    return navigator.clipboard.writeText(`{{embed: ((${getBlockUid(htmlBlockId)}))}}`);
}

// ============== Roam Events ==============
export const RoamEvent = {
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
// Note: RoamBlock is defined in panel.js to avoid circular dependency
// It needs VimRoamPanel which needs RoamBlock

// ============== RoamHighlight ==============
export const RoamHighlight = {
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
