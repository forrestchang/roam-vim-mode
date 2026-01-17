/**
 * CSS styles for Roam Vim Mode
 */

import {
    EXTENSION_ID,
    SELECTED_BLOCK_CSS_CLASS,
    HINT_CSS_CLASS,
    BLUR_PIXEL_ID,
    PANEL_CSS_CLASS,
    HELP_PANEL_ID,
    PAGE_HINT_CSS_CLASS,
    PAGE_HINT_OVERLAY_ID,
    WHICH_KEY_PANEL_ID,
    SEARCH_INPUT_ID,
    SEARCH_HIGHLIGHT_CSS_CLASS,
    SEARCH_CURRENT_CSS_CLASS,
} from './constants.js';

export const VIM_MODE_STYLES = `
.${SELECTED_BLOCK_CSS_CLASS} {
    border-radius: 5px;
    background-color: #F5F5F5;
}

.bp3-dark .${SELECTED_BLOCK_CSS_CLASS} {
    background-color: #424242;
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
.${HINT_CSS_CLASS}5::after { content: "[b]"; }

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

#${HELP_PANEL_ID} {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 700px;
    max-width: 90vw;
    max-height: 80vh;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    z-index: 20000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.bp3-dark #${HELP_PANEL_ID} {
    background: #30404d;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.${HELP_PANEL_ID}--header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e1e4e8;
    background: #f6f8fa;
}

.bp3-dark .${HELP_PANEL_ID}--header {
    background: #394b59;
    border-bottom-color: #5c7080;
}

.${HELP_PANEL_ID}--title {
    font-size: 18px;
    font-weight: 600;
    color: #24292e;
}

.bp3-dark .${HELP_PANEL_ID}--title {
    color: #f5f8fa;
}

.${HELP_PANEL_ID}--close {
    font-size: 12px;
    color: #6a737d;
}

.bp3-dark .${HELP_PANEL_ID}--close {
    color: #a7b6c2;
}

.${HELP_PANEL_ID}--content {
    padding: 16px 20px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    flex: 1;
    min-height: 0;
}

.${HELP_PANEL_ID}--section {
    min-width: 0;
}

.${HELP_PANEL_ID}--category {
    font-size: 14px;
    font-weight: 600;
    color: #2196F3;
    margin: 0 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 2px solid #2196F3;
}

.bp3-dark .${HELP_PANEL_ID}--category {
    color: #48aff0;
    border-bottom-color: #48aff0;
}

.${HELP_PANEL_ID}--list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.${HELP_PANEL_ID}--item {
    display: flex;
    align-items: baseline;
    gap: 12px;
    font-size: 13px;
}

.${HELP_PANEL_ID}--key {
    font-family: monospace;
    font-size: 12px;
    background: #eef1f4;
    padding: 2px 6px;
    border-radius: 4px;
    color: #d73a49;
    white-space: nowrap;
    min-width: 90px;
    text-align: center;
}

.bp3-dark .${HELP_PANEL_ID}--key {
    background: #293742;
    color: #ff7373;
}

.${HELP_PANEL_ID}--desc {
    color: #586069;
}

.bp3-dark .${HELP_PANEL_ID}--desc {
    color: #bfccd6;
}

#${PAGE_HINT_OVERLAY_ID} {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 10001;
}

.${PAGE_HINT_CSS_CLASS} {
    position: absolute;
    display: inline-block;
    padding: 1px 3px;
    font-family: monospace;
    font-size: 11px;
    font-weight: bold;
    color: black;
    background: linear-gradient(to bottom, #FFF785 0%, #FFC542 100%);
    border: 1px solid #E3BE23;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    z-index: 10002;
    pointer-events: none;
    transform: translate(-50%, -50%);
}

.${PAGE_HINT_CSS_CLASS}--matched {
    color: #008000;
}

.bp3-dark .${PAGE_HINT_CSS_CLASS} {
    background: linear-gradient(to bottom, #3D5A80 0%, #293241 100%);
    color: #E0FBFC;
    border-color: #5C7A9E;
}

.bp3-dark .${PAGE_HINT_CSS_CLASS}--matched {
    color: #98C1D9;
}

/* Which-key popup */
#${WHICH_KEY_PANEL_ID} {
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    min-width: 300px;
    max-width: 80vw;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 19999;
    padding: 12px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.bp3-dark #${WHICH_KEY_PANEL_ID} {
    background: #30404d;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.${WHICH_KEY_PANEL_ID}--header {
    font-size: 14px;
    font-weight: 600;
    color: #6a737d;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e1e4e8;
}

.bp3-dark .${WHICH_KEY_PANEL_ID}--header {
    color: #a7b6c2;
    border-bottom-color: #5c7080;
}

.${WHICH_KEY_PANEL_ID}--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 6px 16px;
}

.${WHICH_KEY_PANEL_ID}--item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
}

.${WHICH_KEY_PANEL_ID}--key {
    font-family: monospace;
    font-size: 12px;
    font-weight: bold;
    background: #eef1f4;
    padding: 2px 8px;
    border-radius: 3px;
    color: #2196F3;
    min-width: 24px;
    text-align: center;
}

.bp3-dark .${WHICH_KEY_PANEL_ID}--key {
    background: #293742;
    color: #48aff0;
}

.${WHICH_KEY_PANEL_ID}--name {
    font-size: 13px;
    color: #24292e;
}

.bp3-dark .${WHICH_KEY_PANEL_ID}--name {
    color: #f5f8fa;
}

.${WHICH_KEY_PANEL_ID}--group {
    color: #9C27B0;
    font-weight: 500;
}

.bp3-dark .${WHICH_KEY_PANEL_ID}--group {
    color: #ce93d8;
}

/* Search */
#${SEARCH_INPUT_ID} {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 8px 12px;
    font-family: monospace;
    font-size: 14px;
    background: #f6f8fa;
    border: none;
    border-top: 1px solid #e1e4e8;
    outline: none;
    z-index: 20000;
    box-sizing: border-box;
}

#${SEARCH_INPUT_ID}::placeholder {
    color: #6a737d;
}

.bp3-dark #${SEARCH_INPUT_ID} {
    background: #30404d;
    border-top-color: #5c7080;
    color: #f5f8fa;
}

.bp3-dark #${SEARCH_INPUT_ID}::placeholder {
    color: #a7b6c2;
}

.${SEARCH_HIGHLIGHT_CSS_CLASS} {
    background-color: #fff59d;
    border-radius: 2px;
}

.bp3-dark .${SEARCH_HIGHLIGHT_CSS_CLASS} {
    background-color: #5c6b3a;
}

.${SEARCH_CURRENT_CSS_CLASS} {
    background-color: #ff9800;
    border-radius: 2px;
}

.bp3-dark .${SEARCH_CURRENT_CSS_CLASS} {
    background-color: #e65100;
}
`;
