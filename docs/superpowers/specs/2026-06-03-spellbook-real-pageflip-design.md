# 法师法术书真实翻页（StPageFlip）重构设计

> 日期：2026-06-03
> 状态：待用户确认
> 关联：替换 `SpellbookView.vue` 现有的"贴翻页帧图片"伪翻页

## 1. 目标

把法师实战法术书（`SpellbookView.vue`）的翻页效果，从现在的
"播放 fanye1~4 四帧静态图 + CSS 淡入淡出"（伪翻页，生硬、图文对不上），
升级为 **StPageFlip 驱动的真实 3D 翻页**（页面像真书一样弯曲翻过去，支持手指拖拽）。

**业务逻辑完全不变**：本页仍是"实战施法记录器"——读取车卡阶段已选的戏法 + 已准备法术，
玩家点法术施放、按 DND 2024 规则扣对应环法术位、长休恢复、奥术回想、专注管理。
本次只换"翻页表现层"，不动施法逻辑。

## 2. 范围

### 本期做（In Scope）
- 引入 `page-flip`（StPageFlip）库，npm 安装，打包进 Vite
- 把"环阶导航"从书签栏切换，改为 **一环阶一页、左右翻页** 的真实翻页书
- 单页模式（一次显示一页），契合手机竖屏 + 单环宝石栏逻辑
- 抽出 `useFlipBook.js` composable，封装 StPageFlip 的命令式生命周期
- 施法弹层从"卡内绝对定位覆盖层"改为 **Teleport 居中弹窗**，翻页时自动关闭
- 保留书签导航条作为"快速跳环阶"入口（点击 → `flip(pageNum)`）
- 完整保留现有全部施法能力（见 §3）

### 本期不做（Out of Scope，YAGNI）
- 火焰/宝石燃烧特效升级（用户自行处理 `flameParticles.js` / Lottie，不在本次翻页重构内）
- 双页跨页书（手机竖屏不适用，且使"当前环"概念模糊）
- 翻页页集的动态增删（见 §5 核心约束）
- 缩放（StPageFlip 的 zoom 功能，本工具页不需要）
- 非法师职业的法术书（现有 gate 占位页保留）

## 3. 必须保留的现有能力（重构不得破坏）

| 能力 | 现状位置 | 重构后归属 |
|---|---|---|
| 非法师 gate 占位 | `v-if="!isWizard"` | 不变 |
| header：角色名/子职/等级 | `book-header` | 不变（书外固定） |
| DC / 攻击实时计算 | `spellSaveDc`/`spellAttackBonus` computed | 不变 |
| 环阶导航 | `bookmark-nav` 书签 | 改为"跳页"入口 + 真实翻页 |
| 每环已准备法术列表 | `currentSpells` | 成为"页内容" |
| 戏法页 | `currentLevel===0` | 第一页 |
| 点法术 → 施法弹层 | `cast-panel` 卡内覆盖 | 改为 Teleport 弹窗 |
| 环阶选择器 + 升环提示 | `slot-options`/`upcastHint` | 移入 Teleport 弹窗 |
| 魔法环 SVG | `magic-ring` | 移入 Teleport 弹窗 |
| 戏法不耗位 / 仪式不耗位 | `executeCast` mode 分支 | 不变 |
| 仪式 toast（"+10分钟·不耗位"） | `ritualToast` | 不变 |
| 专注条 + 替换确认 | `concentration-strip`/`pendingCast` | 不变（书外固定） |
| 底部宝石栏 + 烧宝石 | `slot-footer`/`gem-burn` | 不变（书外固定，对应当前页环阶） |
| 奥术回想 modal | `showRecovery` | 不变 |
| 长休 modal + 完成 toast | `showRestConfirm`/`showRestDone` | 不变 |
| runtime 持久化（专注/回想） | localStorage `runtimeStorageKey` | 不变 |

**结论：施法/规则逻辑零改动，只重构"环阶呈现"与"施法弹层位置"两处。**

