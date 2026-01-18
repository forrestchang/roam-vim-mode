# 架构优化 TODO

基于代码 Review 的优化任务清单。

---

## 高优先级

### 1. 清理死代码
**文件**: `commands.js`

删除以下未使用的导出函数：
- [ ] `growHighlightUp()`
- [ ] `growHighlightDown()`
- [ ] `moveBlockUp()`
- [ ] `moveBlockDown()`
- [ ] `ctrlShiftClickHint()`
- [ ] `enterOrCutInVisualMode()`
- [ ] `copySelectedBlock()` - 检查是否还需要
- [ ] `copySelectedBlockReference()`
- [ ] `copySelectedBlockEmbed()`
- [ ] `closeSidebarPage()`
- [ ] `paste()`, `pasteBefore()`
- [ ] `selectFirstVisibleBlock()`
- [ ] `selectLastVisibleBlock()`
- [ ] `selectManyBlocksUp()`, `selectManyBlocksDown()`
- [ ] `scrollUp()`, `scrollDown()`
- [ ] `cutAndGoBackToNormal()`

同时清理 `roam.js` 中的：
- [ ] `RoamNode.withCursorAtTheStart()`
- [ ] `RoamNode.withCursorAtTheEnd()`
- [ ] `copyBlockReference()`, `copyBlockEmbed()`

---

### 2. 修复静默错误处理
**文件**: `view.js:24-34`

当前代码：
```javascript
try {
    const block = RoamBlock.selected().element;
    // ...
} catch (e) {
    // Silently ignore errors when no block is available
}
```

改进：
- [ ] 添加 `console.warn` 日志
- [ ] 区分"无 block 可用"和真正的错误
- [ ] 考虑添加用户可见的错误提示

---

### 3. 事件驱动替代轮询
**文件**: `mode-indicator.js:29`

当前代码：
```javascript
modeIndicatorInterval = setInterval(updateModeIndicator, 100);
```

改进：
- [ ] 创建 `onModeChange` 事件
- [ ] 在模式变化时触发更新
- [ ] 移除 setInterval 轮询

---

### 4. 优化模式检测性能
**文件**: `mode.js:getMode()`

当前问题：每次按键都调用两次 `document.querySelector()`

改进方案：
- [ ] 缓存 DOM 查询结果
- [ ] 在相关事件（sidebar 变化等）时清除缓存
- [ ] 或改为事件驱动的模式状态管理

---

## 中优先级

### 5. 完善或禁用 Spacemacs 功能
**文件**: `leader-config.js`, `settings.js`

当前问题：框架空的但 UI 设置仍可启用

方案选择：
- [ ] 方案 A: 禁用设置项，添加"Coming Soon"提示
- [ ] 方案 B: 实现基础 leader key 功能

---

### 6. Magic Numbers 提取为常量
**文件**: 多个

需要提取的数值：
- [ ] `keybindings.js:236` - `500` (sequence timeout)
- [ ] `commands.js:77-82` - `8` (blocks to jump)
- [ ] `mode-indicator.js:29` - `100` (polling interval)
- [ ] `utils.js` 中的各种 delay 值

建议在 `constants.js` 中添加：
```javascript
export const SEQUENCE_TIMEOUT_MS = 500;
export const BLOCKS_PER_PAGE = 8;
export const MODE_POLL_INTERVAL_MS = 100;
```

---

### 7. 统一命名规范

状态对象命名：
- [ ] 统一为 `xxxState` 格式（已基本一致）

函数命名：
- [ ] 审查并统一 "clear" vs "hide" vs "remove" 的使用
- [ ] 统一 "select" vs "focus" vs "highlight" 的语义

CSS 类命名：
- [ ] 确保所有类都使用 `EXTENSION_ID` 前缀

---

### 8. 拆分 Roam God Object
**文件**: `roam.js`

当前 `Roam` 对象方法过多，建议拆分为：
- [ ] `RoamEditor` - 编辑相关 (activateBlock, deleteBlock, etc.)
- [ ] `RoamQuery` - 查询相关 (getRoamBlockInput, getActiveRoamNode)
- [ ] `RoamCursor` - 光标相关 (moveCursorToStart, moveCursorToEnd)

---

## 低优先级

### 9. 添加 TypeScript 或 JSDoc
- [ ] 为主要函数添加 JSDoc 类型注解
- [ ] 或考虑迁移到 TypeScript

### 10. 改进测试策略
- [ ] 设计 Roam API mock 方案
- [ ] 添加状态机单元测试
- [ ] 添加命令集成测试

### 11. 性能监控
- [ ] 添加模式检测延迟日志（开发模式）
- [ ] 添加搜索性能日志
- [ ] 识别热点代码

---

## 已完成

- [x] 简化 keybindings（2024-01）
- [x] 移除 user-config.js
- [x] 清空 spacemacs 配置（保留框架）

---

## 备注

- 清理死代码时注意：某些函数可能被动态调用或预留给未来功能
- 修改 `roam.js` 时注意：这是与 Roam 交互的核心，需要谨慎测试
- 性能优化可以分批进行，先解决最明显的问题（轮询 → 事件驱动）
