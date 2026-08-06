/**
 * Leader key configuration for Spacemacs-style key bindings
 *
 * The tree is data, not code: `keybindings.js` walks it and `which-key.js`
 * renders it, so adding a binding is a matter of adding a node here.
 *
 * Node shapes:
 * - group:   { name: '+group', keys: { [key]: node } }
 * - command: { name: 'Description', command: 'registryKey' }
 * - action:  { name: 'Description', action: () => {...} }   (for user configs)
 */

import {
    centerCurrentBlock,
    closeSidebarPage,
    copySelectedBlock,
    copySelectedBlockEmbed,
    copySelectedBlockReference,
    deleteBlock,
    expandReferences,
    moveBlockDown,
    moveBlockUp,
    selectFirstBlock,
    selectLastBlock,
    selectPanelLeft,
    selectPanelRight,
    toggleFold,
} from './commands.js';
import { enterSearchMode, nextMatch, previousMatch } from './search.js';
import { showHelpPanel } from './help-panel.js';
import { enterPageHintMode, enterBlockHintMode } from './page-hints.js';

// ============== Command Registry ==============
/**
 * Maps the `command` strings used in the tree to real functions.
 * Keeping this indirection means a user-supplied config can reference commands
 * by name without having to import anything.
 */
export const LEADER_COMMAND_REGISTRY = {
    'block/yank-ref': copySelectedBlockReference,
    'block/yank-embed': copySelectedBlockEmbed,
    'block/yank-text': copySelectedBlock,
    'block/delete': deleteBlock,
    'block/move-up': moveBlockUp,
    'block/move-down': moveBlockDown,
    'block/toggle-fold': toggleFold,
    'block/expand-refs': expandReferences,

    'goto/first': selectFirstBlock,
    'goto/last': selectLastBlock,
    'goto/center': centerCurrentBlock,

    'panel/left': selectPanelLeft,
    'panel/right': selectPanelRight,
    'panel/close': closeSidebarPage,

    'search/start': enterSearchMode,
    'search/next': nextMatch,
    'search/previous': previousMatch,

    'hint/links': () => enterPageHintMode(),
    'hint/links-sidebar': () => enterPageHintMode({ openInSidebar: true }),
    'hint/blocks': () => enterBlockHintMode(),

    'help/show': showHelpPanel,
};

// ============== Leader Key Configuration Tree ==============
export const DEFAULT_LEADER_CONFIG = {
    name: '+leader',
    keys: {
        b: {
            name: '+block',
            keys: {
                y: { name: 'yank block ref', command: 'block/yank-ref' },
                e: { name: 'yank block embed', command: 'block/yank-embed' },
                c: { name: 'copy block text', command: 'block/yank-text' },
                d: { name: 'delete block', command: 'block/delete' },
                k: { name: 'move block up', command: 'block/move-up' },
                j: { name: 'move block down', command: 'block/move-down' },
                z: { name: 'toggle fold', command: 'block/toggle-fold' },
                r: { name: 'expand references', command: 'block/expand-refs' },
            },
        },
        g: {
            name: '+goto',
            keys: {
                g: { name: 'first block', command: 'goto/first' },
                e: { name: 'last block', command: 'goto/last' },
                c: { name: 'center block', command: 'goto/center' },
            },
        },
        p: {
            name: '+panel',
            keys: {
                h: { name: 'focus left panel', command: 'panel/left' },
                l: { name: 'focus right panel', command: 'panel/right' },
                c: { name: 'close sidebar page', command: 'panel/close' },
            },
        },
        s: {
            name: '+search',
            keys: {
                s: { name: 'search in panel', command: 'search/start' },
                n: { name: 'next match', command: 'search/next' },
                p: { name: 'previous match', command: 'search/previous' },
            },
        },
        f: {
            name: '+hint',
            keys: {
                f: { name: 'hint links', command: 'hint/links' },
                s: { name: 'hint links → sidebar', command: 'hint/links-sidebar' },
                b: { name: 'hint blocks (jump to edit)', command: 'hint/blocks' },
            },
        },
        '?': { name: 'help', command: 'help/show' },
    },
};
