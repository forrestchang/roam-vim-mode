// src/constants.js
var EXTENSION_ID = "roam-vim-mode";
var BLUR_PIXEL_ID = `${EXTENSION_ID}--unfocus-pixel`;
var SELECTED_BLOCK_CSS_CLASS = `${EXTENSION_ID}--highlight`;
var HINT_CSS_CLASS = `${EXTENSION_ID}--hint`;
var PANEL_CSS_CLASS = `${EXTENSION_ID}--panel`;
var PANEL_SELECTOR = `.${PANEL_CSS_CLASS}`;
var HELP_PANEL_ID = `${EXTENSION_ID}--help-panel`;
var PAGE_HINT_CSS_CLASS = `${EXTENSION_ID}--page-hint`;
var PAGE_HINT_OVERLAY_ID = `${EXTENSION_ID}--page-hint-overlay`;
var MODE_INDICATOR_ID = `${EXTENSION_ID}--mode-indicator`;
var SEARCH_INPUT_ID = `${EXTENSION_ID}--search-input`;
var SEARCH_HIGHLIGHT_NAME = "roam-vim-search";
var SEARCH_CURRENT_HIGHLIGHT_NAME = "roam-vim-search-current";
var Selectors = {
  link: ".rm-page-ref",
  hiddenSection: ".rm-block__part--equals",
  block: ".roam-block",
  blockInput: ".rm-block-input",
  blockContainer: ".roam-block-container",
  blockReference: ".rm-block-ref",
  blockBulletView: ".block-bullet-view",
  title: ".rm-title-display",
  // Roam's React root. Synthetic events must be dispatched inside this subtree:
  // React attaches its listeners to the root container, so an event dispatched
  // on `document.body` bubbles to `html`/`document` and never reaches Roam.
  appRoot: "#app",
  main: ".roam-main",
  mainContent: ".roam-article",
  mainBody: ".roam-body-main",
  sidebarContent: ".sidebar-content",
  sidebarPage: ".sidebar-content > div > div",
  sidebar: "#right-sidebar",
  sidebarScrollContainer: "#roam-right-sidebar-content",
  leftPanel: ".roam-sidebar-container",
  topBar: ".rm-topbar",
  foldButton: ".rm-caret",
  highlight: ".block-highlight-blue",
  button: ".bp3-button",
  closeButton: ".bp3-icon-cross",
  dailyNotes: "#rm-log-container",
  viewMore: ".roam-log-preview",
  checkbox: ".check-container",
  externalLink: "a",
  referenceItem: ".rm-reference-item",
  inlineReference: ".rm-inline-reference",
  referenceFootnote: ".rm-block__ref-count-footnote",
  zoomPath: ".rm-zoom-path",
  zoomItemContent: ".rm-zoom-item-content",
  breadcrumbsContainer: ".zoom-mentions-view",
  pageReferenceItem: ".rm-ref-page-view",
  pageReferenceLink: ".rm-ref-page-view-title a span",
  filterButton: ".bp3-icon.bp3-icon-filter",
  commandBar: ".bp3-omnibar",
  // CodeMirror 5 (`.CodeMirror`) and 6 (`.cm-editor`) roots. Roam renders code
  // blocks with CodeMirror, which owns the keyboard while focused.
  codeEditor: ".CodeMirror, .cm-editor",
  /**
   * Roam UI that owns Escape itself — but only while it actually has focus.
   *
   * Presence alone proves nothing: a running Roam keeps ~6 `.bp3-overlay` and
   * ~4 `.bp3-overlay-open` elements mounted at all times. Testing for either
   * was true permanently, so every Escape was handed to Roam and returning to
   * normal mode in one press was impossible. Always pair this with a
   * `document.activeElement.closest(...)` check.
   */
  roamModal: ".bp3-omnibar, .bp3-dialog, .bp3-overlay-open",
  blueprintOverlay: ".bp3-overlay-open",
  modalBackdrop: ".bp3-overlay-backdrop",
  escapeHtmlId
};
function escapeHtmlId(htmlId) {
  if (typeof htmlId !== "string")
    return "";
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(htmlId);
  }
  return htmlId.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}
var BLOCK_ID_PREFIX = "block-input-";
var UID_LENGTH = 9;
var HINT_IDS = [0, 1, 2, 3, 4, 5];
var DEFAULT_HINT_KEYS = ["q", "w", "e", "r", "t", "b"];
var HINT_CHARS = "asdfghjkl";
var SCROLL_PADDING = 50;
var SEQUENCE_TIMEOUT_MS = 500;
var BLOCK_ACTIVATION_TIMEOUT_MS = 1e3;
var SEARCH_MAX_MATCHES = 500;
var WHICH_KEY_PANEL_ID = `${EXTENSION_ID}--which-key`;
var WHICH_KEY_DELAY = 400;

