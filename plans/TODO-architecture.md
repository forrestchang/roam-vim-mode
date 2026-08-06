# 架构优化 TODO

基于代码 Review 的优化任务清单。

---

## 已完成（2026-08）

### Bug 修复

- [x] **`gg` / `dd` 完全失效** — `matchCommand()` 对单独的前缀键返回 `() => {}`，
      truthy 导致 `handleKeydown` 立刻 `clearSequence()`，序列缓冲区永远拼不到两个键。
      改为返回 `PENDING` / `CONSUME` 哨兵。回归测试见 `test/keybindings.test.js`。
- [x] **`Shift+A` 误触发 `a`** — 唯一缺少 shift 守卫的绑定，统一用 `plain` 判定。
- [x] **`u` / `Ctrl+R` 在非 macOS 失效** — 硬编码 `metaKey`。改走
      `roamAlphaAPI.data.undo/redo`，fallback 用 `Keyboard.simulateKeyCombo()`
      按平台选择 Cmd / Ctrl（`isMacOS()` 从此不再是死代码）。
- [x] **Search 模式可能卡死** — `searchState.active` 与输入框脱钩后 Escape 也无效。
      `getMode()` 改用 `isSearchInputOpen()`，会自愈；输入框加 `blur` 退出。
- [x] **Search 往 React DOM 插 span** — 改用 CSS Custom Highlight API，零 DOM 改动。
      同时限定在焦点 panel 内搜索，加 range 失效检测和 500 条上限。
- [x] **Panel 索引 -1 污染全局状态** — `select()` / `selected()` / `at()` 全部
      正确 clamp，`get()` 不再接受 undefined。`fromBlock()` 会先补 tag 再重试。
- [x] **`z` 折叠可能抛异常** — `nearestFoldButton` 递归无终止条件，走到 `<html>` 崩。
      改为以 `document.body` 为界的迭代，找不到返回 null；折叠优先走
      `updateBlock({open})`。
- [x] **`startVimMode` / `stopVimMode` 竞态** — 用 `AbortController` 取消挂起的
      `waitForSelectorToExist`，避免卸载后仍注册监听器造成永久泄漏。
- [x] **模式指示器漏了 SEARCH** — 改为表驱动，缺失模式会 `console.warn`。
- [x] **未捕获的 promise rejection** — 新增 `runCommand()` 错误边界，同时兜住
      同步抛出和 rejected promise。
- [x] **`escapeHtmlId` 只替换首个匹配** — 改用 `CSS.escape`。
- [x] **`isElementVisible` 只判左上角** — 改为真正的相交检测，另加
      `isElementFullyVisible` 供 hint 定位使用。
- [x] **`viewMoreDailyLogIfPossible` 每次 j/k 都触发** — 只在 `G` 到底时调用。
- [x] **`firstBlock()` 漏掉编辑中的块** — 改用 `blocks()[0]`。
- [x] **`waitForSelectionToExist` 无超时 / 无法取消** — 支持 `timeout` 与 `signal`。
- [x] **代码块里所有 vim 键都被吞掉**（`/` 触发搜索、`j`/`k` 移动光标而不是输入字符）
      —— `isEditElement()` 只认 `INPUT`/`TEXTAREA`/`SELECT`，而 Roam 的代码块用
      CodeMirror，编辑面是 contenteditable div，于是 `getMode()` 判成 NORMAL。
      修法：`isEditElement()` 认 `isContentEditable`，`getMode()` 再加一层
      `closest('.CodeMirror, .cm-editor')` 兜底（应对焦点落在 wrapper 上的情况）。
      注意这是先前就存在的 bug，不是本轮重构引入的。
