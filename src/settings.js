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

export function getSetting(key) {
    if (!extensionAPIRef) return undefined;
    return extensionAPIRef.settings.get(key);
}

export function setSetting(key, value) {
    if (!extensionAPIRef) return;
    extensionAPIRef.settings.set(key, value);
}
