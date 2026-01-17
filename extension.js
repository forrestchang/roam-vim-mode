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
var SEARCH_HIGHLIGHT_CSS_CLASS = `${EXTENSION_ID}--search-highlight`;
var SEARCH_CURRENT_CSS_CLASS = `${EXTENSION_ID}--search-current`;
var Selectors = {
  link: ".rm-page-ref",
  hiddenSection: ".rm-block__part--equals",
  block: ".roam-block",
  blockInput: ".rm-block-input",
  blockContainer: ".roam-block-container",
  blockReference: ".rm-block-ref",
  blockBulletView: ".block-bullet-view",
  title: ".rm-title-display",
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
  zoomPath: ".rm-zoom-path",
  zoomItemContent: ".rm-zoom-item-content",
  breadcrumbsContainer: ".zoom-mentions-view",
  pageReferenceItem: ".rm-ref-page-view",
  pageReferenceLink: ".rm-ref-page-view-title a span",
  filterButton: ".bp3-icon.bp3-icon-filter",
  commandBar: ".bp3-omnibar",
  escapeHtmlId: (htmlId) => htmlId.replace(".", "\\.").replace("@", "\\@")
};
var HINT_IDS = [0, 1, 2, 3, 4, 5];
var DEFAULT_HINT_KEYS = ["q", "w", "e", "r", "t", "b"];
var HINT_CHARS = "asdfghjkl";
var SCROLL_PADDING = 50;
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
  return element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT";
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
  const { x, y } = element.getBoundingClientRect();
  return x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
}
function getKeyboardEvent(type, code, opts) {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    keyCode: code,
    ...opts
  });
}
var Keyboard = {
  LEFT_ARROW: 37,
  UP_ARROW: 38,
  RIGHT_ARROW: 39,
  DOWN_ARROW: 40,
  BASE_DELAY: 20,
  async simulateKey(code, delayOverride = 0, opts) {
    ["keydown", "keyup"].forEach(
      (eventType) => document?.activeElement?.dispatchEvent(getKeyboardEvent(eventType, code, opts))
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
  }
};
var KEY_TO_CODE = {
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  "0": 48,
  "1": 49,
  "2": 50,
  "3": 51,
  "4": 52,
  "5": 53,
  "6": 54,
  "7": 55,
  "8": 56,
  "9": 57,
  ";": 59,
  "=": 187,
  ",": 188,
  "-": 189,
  ".": 190,
  "/": 191,
  "[": 219,
  "\\": 220,
  "]": 221,
  "'": 222,
  a: 65,
  b: 66,
  c: 67,
  d: 68,
  e: 69,
  f: 70,
  g: 71,
  h: 72,
  i: 73,
  j: 74,
  k: 75,
  l: 76,
  m: 77,
  n: 78,
  o: 79,
  p: 80,
  q: 81,
  r: 82,
  s: 83,
  t: 84,
  u: 85,
  v: 86,
  w: 87,
  x: 88,
  y: 89,
  z: 90
};
function getMouseEvent(mouseEventType, buttons, modifiers = {}) {
  return new MouseEvent(mouseEventType, {
    shiftKey: modifiers.shiftKey || false,
    metaKey: modifiers.metaKey || false,
    ctrlKey: modifiers.ctrlKey || false,
    view: window,
    bubbles: true,
    cancelable: true,
    buttons
  });
}
var Mouse = {
  BASE_DELAY: 20,
  simulateClick(buttons, element, modifiers = {}, delayOverride = 0) {
    const mouseClickEvents = ["mousedown", "click", "mouseup"];
    mouseClickEvents.forEach((mouseEventType) => {
      element.dispatchEvent(getMouseEvent(mouseEventType, buttons, modifiers));
    });
    return delay(delayOverride || this.BASE_DELAY);
  },
  hover(element, delayOverride = 0) {
    element.dispatchEvent(getMouseEvent("mouseover", 1));
    element.dispatchEvent(getMouseEvent("mousemove", 1));
    return delay(delayOverride || this.BASE_DELAY);
  },
  leftClick(element, modifiers = {}, additionalDelay = 0) {
    return this.simulateClick(1, element, modifiers, additionalDelay);
  }
};
function observeElement(observeInside, handleChange, observeChildren = false, observeAttributes = false) {
  const waitForLoad = new MutationObserver((mutations) => {
    handleChange(mutations[0].target);
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
function waitForSelectorToExist(selector, observeInside = document.body) {
  return waitForSelectionToExist((element) => element.querySelector(selector), observeInside);
}
function waitForSelectionToExist(selectionFn, observeInside = document.body) {
  return new Promise((resolve) => {
    const resolveIfElementExists = () => {
      const element = selectionFn(observeInside);
      if (element) {
        resolve(element);
        return true;
      }
      return false;
    };
    if (resolveIfElementExists())
      return;
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
    return new _RoamNode(this.text, selection);
  }
};
function nearestFoldButton(element) {
  const foldButton = element.querySelector(Selectors.foldButton);
  if (foldButton) {
    return foldButton;
  }
  return nearestFoldButton(assumeExists(element.parentElement));
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
    if (element.classList.contains("roam-block")) {
      await Mouse.leftClick(element);
    }
    return this.getRoamBlockInput();
  },
  async deleteBlock() {
    return this.highlight().then(() => Keyboard.pressBackspace());
  },
  async copyBlock() {
    await this.highlight();
    document.execCommand("copy");
  },
  async moveCursorToStart() {
    await this.applyToCurrent((node) => node.withCursorAtTheStart());
  },
  async moveCursorToEnd() {
    await this.applyToCurrent((node) => node.withCursorAtTheEnd());
  },
  async createBlockBelow() {
    await this.moveCursorToEnd();
    await Keyboard.pressEnter();
  },
  async toggleFoldBlock(block) {
    const foldButton = nearestFoldButton(block);
    await Mouse.hover(foldButton);
    await Mouse.leftClick(foldButton);
  }
};
function getBlockUid(htmlBlockId) {
  const UID_LENGTH = 9;
  return htmlBlockId.substr(htmlBlockId?.length - UID_LENGTH);
}
function copyBlockReference(htmlBlockId) {
  if (!htmlBlockId)
    return;
  return navigator.clipboard.writeText(`((${getBlockUid(htmlBlockId)}))`);
}
function copyBlockEmbed(htmlBlockId) {
  if (!htmlBlockId)
    return;
  return navigator.clipboard.writeText(`{{embed: ((${getBlockUid(htmlBlockId)}))}}`);
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
      if (element.classList.contains("rm-block-input")) {
        handler(element);
      }
    };
    document.addEventListener("focusin", handleBlockEvent);
    return () => document.removeEventListener("focusin", handleBlockEvent);
  },
  onBlurBlock(handler) {
    const handleBlockEvent = (event) => {
      const element = event.target;
      if (element.classList.contains("rm-block-input")) {
        const container = assumeExists(element.closest(Selectors.blockContainer));
        waitForSelectorToExist(`${Selectors.block}#${Selectors.escapeHtmlId(element.id)}`, container).then(handler);
      }
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
  first() {
    return assumeExists(this.highlightedBlocks()[0], "No block is highlighted");
  },
  last() {
    const blocks = this.highlightedBlocks();
    return assumeExists(blocks[blocks.length - 1], "No block is highlighted");
  }
};

// src/panel.js
var panelState = {
  panelOrder: [],
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
    await Roam.activateBlock(this.element);
  }
  async toggleFold() {
    await Roam.toggleFoldBlock(this.element);
  }
  static get(blockId) {
    return new _RoamBlock(assumeExists(document.getElementById(blockId)));
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
    this.element.scrollTop = 0;
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
    block.scrollIntoView({ block: "nearest", behavior: "instant" });
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
    this.element.scrollIntoView({ behavior: "smooth" });
  }
  static selected() {
    panelState.focusedPanel = Math.min(panelState.focusedPanel, panelState.panelOrder.length - 1);
    return _VimRoamPanel.get(panelState.panelOrder[panelState.focusedPanel]);
  }
  static fromBlock(blockElement) {
    return _VimRoamPanel.get(assumeExists(blockElement.closest(PANEL_SELECTOR)));
  }
  static at(panelIndex) {
    panelIndex = clamp(panelIndex, 0, panelState.panelOrder.length - 1);
    return _VimRoamPanel.get(panelState.panelOrder[panelIndex]);
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
    panelState.panels = new Map(panelState.panelOrder.map((el) => [el, _VimRoamPanel.get(el)]));
  }
  static get(panelId) {
    if (!panelState.panels.has(panelId)) {
      panelState.panels.set(panelId, new _VimRoamPanel(panelId));
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
    return assumeExists(this.blocks().find(blockIsVisible), "Could not find any visible block");
  }
  lastVisibleBlock() {
    return assumeExists(findLast(this.blocks(), blockIsVisible), "Could not find any visible block");
  }
};
function blockScrollOverflow(block) {
  const { top, height, width } = block.getBoundingClientRect();
  const bottom = top + height;
  const scaledPadding = width / block.offsetWidth * SCROLL_PADDING;
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
  try {
    const block = RoamBlock.selected().element;
    clearVimView();
    block.classList.add(SELECTED_BLOCK_CSS_CLASS);
    updateVimHints(block);
    viewMoreDailyLogIfPossible();
  } catch (e) {
  }
  return null;
}
function clearVimView() {
  const priorSelections = document.querySelectorAll(`.${SELECTED_BLOCK_CSS_CLASS}`);
  priorSelections.forEach((selection) => selection.classList.remove(SELECTED_BLOCK_CSS_CLASS));
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
    blurPixel = document.createElement("div");
    blurPixel.id = BLUR_PIXEL_ID;
    document.body.appendChild(blurPixel);
  }
  Mouse.leftClick(blurPixel);
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
  links.forEach((link, i) => {
    if (i < HINT_IDS.length) {
      link.classList.add(HINT_CSS_CLASS, hintCssClass(i));
    }
  });
}
function clearVimHints() {
  const priorHints = document.querySelectorAll(`.${HINT_CSS_CLASS}`);
  priorHints.forEach((selection) => selection.classList.remove(HINT_CSS_CLASS, ...HINT_CSS_CLASSES));
}
function getHint(n) {
  return document.querySelector(`.${hintCssClass(n)}`);
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
  return allElements.filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
  });
}
function getBlockElements() {
  const elements = document.querySelectorAll(Selectors.block);
  return Array.from(elements).filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
  });
}
function updateHintPositions() {
  pageHintState.hints.forEach((hint) => {
    const rect = hint.element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth) {
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
}
function hidePageHints() {
  removeScrollListeners();
  const overlay = document.getElementById(PAGE_HINT_OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
  pageHintState.active = false;
  pageHintState.hints = [];
  pageHintState.inputBuffer = "";
}
function filterPageHints(char) {
  pageHintState.inputBuffer += char.toLowerCase();
  const buffer = pageHintState.inputBuffer;
  const exactMatch = pageHintState.hints.find((h) => h.label === buffer);
  if (exactMatch) {
    const clickOptions = pageHintState.editBlock ? {} : pageHintState.openInSidebar ? { shiftKey: true } : {};
    Mouse.leftClick(exactMatch.element, clickOptions);
    hidePageHints();
    return true;
  }
  let hasMatches = false;
  pageHintState.hints.forEach((hint) => {
    if (hint.label.startsWith(buffer)) {
      hint.hintEl.style.display = "";
      const matched = buffer;
      const remaining = hint.label.substring(buffer.length);
      hint.hintEl.innerHTML = `<span class="${PAGE_HINT_CSS_CLASS}--matched">${matched}</span>${remaining}`;
      hasMatches = true;
    } else {
      hint.hintEl.style.display = "none";
    }
  });
  if (!hasMatches) {
    hidePageHints();
  }
  return hasMatches;
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
  matches: [],
  // Array of { element, textNode, startIndex, endIndex }
  currentIndex: -1,
  // Current match index
  lastQuery: ""
  // Remember last search for n/N commands
};
function enterSearchMode() {
  if (searchState.active)
    return;
  searchState.active = true;
  searchState.query = "";
  searchState.matches = [];
  searchState.currentIndex = -1;
  const input = document.createElement("input");
  input.id = SEARCH_INPUT_ID;
  input.type = "text";
  input.placeholder = "/";
  input.autocomplete = "off";
  input.spellcheck = false;
  document.body.appendChild(input);
  setTimeout(() => input.focus(), 0);
}
function exitSearchMode(clearHighlights = true) {
  searchState.active = false;
  const input = document.getElementById(SEARCH_INPUT_ID);
  if (input) {
    input.remove();
  }
  if (clearHighlights) {
    clearSearchHighlights();
    searchState.matches = [];
    searchState.currentIndex = -1;
  }
}
function handleSearchInput(event) {
  const input = document.getElementById(SEARCH_INPUT_ID);
  if (!input)
    return;
  const key = event.key;
  if (key === "Escape") {
    exitSearchMode(true);
    return true;
  }
  if (key === "Enter") {
    searchState.lastQuery = input.value;
    if (input.value) {
      performSearch(input.value);
      if (searchState.matches.length > 0) {
        navigateToMatch(0);
      }
    }
    exitSearchMode(false);
    return true;
  }
  return false;
}
function performSearch(query) {
  clearSearchHighlights();
  searchState.query = query;
  searchState.matches = [];
  searchState.currentIndex = -1;
  if (!query)
    return;
  const queryLower = query.toLowerCase();
  const blocks = getVisibleBlocks();
  blocks.forEach((block) => {
    const textNodes = getTextNodes(block);
    textNodes.forEach((textNode) => {
      const text = textNode.nodeValue;
      const textLower = text.toLowerCase();
      let startIndex = 0;
      while (true) {
        const index = textLower.indexOf(queryLower, startIndex);
        if (index === -1)
          break;
        searchState.matches.push({
          element: block,
          textNode,
          startIndex: index,
          endIndex: index + query.length
        });
        startIndex = index + 1;
      }
    });
  });
  highlightMatches();
}
function getVisibleBlocks() {
  const blocks = document.querySelectorAll(Selectors.block);
  return Array.from(blocks).filter((block) => {
    const rect = block.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}
function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node2) => {
        if (!node2.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node2.parentElement.classList.contains(SEARCH_HIGHLIGHT_CSS_CLASS) || node2.parentElement.classList.contains(SEARCH_CURRENT_CSS_CLASS)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  return textNodes;
}
function highlightMatches() {
  const matchesByNode = /* @__PURE__ */ new Map();
  searchState.matches.forEach((match, index) => {
    if (!matchesByNode.has(match.textNode)) {
      matchesByNode.set(match.textNode, []);
    }
    matchesByNode.get(match.textNode).push({ ...match, originalIndex: index });
  });
  matchesByNode.forEach((nodeMatches, textNode) => {
    nodeMatches.sort((a, b) => b.startIndex - a.startIndex);
    const parent = textNode.parentNode;
    let currentNode = textNode;
    nodeMatches.forEach((match) => {
      const text = currentNode.nodeValue;
      const before = text.substring(0, match.startIndex);
      const matchText = text.substring(match.startIndex, match.endIndex);
      const after = text.substring(match.endIndex);
      const highlightSpan = document.createElement("span");
      highlightSpan.className = SEARCH_HIGHLIGHT_CSS_CLASS;
      highlightSpan.textContent = matchText;
      highlightSpan.dataset.matchIndex = match.originalIndex;
      if (after) {
        const afterNode = document.createTextNode(after);
        parent.insertBefore(afterNode, currentNode.nextSibling);
      }
      parent.insertBefore(highlightSpan, currentNode.nextSibling);
      currentNode.nodeValue = before;
      searchState.matches[match.originalIndex].highlightSpan = highlightSpan;
    });
  });
}
function clearSearchHighlights() {
  const highlights = document.querySelectorAll(`.${SEARCH_HIGHLIGHT_CSS_CLASS}, .${SEARCH_CURRENT_CSS_CLASS}`);
  highlights.forEach((span) => {
    const text = span.textContent;
    const textNode = document.createTextNode(text);
    span.parentNode.replaceChild(textNode, span);
  });
  const blocks = document.querySelectorAll(Selectors.block);
  blocks.forEach((block) => block.normalize());
}
function navigateToMatch(index) {
  if (searchState.matches.length === 0)
    return;
  if (index < 0) {
    index = searchState.matches.length - 1;
  } else if (index >= searchState.matches.length) {
    index = 0;
  }
  if (searchState.currentIndex >= 0 && searchState.matches[searchState.currentIndex]) {
    const prevSpan = searchState.matches[searchState.currentIndex].highlightSpan;
    if (prevSpan) {
      prevSpan.classList.remove(SEARCH_CURRENT_CSS_CLASS);
      prevSpan.classList.add(SEARCH_HIGHLIGHT_CSS_CLASS);
    }
  }
  searchState.currentIndex = index;
  const match = searchState.matches[index];
  if (match && match.highlightSpan) {
    match.highlightSpan.classList.remove(SEARCH_HIGHLIGHT_CSS_CLASS);
    match.highlightSpan.classList.add(SEARCH_CURRENT_CSS_CLASS);
    match.highlightSpan.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
function nextMatch() {
  if (searchState.matches.length === 0) {
    if (searchState.lastQuery) {
      performSearch(searchState.lastQuery);
      if (searchState.matches.length > 0) {
        navigateToMatch(0);
      }
    }
    return;
  }
  navigateToMatch(searchState.currentIndex + 1);
}
function previousMatch() {
  if (searchState.matches.length === 0) {
    if (searchState.lastQuery) {
      performSearch(searchState.lastQuery);
      if (searchState.matches.length > 0) {
        navigateToMatch(searchState.matches.length - 1);
      }
    }
    return;
  }
  navigateToMatch(searchState.currentIndex - 1);
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
  if (searchState.active) {
    return Mode.SEARCH;
  }
  if (pageHintState.active) {
    return Mode.HINT;
  }
  if (getActiveEditElement() && !document.querySelector(Selectors.commandBar)) {
    return Mode.INSERT;
  }
  if (document.querySelector(Selectors.highlight)) {
    return Mode.VISUAL;
  }
  return Mode.NORMAL;
}

// src/help-panel.js
var KEYBINDINGS = {
  "Navigation": [
    { key: "j", description: "Move down" },
    { key: "k", description: "Move up" },
    { key: "h", description: "Switch to left panel" },
    { key: "l", description: "Switch to right panel" },
    { key: "H", description: "Jump to first visible block" },
    { key: "L", description: "Jump to last visible block" },
    { key: "gg", description: "Jump to first block" },
    { key: "G", description: "Jump to last block" },
    { key: "Ctrl+u", description: "Page up (8 blocks)" },
    { key: "Ctrl+d", description: "Page down (8 blocks)" },
    { key: "Ctrl+y", description: "Scroll up" },
    { key: "Ctrl+e", description: "Scroll down" }
  ],
  "Editing": [
    { key: "i", description: "Enter insert mode (start)" },
    { key: "a", description: "Enter insert mode (end)" },
    { key: "o", description: "Insert block below" },
    { key: "O", description: "Insert block above" },
    { key: "u", description: "Undo" },
    { key: "Ctrl+r", description: "Redo" },
    { key: "za", description: "Toggle fold" },
    { key: "zz", description: "Center current block" }
  ],
  "Visual Mode": [
    { key: "v", description: "Enter visual mode" },
    { key: "d", description: "Enter visual mode / Cut" },
    { key: "J", description: "Grow selection down" },
    { key: "K", description: "Grow selection up" }
  ],
  "Clipboard": [
    { key: "y", description: "Copy block" },
    { key: "Alt+y", description: "Copy block reference" },
    { key: "Y", description: "Copy block embed" },
    { key: "p", description: "Paste below" },
    { key: "P", description: "Paste above" }
  ],
  "Block Movement": [
    { key: "Cmd+Shift+k", description: "Move block up" },
    { key: "Cmd+Shift+j", description: "Move block down" }
  ],
  "Hints (click links)": [
    { key: "q/w/e/r/t/b", description: "Click hint in block" },
    { key: "Shift + hint", description: "Shift-click hint" },
    { key: "Ctrl+Shift + hint", description: "Open in sidebar" },
    { key: "f", description: "Show page-wide hints" },
    { key: "F", description: "Open page hint in sidebar" },
    { key: "gf", description: "Show block hints to edit" }
  ],
  "Leader Key (SPC) - Block": [
    { key: "SPC b y", description: "Copy block" },
    { key: "SPC b r", description: "Copy block reference" },
    { key: "SPC b e", description: "Copy block embed" },
    { key: "SPC b p/P", description: "Paste after/before" },
    { key: "SPC b d", description: "Delete block" },
    { key: "SPC b x", description: "Cut block" },
    { key: "SPC b n/N", description: "New block below/above" },
    { key: "SPC b o", description: "Open block in sidebar" },
    { key: "SPC b m", description: "Show block mentions" },
    { key: "SPC b z", description: "Zoom into block" }
  ],
  "Leader Key (SPC) - Goto": [
    { key: "SPC g g/G", description: "First/Last block" },
    { key: "SPC g d/h", description: "Daily Notes / Home" },
    { key: "SPC g p", description: "Go to page..." },
    { key: "SPC g b", description: "Go to block..." },
    { key: "SPC g l", description: "Go to linked refs" }
  ],
  "Leader Key (SPC) - Window": [
    { key: "SPC w h/l", description: "Panel left/right" },
    { key: "SPC w o/c", description: "Open/Close right sidebar" },
    { key: "SPC w d", description: "Close sidebar page" },
    { key: "SPC w L", description: "Toggle left sidebar" },
    { key: "SPC w a", description: "Add block to sidebar" },
    { key: "SPC w m", description: "Add mentions to sidebar" },
    { key: "SPC w g", description: "Add graph to sidebar" },
    { key: "SPC w s", description: "Search in sidebar" }
  ],
  "Leader Key (SPC) - Search": [
    { key: "SPC s s", description: "Command palette" },
    { key: "SPC s p", description: "Find page" },
    { key: "SPC s /", description: "Browser find (Cmd+F)" },
    { key: "SPC s r", description: "Search in sidebar" },
    { key: "SPC s g", description: "Graph search" }
  ],
  "Leader Key (SPC) - Page": [
    { key: "SPC p n", description: "New page" },
    { key: "SPC p d", description: "Delete page" },
    { key: "SPC p r", description: "Rename page" },
    { key: "SPC p o", description: "Open page in sidebar" },
    { key: "SPC p m", description: "Show page mentions" },
    { key: "SPC p g", description: "Show page graph" }
  ],
  "Leader Key (SPC) - Other": [
    { key: "SPC t f", description: "Toggle fold" },
    { key: "SPC t l/r", description: "Toggle left/right sidebar" },
    { key: "SPC f f", description: "Focus first block" },
    { key: "SPC f b", description: "Focus current block" },
    { key: "SPC u", description: "Undo" },
    { key: "SPC r", description: "Redo" },
    { key: "SPC ?", description: "Help" }
  ],
  "Search": [
    { key: "/", description: "Search in visible blocks" },
    { key: "n", description: "Go to next match" },
    { key: "N", description: "Go to previous match" }
  ],
  "Other": [
    { key: "Esc", description: "Return to normal mode" },
    { key: "Ctrl+w", description: "Close sidebar page" },
    { key: "?", description: "Toggle this help panel" }
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
var yankRegister = "";
async function returnToNormalMode() {
  blurEverything();
  await delay(0);
  blurEverything();
}
var RoamVim = {
  async jumpBlocksInFocusedPanel(blocksToJump) {
    const mode = getMode();
    if (mode === Mode.NORMAL) {
      VimRoamPanel.selected().selectRelativeBlock(blocksToJump);
      updateVimView();
    }
    if (mode === Mode.VISUAL) {
      await repeatAsync(
        Math.abs(blocksToJump),
        () => Keyboard.simulateKey(blocksToJump > 0 ? Keyboard.DOWN_ARROW : Keyboard.UP_ARROW, 0, { shiftKey: true })
      );
      VimRoamPanel.selected().scrollUntilBlockIsVisible(
        blocksToJump > 0 ? RoamHighlight.last() : RoamHighlight.first()
      );
    }
  }
};
async function selectBlockUp() {
  await RoamVim.jumpBlocksInFocusedPanel(-1);
}
async function selectBlockDown() {
  await RoamVim.jumpBlocksInFocusedPanel(1);
}
async function selectFirstVisibleBlock() {
  VimRoamPanel.selected().selectFirstVisibleBlock();
  updateVimView();
}
async function selectLastVisibleBlock() {
  VimRoamPanel.selected().selectLastVisibleBlock();
  updateVimView();
}
async function selectFirstBlock() {
  VimRoamPanel.selected().selectFirstBlock();
  updateVimView();
}
async function selectLastBlock() {
  VimRoamPanel.selected().selectLastBlock();
  updateVimView();
}
async function selectManyBlocksUp() {
  await RoamVim.jumpBlocksInFocusedPanel(-8);
}
async function selectManyBlocksDown() {
  await RoamVim.jumpBlocksInFocusedPanel(8);
}
async function scrollUp() {
  VimRoamPanel.selected().scrollAndReselectBlockToStayVisible(-50);
  updateVimView();
}
async function scrollDown() {
  VimRoamPanel.selected().scrollAndReselectBlockToStayVisible(50);
  updateVimView();
}
async function centerCurrentBlock() {
  const panel = VimRoamPanel.selected();
  const block = panel.selectedBlock().element;
  const panelRect = panel.element.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  const blockCenterRelativeToPanel = blockRect.top + blockRect.height / 2 - panelRect.top;
  const panelCenter = panelRect.height / 2;
  const scrollAdjustment = blockCenterRelativeToPanel - panelCenter;
  panel.element.scrollTop += scrollAdjustment;
  updateVimView();
}
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
function selectPanelLeft() {
  VimRoamPanel.previousPanel().select();
  updateVimView();
}
function selectPanelRight() {
  VimRoamPanel.nextPanel().select();
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
async function getBlockText(blockElement) {
  await Roam.activateBlock(blockElement);
  const textarea = Roam.getRoamBlockInput();
  if (textarea) {
    return textarea.value;
  }
  return "";
}
async function cutAndGoBackToNormal() {
  const textarea = Roam.getRoamBlockInput();
  if (textarea) {
    yankRegister = textarea.value;
  }
  document.execCommand("cut");
  await delay(0);
  await returnToNormalMode();
}
async function paste() {
  await insertBlockAfter();
  if (yankRegister) {
    const textarea = Roam.getRoamBlockInput();
    if (textarea) {
      textarea.value = yankRegister;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } else {
    document.execCommand("paste");
  }
  await returnToNormalMode();
}
async function pasteBefore() {
  await RoamVim.jumpBlocksInFocusedPanel(-1);
  await insertBlockAfter();
  if (yankRegister) {
    const textarea = Roam.getRoamBlockInput();
    if (textarea) {
      textarea.value = yankRegister;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } else {
    document.execCommand("paste");
  }
  await returnToNormalMode();
}
async function copySelectedBlock(mode) {
  const blockElement = RoamBlock.selected().element;
  const text = await getBlockText(blockElement);
  yankRegister = text;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    document.execCommand("copy");
  }
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
  const highlightedBlock = RoamHighlight.first();
  if (highlightedBlock) {
    const text = await getBlockText(highlightedBlock);
    yankRegister = text;
  }
  await cutAndGoBackToNormal();
}
async function undo() {
  await Keyboard.simulateKey(KEY_TO_CODE["z"], 0, { key: "z", metaKey: true });
  await returnToNormalMode();
}
async function redo() {
  await Keyboard.simulateKey(KEY_TO_CODE["z"], 0, { key: "z", shiftKey: true, metaKey: true });
  await returnToNormalMode();
}
async function moveBlockUp() {
  RoamBlock.selected().edit();
  await Keyboard.simulateKey(Keyboard.UP_ARROW, 0, { metaKey: true, shiftKey: true });
}
async function moveBlockDown() {
  RoamBlock.selected().edit();
  await Keyboard.simulateKey(Keyboard.DOWN_ARROW, 0, { metaKey: true, shiftKey: true });
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
function ctrlShiftClickHint(n) {
  const hint = getHint(n);
  if (hint) {
    Mouse.leftClick(hint, { shiftKey: true, metaKey: true });
  }
}
function toggleFold() {
  RoamBlock.selected().toggleFold();
}

// src/leader-config.js
function getSelectedBlockUid() {
  const panel = VimRoamPanel.selected();
  if (!panel)
    return null;
  const block = panel.selectedBlock();
  return block?.id || null;
}
function getCurrentPageUid() {
  if (window.roamAlphaAPI?.ui?.mainWindow?.getOpenPageOrBlockUid) {
    return window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
  }
  const match = window.location.hash.match(/\/page\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
function promptUser(message, defaultValue = "") {
  return window.prompt(message, defaultValue);
}
var DEFAULT_LEADER_CONFIG = {
  name: "+leader",
  keys: {
    // Block operations
    "b": {
      name: "+block",
      keys: {
        "y": { name: "Copy block", command: "copyBlock" },
        "r": { name: "Copy reference", command: "copyBlockReference" },
        "e": { name: "Copy embed", command: "copyBlockEmbed" },
        "p": { name: "Paste after", command: "paste" },
        "P": { name: "Paste before", command: "pasteBefore" },
        "d": { name: "Delete block", command: "deleteBlock" },
        "x": { name: "Cut block", command: "cutBlock" },
        "n": { name: "New block below", command: "createBlockBelow" },
        "N": { name: "New block above", command: "createBlockAbove" },
        "o": { name: "Open in sidebar", command: "openBlockInSidebar" },
        "m": { name: "Show mentions", command: "showBlockMentions" },
        "z": { name: "Zoom into block", command: "zoomIntoBlock" }
      }
    },
    // Goto/Navigation
    "g": {
      name: "+goto",
      keys: {
        "g": { name: "First block", command: "selectFirstBlock" },
        "G": { name: "Last block", command: "selectLastBlock" },
        "d": { name: "Daily Notes", command: "gotoDailyNotes" },
        "p": { name: "Go to page...", command: "gotoPage" },
        "b": { name: "Go to block...", command: "gotoBlock" },
        "h": { name: "Go home (Daily Notes)", command: "gotoDailyNotes" },
        "l": { name: "Go to linked refs", command: "gotoLinkedRefs" }
      }
    },
    // Window/Panel operations
    "w": {
      name: "+window",
      keys: {
        "h": { name: "Panel left", command: "selectPanelLeft" },
        "l": { name: "Panel right", command: "selectPanelRight" },
        "o": { name: "Open right sidebar", command: "openRightSidebar" },
        "c": { name: "Close right sidebar", command: "closeRightSidebar" },
        "d": { name: "Close sidebar page", command: "closeSidebarPage" },
        "L": { name: "Toggle left sidebar", command: "toggleLeftSidebar" },
        "a": { name: "Add block to sidebar", command: "openBlockInSidebar" },
        "m": { name: "Add mentions to sidebar", command: "showBlockMentions" },
        "g": { name: "Add graph to sidebar", command: "showGraphInSidebar" },
        "s": { name: "Search in sidebar", command: "searchInSidebar" }
      }
    },
    // Search operations
    "s": {
      name: "+search",
      keys: {
        "s": { name: "Command palette", command: "openCommandPalette" },
        "p": { name: "Find page", command: "openSearch" },
        "/": { name: "Search in page", command: "searchInPage" },
        "r": { name: "Search in sidebar", command: "searchInSidebar" },
        "g": { name: "Graph search", command: "graphSearch" }
      }
    },
    // Page operations
    "p": {
      name: "+page",
      keys: {
        "n": { name: "New page", command: "createPage" },
        "d": { name: "Delete page", command: "deletePage" },
        "r": { name: "Rename page", command: "renamePage" },
        "o": { name: "Open in sidebar", command: "openPageInSidebar" },
        "m": { name: "Show mentions", command: "showPageMentions" },
        "g": { name: "Show graph", command: "showPageGraph" }
      }
    },
    // Toggle operations
    "t": {
      name: "+toggle",
      keys: {
        "f": { name: "Fold/Unfold", command: "toggleFold" },
        "l": { name: "Left sidebar", command: "toggleLeftSidebar" },
        "r": { name: "Right sidebar", command: "toggleRightSidebar" }
      }
    },
    // Focus operations
    "f": {
      name: "+focus",
      keys: {
        "f": { name: "Focus first block", command: "focusFirstBlock" },
        "b": { name: "Focus current block", command: "focusCurrentBlock" }
      }
    },
    // History - single key commands
    "u": { name: "Undo", command: "undo" },
    "r": { name: "Redo", command: "redo" },
    // Help
    "?": { name: "Help", command: "showHelpPanel" }
  }
};
var LEADER_COMMAND_REGISTRY = {
  // ==================== Block Operations ====================
  copyBlock: () => copySelectedBlock(Mode.NORMAL),
  copyBlockReference: copySelectedBlockReference,
  copyBlockEmbed: copySelectedBlockEmbed,
  paste,
  pasteBefore,
  cutBlock: () => enterOrCutInVisualMode(Mode.VISUAL),
  deleteBlock: () => {
    const uid = getSelectedBlockUid();
    if (!uid) {
      console.warn("[Vim Mode] No block selected");
      return;
    }
    if (window.roamAlphaAPI?.data?.block?.delete) {
      window.roamAlphaAPI.data.block.delete({ block: { uid } });
    } else {
      enterOrCutInVisualMode(Mode.VISUAL);
    }
  },
  createBlockBelow: () => {
    const uid = getSelectedBlockUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.data?.block?.create) {
      const blockInfo = window.roamAlphaAPI.data.pull("[{:block/parents [:block/uid :block/order]}]", [":block/uid", uid]);
      if (blockInfo) {
        const parentUid = blockInfo[":block/parents"]?.[0]?.[":block/uid"];
        if (parentUid) {
          window.roamAlphaAPI.data.block.create({
            location: { "parent-uid": parentUid, order: "last" },
            block: { string: "" }
          }).then(() => {
            window.roamAlphaAPI.ui.mainWindow.focusFirstBlock?.();
          });
        }
      }
    }
  },
  createBlockAbove: () => {
    const uid = getSelectedBlockUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.data?.block?.create) {
      const blockInfo = window.roamAlphaAPI.data.pull("[{:block/parents [:block/uid]} :block/order]", [":block/uid", uid]);
      if (blockInfo) {
        const parentUid = blockInfo[":block/parents"]?.[0]?.[":block/uid"];
        const order = blockInfo[":block/order"] || 0;
        if (parentUid) {
          window.roamAlphaAPI.data.block.create({
            location: { "parent-uid": parentUid, order },
            block: { string: "" }
          });
        }
      }
    }
  },
  openBlockInSidebar: () => {
    const uid = getSelectedBlockUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
      window.roamAlphaAPI.ui.rightSidebar.addWindow({
        window: { type: "block", "block-uid": uid }
      });
    }
  },
  showBlockMentions: () => {
    const uid = getSelectedBlockUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
      window.roamAlphaAPI.ui.rightSidebar.addWindow({
        window: { type: "mentions", "block-uid": uid }
      });
    }
  },
  zoomIntoBlock: () => {
    const uid = getSelectedBlockUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.ui?.mainWindow?.openBlock) {
      window.roamAlphaAPI.ui.mainWindow.openBlock({ block: { uid } });
    }
  },
  // ==================== Navigation ====================
  selectFirstBlock,
  selectLastBlock,
  gotoDailyNotes: () => {
    if (window.roamAlphaAPI?.ui?.mainWindow?.openDailyNotes) {
      window.roamAlphaAPI.ui.mainWindow.openDailyNotes();
    } else {
      const dailyNotesLink = document.querySelector(".rm-topbar .bp3-icon-calendar");
      if (dailyNotesLink) {
        dailyNotesLink.click();
      }
    }
  },
  gotoPage: () => {
    const title = promptUser("Enter page title:");
    if (!title)
      return;
    if (window.roamAlphaAPI?.ui?.mainWindow?.openPage) {
      window.roamAlphaAPI.ui.mainWindow.openPage({ page: { title } });
    }
  },
  gotoBlock: () => {
    const uid = promptUser("Enter block UID:");
    if (!uid)
      return;
    if (window.roamAlphaAPI?.ui?.mainWindow?.openBlock) {
      window.roamAlphaAPI.ui.mainWindow.openBlock({ block: { uid } });
    }
  },
  gotoLinkedRefs: () => {
    const linkedRefs = document.querySelector(".rm-reference-main");
    if (linkedRefs) {
      linkedRefs.scrollIntoView({ behavior: "smooth" });
    }
  },
  // ==================== Window/Panel Operations ====================
  selectPanelLeft,
  selectPanelRight,
  closeSidebarPage,
  openRightSidebar: () => {
    if (window.roamAlphaAPI?.ui?.rightSidebar?.open) {
      window.roamAlphaAPI.ui.rightSidebar.open();
    }
  },
  closeRightSidebar: () => {
    if (window.roamAlphaAPI?.ui?.rightSidebar?.close) {
      window.roamAlphaAPI.ui.rightSidebar.close();
    }
  },
  toggleLeftSidebar: () => {
    const leftSidebar = document.querySelector(".roam-sidebar-container");
    const isOpen = leftSidebar && !leftSidebar.classList.contains("rm-sidebar-closed");
    if (isOpen) {
      if (window.roamAlphaAPI?.ui?.leftSidebar?.close) {
        window.roamAlphaAPI.ui.leftSidebar.close();
      }
    } else {
      if (window.roamAlphaAPI?.ui?.leftSidebar?.open) {
        window.roamAlphaAPI.ui.leftSidebar.open();
      }
    }
  },
  toggleRightSidebar: () => {
    const rightSidebar = document.getElementById("right-sidebar");
    const isOpen = rightSidebar && rightSidebar.classList.contains("open");
    if (isOpen) {
      if (window.roamAlphaAPI?.ui?.rightSidebar?.close) {
        window.roamAlphaAPI.ui.rightSidebar.close();
      }
    } else {
      if (window.roamAlphaAPI?.ui?.rightSidebar?.open) {
        window.roamAlphaAPI.ui.rightSidebar.open();
      }
    }
  },
  showGraphInSidebar: () => {
    const uid = getCurrentPageUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
      window.roamAlphaAPI.ui.rightSidebar.addWindow({
        window: { type: "graph", "block-uid": uid }
      });
    }
  },
  searchInSidebar: () => {
    const query = promptUser("Enter search query:");
    if (!query)
      return;
    if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
      window.roamAlphaAPI.ui.rightSidebar.addWindow({
        window: { type: "search-query", "search-query-str": query }
      });
    }
  },
  // ==================== Search Operations ====================
  openCommandPalette: () => {
    if (window.roamAlphaAPI?.ui?.commandPalette?.open) {
      window.roamAlphaAPI.ui.commandPalette.open();
    } else {
      document.dispatchEvent(new KeyboardEvent("keydown", {
        key: "p",
        code: "KeyP",
        keyCode: 80,
        metaKey: true,
        bubbles: true,
        cancelable: true
      }));
    }
  },
  openSearch: () => {
    if (window.roamAlphaAPI?.ui?.commandPalette?.open) {
      window.roamAlphaAPI.ui.commandPalette.open();
    } else {
      const searchButton = document.querySelector(".rm-topbar .bp3-icon-search");
      if (searchButton) {
        searchButton.click();
      }
    }
  },
  searchInPage: () => {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "f",
      code: "KeyF",
      keyCode: 70,
      metaKey: true,
      bubbles: true,
      cancelable: true
    }));
  },
  graphSearch: () => {
    const query = promptUser("Enter graph search query:");
    if (!query)
      return;
    if (window.roamAlphaAPI?.data?.search) {
      const results = window.roamAlphaAPI.data.search({ "search-str": query, limit: 20 });
      console.log("[Vim Mode] Graph search results:", results);
      if (results && results.length > 0) {
        const firstResult = results[0];
        const uid = firstResult[":block/uid"] || firstResult[":node/title"];
        if (uid && window.roamAlphaAPI?.ui?.mainWindow?.openBlock) {
          window.roamAlphaAPI.ui.mainWindow.openBlock({ block: { uid } });
        }
      }
    }
  },
  // ==================== Page Operations ====================
  createPage: () => {
    const title = promptUser("Enter new page title:");
    if (!title)
      return;
    if (window.roamAlphaAPI?.data?.page?.create) {
      window.roamAlphaAPI.data.page.create({ page: { title } }).then(() => {
        if (window.roamAlphaAPI?.ui?.mainWindow?.openPage) {
          window.roamAlphaAPI.ui.mainWindow.openPage({ page: { title } });
        }
      });
    }
  },
  deletePage: () => {
    const uid = getCurrentPageUid();
    if (!uid) {
      console.warn("[Vim Mode] No page currently open");
      return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this page?");
    if (!confirmed)
      return;
    if (window.roamAlphaAPI?.data?.page?.delete) {
      window.roamAlphaAPI.data.page.delete({ page: { uid } });
      if (window.roamAlphaAPI?.ui?.mainWindow?.openDailyNotes) {
        window.roamAlphaAPI.ui.mainWindow.openDailyNotes();
      }
    }
  },
  renamePage: () => {
    const uid = getCurrentPageUid();
    if (!uid)
      return;
    const pageInfo = window.roamAlphaAPI?.data?.pull?.("[:node/title]", [":block/uid", uid]);
    const currentTitle = pageInfo?.[":node/title"] || "";
    const newTitle = promptUser("Enter new page title:", currentTitle);
    if (!newTitle || newTitle === currentTitle)
      return;
    if (window.roamAlphaAPI?.data?.page?.update) {
      window.roamAlphaAPI.data.page.update({ page: { uid, title: newTitle } });
    }
  },
  openPageInSidebar: () => {
    const uid = getCurrentPageUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
      window.roamAlphaAPI.ui.rightSidebar.addWindow({
        window: { type: "outline", "block-uid": uid }
      });
    }
  },
  showPageMentions: () => {
    const uid = getCurrentPageUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
      window.roamAlphaAPI.ui.rightSidebar.addWindow({
        window: { type: "mentions", "block-uid": uid }
      });
    }
  },
  showPageGraph: () => {
    const uid = getCurrentPageUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.ui?.rightSidebar?.addWindow) {
      window.roamAlphaAPI.ui.rightSidebar.addWindow({
        window: { type: "graph", "block-uid": uid }
      });
    }
  },
  // ==================== Toggle Operations ====================
  toggleFold,
  // ==================== Focus Operations ====================
  focusFirstBlock: () => {
    if (window.roamAlphaAPI?.ui?.mainWindow?.focusFirstBlock) {
      window.roamAlphaAPI.ui.mainWindow.focusFirstBlock();
    }
  },
  focusCurrentBlock: () => {
    const uid = getSelectedBlockUid();
    if (!uid)
      return;
    if (window.roamAlphaAPI?.ui?.setBlockFocusAndSelection) {
      window.roamAlphaAPI.ui.setBlockFocusAndSelection({
        location: { "block-uid": uid, "window-id": "main-window" }
      });
    }
  },
  // ==================== History ====================
  undo: () => {
    if (window.roamAlphaAPI?.data?.undo) {
      window.roamAlphaAPI.data.undo();
    } else {
      undo();
    }
  },
  redo: () => {
    if (window.roamAlphaAPI?.data?.redo) {
      window.roamAlphaAPI.data.redo();
    } else {
      redo();
    }
  },
  // ==================== Help ====================
  showHelpPanel
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
var sequenceBuffer = "";
var sequenceTimeout = null;
var SEQUENCE_PREFIXES = ["g", "z"];
var leaderConfig = DEFAULT_LEADER_CONFIG;
var leaderState = {
  active: false,
  currentNode: leaderConfig,
  path: []
};
function setLeaderConfig(config) {
  leaderConfig = config;
  leaderState.currentNode = leaderConfig;
}
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
function handleLeaderSequence(key, event) {
  const currentNode = leaderState.currentNode;
  if (currentNode.keys && currentNode.keys[key]) {
    const nextNode = currentNode.keys[key];
    if (nextNode.keys) {
      leaderState.currentNode = nextNode;
      leaderState.path.push(key);
      showWhichKeyImmediate(nextNode, [...leaderState.path]);
      return true;
    } else if (nextNode.action) {
      try {
        nextNode.action();
      } catch (error) {
        console.error("[Roam Vim Mode] Error executing action:", error);
      }
      resetLeaderState();
      return true;
    } else if (nextNode.command) {
      const commandFn = LEADER_COMMAND_REGISTRY[nextNode.command];
      if (commandFn) {
        commandFn();
      }
      resetLeaderState();
      return true;
    }
  }
  resetLeaderState();
  return false;
}
function handleKeydown(event) {
  const mode = getMode();
  const key = event.key.toLowerCase();
  const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
  if (mode === Mode.SEARCH) {
    if (key === "escape" || key === "enter") {
      event.preventDefault();
      event.stopPropagation();
      handleSearchInput(event);
    }
    return;
  }
  if (mode === Mode.HINT) {
    event.preventDefault();
    event.stopPropagation();
    if (key === "escape") {
      hidePageHints();
    } else if (key === "backspace") {
      if (pageHintState.inputBuffer.length > 0) {
        pageHintState.inputBuffer = pageHintState.inputBuffer.slice(0, -1);
        const buffer = pageHintState.inputBuffer;
        pageHintState.hints.forEach((hint) => {
          if (hint.label.startsWith(buffer)) {
            hint.hintEl.style.display = "";
            const matched = buffer;
            const remaining = hint.label.substring(buffer.length);
            hint.hintEl.innerHTML = matched ? `<span class="${PAGE_HINT_CSS_CLASS}--matched">${matched}</span>${remaining}` : hint.label;
          } else {
            hint.hintEl.style.display = "none";
          }
        });
      }
    } else if (HINT_CHARS.includes(key) && !hasModifier) {
      filterPageHints(key);
    }
    return;
  }
  if (mode === Mode.INSERT && key !== "escape") {
    return;
  }
  if (key === "escape" && document.querySelector(Selectors.commandBar)) {
    return;
  }
  if (leaderState.active) {
    event.preventDefault();
    event.stopPropagation();
    if (key === "escape") {
      resetLeaderState();
      return;
    }
    const leaderKey = event.shiftKey && event.key.length === 1 ? event.key : key;
    handleLeaderSequence(leaderKey, event);
    return;
  }
  if (mode === Mode.NORMAL && event.key === " " && !hasModifier && isSpacemacsEnabled()) {
    event.preventDefault();
    event.stopPropagation();
    enterLeaderMode();
    return;
  }
  if (event.metaKey && !(event.shiftKey && (key === "k" || key === "j"))) {
    return;
  }
  const sequence = buildSequence(key, event);
  const command = matchCommand(sequence, mode, event);
  if (command) {
    event.preventDefault();
    event.stopPropagation();
    command();
    clearSequence();
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
  if (event.shiftKey && key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
  } else if (event.shiftKey) {
    prefix += "shift+";
  }
  sequenceBuffer += prefix + key + " ";
  sequenceTimeout = setTimeout(() => {
    clearSequence();
  }, 500);
  return sequenceBuffer.trim();
}
function clearSequence() {
  sequenceBuffer = "";
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
  const sequencePrefix = SEQUENCE_PREFIXES.find((p) => sequence.startsWith(p + " "));
  if (isHelpPanelOpen()) {
    if (key === "escape" || event.key === "?") {
      return hideHelpPanel;
    }
    return () => {
    };
  }
  if (key === "escape") {
    return returnToNormalMode;
  }
  if (isNormal) {
    if (sequence === "g g")
      return selectFirstBlock;
    if (sequence === "g f")
      return enterBlockHintMode;
    if (sequence === "z z")
      return centerCurrentBlock;
    if (sequence === "z a")
      return toggleFold;
    if (sequencePrefix) {
      return () => {
      };
    }
    if (key === "k" && !event.shiftKey && !event.ctrlKey)
      return selectBlockUp;
    if (key === "j" && !event.shiftKey && !event.ctrlKey)
      return selectBlockDown;
    if (key === "h" && event.shiftKey)
      return selectFirstVisibleBlock;
    if (key === "l" && event.shiftKey)
      return selectLastVisibleBlock;
    if (key === "g" && event.shiftKey)
      return selectLastBlock;
    if (key === "u" && event.ctrlKey)
      return selectManyBlocksUp;
    if (key === "d" && event.ctrlKey)
      return selectManyBlocksDown;
    if (key === "h" && !event.shiftKey)
      return selectPanelLeft;
    if (key === "l" && !event.shiftKey)
      return selectPanelRight;
    if (key === "i" && !event.shiftKey)
      return editBlock;
    if (key === "a")
      return editBlockFromEnd;
    if (key === "o" && event.shiftKey)
      return insertBlockBefore;
    if (key === "o" && !event.shiftKey)
      return insertBlockAfter;
    if (key === "v" && !event.shiftKey)
      return highlightSelectedBlock;
    if (key === "p" && !event.shiftKey)
      return paste;
    if (key === "p" && event.shiftKey)
      return pasteBefore;
    if (key === "y" && !event.shiftKey && !event.altKey)
      return () => copySelectedBlock(mode);
    if (key === "y" && event.altKey)
      return copySelectedBlockReference;
    if (key === "y" && event.shiftKey)
      return copySelectedBlockEmbed;
    if (key === "d" && !event.ctrlKey)
      return () => enterOrCutInVisualMode(mode);
    if (key === "u" && !event.ctrlKey)
      return undo;
    if (key === "r" && event.ctrlKey)
      return redo;
    if (event.key === "?")
      return showHelpPanel;
    if (event.key === "/")
      return enterSearchMode;
    if (key === "n" && !event.shiftKey && !event.ctrlKey)
      return nextMatch;
    if (key === "n" && event.shiftKey && !event.ctrlKey)
      return previousMatch;
    if (key === "f" && !event.shiftKey && !event.ctrlKey)
      return () => enterPageHintMode(false);
    if (key === "f" && event.shiftKey && !event.ctrlKey)
      return () => enterPageHintMode(true);
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
  if (isVisual) {
    if (key === "k" && !event.shiftKey)
      return selectBlockUp;
    if (key === "j" && !event.shiftKey)
      return selectBlockDown;
    if (key === "k" && event.shiftKey)
      return () => growHighlightUp(mode);
    if (key === "j" && event.shiftKey)
      return () => growHighlightDown(mode);
    if (key === "y")
      return () => copySelectedBlock(mode);
    if (key === "d")
      return () => enterOrCutInVisualMode(mode);
  }
  if (isNormalOrVisual) {
    if (key === "y" && event.ctrlKey)
      return scrollUp;
    if (key === "e" && event.ctrlKey)
      return scrollDown;
  }
  if (key === "k" && event.metaKey && event.shiftKey)
    return moveBlockUp;
  if (key === "j" && event.metaKey && event.shiftKey)
    return moveBlockDown;
  if (key === "w" && event.ctrlKey)
    return closeSidebarPage;
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

// src/mode-indicator.js
var modeIndicatorInterval = null;
function createModeIndicator() {
  const indicator = document.createElement("div");
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
  modeIndicatorInterval = setInterval(updateModeIndicator, 100);
}
function updateModeIndicator() {
  const indicator = document.getElementById(MODE_INDICATOR_ID);
  if (!indicator)
    return;
  const mode = getMode();
  switch (mode) {
    case Mode.NORMAL:
      indicator.textContent = "-- NORMAL --";
      indicator.style.backgroundColor = "#2196F3";
      indicator.style.color = "white";
      break;
    case Mode.INSERT:
      indicator.textContent = "-- INSERT --";
      indicator.style.backgroundColor = "#4CAF50";
      indicator.style.color = "white";
      break;
    case Mode.VISUAL:
      indicator.textContent = "-- VISUAL --";
      indicator.style.backgroundColor = "#FF9800";
      indicator.style.color = "white";
      break;
    case Mode.HINT:
      indicator.textContent = "-- HINT --";
      indicator.style.backgroundColor = "#9C27B0";
      indicator.style.color = "white";
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

// src/user-config.js
var CONFIG_PAGE_TITLE = "roam/js/vim-mode";
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) && typeof source[key] !== "function") {
      if (target[key] && typeof target[key] === "object" && !Array.isArray(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
function getPageUidByTitle(title) {
  if (!window.roamAlphaAPI)
    return null;
  const result = window.roamAlphaAPI.q(`
        [:find ?uid
         :where
         [?e :node/title "${title}"]
         [?e :block/uid ?uid]]
    `);
  return result?.[0]?.[0] || null;
}
function getPageBlocks(pageUid) {
  if (!window.roamAlphaAPI || !pageUid)
    return [];
  const result = window.roamAlphaAPI.q(`
        [:find ?string ?order
         :where
         [?page :block/uid "${pageUid}"]
         [?page :block/children ?child]
         [?child :block/string ?string]
         [?child :block/order ?order]]
    `);
  return result.sort((a, b) => a[1] - b[1]).map((r) => r[0]);
}
function extractJavaScriptCode(blockString) {
  const codeBlockMatch = blockString.match(/```(?:javascript|js)\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return null;
}
function evaluateConfigCode(code) {
  try {
    const fn = new Function(code);
    const result = fn();
    return result;
  } catch (error) {
    console.error("[Roam Vim Mode] Error evaluating user config:", error);
    return null;
  }
}
async function loadUserConfig() {
  try {
    if (!window.roamAlphaAPI) {
      console.log("[Roam Vim Mode] roamAlphaAPI not available, skipping user config");
      return null;
    }
    const pageUid = getPageUidByTitle(CONFIG_PAGE_TITLE);
    if (!pageUid) {
      console.log(`[Roam Vim Mode] Config page "${CONFIG_PAGE_TITLE}" not found`);
      return null;
    }
    const blocks = getPageBlocks(pageUid);
    if (blocks.length === 0) {
      console.log("[Roam Vim Mode] Config page is empty");
      return null;
    }
    for (const block of blocks) {
      const code = extractJavaScriptCode(block);
      if (code) {
        console.log("[Roam Vim Mode] Found user config code");
        const config = evaluateConfigCode(code);
        if (config && typeof config === "object") {
          console.log("[Roam Vim Mode] User config loaded successfully");
          return config;
        }
      }
    }
    console.log("[Roam Vim Mode] No valid JavaScript config found");
    return null;
  } catch (error) {
    console.error("[Roam Vim Mode] Error loading user config:", error);
    return null;
  }
}
function mergeConfigs(defaultConfig, userConfig) {
  if (!userConfig) {
    return defaultConfig;
  }
  const mergedKeys = deepMerge(defaultConfig.keys || {}, userConfig);
  return {
    ...defaultConfig,
    keys: mergedKeys
  };
}

// src/extension.js
var disconnectHandlers = [];
var keydownHandler = null;
async function loadAndApplyUserConfig() {
  try {
    const userConfig = await loadUserConfig();
    if (userConfig) {
      const mergedConfig = mergeConfigs(DEFAULT_LEADER_CONFIG, userConfig);
      setLeaderConfig(mergedConfig);
      console.log("[Roam Vim Mode] User config applied");
    }
  } catch (error) {
    console.error("[Roam Vim Mode] Failed to load user config:", error);
  }
}
function startVimMode() {
  waitForSelectorToExist(Selectors.mainContent).then(async () => {
    await delay(300);
    await loadAndApplyUserConfig();
    disconnectHandlers = [
      RoamEvent.onEditBlock((blockElement) => {
        VimRoamPanel.fromBlock(blockElement).select();
        VimRoamPanel.selected().selectBlock(blockElement.id);
        updateVimView();
      }),
      RoamEvent.onBlurBlock(updateVimView),
      RoamEvent.onSidebarToggle((isRightPanelOn) => {
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
      })
    ];
    VimRoamPanel.updateSidePanels();
    updateVimView();
    keydownHandler = handleKeydown;
    document.addEventListener("keydown", keydownHandler, true);
  });
}
function stopVimMode() {
  disconnectHandlers.forEach((disconnect) => disconnect());
  disconnectHandlers = [];
  clearVimView();
  hideWhichKey();
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler, true);
    keydownHandler = null;
  }
  const blurPixel = document.getElementById(BLUR_PIXEL_ID);
  if (blurPixel) {
    blurPixel.remove();
  }
}
function onload({ extensionAPI }) {
  console.log("Roam Vim Mode extension loaded");
  setExtensionAPI(extensionAPI);
  extensionAPI.settings.panel.create({
    tabTitle: "Vim Mode",
    settings: [
      {
        id: SETTING_SPACEMACS_ENABLED,
        name: "Enable Spacemacs-style Leader Key (Experimental)",
        description: "Press Space in Normal mode to open a command menu with which-key popup. Allows multi-key sequences like SPC b y to copy block.",
        action: {
          type: "switch"
        }
      }
    ]
  });
  injectStyle(VIM_MODE_STYLES, `${EXTENSION_ID}--styles`);
  createModeIndicator();
  startVimMode();
}
function onunload() {
  console.log("Roam Vim Mode extension unloaded");
  stopVimMode();
  removeStyle(`${EXTENSION_ID}--styles`);
  removeModeIndicator();
  hideHelpPanel();
  hidePageHints();
  hideWhichKey();
}
var extension_default = {
  onload,
  onunload
};
export {
  extension_default as default
};
