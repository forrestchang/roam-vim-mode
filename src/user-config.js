/**
 * User configuration loader for Roam Vim Mode
 * Loads custom keybindings from roam/js/vim-mode page
 */

const CONFIG_PAGE_TITLE = 'roam/js/vim-mode';

/**
 * Deep merge two objects
 * User config overrides default config
 */
function deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && typeof source[key] !== 'function') {
            // If both are objects, merge recursively
            if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        } else {
            // Direct assignment for primitives, arrays, and functions
            result[key] = source[key];
        }
    }

    return result;
}

/**
 * Get the UID of a page by its title
 */
function getPageUidByTitle(title) {
    if (!window.roamAlphaAPI) return null;

    const result = window.roamAlphaAPI.q(`
        [:find ?uid
         :where
         [?e :node/title "${title}"]
         [?e :block/uid ?uid]]
    `);

    return result?.[0]?.[0] || null;
}

/**
 * Get all blocks under a page
 */
function getPageBlocks(pageUid) {
    if (!window.roamAlphaAPI || !pageUid) return [];

    const result = window.roamAlphaAPI.q(`
        [:find ?string ?order
         :where
         [?page :block/uid "${pageUid}"]
         [?page :block/children ?child]
         [?child :block/string ?string]
         [?child :block/order ?order]]
    `);

    return result
        .sort((a, b) => a[1] - b[1])
        .map(r => r[0]);
}

/**
 * Extract JavaScript code from a code block
 */
function extractJavaScriptCode(blockString) {
    // Match ```javascript ... ``` or ```js ... ```
    const codeBlockMatch = blockString.match(/```(?:javascript|js)\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
        return codeBlockMatch[1].trim();
    }
    return null;
}

/**
 * Safely evaluate user config code
 */
function evaluateConfigCode(code) {
    try {
        // Wrap in a function and execute
        const fn = new Function(code);
        const result = fn();
        return result;
    } catch (error) {
        console.error('[Roam Vim Mode] Error evaluating user config:', error);
        return null;
    }
}

/**
 * Load user configuration from Roam page
 * Returns null if no config found or error
 */
export async function loadUserConfig() {
    try {
        // Wait a bit for roamAlphaAPI to be available
        if (!window.roamAlphaAPI) {
            console.log('[Roam Vim Mode] roamAlphaAPI not available, skipping user config');
            return null;
        }

        const pageUid = getPageUidByTitle(CONFIG_PAGE_TITLE);
        if (!pageUid) {
            console.log(`[Roam Vim Mode] Config page "${CONFIG_PAGE_TITLE}" not found`);
            return null;
        }

        const blocks = getPageBlocks(pageUid);
        if (blocks.length === 0) {
            console.log('[Roam Vim Mode] Config page is empty');
            return null;
        }

        // Find the first JavaScript code block
        for (const block of blocks) {
            const code = extractJavaScriptCode(block);
            if (code) {
                console.log('[Roam Vim Mode] Found user config code');
                const config = evaluateConfigCode(code);
                if (config && typeof config === 'object') {
                    console.log('[Roam Vim Mode] User config loaded successfully');
                    return config;
                }
            }
        }

        console.log('[Roam Vim Mode] No valid JavaScript config found');
        return null;
    } catch (error) {
        console.error('[Roam Vim Mode] Error loading user config:', error);
        return null;
    }
}

/**
 * Merge user config with default config
 */
export function mergeConfigs(defaultConfig, userConfig) {
    if (!userConfig) {
        return defaultConfig;
    }

    // Merge the keys object
    const mergedKeys = deepMerge(defaultConfig.keys || {}, userConfig);

    return {
        ...defaultConfig,
        keys: mergedKeys,
    };
}