// src/utils.js
function delay(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}
async function repeatAsync(n, callbackFn) {
  for (let i = 0; i < n; i++) {
    await callbackFn();
  }
}
function assumeExists(x, errorMessage = "Assumed that variable exists, but it does not") {
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
  const platform = window.navigator.userAgentData?.platform || window.navigator.platform || "";
  return /mac/i.test(platform);
}
function commandModifier() {
  return isMacOS() ? { metaKey: true } : { ctrlKey: true };
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
  return void 0;
}
function injectStyle(css, tagId) {
  if (document.getElementById(tagId)) {
    document.getElementById(tagId).innerHTML = css;
    return;
  }
  const style = document.createElement("style");
  style.id = tagId;
  style.innerHTML = css;
  document.getElementsByTagName("head")[0].appendChild(style);
}
function removeStyle(tagId) {
  const style = document.getElementById(tagId);
  if (style) {
    style.remove();
  }
}
function getActiveEditElement() {
  let element = document.activeElement;
  while (element?.shadowRoot) {
    if (element.shadowRoot.activeElement) {
      element = element.shadowRoot.activeElement;
    } else {
      const subElement = element.shadowRoot.querySelector("input, textarea, select");
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
  if (!element)
    return false;
  const tagName = element.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  return element.isContentEditable === true;
}
function getInputEvent() {
  return new Event("input", {
    bubbles: true,
    cancelable: true
  });
}
function isElementVisible(element) {
  if (!element) {
    return false;
  }
  const { top, left, bottom, right, width, height } = element.getBoundingClientRect();
  if (width <= 0 || height <= 0) {
    return false;
  }
  return bottom > 0 && right > 0 && top < window.innerHeight && left < window.innerWidth;
}
function isElementFullyVisible(element) {
  if (!element) {
    return false;
  }
  const { top, left, bottom, right, width, height } = element.getBoundingClientRect();
  return width > 0 && height > 0 && top >= 0 && left >= 0 && bottom <= window.innerHeight && right <= window.innerWidth;
}
var SYNTHETIC_KEY_FLAG = "__roamVimModeSynthetic";
var NAMED_KEY_CODES = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Escape: 27,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40
};
function keyDescriptor(key) {
  const namedCode = NAMED_KEY_CODES[key];
  if (namedCode) {
    return { key, code: key, keyCode: namedCode, which: namedCode };
  }
  if (key.length === 1) {
    const upper = key.toUpperCase();
    const keyCode = upper.charCodeAt(0);
    return {
      key,
      code: /[a-z]/i.test(key) ? `Key${upper}` : void 0,
      keyCode,
      which: keyCode
    };
  }
  return { key };
}
function getKeyboardEvent(type, init) {
  const event = new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    ...init
  });
  event[SYNTHETIC_KEY_FLAG] = true;
  return event;
}
function keyEventTarget() {
  const active = document?.activeElement;
  if (active && active !== document.body) {
    return active;
  }
  return document?.querySelector(Selectors.appRoot) ?? document?.body ?? null;
}
var Keyboard = {
  BASE_DELAY: 20,
  /**
   * Dispatch a keydown/keyup pair for `key`.
   * @param {string} key a `KeyboardEvent.key` value, e.g. 'Enter' or 'z'
   * @param {{target?: Element}} [opts] extra event init; `target` overrides where it lands
   */
  async press(key, opts = {}, delayOverride = 0) {
    const { target, ...eventInit } = opts;
    const node = target ?? keyEventTarget();
    if (!node)
      return;
    const init = { ...keyDescriptor(key), ...eventInit };
    ["keydown", "keyup"].forEach(
      (eventType) => node.dispatchEvent(getKeyboardEvent(eventType, init))
    );
    return delay(delayOverride || this.BASE_DELAY);
  },
  async pressEnter(delayOverride = 0) {
    return this.press("Enter", {}, delayOverride);
  },
  async pressEsc(delayOverride = 0) {
    return this.press("Escape", {}, delayOverride);
  },
  async pressBackspace(delayOverride = 0) {
    return this.press("Backspace", {}, delayOverride);
  },
  async pressArrow(direction, opts = {}, delayOverride = 0) {
    return this.press(direction === "up" ? "ArrowUp" : "ArrowDown", opts, delayOverride);
  },
  /**
   * Send a "command key" combo using the right modifier for the platform:
   * Cmd on macOS, Ctrl everywhere else.
   */
  async simulateKeyCombo(key, opts = {}, delayOverride = 0) {
    return this.press(key, { ...commandModifier(), ...opts }, delayOverride);
  }
};
var POINTER_EVENT_TYPES = /* @__PURE__ */ new Set(["pointerdown", "pointerup", "pointermove", "pointerover"]);
function getMouseEvent(type, buttons, modifiers = {}) {
  const init = {
    shiftKey: modifiers.shiftKey || false,
    metaKey: modifiers.metaKey || false,
    ctrlKey: modifiers.ctrlKey || false,
    view: typeof window !== "undefined" ? window : void 0,
    bubbles: true,
    cancelable: true,
    composed: true,
    buttons,
    button: 0,
    detail: 1
  };
  if (POINTER_EVENT_TYPES.has(type) && typeof PointerEvent === "function") {
    return new PointerEvent(type, { ...init, pointerType: "mouse", isPrimary: true });
  }
  return new MouseEvent(type, init);
}
var CLICK_SEQUENCE = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
var Mouse = {
  BASE_DELAY: 20,
  simulateClick(buttons, element, modifiers = {}, delayOverride = 0) {
    if (!element)
      return delay(0);
    CLICK_SEQUENCE.forEach((type) => {
      element.dispatchEvent(getMouseEvent(type, buttons, modifiers));
    });
    return delay(delayOverride || this.BASE_DELAY);
  },
  hover(element, delayOverride = 0) {
    if (!element)
      return delay(0);
    ["pointerover", "mouseover", "pointermove", "mousemove"].forEach((type) => {
      element.dispatchEvent(getMouseEvent(type, 0));
    });
    return delay(delayOverride || this.BASE_DELAY);
  },
  leftClick(element, modifiers = {}, additionalDelay = 0) {
    return this.simulateClick(1, element, modifiers, additionalDelay);
  }
};
function observeElement(observeInside, handleChange, observeChildren = false, observeAttributes = false) {
  const waitForLoad = new MutationObserver((mutations) => {
    handleChange(mutations[mutations.length - 1]?.target ?? observeInside, mutations);
  });
  waitForLoad.observe(observeInside, {
    childList: true,
    attributes: observeAttributes,
    subtree: observeChildren
  });
  return () => waitForLoad.disconnect();
}
function onSelectorChange(selector, handleChange, observeChildren = false, observeAttributes = false) {
  const element = document.querySelector(selector);
  if (!element)
    return () => {
    };
  return observeElement(element, handleChange, observeChildren, observeAttributes);
}
function waitForSelectorToExist(selector, observeInside = document.body, options) {
  return waitForSelectionToExist((element) => element.querySelector(selector), observeInside, options);
}
function waitForSelectionToExist(selectionFn, observeInside = document.body, options = {}) {
  const { timeout = 0, signal } = options;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    let disconnect = () => {
    };
    let timeoutId = null;
    const cleanup = () => {
      disconnect();
      if (timeoutId !== null)
        clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    };
    function onAbort() {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    }
    const resolveIfElementExists = () => {
      const element = selectionFn(observeInside);
      if (element) {
        cleanup();
        resolve(element);
        return true;
      }
      return false;
    };
    if (resolveIfElementExists())
      return;
    signal?.addEventListener("abort", onAbort, { once: true });
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out after ${timeout}ms waiting for element`));
      }, timeout);
    }
    disconnect = observeElement(observeInside, resolveIfElementExists, true);
  });
}

// src/logger.js
var MAX_ENTRIES = 2e3;
var PREFIX = "[Roam Vim Mode]";
var LOG_FILE_NAME = "roam-vim-mode-log.txt";
var entries = [];
var startedAt = Date.now();
function describe(value, depth = 0) {
  if (value === null)
    return "null";
  if (value === void 0)
    return "undefined";
  const type = typeof value;
  if (type === "string")
    return depth === 0 ? value : JSON.stringify(value);
  if (type === "number" || type === "boolean")
    return String(value);
  if (type === "function")
    return `fn ${value.name || "(anonymous)"}`;
  if (type === "symbol")
    return value.toString();
  if (value instanceof Error) {
    return `${value.name}: ${value.message}
${value.stack ?? ""}`;
  }
  if (typeof Element !== "undefined" && value instanceof Element) {
    const id = value.id ? `#${value.id}` : "";
    const cls = value.classList?.length ? `.${[...value.classList].join(".")}` : "";
    return `<${value.tagName.toLowerCase()}${id}${cls}>`;
  }
  if (Array.isArray(value)) {
    if (depth > 2)
      return `[\u2026${value.length}]`;
    return `[${value.slice(0, 20).map((v) => describe(v, depth + 1)).join(", ")}]`;
  }
  if (depth > 2)
    return "{\u2026}";
  try {
    const parts = Object.entries(value).map(([k, v]) => `${k}: ${describe(v, depth + 1)}`);
    return `{ ${parts.join(", ")} }`;
  } catch {
    return String(value);
  }
}
function record(level, category, message, data) {
  entries.push({
    t: Date.now() - startedAt,
    level,
    category,
    message,
    data: data === void 0 ? null : describe(data, 1)
  });
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
  if (isVerbose() || level === "error") {
    const method = level === "error" ? "warn" : "log";
    console[method](`${PREFIX} [${category}] ${message}`, data ?? "");
  }
}
function isVerbose() {
  return typeof window !== "undefined" && (window.roamVimMode?.verbose === true || window.__roamVimDebug === true);
}
function debugLog(category, message, data) {
  record("debug", category, message, data);
}
function logError(category, message, error) {
  record("error", category, message, error);
}
function warnFallback(what, error) {
  record("error", "fallback", what, error);
}
function getLog() {
  const header = [
    `Roam Vim Mode log`,
    `entries: ${entries.length}${entries.length === MAX_ENTRIES ? " (truncated to newest)" : ""}`,
    `userAgent: ${typeof navigator !== "undefined" ? navigator.userAgent : "n/a"}`,
    ""
  ];
  const body = entries.map(({ t, level, category, message, data }) => {
    const stamp = String(t).padStart(7, " ");
    const line = `${stamp}ms ${level.toUpperCase().padEnd(5)} [${category}] ${message}`;
    return data ? `${line}
${" ".repeat(10)}${data.replace(/\n/g, `
${" ".repeat(10)}`)}` : line;
  });
  return [...header, ...body].join("\n");
}
function clearLog() {
  entries.length = 0;
  return "cleared";
}
function downloadLog(fileName = LOG_FILE_NAME) {
  const blob = new Blob([getLog()], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
  return `saved ${fileName} (${entries.length} entries)`;
}
async function copyLog() {
  try {
    await navigator.clipboard.writeText(getLog());
    return `copied ${entries.length} entries to the clipboard`;
  } catch (error) {
    console.warn(`${PREFIX} clipboard write failed; printing instead`, error);
    console.log(getLog());
    return "clipboard unavailable \u2014 the log was printed above";
  }
}
var PROBED_SELECTORS = {
  appRoot: Selectors.appRoot,
  roamBlock: Selectors.block,
  blockInput: Selectors.blockInput,
  mainContent: Selectors.mainContent,
  panel: ".roam-vim-mode--panel",
  omnibar: Selectors.commandBar,
  // Note: these two are non-zero in an idle Roam (~6 and ~4). Presence says
  // nothing about whether a modal is really up — see `Selectors.roamModal`.
  overlayAny: ".bp3-overlay",
  overlayOpen: Selectors.blueprintOverlay,
  modalBackdrop: Selectors.modalBackdrop,
  blockHighlight: Selectors.highlight,
  codeMirror5: ".CodeMirror",
  codeMirror6: ".cm-editor"
};
function diagnose() {
  const api = typeof window !== "undefined" ? window.roamAlphaAPI : null;
  const counts = {};
  for (const [name, selector] of Object.entries(PROBED_SELECTORS)) {
    counts[name] = document.querySelectorAll(selector).length;
  }
  const sample = document.querySelector(Selectors.blockInput) ?? document.querySelector(Selectors.block);
  const sampleId = sample?.id ?? null;
  const report = {
    api: {
      present: !!api,
      "data.block": !!api?.data?.block,
      "data.undo": typeof api?.data?.undo,
      pull: typeof api?.pull,
      "ui.getFocusedBlock": typeof api?.ui?.getFocusedBlock,
      "ui.setBlockFocusAndSelection": typeof api?.ui?.setBlockFocusAndSelection,
      "util.generateUID": typeof api?.util?.generateUID,
      legacyCreateBlock: typeof api?.createBlock
    },
    selectorCounts: counts,
    sampleBlockId: sampleId,
    activeElement: document.activeElement ? describe(document.activeElement, 1) : null,
    activeIsContentEditable: document.activeElement?.isContentEditable ?? null,
    activeIsInsideRoamModal: !!document.activeElement?.closest?.(Selectors.roamModal)
  };
  if (sampleId) {
    const uid = sampleId.startsWith("block-input-") ? sampleId.slice(-9) : null;
    report.parsedUid = uid;
    if (uid && api?.pull) {
      try {
        report.pullRoundTrip = api.pull(
          "[:block/uid :block/string :block/order {:block/_children [:block/uid]}]",
          [":block/uid", uid]
        );
      } catch (error) {
        report.pullRoundTrip = `threw: ${error.message}`;
      }
    }
  }
  debugLog("diagnose", "environment probe", report);
  return report;
}
function installConsoleApi(extra = {}) {
  if (typeof window === "undefined")
    return;
  window.roamVimMode = {
    verbose: window.roamVimMode?.verbose ?? false,
    logs: getLog,
    print: () => console.log(getLog()),
    download: downloadLog,
    copy: copyLog,
    clear: clearLog,
    diagnose,
    ...extra
  };
  console.log(
    `${PREFIX} debug tools ready \u2014 roamVimMode.download() / .copy() / .diagnose() / .verbose = true`
  );
}
function removeConsoleApi() {
  if (typeof window !== "undefined") {
    delete window.roamVimMode;
  }
}

// src/roam-api.js
function getRoamAlphaAPI() {
  return typeof window !== "undefined" && window.roamAlphaAPI || null;
}
function isApiAvailable() {
  return !!getRoamAlphaAPI();
}
function blockOp(modernName, legacyName) {
  const api = getRoamAlphaAPI();
  if (!api)
    return null;
  const modern = api.data?.block?.[modernName];
  if (typeof modern === "function")
    return modern.bind(api.data.block);
  const legacy = api[legacyName];
  if (typeof legacy === "function")
    return legacy.bind(api);
  return null;
}
function parseBlockElementId(htmlId) {
  if (typeof htmlId !== "string" || !htmlId.startsWith(BLOCK_ID_PREFIX)) {
    return null;
  }
  const rest = htmlId.slice(BLOCK_ID_PREFIX.length);
  if (rest.length < UID_LENGTH + 2)
    return null;
  const uid = rest.slice(-UID_LENGTH);
  const windowId = rest.slice(0, -(UID_LENGTH + 1));
  if (!windowId || !uid)
    return null;
  return { windowId, uid };
}
function toHtmlId(elementOrId) {
  if (!elementOrId)
    return null;
  return typeof elementOrId === "string" ? elementOrId : elementOrId.id;
}
function getBlockUid(elementOrId) {
  return parseBlockElementId(toHtmlId(elementOrId))?.uid ?? null;
}
function getWindowId(elementOrId) {
  return parseBlockElementId(toHtmlId(elementOrId))?.windowId ?? null;
}
var BLOCK_PULL_PATTERN = "[:block/uid :block/string :block/order :block/open {:block/children [:block/uid]} {:block/_children [:block/uid]}]";
function pullBlock(uid) {
  const api = getRoamAlphaAPI();
  if (!api?.pull || !uid)
    return null;
  try {
    const result = api.pull(BLOCK_PULL_PATTERN, [":block/uid", uid]);
    if (!result)
      return null;
    const reverse = result[":block/_children"];
    const parent = Array.isArray(reverse) ? reverse[0] : reverse;
    return {
      uid: result[":block/uid"],
      string: result[":block/string"] ?? "",
      order: result[":block/order"] ?? 0,
      // `:block/open` is absent for blocks that were never collapsed.
      open: result[":block/open"] !== false,
      parentUid: parent?.[":block/uid"] ?? null,
      childCount: result[":block/children"]?.length ?? 0
    };
  } catch (error) {
    console.warn("[Roam Vim Mode] pull failed for block", uid, error);
    return null;
  }
}
function getFocusedBlock() {
  const api = getRoamAlphaAPI();
  const focused = api?.ui?.getFocusedBlock?.();
  if (!focused)
    return null;
  return {
    uid: focused["block-uid"],
    windowId: focused["window-id"]
  };
}
function generateUid() {
  return getRoamAlphaAPI()?.util?.generateUID?.() ?? null;
}
async function createBlock({ parentUid, order = 0, string = "", uid }) {
  const create = blockOp("create", "createBlock");
  if (!create || !parentUid)
    return null;
  const newUid = uid || generateUid();
  await create({
    location: { "parent-uid": parentUid, order },
    block: newUid ? { string, uid: newUid } : { string }
  });
  return newUid;
}
async function updateBlock({ uid, string, open }) {
  const update = blockOp("update", "updateBlock");
  if (!update || !uid)
    return false;
  const block = { uid };
  if (typeof string === "string")
    block.string = string;
  if (typeof open === "boolean")
    block.open = open;
  await update({ block });
  return true;
}
async function deleteBlock(uid) {
  const remove = blockOp("delete", "deleteBlock");
  if (!remove || !uid)
    return false;
  await remove({ block: { uid } });
  return true;
}
async function moveBlock({ uid, parentUid, order }) {
  const move = blockOp("move", "moveBlock");
  if (!move || !uid || !parentUid)
    return false;
  await move({
    location: { "parent-uid": parentUid, order },
    block: { uid }
  });
  return true;
}
async function focusBlock({ uid, windowId, start, end } = {}) {
  const api = getRoamAlphaAPI();
  if (!api?.ui?.setBlockFocusAndSelection)
    return false;
  const args = {};
  if (uid) {
    args.location = { "block-uid": uid, "window-id": windowId || "main-window" };
  }
  if (typeof start === "number") {
    args.selection = typeof end === "number" ? { start, end } : { start };
  }
  try {
    await api.ui.setBlockFocusAndSelection(args);
    return true;
  } catch (error) {
    console.warn("[Roam Vim Mode] setBlockFocusAndSelection failed", error);
    return false;
  }
}
async function undo() {
  const fn = getRoamAlphaAPI()?.data?.undo;
  if (typeof fn !== "function")
    return false;
  await fn();
  return true;
}
async function redo() {
  const fn = getRoamAlphaAPI()?.data?.redo;
  if (typeof fn !== "function")
    return false;
  await fn();
  return true;
}

// src/roam.js
var Selection = class {
  constructor(start = 0, end = 0) {
    this.start = start;
    this.end = end;
  }
};
var RoamNode = class _RoamNode {
  constructor(text, selection = new Selection(0, 0)) {
    this.text = text;
    this.selection = selection;
  }
  withCursorAtTheStart() {
    return this.withSelection(new Selection(0, 0));
  }
  withCursorAtTheEnd() {
    return this.withSelection(new Selection(this.text.length, this.text.length));
  }
  withSelection(selection) {
    return new _RoamNode(this.text, selection);
  }
};
function nearestFoldButton(element) {
  let current = element;
  while (current && current !== document.body) {
    const foldButton = current.querySelector?.(Selectors.foldButton);
    if (foldButton) {
      return foldButton;
    }
    current = current.parentElement;
  }
  return null;
}
var Roam = {
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
    if (element?.tagName.toLocaleLowerCase() !== "textarea") {
      return null;
    }
    return element;
  },
  getActiveRoamNode() {
    const element = this.getRoamBlockInput();
    if (!element)
      return null;
    return new RoamNode(element.value, new Selection(element.selectionStart, element.selectionEnd));
  },
  async applyToCurrent(action) {
    const node = this.getActiveRoamNode();
    if (!node)
      return;
    await this.save(action(node));
  },
  /**
   * Read a block's text without having to focus it.
   *
   * Falls back to activating the block and reading the textarea only when the
   * official API is unavailable — activating has the nasty side effect of
   * dropping the user into INSERT mode.
   */
  async getBlockText(element) {
    const uid = getBlockUid(element);
    const block = uid ? pullBlock(uid) : null;
    if (block) {
      return block.string;
    }
    await this.activateBlock(element);
    return this.getRoamBlockInput()?.value ?? "";
  },
  /**
   * Poll until Roam has swapped in the editing textarea.
   *
   * Replaces the old "click and hope 20ms was enough" timing assumption, which
   * made `i` / `a` / `o` silently do nothing on a slow render.
   */
  async waitForBlockInput(uid, timeout = BLOCK_ACTIVATION_TIMEOUT_MS) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const input = this.getRoamBlockInput();
      if (input && (!uid || input.id.endsWith(uid))) {
        return input;
      }
      await delay(16);
    }
    return this.getRoamBlockInput();
  },
  /**
   * Put the block into edit mode, optionally placing the cursor.
   * @returns {Promise<HTMLTextAreaElement|null>} the focused textarea
   */
  async activateBlock(element, { start, end } = {}) {
    if (!element)
      return null;
    const uid = getBlockUid(element);
    if (uid && isApiAvailable()) {
      const focused = await focusBlock({
        uid,
        windowId: getWindowId(element),
        start,
        end
      });
      if (focused) {
        const input = await this.waitForBlockInput(uid);
        if (input)
          return input;
      }
    }
    if (element.classList.contains("roam-block")) {
      await Mouse.leftClick(element);
    }
    return this.waitForBlockInput(uid);
  },
  /**
   * Turn the focused block into Roam's blue block-selection (VISUAL mode).
   * @returns {Promise<boolean>} whether we ended up inside a block
   */
  async highlight(element) {
    if (element) {
      await this.activateBlock(element);
    }
    if (!this.getRoamBlockInput()) {
      return false;
    }
    await Keyboard.pressEsc();
    return true;
  },
  async deleteBlock(element) {
    try {
      const uid = getBlockUid(element);
      if (uid && await deleteBlock(uid)) {
        debugLog("roam", "deleteBlock via API", { uid });
        return true;
      }
    } catch (error) {
      warnFallback("deleteBlock via roamAlphaAPI failed", error);
    }
    if (await this.highlight(element)) {
      await Keyboard.pressBackspace();
      return true;
    }
    return false;
  },
  async moveCursorToStart() {
    const focused = getFocusedBlock();
    if (focused && await focusBlock({ ...focused, start: 0 })) {
      return;
    }
    await this.applyToCurrent((node) => node.withCursorAtTheStart());
  },
  async moveCursorToEnd() {
    const focused = getFocusedBlock();
    if (focused && await focusBlock(focused)) {
      return;
    }
    await this.applyToCurrent((node) => node.withCursorAtTheEnd());
  },
  /**
   * Create an empty block below `element` and focus it (vim's `o`).
   *
   * Mirrors Roam's own Enter-at-end rule: a block that has children and is
   * expanded gets a new *first child*, anything else gets a sibling directly
   * below. Doing this through the API rather than by simulating Enter means the
   * result doesn't depend on Roam's keyboard handling or on render timing.
   *
   * @returns {Promise<string|null>} the new block's uid
   */
  async createBlockBelow(element) {
    try {
      const uid = getBlockUid(element);
      const block = uid ? pullBlock(uid) : null;
      debugLog("roam", "createBlockBelow: resolved block", { uid, block });
      if (block) {
        const nestIntoChildren = block.open && block.childCount > 0;
        const parentUid = nestIntoChildren ? block.uid : block.parentUid;
        const order = nestIntoChildren ? 0 : block.order + 1;
        if (parentUid) {
          const newUid = await createBlock({ parentUid, order });
          debugLog("roam", "createBlockBelow: created via API", { newUid, parentUid, order, nestIntoChildren });
          if (newUid) {
            await focusBlock({ uid: newUid, windowId: getWindowId(element) });
            return newUid;
          }
        }
      }
    } catch (error) {
      warnFallback("createBlockBelow via roamAlphaAPI failed", error);
    }
    debugLog("roam", "createBlockBelow: using Enter fallback");
    await this.activateBlock(element);
    await this.moveCursorToEnd();
    await Keyboard.pressEnter();
    return null;
  },
  /**
   * Create an empty block above `element` and focus it (vim's `O`).
   * Always a sibling — there is no "above" inside the children list.
   *
   * @returns {Promise<string|null>} the new block's uid
   */
  async createBlockAbove(element) {
    try {
      const uid = getBlockUid(element);
      const block = uid ? pullBlock(uid) : null;
      debugLog("roam", "createBlockAbove: resolved block", { uid, block });
      if (block?.parentUid) {
        const newUid = await createBlock({
          parentUid: block.parentUid,
          order: block.order
        });
        if (newUid) {
          await focusBlock({ uid: newUid, windowId: getWindowId(element) });
          return newUid;
        }
      }
    } catch (error) {
      warnFallback("createBlockAbove via roamAlphaAPI failed", error);
    }
    debugLog("roam", "createBlockAbove: using Enter fallback");
    await this.activateBlock(element, { start: 0 });
    await Keyboard.pressEnter();
    return null;
  },
  async toggleFoldBlock(block) {
    try {
      const uid = getBlockUid(block);
      const pulled = uid ? pullBlock(uid) : null;
      if (pulled && await updateBlock({ uid, open: !pulled.open })) {
        debugLog("roam", "toggleFoldBlock via API", { uid, open: !pulled.open });
        return true;
      }
    } catch (error) {
      warnFallback("toggleFoldBlock via roamAlphaAPI failed", error);
    }
    const foldButton = nearestFoldButton(block);
    if (!foldButton) {
      return false;
    }
    await Mouse.hover(foldButton);
    await Mouse.leftClick(foldButton);
    return true;
  },
  async undo() {
    if (await undo())
      return true;
    await Keyboard.simulateKeyCombo("z");
    return false;
  },
  async redo() {
    if (await redo())
      return true;
    await Keyboard.simulateKeyCombo("z", { shiftKey: true });
    return false;
  }
};
function copyBlockReference(htmlBlockId) {
  const uid = getBlockUid(htmlBlockId);
  if (!uid)
    return Promise.resolve(false);
  return writeToClipboard(`((${uid}))`);
}
function copyBlockEmbed(htmlBlockId) {
  const uid = getBlockUid(htmlBlockId);
  if (!uid)
    return Promise.resolve(false);
  return writeToClipboard(`{{embed: ((${uid}))}}`);
}
async function writeToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("[Roam Vim Mode] Could not write to clipboard", error);
    return false;
  }
}
var RoamEvent = {
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
      if (element.classList?.contains("rm-block-input")) {
        handler(element);
      }
    };
    document.addEventListener("focusin", handleBlockEvent);
    return () => document.removeEventListener("focusin", handleBlockEvent);
  },
  onBlurBlock(handler) {
    const handleBlockEvent = (event) => {
      const element = event.target;
      if (!element.classList?.contains("rm-block-input"))
        return;
      const container = element.closest(Selectors.blockContainer);
      if (!container) {
        handler(null);
        return;
      }
      const selector = `${Selectors.block}#${Selectors.escapeHtmlId(element.id)}`;
      waitForSelectorToExist(selector, container, { timeout: BLOCK_ACTIVATION_TIMEOUT_MS }).then(handler).catch(() => handler(null));
    };
    document.addEventListener("focusout", handleBlockEvent);
    return () => document.removeEventListener("focusout", handleBlockEvent);
  },
  onChangePage(handler) {
    let stopObservingContent = () => {
    };
    const reobserveContent = () => {
      stopObservingContent();
      stopObservingContent = onSelectorChange(Selectors.mainContent, handler);
    };
    let stopObservingMain = () => {
    };
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
  }
};
var RoamHighlight = {
  highlightedBlocks() {
    return document.querySelectorAll(`${Selectors.highlight} ${Selectors.block}`);
  },
  /** @returns {Element|null} */
  first() {
    return this.highlightedBlocks()[0] ?? null;
  },
  /** @returns {Element|null} */
  last() {
    const blocks = this.highlightedBlocks();
    return blocks[blocks.length - 1] ?? null;
  }
};

