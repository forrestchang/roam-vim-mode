/**
 * Settings management for Roam Vim Mode
 */

// ============== Settings State ==============
let extensionAPIRef = null;

// ============== Settings Keys ==============
export const SETTING_SPACEMACS_ENABLED = 'spacemacs-enabled';

// ============== API ==============
export function setExtensionAPI(api) {
    extensionAPIRef = api;
}

export function isSpacemacsEnabled() {
    if (!extensionAPIRef) return false;
    return extensionAPIRef.settings.get(SETTING_SPACEMACS_ENABLED) === true;
}