## 4. 架构

### 4.1 布局：书外固定 + 书内翻页

```
┌─────────────────────────────────────┐
│ header（书脊·标题·角色·DC·攻击）       │ ← 书外固定，不翻
├─────────────────────────────────────┤
│ [戏][I][III][V] 书签（快速跳环阶）     │ ← 书外固定；点击 = flip 到该页
├─────────────────────────────────────┤
│ 专注：飞行术 [结束]                   │ ← 书外固定（若有专注）
├─────────────────────────────────────┤
│ ╔═══ StPageFlip 翻页区 ═══╗          │
│ ║  当前环页：该环已准备法术列表 ║      │ ← 真实翻页区（唯一翻页 DOM）
│ ║  · 法术卡 × N（点→Teleport弹层）║   │
│ ╚═══════════════════════╝          │
├─────────────────────────────────────┤
│ N环法术位 ●●●○○ [回想][长休]         │ ← 书外固定；对应"当前可见页"的环阶
└─────────────────────────────────────┘
```

**只有中间翻页区是 StPageFlip 接管的 DOM。** header、书签、专注条、宝石栏、所有 modal 都在翻页区**之外**，由 Vue 正常声明式渲染，不被翻页几何影响。

### 4.2 三条防乱套铁律

StPageFlip 是命令式 DOM 库（`new PageFlip()` + `loadFromHtml`），与 Vue 响应式结合的唯一风险是"两者抢同一块 DOM"。守住三条即不乱套：

1. **页节点数量进入后冻结**：`flipPages` 数组在 `onMounted` 前由 `availableTabs` 快照确定，之后**永不增删**。StPageFlip 加载后页几何稳定。
2. **页内内容用 Vue 渲染，但只改文字/class，不增删页节点**：剩余宝石数、"已耗尽"状态等响应式更新，不动页 DOM 结构，StPageFlip 不受影响。
3. **施法弹层 Teleport 到 body**：完全在翻页 DOM 之外，永不被翻页变换裁剪/克隆。

### 4.3 唯一命令式封装：`useFlipBook.js`

```
useFlipBook(containerRef, { pageSelector, onFlip }) 返回：
  init()        // onMounted+nextTick 调：new PageFlip + loadFromHtml
  destroy()     // onUnmounted 调：pageFlip.destroy()
  flipTo(index, { animated })  // 书签点击跳页：flip() 或 turnToPage()
  currentPage   // ref，由 StPageFlip 'flip' 事件同步
```

**约束**：全项目只有 `useFlipBook.js` 能 import `page-flip`、能调 `document.querySelector`、能碰 PageFlip 实例。`SpellbookView.vue` 一行命令式翻页代码都不写。

StPageFlip 配置（经 API 核对）：
```js
new PageFlip(container, {
  size: 'stretch',          // 自适应容器
  minWidth: 280, maxWidth: 600,
  minHeight: 360, maxHeight: 900,
  usePortrait: true,        // 竖屏单页
  showCover: false,
  maxShadowOpacity: 0.5,
  mobileScrollSupport: true,
  disableFlipByClick: true, // 关键：点法术卡不触发翻页，只拖拽/书签翻
  flippingTime: 700,
})
pageFlip.loadFromHtml(container.querySelectorAll('.flip-page'))
pageFlip.on('flip', e => onFlip(e.data))  // e.data = 页码
```

## 5. 数据流与核心约束

```
进入 SpellbookView
  → availableTabs 快照 → flipPages = [0,1,3,5]（冻结，永不变）
  → Vue 渲染每页 <section class="flip-page" v-for="lv in flipPages">
  → onMounted + nextTick → useFlipBook.init() → loadFromHtml
  → StPageFlip 接管翻页几何

翻页（拖拽 / 点书签）
  → 'flip' 事件 → currentPage 同步 → currentLevel = flipPages[currentPage]
  → 书外宝石栏/专注条按 currentLevel 实时显示

施法
  → 点法术卡 → activeSpell=该法术 → Teleport 弹窗
  → 选环阶 → 升环提示 → 施法/仪式
  → setSpellSlotUsed → slotsUsed 数据变
  → 页内"剩余N"、宝石、书签角标实时刷新（节点不增删）✓

长休 / 奥术回想
  → 只改 slotsUsed → 宝石实时恢复 → flipPages 不变 ✓
```