// src/panel.js
var panelState = {
  /** @type {Element[]} main panel first, then sidebar panels in visual order. */
  panelOrder: [],
  /** @type {Map<Element, VimRoamPanel>} */
  panels: /* @__PURE__ */ new Map(),
  focusedPanel: 0
};
var RoamBlock = class _RoamBlock {
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
    return new _RoamBlock(assumeExists(document.getElementById(blockId), `No block with id ${blockId}`));
  }
  static selected() {
    return VimRoamPanel.selected().selectedBlock();
  }
};
var VimRoamPanel = class _VimRoamPanel {
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
      throw new Error("This panel has no blocks to select");
    }
    return RoamBlock.get(blockId);
  }
  /** @param {{scroll?: boolean}} [options] */
  selectBlock(blockId, { scroll = true } = {}) {
    if (!blockId)
      return;
    const index = this.indexOf(blockId);
    if (index === -1)
      return;
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
    if (!blockId)
      return;
    this.selectBlock(this.relativeBlockId(blockId, blocksToJump));
  }
  selectFirstBlock() {
    const first = this.firstBlock();
    if (!first)
      return;
    this.element.scrollTop = 0;
    this.selectBlock(first.id);
  }
  selectLastBlock() {
    const last = this.lastBlock();
    if (last)
      this.selectBlock(last.id);
  }
  selectLastVisibleBlock() {
    const last = this.lastVisibleBlock();
    if (last)
      this.selectBlock(last.id);
  }
  selectFirstVisibleBlock() {
    const first = this.firstVisibleBlock();
    if (first)
      this.selectBlock(first.id);
  }
  scrollUntilBlockIsVisible(block) {
    block?.scrollIntoView({ block: "nearest", behavior: "instant" });
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
      _VimRoamPanel.updateSidePanels();
      const retryIndex = panelState.panelOrder.indexOf(this.element);
      if (retryIndex === -1)
        return;
      panelState.focusedPanel = retryIndex;
    } else {
      panelState.focusedPanel = index;
    }
    this.element.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  /** @returns {VimRoamPanel} @throws if no panel is currently mounted */
  static selected() {
    if (panelState.panelOrder.length === 0) {
      _VimRoamPanel.updateSidePanels();
    }
    const element = panelState.panelOrder[clamp(panelState.focusedPanel, 0, panelState.panelOrder.length - 1)];
    return _VimRoamPanel.get(assumeExists(element, "No Roam panel is currently mounted"));
  }
  static fromBlock(blockElement) {
    let panelElement = blockElement.closest(PANEL_SELECTOR);
    if (!panelElement) {
      _VimRoamPanel.updateSidePanels();
      panelElement = blockElement.closest(PANEL_SELECTOR);
    }
    return panelElement ? _VimRoamPanel.get(panelElement) : null;
  }
  static at(panelIndex) {
    if (panelState.panelOrder.length === 0)
      return null;
    const element = panelState.panelOrder[clamp(panelIndex, 0, panelState.panelOrder.length - 1)];
    return element ? _VimRoamPanel.get(element) : null;
  }
  static mainPanel() {
    return _VimRoamPanel.at(0);
  }
  static previousPanel() {
    return _VimRoamPanel.at(panelState.focusedPanel - 1);
  }
  static nextPanel() {
    return _VimRoamPanel.at(panelState.focusedPanel + 1);
  }
  static updateSidePanels() {
    tagPanels();
    panelState.panelOrder = Array.from(document.querySelectorAll(PANEL_SELECTOR));
    const previous = panelState.panels;
    panelState.panels = new Map(
      panelState.panelOrder.map((el) => [el, previous.get(el) ?? new _VimRoamPanel(el)])
    );
    panelState.focusedPanel = clamp(
      panelState.focusedPanel,
      0,
      Math.max(0, panelState.panelOrder.length - 1)
    );
    debugLog("panel", `${panelState.panelOrder.length} panel(s), focused #${panelState.focusedPanel}`);
  }
  /** @param {Element} panelElement */
  static get(panelElement) {
    assumeExists(panelElement, "Cannot get a panel without an element");
    let panel = panelState.panels.get(panelElement);
    if (!panel) {
      panel = new _VimRoamPanel(panelElement);
      panelState.panels.set(panelElement, panel);
    }
    return panel;
  }
  static reset() {
    panelState.panelOrder = [];
    panelState.panels = /* @__PURE__ */ new Map();
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
    if (!block)
      return;
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
};
function blockScrollOverflow(block) {
  const { top, height, width } = block.getBoundingClientRect();
  const bottom = top + height;
  const scale = block.offsetWidth ? width / block.offsetWidth : 1;
  const scaledPadding = scale * SCROLL_PADDING;
  const panel = block.closest(PANEL_SELECTOR);
  if (!panel)
    return 0;
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
  document.querySelectorAll(DEFAULT_SCROLL_PANELS).forEach((el) => {
    el.classList.add(PANEL_CSS_CLASS);
  });
}