- [x] **Escape 从来没被我们处理过** — `handleKeydown` 的放行判断是"页面上有没有
      Blueprint overlay"。实测（见 `roamVimMode.diagnose()`）：**空闲的 Roam 常驻挂着
      约 6 个 `.bp3-overlay` 和 4 个 `.bp3-overlay-open`**，所以无论用哪个类名，
      判断都恒为真，每个 Escape 都被直接交给 Roam，`matchCommand` 一次都没执行过。
      表现为：帮助面板只能用 `?` 关；编辑后按 Esc 走 Roam 原生两段式（编辑 →
      蓝色选中 → 取消），看起来像"先进 VISUAL 再进 NORMAL"。
      **正确的判断是焦点位置，不是元素存在性**：`document.activeElement.closest(roamModal)`。
      配套：我们自己的模态 UI（帮助面板 / leader 菜单）优先；键盘监听器移到
      `window` 捕获阶段（严格早于 `document` 捕获）并改用 `stopImmediatePropagation()`，
      让 Roam 根本看不到我们已接管的键；`returnToNormalMode()` 改为自校正循环，
      最多 6 次合成 Esc 直到 `getMode()` 收敛到 NORMAL。
      **教训：任何"某元素存在 ⇒ 某状态"的判断，都要先在真实 Roam 里数一遍。**
- [x] **合成鼠标事件序列错误** — 原来是 `['mousedown', 'click', 'mouseup']`：
      `click` 排在 `mouseup` 之前，且完全没有 pointer 事件。真实顺序是
      `pointerdown → mousedown → pointerup → mouseup → click`。React 和 Blueprint
      在现代版本上都绑 pointer 事件，缺失时相关处理器根本不触发。
- [x] **合成事件派发目标错误** — `blurEverything()` 把点击目标挂在 `document.body`，
      而 Roam 的 React root 是 `#app`；React 把监听器挂在 root 容器上，
      在 body 层级派发的事件永远进不了 React 树，等于空操作。
      新增 `keyEventTarget()`：焦点落到 `<body>` 时改向 `#app` 派发。
- [x] **`ReferenceError: getBlockUid is not defined`** — `export ... from` 是纯转发，
      不产生本地绑定，而同文件又把它 import 成了别名 `parseBlockUid`。
      单测结构上抓不到这类错误（那些路径需要真实 DOM 才能执行），因此引入 ESLint
      `no-undef` 并接入 `npm run check` 与 CI。
- [x] **`:block/_children` 形状假设** — 兼容单 map 与数组两种返回形状。
- [x] **合成按键事件没有 `key`** — `new KeyboardEvent(type, {keyCode})` 不会填充
      `event.key`，而 React/Roam 读的是 `key`。导致 `pressEnter` / `pressEsc` /
      `pressBackspace` / 方向键全部无效（只有 `undo` 那处碰巧传了 `key: 'z'`）。
      最明显的症状是 `o` 只进编辑态、不创建 block。
      修法：新增 `keyDescriptor()`，同时填 `key` / `code` / `keyCode` / `which`。
- [x] **自己响应自己合成的按键** — 捕获阶段监听器会收到我们 dispatch 的事件，
      `V`（内部 `pressEsc`）一直在和自己打架。新增 `SYNTHETIC_KEY_FLAG` 标记跳过。
- [x] **`o` / `O` 改走官方 API** — 不再依赖 Enter 模拟。`o` 复刻 Roam 的规则：
      有子块且展开 → 新建首个子块，否则 → 建同级下一个；`O` 建同级上一个。
      Enter 模拟保留为 fallback。

### 架构改进

- [x] **接入官方 `roamAlphaAPI`**（新增 `src/roam-api.js`）
      删除 / 撤销 / 重做 / 折叠 / 光标定位 / 读取 block 文本 / 移动 block
      全部改走官方 API，DOM 模拟只作为 fallback。
      `dd` 不再需要先聚焦 block（此前会顺带把用户丢进 INSERT 模式）。
      `activateBlock` 改为轮询等待 textarea 挂载，取代原来"点击后等 20ms"的猜测。
- [x] **事件驱动替代轮询** — `mode-indicator.js` 的 `setInterval(100)` 删除，
      改为 `mode.js` 的 `onModeChange()`（交互事件 + `mode-events.js` 显式通知）。
- [x] **删除重复 CSS** — 删掉根目录 `extension.css`（与 `styles.js` 内容漂移，
      hint5 一个写 `[f]` 一个写 `[b]`）。`styles.js` 成为唯一来源。