### 核心约束（不乱套的根本）
**`flipPages` 进入法术书时快照冻结，全程不增删页。**
即使某环法术位耗尽（算法上"无内容"），该页仍保留，显示"已耗尽/空"状态，**不消失**。
理由：翻页中途页节点增删会打断 StPageFlip 几何 → 翻页错位。页内数据照常响应式刷新，体验无损。

### 书签 ↔ 翻页同步
- 书签点击 → `useFlipBook.flipTo(index, { animated:true })` → StPageFlip 翻过去
- 拖拽翻页 → 'flip' 事件 → 高亮对应书签
- 双向同步通过单一 `currentPage` ref，无第二事实来源

## 6. 错误与边界处理

- StPageFlip init 失败 / 容器尺寸为 0 → try/catch 兜底降级为"无翻页竖向滚动列表"（`flip-page` 用普通 flow 布局），不白屏
- 只有 1 页（仅准备戏法）→ 单页正常显示，无翻页交互
- 非法师 → 现有 gate 占位页，不初始化翻页
- 翻页时若施法弹窗开着 → 监听翻页开始事件，自动关闭 `activeSpell`
- 组件卸载 → `useFlipBook.destroy()` 销毁实例 + 解绑事件，防内存泄漏
- 窗口 resize → StPageFlip `size:'stretch'` + `autoSize` 自适应，无需手动处理

## 7. 测试策略

施法/规则逻辑未改，沿用现状。翻页是表现层，以手动验收为主：

- **逻辑回归**（已有，确保未被破坏）：施法扣位、升环可用环筛选、专注替换、奥术回想总环阶上限、长休恢复
- **翻页手动验收**：
  - 拖拽翻页流畅、不错位、页内法术文字清晰
  - 点书签跳到对应环阶页
  - 施法扣位后该页宝石/剩余数实时更新，翻页结构不乱
  - 点法术卡弹出 Teleport 弹窗（不被翻页裁剪），翻页时弹窗自动关
  - 长休后所有页宝石恢复，页集不变
  - 移动端竖屏：单页显示、自适应宽高、拖拽手感正常
  - 卸载页面无报错、无残留 DOM

## 8. 实现顺序（供 writing-plans 细化）

1. `npm i page-flip`，确认打包正常
2. 抽 `useFlipBook.js`：封装 init/destroy/flipTo/currentPage（命令式全关这里）
3. `SpellbookView.vue` 模板：把环阶页改为 `.flip-page` v-for（flipPages 快照）
4. 接 `useFlipBook`：onMounted init / onUnmounted destroy / flip 事件同步 currentLevel
5. 施法弹层迁移：cast-panel → Teleport 居中弹窗，翻页时自动关
6. 书签导航改为 flipTo 跳页 + 翻页高亮同步
7. 边界兜底：init 失败降级、单页、resize
8. 移动端竖屏回归 + 逻辑回归验收

## 9. 风险

- **命令式库与 Vue 响应式冲突**：用"三条铁律 + useFlipBook 单点封装"隔离，最大风险已收敛到一个文件。
- **`loadFromHtml` 时机**：必须在 Vue 渲染出 `.flip-page` 后（`nextTick`），否则 NodeList 为空。已在实现顺序 step 4 标注。
- **`disableFlipByClick` 必须 true**：否则点法术卡会被当成翻页手势，导致施法点击失效——这是 codex 旧版可能的 bug 来源之一。
- **页集冻结的取舍**：耗尽的环页保留显示而非消失，是有意为之（防翻页错位），spec 已明确为预期行为。