// src/view.js
function hintCssClass(n) {
  return HINT_CSS_CLASS + n;
}
var HINT_CSS_CLASSES = HINT_IDS.map(hintCssClass);
function updateVimView() {
  let block;
  try {
    block = RoamBlock.selected().element;
  } catch {
    clearVimView();
    return;
  }
  try {
    clearVimView();
    block.classList.add(SELECTED_BLOCK_CSS_CLASS);
    updateVimHints(block);
  } catch (error) {
    console.warn("[Roam Vim Mode] Failed to update the vim view", error);
  }
}
function clearVimView() {
  document.querySelectorAll(`.${SELECTED_BLOCK_CSS_CLASS}`).forEach((selection) => selection.classList.remove(SELECTED_BLOCK_CSS_CLASS));
  clearVimHints();
}
function viewMoreDailyLogIfPossible() {
  const viewMore = document.querySelector(Selectors.viewMore);
  if (isElementVisible(viewMore)) {
    Mouse.hover(viewMore);
  }
}
function blurEverything() {
  const host = document.querySelector(Selectors.appRoot) ?? document.body;
  let blurPixel = document.getElementById(BLUR_PIXEL_ID);
  if (!blurPixel || blurPixel.parentElement !== host) {
    blurPixel?.remove();
    blurPixel = document.createElement("div");
    blurPixel.id = BLUR_PIXEL_ID;
    host.appendChild(blurPixel);
  }
  document.activeElement?.blur?.();
  return Mouse.leftClick(blurPixel);
}
function updateVimHints(block) {
  const clickableSelectors = [
    Selectors.link,
    Selectors.externalLink,
    Selectors.checkbox,
    Selectors.button,
    Selectors.blockReference,
    Selectors.hiddenSection
  ];
  const links = block.querySelectorAll(clickableSelectors.join(", "));
  const seen = [];
  for (const link of links) {
    if (seen.length >= HINT_IDS.length)
      break;
    if (seen.some((other) => other.contains(link) || link.contains(other)))
      continue;
    seen.push(link);
  }
  seen.forEach((link, i) => {
    link.classList.add(HINT_CSS_CLASS, hintCssClass(i));
  });
}
function clearVimHints() {
  document.querySelectorAll(`.${HINT_CSS_CLASS}`).forEach((hint) => hint.classList.remove(HINT_CSS_CLASS, ...HINT_CSS_CLASSES));
}
function getHint(n) {
  return document.querySelector(`.${hintCssClass(n)}`);
}

// src/mode-events.js
var subscribers = /* @__PURE__ */ new Set();
function subscribeModeChange(handler) {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}
function notifyModeChange() {
  subscribers.forEach((handler) => {
    try {
      handler();
    } catch (error) {
      console.warn("[Roam Vim Mode] mode change subscriber failed", error);
    }
  });
}
function clearModeSubscribers() {
  subscribers.clear();
}