- [x] **启用 page-hints** — 接上 `f` / `F`（`SPC f b` 走块 hint），
      226 行不可达代码复活；`keybindings.js` 里重复的 backspace 渲染逻辑
      合并进 `renderHintLabels()`。
- [x] **填充 Spacemacs leader 配置** — 不再是"打开后弹空面板"的陷阱，
      顺带复活 `copyBlockReference` / `copyBlockEmbed` / `closeSidebarPage` 等命令。
- [x] **VISUAL 模式可用** — 此前 `V` 之后除 Esc 外全部无响应，
      `jumpBlocksInFocusedPanel` 的 VISUAL 分支实际不可达。现在 j/k 可扩展选区。
- [x] **清理死代码** — `growHighlight*`、`ctrlShiftClickHint`、
      `enterOrCutInVisualMode`、`paste` / `pasteBefore` / `cutAndGoBackToNormal`
      （基于废弃的 `execCommand`）、`selectManyBlocks*`、`scroll*`、
      `listenToEvent`、`pressTab` / `pressShiftTab`、`getSetting` / `setSetting`、
      `isWhichKeyActive` / `getWhichKeyState` / `isLeaderModeActive`、
      yank register（剪贴板已覆盖）、`RoamNode` 未使用的方法。
- [x] **Magic numbers 提取** — `SEQUENCE_TIMEOUT_MS`、
      `BLOCK_ACTIVATION_TIMEOUT_MS`、`SEARCH_MAX_MATCHES` 移入 `constants.js`。
- [x] **卸载清理完整** — `stopVimMode()` 现在会清掉搜索框 / 高亮 / hint 覆盖层 /
      帮助面板 / which-key / 键盘序列状态 / panel 缓存。
- [x] **测试与 CI** — `npm test`（node:test，22 个用例，无需 jsdom）+
      GitHub Actions，并校验 `extension.js` 与 `src/` 未漂移。

---

## 待办

### 中优先级

#### 1. `getMode()` 缓存
每次按键调用 1–2 次 `document.querySelector`。轮询已经去掉，实测成本可忽略，
所以**刻意没有加缓存** —— 缓存会引入命令执行中途状态过期的风险。
如果之后 profile 发现是热点，再考虑按 microtask 失效的缓存。

#### 2. 拆分 Roam God Object
`roam.js` 的 `Roam` 对象方法仍然偏多。现在 `roam-api.js` 已经承担了数据层，
剩下的可以进一步拆：
- [ ] `RoamEditor` — activateBlock / deleteBlock / createBlockBelow
- [ ] `RoamCursor` — moveCursorToStart / moveCursorToEnd / save / applyToCurrent

#### 3. 统一命名规范
- [ ] 审查 "clear" vs "hide" vs "remove" 的语义
- [ ] 审查 "select" vs "focus" vs "highlight" 的语义

### 低优先级

#### 4. 类型标注
- [ ] 主要函数已补 JSDoc，可考虑加 `checkJs` 或迁移 TypeScript

#### 5. 扩大测试覆盖
当前测试只覆盖不依赖 DOM 的纯逻辑（键序列匹配、block id 解析、工具函数）。
- [ ] 引入 jsdom，覆盖 panel 选择 / search range / hint 定位
- [ ] mock `roamAlphaAPI` 覆盖 `roam-api.js` 的写操作

#### 6. 未接线的能力
- [ ] `setLeaderConfig()` 是给用户自定义 leader 树的公开入口，但没有 UI
- [ ] `roam-api.js` 的 `createBlock` 目前无调用方（保留为完整 CRUD 面）

---

## 备注

- `o` 的语义刻意复刻 Roam 的 Enter 规则（有展开子块 → 建首个子块，否则 → 建同级），
  只是实现从"模拟 Enter"换成了官方 API，行为不变但不再依赖键盘事件和渲染时序。
- 修改 `roam.js` / `roam-api.js` 时注意：这是与 Roam 交互的核心，需谨慎测试。
- `roam-alpha-api.md` 是官方 API 文档快照，改动数据层前先查它，不要凭记忆写。