// src/page-hints.js
var pageHintState = {
  active: false,
  hints: [],
  inputBuffer: "",
  scrollHandler: null,
  openInSidebar: false,
  editBlock: false
  // When true, hints target blocks for editing instead of links
};
function generateHintLabels(count) {
  const labels = [];
  const chars = HINT_CHARS.split("");
  const base = chars.length;
  if (count <= base) {
    for (let i = 0; i < count && i < base; i++) {
      labels.push(chars[i]);
    }
  } else {
    for (let i = 0; i < base && labels.length < count; i++) {
      for (let j = 0; j < base && labels.length < count; j++) {
        labels.push(chars[i] + chars[j]);
      }
    }
  }
  return labels;
}
function getClickableElements() {
  const clickableSelectors = [
    Selectors.link,
    // .rm-page-ref - page references and tags
    Selectors.blockReference
    // .rm-block-ref - block references
  ];
  const elements = document.querySelectorAll(clickableSelectors.join(", "));
  const externalLinks = document.querySelectorAll("a[href]");
  const allElements = [...Array.from(elements)];
  externalLinks.forEach((link) => {
    if (link.classList.contains("bp3-button") || link.closest(".bp3-button") || link.classList.contains("bp3-menu-item") || link.closest(".bp3-popover") || link.closest(".rm-topbar") || link.closest(".roam-sidebar-container")) {
      return;
    }
    if (link.classList.contains("rm-page-ref") || link.classList.contains("rm-block-ref")) {
      return;
    }
    allElements.push(link);
  });
  return allElements.filter(isElementFullyVisible);
}
function getBlockElements() {
  return Array.from(document.querySelectorAll(Selectors.block)).filter(isElementFullyVisible);
}
function updateHintPositions() {
  pageHintState.hints.forEach((hint) => {
    if (isElementFullyVisible(hint.element)) {
      const rect = hint.element.getBoundingClientRect();
      hint.hintEl.style.left = `${rect.left}px`;
      hint.hintEl.style.top = `${rect.top}px`;
      hint.hintEl.style.visibility = "visible";
    } else {
      hint.hintEl.style.visibility = "hidden";
    }
  });
}
function addScrollListeners() {
  pageHintState.scrollHandler = () => {
    requestAnimationFrame(updateHintPositions);
  };
  window.addEventListener("scroll", pageHintState.scrollHandler, true);
}
function removeScrollListeners() {
  if (pageHintState.scrollHandler) {
    window.removeEventListener("scroll", pageHintState.scrollHandler, true);
    pageHintState.scrollHandler = null;
  }
}
function showPageHints(options = {}) {
  hidePageHints();
  pageHintState.openInSidebar = options.openInSidebar || false;
  pageHintState.editBlock = options.editBlock || false;
  const elements = pageHintState.editBlock ? getBlockElements() : getClickableElements();
  const labels = generateHintLabels(elements.length);
  const overlay = document.createElement("div");
  overlay.id = PAGE_HINT_OVERLAY_ID;
  document.body.appendChild(overlay);
  pageHintState.hints = [];
  elements.forEach((element, i) => {
    if (i >= labels.length)
      return;
    const rect = element.getBoundingClientRect();
    const label = labels[i];
    const hintEl = document.createElement("span");
    hintEl.className = PAGE_HINT_CSS_CLASS;
    hintEl.textContent = label;
    hintEl.dataset.label = label;
    hintEl.style.left = `${rect.left}px`;
    hintEl.style.top = `${rect.top}px`;
    overlay.appendChild(hintEl);
    pageHintState.hints.push({ element, label, hintEl });
  });
  pageHintState.active = true;
  pageHintState.inputBuffer = "";
  addScrollListeners();
  debugLog("hints", `showing ${pageHintState.hints.length} hints`, {
    editBlock: pageHintState.editBlock,
    openInSidebar: pageHintState.openInSidebar
  });
  notifyModeChange();
  if (pageHintState.hints.length === 0) {
    hidePageHints();
  }
}
function hidePageHints() {
  removeScrollListeners();
  document.getElementById(PAGE_HINT_OVERLAY_ID)?.remove();
  const wasActive = pageHintState.active;
  pageHintState.active = false;
  pageHintState.hints = [];
  pageHintState.inputBuffer = "";
  if (wasActive) {
    notifyModeChange();
  }
}
function renderHintLabels(buffer) {
  let hasMatches = false;
  pageHintState.hints.forEach((hint) => {
    if (!hint.label.startsWith(buffer)) {
      hint.hintEl.style.display = "none";
      return;
    }
    hint.hintEl.style.display = "";
    hint.hintEl.textContent = "";
    if (buffer) {
      const matched = document.createElement("span");
      matched.className = `${PAGE_HINT_CSS_CLASS}--matched`;
      matched.textContent = buffer;
      hint.hintEl.appendChild(matched);
    }
    hint.hintEl.appendChild(document.createTextNode(hint.label.substring(buffer.length)));
    hasMatches = true;
  });
  return hasMatches;
}
function filterPageHints(char) {
  pageHintState.inputBuffer += char.toLowerCase();
  const buffer = pageHintState.inputBuffer;
  const exactMatch = pageHintState.hints.find((h) => h.label === buffer);
  if (exactMatch) {
    const clickOptions = pageHintState.editBlock ? {} : pageHintState.openInSidebar ? { shiftKey: true } : {};
    const target = exactMatch.element;
    hidePageHints();
    Mouse.leftClick(target, clickOptions);
    return true;
  }
  const hasMatches = renderHintLabels(buffer);
  if (!hasMatches) {
    hidePageHints();
  }
  return hasMatches;
}
function backspacePageHints() {
  if (pageHintState.inputBuffer.length === 0)
    return;
  pageHintState.inputBuffer = pageHintState.inputBuffer.slice(0, -1);
  renderHintLabels(pageHintState.inputBuffer);
}
function enterPageHintMode(options = {}) {
  if (typeof options === "boolean") {
    options = { openInSidebar: options };
  }
  showPageHints(options);
}
function enterBlockHintMode() {
  showPageHints({ editBlock: true });
}

// src/search.js
var searchState = {
  active: false,
  query: "",
  /** @type {{range: Range, block: Element}[]} */
  matches: [],
  currentIndex: -1,
  /** Remembered so `n`/`N` keep working after the input is dismissed. */
  lastQuery: "",
  truncated: false
};
var inputListeners = null;
function highlightRegistry() {
  return typeof CSS !== "undefined" && CSS.highlights ? CSS.highlights : null;
}
var warnedAboutHighlightSupport = false;
function warnOnceAboutHighlights() {
  if (warnedAboutHighlightSupport)
    return;
  warnedAboutHighlightSupport = true;
  console.warn(
    "[Roam Vim Mode] CSS Custom Highlight API unavailable; search will navigate between matches without highlighting them."
  );
}
function enterSearchMode() {
  if (searchState.active)
    return;
  searchState.active = true;
  searchState.query = "";
  searchState.matches = [];
  searchState.currentIndex = -1;
  searchState.truncated = false;
  const input = document.createElement("input");
  input.id = SEARCH_INPUT_ID;
  input.type = "text";
  input.placeholder = "/";
  input.autocomplete = "off";
  input.spellcheck = false;
  document.body.appendChild(input);
  const onInput = () => {
    performSearch(input.value);
    if (searchState.matches.length > 0) {
      navigateToMatch(0, { scroll: true });
    }
  };
  const onBlur = () => exitSearchMode(true);
  input.addEventListener("input", onInput);
  input.addEventListener("blur", onBlur);
  inputListeners = { input, onInput, onBlur };
  setTimeout(() => input.focus(), 0);
  debugLog("search", "entered search mode");
  notifyModeChange();
}
function exitSearchMode(clearHighlights = true) {
  if (!searchState.active && !document.getElementById(SEARCH_INPUT_ID)) {
    if (clearHighlights)
      clearSearchHighlights();
    return;
  }
  searchState.active = false;
  if (inputListeners) {
    const { input, onInput, onBlur } = inputListeners;
    input.removeEventListener("input", onInput);
    input.removeEventListener("blur", onBlur);
    inputListeners = null;
  }
  document.getElementById(SEARCH_INPUT_ID)?.remove();
  if (clearHighlights) {
    clearSearchHighlights();
    searchState.matches = [];
    searchState.currentIndex = -1;
  }
  notifyModeChange();
}
function isSearchInputOpen() {
  const open = !!document.getElementById(SEARCH_INPUT_ID);
  if (searchState.active && !open) {
    searchState.active = false;
    notifyModeChange();
  }
  return searchState.active && open;
}
function handleSearchInput(event) {
  const input = document.getElementById(SEARCH_INPUT_ID);
  if (event.key === "Escape") {
    exitSearchMode(true);
    return true;
  }
  if (event.key === "Enter") {
    const value = input?.value ?? searchState.query;
    searchState.lastQuery = value;
    if (value) {
      performSearch(value);
      if (searchState.matches.length > 0) {
        navigateToMatch(0, { scroll: true });
      }
    }
    exitSearchMode(false);
    return true;
  }
  return false;
}
function performSearch(query, root = searchRoot()) {
  clearSearchHighlights();
  searchState.query = query;
  searchState.matches = [];
  searchState.currentIndex = -1;
  searchState.truncated = false;
  if (!query)
    return;
  const queryLower = query.toLowerCase();
  const blocks = getVisibleBlocks(root);
  outer:
    for (const block of blocks) {
      for (const textNode of getTextNodes(block)) {
        const textLower = textNode.nodeValue.toLowerCase();
        let searchFrom = 0;
        while (true) {
          const index = textLower.indexOf(queryLower, searchFrom);
          if (index === -1)
            break;
          if (searchState.matches.length >= SEARCH_MAX_MATCHES) {
            searchState.truncated = true;
            break outer;
          }
          const range = document.createRange();
          range.setStart(textNode, index);
          range.setEnd(textNode, index + query.length);
          searchState.matches.push({ range, block });
          searchFrom = index + query.length;
        }
      }
    }
  if (searchState.truncated) {
    console.warn(
      `[Roam Vim Mode] Search stopped at ${SEARCH_MAX_MATCHES} matches; refine your query.`
    );
  }
  debugLog("search", `"${query}" matched ${searchState.matches.length} in ${blocks.length} blocks`, {
    truncated: searchState.truncated,
    highlightApi: !!highlightRegistry()
  });
  applyHighlights();
}
function searchRoot() {
  try {
    return VimRoamPanel.selected().element;
  } catch {
    return document.body;
  }
}
function getVisibleBlocks(root) {
  return Array.from(root.querySelectorAll(Selectors.block)).filter(isElementVisible);
}
function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node2) => node2.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  return textNodes;
}
function applyHighlights() {
  const registry = highlightRegistry();
  if (!registry) {
    warnOnceAboutHighlights();
    return;
  }
  const current = searchState.matches[searchState.currentIndex];
  const others = searchState.matches.filter((_, i) => i !== searchState.currentIndex).map((match) => match.range);
  if (others.length > 0) {
    registry.set(SEARCH_HIGHLIGHT_NAME, new Highlight(...others));
  } else {
    registry.delete(SEARCH_HIGHLIGHT_NAME);
  }
  if (current) {
    const highlight = new Highlight(current.range);
    highlight.priority = 1;
    registry.set(SEARCH_CURRENT_HIGHLIGHT_NAME, highlight);
  } else {
    registry.delete(SEARCH_CURRENT_HIGHLIGHT_NAME);
  }
}
function clearSearchHighlights() {
  const registry = highlightRegistry();
  if (!registry)
    return;
  registry.delete(SEARCH_HIGHLIGHT_NAME);
  registry.delete(SEARCH_CURRENT_HIGHLIGHT_NAME);
}
function matchesAreStale() {
  return searchState.matches.some(
    (match) => !match.range.startContainer.isConnected || !match.block.isConnected
  );
}
function ensureFreshMatches() {
  if (searchState.matches.length > 0 && !matchesAreStale()) {
    return true;
  }
  const query = searchState.query || searchState.lastQuery;
  if (!query)
    return false;
  const previousIndex = searchState.currentIndex;
  performSearch(query);
  if (searchState.matches.length === 0)
    return false;
  searchState.currentIndex = Math.min(Math.max(previousIndex, -1), searchState.matches.length - 1);
  return true;
}
function navigateToMatch(index, { scroll = true } = {}) {
  if (searchState.matches.length === 0)
    return;
  const count = searchState.matches.length;
  searchState.currentIndex = (index % count + count) % count;
  applyHighlights();
  if (!scroll)
    return;
  const match = searchState.matches[searchState.currentIndex];
  const target = match.range.startContainer.parentElement ?? match.block;
  if (target?.isConnected) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
function nextMatch() {
  if (!ensureFreshMatches())
    return;
  navigateToMatch(searchState.currentIndex + 1);
}
function previousMatch() {
  if (!ensureFreshMatches())
    return;
  navigateToMatch(searchState.currentIndex - 1);
}
function resetSearch() {
  exitSearchMode(true);
  searchState.query = "";
  searchState.lastQuery = "";
  searchState.matches = [];
  searchState.currentIndex = -1;
}

// src/mode.js
var Mode = {
  INSERT: "INSERT",
  VISUAL: "VISUAL",
  NORMAL: "NORMAL",
  HINT: "HINT",
  SEARCH: "SEARCH"
};
function getMode() {
  if (isSearchInputOpen()) {
    return Mode.SEARCH;
  }
  if (pageHintState.active) {
    return Mode.HINT;
  }
  if (isEditingContext()) {
    return document.querySelector(Selectors.commandBar) ? Mode.NORMAL : Mode.INSERT;
  }
  if (document.querySelector(Selectors.highlight)) {
    return Mode.VISUAL;
  }
  return Mode.NORMAL;
}
function isEditingContext() {
  if (getActiveEditElement()) {
    return true;
  }
  return !!document.activeElement?.closest?.(Selectors.codeEditor);
}
var MODE_TRIGGER_EVENTS = ["keydown", "keyup", "mouseup", "focusin", "focusout"];
function onModeChange(handler) {
  let lastMode = null;
  let scheduled = false;
  const check = () => {
    scheduled = false;
    const mode = getMode();
    if (mode === lastMode)
      return;
    lastMode = mode;
    handler(mode);
  };
  const schedule = () => {
    if (scheduled)
      return;
    scheduled = true;
    requestAnimationFrame(check);
  };
  MODE_TRIGGER_EVENTS.forEach(
    (eventName) => document.addEventListener(eventName, schedule, true)
  );
  const unsubscribe = subscribeModeChange(schedule);
  check();
  return () => {
    MODE_TRIGGER_EVENTS.forEach(
      (eventName) => document.removeEventListener(eventName, schedule, true)
    );
    unsubscribe();
  };
}

// src/help-panel.js
var KEYBINDINGS = {
  "Navigation": [
    { key: "j", description: "Move down" },
    { key: "k", description: "Move up" },
    { key: "h", description: "Switch to left panel" },
    { key: "l", description: "Switch to right panel" },
    { key: "gg", description: "Jump to first block" },
    { key: "G", description: "Jump to last block" }
  ],
  "Editing": [
    { key: "i", description: "Enter insert mode (start)" },
    { key: "a", description: "Enter insert mode (end)" },
    { key: "o", description: "Insert block below" },
    { key: "O", description: "Insert block above" },
    { key: "V", description: "Select block (visual)" },
    { key: "dd", description: "Delete block (yanks first)" },
    { key: "u", description: "Undo" },
    { key: "Ctrl+r", description: "Redo" },
    { key: "z", description: "Toggle fold" },
    { key: "c", description: "Center current block" }
  ],
  "Search": [
    { key: "/", description: "Search in current panel" },
    { key: "n", description: "Go to next match" },
    { key: "N", description: "Go to previous match" }
  ],
  "Hints": [
    { key: "f", description: "Hint all links on page" },
    { key: "F", description: "Hint links \u2192 open in sidebar" },
    { key: "q/w/e/r/t/b", description: "Click link in block" },
    { key: "Shift + hint", description: "Shift-click link" }
  ],
  "Other": [
    { key: "Esc", description: "Return to normal mode" },
    { key: "?", description: "Toggle this help panel" },
    { key: "Space", description: "Leader menu (if enabled)" }
  ]
};
function showHelpPanel() {
  if (document.getElementById(HELP_PANEL_ID)) {
    hideHelpPanel();
    return;
  }
  const panel = document.createElement("div");
  panel.id = HELP_PANEL_ID;
  const header = document.createElement("div");
  header.className = `${HELP_PANEL_ID}--header`;
  header.innerHTML = `
        <span class="${HELP_PANEL_ID}--title">Vim Mode Keybindings</span>
        <span class="${HELP_PANEL_ID}--close">Press ? or Esc to close</span>
    `;
  panel.appendChild(header);
  const content = document.createElement("div");
  content.className = `${HELP_PANEL_ID}--content`;
  for (const [category, bindings] of Object.entries(KEYBINDINGS)) {
    const section = document.createElement("div");
    section.className = `${HELP_PANEL_ID}--section`;
    const categoryTitle = document.createElement("h3");
    categoryTitle.className = `${HELP_PANEL_ID}--category`;
    categoryTitle.textContent = category;
    section.appendChild(categoryTitle);
    const list = document.createElement("div");
    list.className = `${HELP_PANEL_ID}--list`;
    for (const binding of bindings) {
      const item = document.createElement("div");
      item.className = `${HELP_PANEL_ID}--item`;
      const keySpan = document.createElement("span");
      keySpan.className = `${HELP_PANEL_ID}--key`;
      keySpan.textContent = binding.key;
      const descSpan = document.createElement("span");
      descSpan.className = `${HELP_PANEL_ID}--desc`;
      descSpan.textContent = binding.description;
      item.appendChild(keySpan);
      item.appendChild(descSpan);
      list.appendChild(item);
    }
    section.appendChild(list);
    content.appendChild(section);
  }
  panel.appendChild(content);
  document.body.appendChild(panel);
}
function hideHelpPanel() {
  const panel = document.getElementById(HELP_PANEL_ID);
  if (panel) {
    panel.remove();
  }
}
function isHelpPanelOpen() {
  return !!document.getElementById(HELP_PANEL_ID);
}

// src/which-key.js
var whichKeyState = {
  active: false,
  currentNode: null,
  path: [],
  showTimeout: null
};
function showWhichKey(node, path) {
  if (whichKeyState.showTimeout) {
    clearTimeout(whichKeyState.showTimeout);
  }
  whichKeyState.currentNode = node;
  whichKeyState.path = path;
  whichKeyState.showTimeout = setTimeout(() => {
    renderWhichKeyPopup(node, path);
    whichKeyState.active = true;
  }, WHICH_KEY_DELAY);
}
function showWhichKeyImmediate(node, path) {
  if (whichKeyState.showTimeout) {
    clearTimeout(whichKeyState.showTimeout);
    whichKeyState.showTimeout = null;
  }
  whichKeyState.currentNode = node;
  whichKeyState.path = path;
  renderWhichKeyPopup(node, path);
  whichKeyState.active = true;
}
function hideWhichKey() {
  if (whichKeyState.showTimeout) {
    clearTimeout(whichKeyState.showTimeout);
    whichKeyState.showTimeout = null;
  }
  const panel = document.getElementById(WHICH_KEY_PANEL_ID);
  if (panel) {
    panel.remove();
  }
  whichKeyState.active = false;
  whichKeyState.currentNode = null;
  whichKeyState.path = [];
}
function renderWhichKeyPopup(node, path) {
  const existing = document.getElementById(WHICH_KEY_PANEL_ID);
  if (existing) {
    existing.remove();
  }
  const panel = document.createElement("div");
  panel.id = WHICH_KEY_PANEL_ID;
  const header = document.createElement("div");
  header.className = `${WHICH_KEY_PANEL_ID}--header`;
  header.textContent = path.join(" ") + " -";
  panel.appendChild(header);
  const grid = document.createElement("div");
  grid.className = `${WHICH_KEY_PANEL_ID}--grid`;
  const keys = Object.entries(node.keys || {});
  keys.forEach(([key, value]) => {
    const item = document.createElement("div");
    item.className = `${WHICH_KEY_PANEL_ID}--item`;
    const keySpan = document.createElement("span");
    keySpan.className = `${WHICH_KEY_PANEL_ID}--key`;
    keySpan.textContent = key;
    const nameSpan = document.createElement("span");
    nameSpan.className = `${WHICH_KEY_PANEL_ID}--name`;
    nameSpan.textContent = value.name;
    const isGroup = value.keys !== void 0;
    if (isGroup) {
      nameSpan.classList.add(`${WHICH_KEY_PANEL_ID}--group`);
    }
    item.appendChild(keySpan);
    item.appendChild(nameSpan);
    grid.appendChild(item);
  });
  panel.appendChild(grid);
  document.body.appendChild(panel);
}

// src/commands.js
var MAX_NORMAL_MODE_NUDGES = 6;
async function returnToNormalMode() {
  blurEverything();
  await delay(0);
  blurEverything();
  for (let attempt = 0; attempt < MAX_NORMAL_MODE_NUDGES; attempt++) {
    await delay(16);
    const mode = getMode();
    if (mode === Mode.NORMAL) {
      debugLog("commands", `returnToNormalMode: reached NORMAL after ${attempt} nudge(s)`);
      return;
    }
    debugLog("commands", `returnToNormalMode: still ${mode}, nudging`, {
      attempt,
      blockSelections: document.querySelectorAll(Selectors.highlight).length
    });
    await Keyboard.pressEsc();
  }
  logError("commands", `returnToNormalMode: gave up, mode is still ${getMode()}`);
}
var RoamVim = {
  async jumpBlocksInFocusedPanel(blocksToJump) {
    const mode = getMode();
    if (mode === Mode.NORMAL) {
      VimRoamPanel.selected().selectRelativeBlock(blocksToJump);
      updateVimView();
      return;
    }
    if (mode === Mode.VISUAL) {
      await repeatAsync(
        Math.abs(blocksToJump),
        () => Keyboard.pressArrow(blocksToJump > 0 ? "down" : "up", { shiftKey: true })
      );
      const edge = blocksToJump > 0 ? RoamHighlight.last() : RoamHighlight.first();
      if (edge) {
        VimRoamPanel.selected().scrollUntilBlockIsVisible(edge);
      }
    }
  }
};
async function selectBlockUp() {
  await RoamVim.jumpBlocksInFocusedPanel(-1);
}
async function selectBlockDown() {
  await RoamVim.jumpBlocksInFocusedPanel(1);
}
function selectFirstBlock() {
  VimRoamPanel.selected().selectFirstBlock();
  updateVimView();
}
function selectLastBlock() {
  VimRoamPanel.selected().selectLastBlock();
  updateVimView();
  viewMoreDailyLogIfPossible();
}
function centerCurrentBlock() {
  const panel = VimRoamPanel.selected();
  const block = panel.selectedBlock().element;
  const panelRect = panel.element.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  const blockCenterRelativeToPanel = blockRect.top + blockRect.height / 2 - panelRect.top;
  const panelCenter = panelRect.height / 2;
  panel.element.scrollTop += blockCenterRelativeToPanel - panelCenter;
  updateVimView();
}
async function insertBlockAfter() {
  await Roam.createBlockBelow(RoamBlock.selected().element);
}
async function insertBlockBefore() {
  await Roam.createBlockAbove(RoamBlock.selected().element);
}
async function editBlock() {
  await Roam.activateBlock(RoamBlock.selected().element, { start: 0 });
}
async function editBlockFromEnd() {
  await Roam.activateBlock(RoamBlock.selected().element);
  await Roam.moveCursorToEnd();
}
function selectPanelLeft() {
  VimRoamPanel.previousPanel()?.select();
  updateVimView();
}
function selectPanelRight() {
  VimRoamPanel.nextPanel()?.select();
  updateVimView();
}
function closeSidebarPage() {
  const block = RoamBlock.selected().element;
  const pageContainer = block.closest(`${Selectors.sidebarContent} > div`);
  const closeButton = pageContainer?.querySelector(Selectors.closeButton);
  if (closeButton) {
    Mouse.leftClick(closeButton);
  }
}
async function highlightSelectedBlock() {
  await Roam.highlight(RoamBlock.selected().element);
}
async function copySelectedBlock() {
  const text = await Roam.getBlockText(RoamBlock.selected().element);
  await writeToClipboard(text);
  await returnToNormalMode();
}
function copySelectedBlockReference() {
  return copyBlockReference(VimRoamPanel.selected().selectedBlockId);
}
function copySelectedBlockEmbed() {
  return copyBlockEmbed(VimRoamPanel.selected().selectedBlockId);
}
async function undo2() {
  await Roam.undo();
  await returnToNormalMode();
}
async function redo2() {
  await Roam.redo();
  await returnToNormalMode();
}
async function reorderSelectedBlock(offset) {
  const element = RoamBlock.selected().element;
  try {
    const uid = getBlockUid(element);
    const block = uid ? pullBlock(uid) : null;
    if (block?.parentUid) {
      const order = Math.max(0, block.order + offset);
      if (order === block.order)
        return;
      await moveBlock({ uid, parentUid: block.parentUid, order });
      updateVimView();
      return;
    }
  } catch (error) {
    warnFallback("moveBlock via roamAlphaAPI failed", error);
  }
  await Roam.activateBlock(element);
  await Keyboard.simulateKeyCombo(offset < 0 ? "ArrowUp" : "ArrowDown", { shiftKey: true });
}
async function moveBlockUp() {
  await reorderSelectedBlock(-1);
}
async function moveBlockDown() {
  await reorderSelectedBlock(1);
}
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
async function toggleFold() {
  await RoamBlock.selected().toggleFold();
}
async function deleteBlock2() {
  const element = RoamBlock.selected().element;
  await writeToClipboard(await Roam.getBlockText(element));
  await Roam.deleteBlock(element);
  await returnToNormalMode();
  updateVimView();
}
function expandReferences() {
  const block = RoamBlock.selected().element;
  const footnote = block.querySelector(Selectors.referenceFootnote);
  if (footnote) {
    Mouse.leftClick(footnote);
  }
}

// src/leader-config.js
var LEADER_COMMAND_REGISTRY = {
  "block/yank-ref": copySelectedBlockReference,
  "block/yank-embed": copySelectedBlockEmbed,
  "block/yank-text": copySelectedBlock,
  "block/delete": deleteBlock2,
  "block/move-up": moveBlockUp,
  "block/move-down": moveBlockDown,
  "block/toggle-fold": toggleFold,
  "block/expand-refs": expandReferences,
  "goto/first": selectFirstBlock,
  "goto/last": selectLastBlock,
  "goto/center": centerCurrentBlock,
  "panel/left": selectPanelLeft,
  "panel/right": selectPanelRight,
  "panel/close": closeSidebarPage,
  "search/start": enterSearchMode,
  "search/next": nextMatch,
  "search/previous": previousMatch,
  "hint/links": () => enterPageHintMode(),
  "hint/links-sidebar": () => enterPageHintMode({ openInSidebar: true }),
  "hint/blocks": () => enterBlockHintMode(),
  "help/show": showHelpPanel
};
var DEFAULT_LEADER_CONFIG = {
  name: "+leader",
  keys: {
    b: {
      name: "+block",
      keys: {
        y: { name: "yank block ref", command: "block/yank-ref" },
        e: { name: "yank block embed", command: "block/yank-embed" },
        c: { name: "copy block text", command: "block/yank-text" },
        d: { name: "delete block", command: "block/delete" },
        k: { name: "move block up", command: "block/move-up" },
        j: { name: "move block down", command: "block/move-down" },
        z: { name: "toggle fold", command: "block/toggle-fold" },
        r: { name: "expand references", command: "block/expand-refs" }
      }
    },
    g: {
      name: "+goto",
      keys: {
        g: { name: "first block", command: "goto/first" },
        e: { name: "last block", command: "goto/last" },
        c: { name: "center block", command: "goto/center" }
      }
    },
    p: {
      name: "+panel",
      keys: {
        h: { name: "focus left panel", command: "panel/left" },
        l: { name: "focus right panel", command: "panel/right" },
        c: { name: "close sidebar page", command: "panel/close" }
      }
    },
    s: {
      name: "+search",
      keys: {
        s: { name: "search in panel", command: "search/start" },
        n: { name: "next match", command: "search/next" },
        p: { name: "previous match", command: "search/previous" }
      }
    },
    f: {
      name: "+hint",
      keys: {
        f: { name: "hint links", command: "hint/links" },
        s: { name: "hint links \u2192 sidebar", command: "hint/links-sidebar" },
        b: { name: "hint blocks (jump to edit)", command: "hint/blocks" }
      }
    },
    "?": { name: "help", command: "help/show" }
  }
};

// src/settings.js
var extensionAPIRef = null;
var SETTING_SPACEMACS_ENABLED = "spacemacs-enabled";
function setExtensionAPI(api) {
  extensionAPIRef = api;
}
function isSpacemacsEnabled() {
  if (!extensionAPIRef)
    return false;
  return extensionAPIRef.settings.get(SETTING_SPACEMACS_ENABLED) === true;
}

// src/keybindings.js
var PENDING = Symbol("roam-vim-pending-sequence");
var CONSUME = Symbol("roam-vim-consume");
var sequenceBuffer = "";
var sequenceTimeout = null;
var SEQUENCE_PREFIXES = ["g", "d"];
var leaderConfig = DEFAULT_LEADER_CONFIG;
var leaderState = {
  active: false,
  currentNode: leaderConfig,
  path: []
};
function enterLeaderMode() {
  leaderState.active = true;
  leaderState.currentNode = leaderConfig;
  leaderState.path = ["SPC"];
  showWhichKey(leaderConfig, ["SPC"]);
}
function resetLeaderState() {
  leaderState.active = false;
  leaderState.currentNode = leaderConfig;
  leaderState.path = [];
  hideWhichKey();
}
function handleLeaderSequence(key) {
  const nextNode = leaderState.currentNode.keys?.[key];
  if (nextNode?.keys) {
    leaderState.currentNode = nextNode;
    leaderState.path.push(key);
    showWhichKeyImmediate(nextNode, [...leaderState.path]);
    return true;
  }
  if (nextNode?.action) {
    runCommand(nextNode.action);
    resetLeaderState();
    return true;
  }
  if (nextNode?.command) {
    const commandFn = LEADER_COMMAND_REGISTRY[nextNode.command];
    if (commandFn) {
      runCommand(commandFn);
    } else {
      console.warn(`[Roam Vim Mode] Unknown leader command: ${nextNode.command}`);
    }
    resetLeaderState();
    return true;
  }
  resetLeaderState();
  return false;
}
function isRoamModalFocused() {
  return !!document.activeElement?.closest?.(Selectors.roamModal);
}
function runCommand(command) {
  const name = command.name || "(anonymous)";
  debugLog("command", `running ${name}`);
  try {
    const result = command();
    if (result && typeof result.catch === "function") {
      result.catch((error) => logError("command", `"${name}" failed`, error));
    }
  } catch (error) {
    logError("command", `"${name}" failed`, error);
  }
}
function consume(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}
function describeKeyPress(event) {
  const mods = [
    event.ctrlKey && "Ctrl",
    event.metaKey && "Cmd",
    event.altKey && "Alt",
    event.shiftKey && "Shift"
  ].filter(Boolean);
  return [...mods, event.key === " " ? "Space" : event.key].join("+");
}
function describeMatch(match) {
  if (!match)
    return "no match (passed to Roam)";
  if (match === PENDING)
    return "PENDING (waiting for next key)";
  if (match === CONSUME)
    return "CONSUME (swallowed)";
  return `command ${match.name || "(anonymous)"}`;
}
function handleKeydown(event) {
  if (event[SYNTHETIC_KEY_FLAG]) {
    return;
  }
  const mode = getMode();
  const key = event.key.toLowerCase();
  const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
  debugLog("keys", `keydown ${describeKeyPress(event)} in ${mode}`, {
    target: event.target,
    activeElement: document.activeElement,
    blockSelections: document.querySelectorAll(Selectors.highlight).length
  });
  if (mode === Mode.SEARCH) {
    if (key === "escape" || key === "enter") {
      consume(event);
      handleSearchInput(event);
    }
    return;
  }
  if (mode === Mode.HINT) {
    if (key === "escape") {
      consume(event);
      hidePageHints();
      return;
    }
    if (key === "backspace") {
      consume(event);
      backspacePageHints();
      return;
    }
    if (HINT_CHARS.includes(key) && !hasModifier) {
      consume(event);
      filterPageHints(key);
      return;
    }
    hidePageHints();
    return;
  }
  if (mode === Mode.INSERT && key !== "escape") {
    return;
  }
  if (key === "escape" && !isHelpPanelOpen() && !leaderState.active && isRoamModalFocused()) {
    debugLog("keys", "escape handed to Roam: focus is inside its own modal UI");
    return;
  }
  if (leaderState.active) {
    consume(event);
    if (key === "escape") {
      resetLeaderState();
      return;
    }
    const leaderKey = event.shiftKey && event.key.length === 1 ? event.key : key;
    handleLeaderSequence(leaderKey);
    return;
  }
  if (mode === Mode.NORMAL && event.key === " " && !hasModifier && isSpacemacsEnabled()) {
    consume(event);
    enterLeaderMode();
    return;
  }
  if (event.metaKey) {
    return;
  }
  const sequence = buildSequence(key, event);
  const match = matchCommand(sequence, mode, event);
  debugLog("keys", `sequence "${sequence}" -> ${describeMatch(match)}`);
  if (!match) {
    clearSequence();
    return;
  }
  consume(event);
  if (match === PENDING) {
    return;
  }
  clearSequence();
  if (match !== CONSUME) {
    runCommand(match);
  }
}
function buildSequence(key, event) {
  if (sequenceTimeout) {
    clearTimeout(sequenceTimeout);
  }
  let prefix = "";
  if (event.ctrlKey)
    prefix += "ctrl+";
  if (event.metaKey)
    prefix += "cmd+";
  if (event.altKey)
    prefix += "alt+";
  if (event.shiftKey && !(key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey)) {
    prefix += "shift+";
  }
  sequenceBuffer += prefix + key + " ";
  sequenceTimeout = setTimeout(clearSequence, SEQUENCE_TIMEOUT_MS);
  return sequenceBuffer.trim();
}
function clearSequence() {
  sequenceBuffer = "";
  if (sequenceTimeout) {
    clearTimeout(sequenceTimeout);
    sequenceTimeout = null;
  }
}
function resetKeybindingState() {
  clearSequence();
  resetLeaderState();
}
function matchCommand(sequence, mode, event) {
  const key = event.key.toLowerCase();
  const isNormal = mode === Mode.NORMAL;
  const isVisual = mode === Mode.VISUAL;
  const plain = !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;
  if (isHelpPanelOpen()) {
    if (key === "escape" || event.key === "?") {
      return hideHelpPanel;
    }
    return CONSUME;
  }
  if (key === "escape") {
    return returnToNormalMode;
  }
  if (isVisual) {
    if (key === "j" && plain)
      return selectBlockDown;
    if (key === "k" && plain)
      return selectBlockUp;
    return null;
  }
  if (!isNormal) {
    return null;
  }
  if (sequence === "g g" && !event.shiftKey)
    return selectFirstBlock;
  if (sequence === "d d" && !event.shiftKey)
    return deleteBlock2;
  if (SEQUENCE_PREFIXES.some((prefix) => sequence.startsWith(`${prefix} `))) {
    return CONSUME;
  }
  if (SEQUENCE_PREFIXES.includes(key) && sequence === key && plain) {
    return PENDING;
  }
  if (key === "k" && plain)
    return selectBlockUp;
  if (key === "j" && plain)
    return selectBlockDown;
  if (key === "g" && event.shiftKey && !event.ctrlKey && !event.altKey)
    return selectLastBlock;
  if (key === "h" && plain)
    return selectPanelLeft;
  if (key === "l" && plain)
    return selectPanelRight;
  if (key === "i" && plain)
    return editBlock;
  if (key === "a" && plain)
    return editBlockFromEnd;
  if (key === "o" && event.shiftKey && !event.ctrlKey && !event.altKey)
    return insertBlockBefore;
  if (key === "o" && plain)
    return insertBlockAfter;
  if (key === "v" && event.shiftKey && !event.ctrlKey && !event.altKey)
    return highlightSelectedBlock;
  if (key === "z" && plain)
    return toggleFold;
  if (key === "c" && plain)
    return centerCurrentBlock;
  if (key === "u" && plain)
    return undo2;
  if (key === "r" && event.ctrlKey && !event.altKey)
    return redo2;
  if (event.key === "?")
    return showHelpPanel;
  if (event.key === "/")
    return enterSearchMode;
  if (key === "n" && plain)
    return nextMatch;
  if (key === "n" && event.shiftKey && !event.ctrlKey && !event.altKey)
    return previousMatch;
  if (key === "f" && plain)
    return () => enterPageHintMode();
  if (key === "f" && event.shiftKey && !event.ctrlKey && !event.altKey) {
    return () => enterPageHintMode({ openInSidebar: true });
  }
  const hintIndex = DEFAULT_HINT_KEYS.indexOf(key);
  if (hintIndex !== -1 && !event.ctrlKey && !event.altKey) {
    return event.shiftKey ? () => shiftClickHint(hintIndex) : () => clickHint(hintIndex);
  }
  return null;
}

// src/styles.js
var VIM_MODE_STYLES = `
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

/*
 * Search matches are painted with the CSS Custom Highlight API, so these rules
 * style ranges rather than elements \u2014 no markup is injected into Roam's blocks.
 * Only a small set of properties is honoured inside ::highlight(); background-color
 * and color are the ones we need.
 */
::highlight(${SEARCH_HIGHLIGHT_NAME}) {
    background-color: #fff59d;
    color: #24292e;
}

::highlight(${SEARCH_CURRENT_HIGHLIGHT_NAME}) {
    background-color: #ff9800;
    color: #24292e;
}

/* Descendant combinator: the highlight pseudo-element belongs to whichever
   element contains the matched text, not to .bp3-dark itself. */
.bp3-dark ::highlight(${SEARCH_HIGHLIGHT_NAME}) {
    background-color: #5c6b3a;
    color: #f5f8fa;
}

.bp3-dark ::highlight(${SEARCH_CURRENT_HIGHLIGHT_NAME}) {
    background-color: #e65100;
    color: #f5f8fa;
}

/* Mode indicator */
#${MODE_INDICATOR_ID} {
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
    transition: background-color 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
`;

// src/mode-indicator.js
var unsubscribeModeChange = null;
var MODE_APPEARANCE = {
  [Mode.NORMAL]: { label: "-- NORMAL --", background: "#2196F3" },
  [Mode.INSERT]: { label: "-- INSERT --", background: "#4CAF50" },
  [Mode.VISUAL]: { label: "-- VISUAL --", background: "#FF9800" },
  [Mode.HINT]: { label: "-- HINT --", background: "#9C27B0" },
  [Mode.SEARCH]: { label: "-- SEARCH --", background: "#607D8B" }
};
function createModeIndicator() {
  if (document.getElementById(MODE_INDICATOR_ID))
    return;
  const indicator = document.createElement("div");
  indicator.id = MODE_INDICATOR_ID;
  document.body.appendChild(indicator);
  unsubscribeModeChange = onModeChange(updateModeIndicator);
}
function updateModeIndicator(mode) {
  debugLog("mode", `-> ${mode}`);
  const indicator = document.getElementById(MODE_INDICATOR_ID);
  if (!indicator)
    return;
  const appearance = MODE_APPEARANCE[mode];
  if (!appearance) {
    console.warn("[Roam Vim Mode] No indicator appearance for mode", mode);
    return;
  }
  indicator.textContent = appearance.label;
  indicator.style.backgroundColor = appearance.background;
  indicator.style.color = "white";
}
function removeModeIndicator() {
  document.getElementById(MODE_INDICATOR_ID)?.remove();
  if (unsubscribeModeChange) {
    unsubscribeModeChange();
    unsubscribeModeChange = null;
  }
}

// src/extension.js
var disconnectHandlers = [];
var keydownHandler = null;
var startupController = null;
async function startVimMode() {
  startupController = new AbortController();
  const { signal } = startupController;
  try {
    await waitForSelectorToExist(Selectors.mainContent, document.body, { signal });
    await delay(300);
  } catch {
    return;
  }
  if (signal.aborted)
    return;
  disconnectHandlers = [
    RoamEvent.onEditBlock((blockElement) => {
      const panel = VimRoamPanel.fromBlock(blockElement);
      if (!panel)
        return;
      panel.select();
      panel.selectBlock(blockElement.id);
      updateVimView();
    }),
    RoamEvent.onBlurBlock(updateVimView),
    RoamEvent.onSidebarToggle((isRightPanelOn) => {
      VimRoamPanel.updateSidePanels();
      if (!isRightPanelOn) {
        VimRoamPanel.mainPanel()?.select();
      }
      updateVimView();
    }),
    RoamEvent.onSidebarChange(() => {
      VimRoamPanel.updateSidePanels();
      updateVimView();
    }),
    RoamEvent.onChangePage(() => {
      VimRoamPanel.updateSidePanels();
      VimRoamPanel.mainPanel()?.selectFirstBlock();
      updateVimView();
    })
  ];
  VimRoamPanel.updateSidePanels();
  updateVimView();
  keydownHandler = handleKeydown;
  window.addEventListener("keydown", keydownHandler, true);
  debugLog("lifecycle", "vim mode started", {
    panels: panelState.panelOrder.length
  });
}
function stopVimMode() {
  startupController?.abort();
  startupController = null;
  disconnectHandlers.forEach((disconnect) => disconnect());
  disconnectHandlers = [];
  if (keydownHandler) {
    window.removeEventListener("keydown", keydownHandler, true);
    keydownHandler = null;
  }
  clearVimView();
  resetSearch();
  hidePageHints();
  hideHelpPanel();
  hideWhichKey();
  resetKeybindingState();
  VimRoamPanel.reset();
  document.getElementById(BLUR_PIXEL_ID)?.remove();
}
function onload({ extensionAPI }) {
  setExtensionAPI(extensionAPI);
  extensionAPI.settings.panel.create({
    tabTitle: "Vim Mode",
    settings: [
      {
        id: SETTING_SPACEMACS_ENABLED,
        name: "Enable Spacemacs-style Leader Key",
        description: "Press Space in Normal mode to open a command menu with a which-key popup. Supports multi-key sequences like SPC b y to copy a block reference.",
        action: {
          type: "switch"
        }
      }
    ]
  });
  injectStyle(VIM_MODE_STYLES, `${EXTENSION_ID}--styles`);
  createModeIndicator();
  installConsoleApi();
  debugLog("lifecycle", "onload");
  diagnose();
  startVimMode();
}
function onunload() {
  debugLog("lifecycle", "onunload");
  stopVimMode();
  removeStyle(`${EXTENSION_ID}--styles`);
  removeModeIndicator();
  clearModeSubscribers();
  removeConsoleApi();
}
var extension_default = {
  onload,
  onunload
};
export {
  extension_default as default
};
