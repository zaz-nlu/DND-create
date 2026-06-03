# 法师法术书真实翻页（StPageFlip）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `SpellbookView.vue` 的伪翻页（fanye1~4 帧图淡入淡出）换成 StPageFlip 驱动的真实 3D 翻页，施法/规则逻辑完全不变。

**Architecture:** 命令式翻页库的全部生命周期关进单个 `useFlipBook.js` composable；`SpellbookView.vue` 把环阶页改成冻结的 `.flip-page` 列表，header/书签/专注条/宝石栏/所有 modal 留在翻页区之外由 Vue 声明式渲染；施法弹层从卡内覆盖层迁到 Teleport 居中弹窗。

**Tech Stack:** Vue 3 Composition API、Vite、`page-flip`（StPageFlip，`import { PageFlip } from 'page-flip'`）。

参考 spec：`docs/superpowers/specs/2026-06-03-spellbook-real-pageflip-design.md`

---

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `package.json` | 加 `page-flip` 依赖 | Modify |
| `src/composables/useFlipBook.js` | 唯一封装 StPageFlip 命令式逻辑（init/destroy/flipTo/currentPage） | Create |
| `src/composables/spellbookPages.js` | 纯函数：从 character 计算 flipPages 快照（可单测） | Create |
| `test/spellbookPages.test.mjs` | spellbookPages 纯逻辑单测 | Create |
| `src/views/SpellbookView.vue` | 环阶页→.flip-page 列表；接 useFlipBook；施法弹层迁 Teleport；书签改跳页 | Modify |

**关键约束（来自 spec §4.2）**：只有 `useFlipBook.js` 能 `import 'page-flip'` / 调 `document.querySelector` / 碰 PageFlip 实例。`SpellbookView.vue` 不写一行命令式翻页代码。

---

## Task 1: 安装 page-flip 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装依赖**

Run:
```bash
cd "d:/dnd车卡/DND-create" && npm i page-flip
```
Expected: `package.json` 的 dependencies 出现 `"page-flip": "^x.y.z"`，`node_modules/page-flip` 存在。

- [ ] **Step 2: 验证可被 Vite 解析**

Run:
```bash
cd "d:/dnd车卡/DND-create" && node -e "import('page-flip').then(m=>console.log('PageFlip:', typeof m.PageFlip)).catch(e=>{console.error(e);process.exit(1)})"
```
Expected: 输出 `PageFlip: function`（确认导出类名正确）。

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json && git commit -m "chore: 引入 page-flip 用于法术书真实翻页"
```

---

## Task 2: spellbookPages 纯函数（flipPages 快照逻辑）

把"哪些环阶成页"的逻辑抽成纯函数，便于单测，也让 SpellbookView 只消费结果。
逻辑等价于现有 `availableTabs`（spec §5）：戏法页（若有已准备戏法）+ 每个"有法术位或有已准备法术"的环。

**Files:**
- Create: `src/composables/spellbookPages.js`
- Test: `test/spellbookPages.test.mjs`

- [ ] **Step 1: 写失败测试**

Create `test/spellbookPages.test.mjs`:
```js
/**
 * 轻量 Node 测试：computeFlipPages
 * 运行：node test/spellbookPages.test.mjs
 */
import { computeFlipPages } from '../src/composables/spellbookPages.js'

let failed = 0
function assert(cond, label) {
  if (cond) { console.log('  ✓', label) }
  else { failed++; console.error('  ✗', label) }
}

// 有戏法 + 1环法术位 + 3环已准备法术 → [0,1,3]
assert(
  JSON.stringify(computeFlipPages({
    hasCantrips: true,
    slotsByLevel: { 1: 2, 2: 0 },
    preparedCountByLevel: { 3: 1 },
  })) === JSON.stringify([0, 1, 3]),
  '戏法+1环位+3环已准备 → [0,1,3]'
)

// 无戏法 → 不含 0
assert(
  JSON.stringify(computeFlipPages({
    hasCantrips: false,
    slotsByLevel: { 1: 2 },
    preparedCountByLevel: {},
  })) === JSON.stringify([1]),
  '无戏法 → 不含戏法页'
)

// 全空 → 至少返回 [0]（兜底，避免空书）
assert(
  JSON.stringify(computeFlipPages({
    hasCantrips: false,
    slotsByLevel: {},
    preparedCountByLevel: {},
  })) === JSON.stringify([0]),
  '全空 → 兜底 [0]'
)

// 某环只有法术位没准备法术 → 仍成页
assert(
  JSON.stringify(computeFlipPages({
    hasCantrips: false,
    slotsByLevel: { 5: 1 },
    preparedCountByLevel: {},
  })) === JSON.stringify([5]),
  '只有法术位也成页'
)

if (failed) { console.error(`\n${failed} 个断言失败`); process.exit(1) }
console.log('\n全部通过')
```

- [ ] **Step 2: 运行测试，确认失败**

Run:
```bash
cd "d:/dnd车卡/DND-create" && node test/spellbookPages.test.mjs
```
Expected: FAIL — 报错找不到模块 `../src/composables/spellbookPages.js`。

- [ ] **Step 3: 实现纯函数**

Create `src/composables/spellbookPages.js`:
```js
/**
 * 计算法术书的"页集快照"——哪些环阶成为一页。
 * 纯函数，无副作用，便于单测。
 *
 * 规则（等价于旧 availableTabs）：
 *  - 若有已准备戏法 → 包含戏法页 0
 *  - 1~9 环中，任一环有法术位总数 > 0 或有已准备法术 → 该环成页
 *  - 全空兜底返回 [0]，避免空书导致 StPageFlip 加载 0 页报错
 *
 * @param {object} args
 * @param {boolean} args.hasCantrips           是否有已准备戏法
 * @param {Object<number,number>} args.slotsByLevel          各环法术位总数 { 1: 4, 2: 3, ... }
 * @param {Object<number,number>} args.preparedCountByLevel  各环已准备法术数 { 3: 2, ... }
 * @returns {number[]} 升序页码数组，如 [0,1,3]
 */
export function computeFlipPages({ hasCantrips, slotsByLevel = {}, preparedCountByLevel = {} }) {
  const pages = []
  if (hasCantrips) pages.push(0)
  for (let level = 1; level <= 9; level += 1) {
    const slotTotal = Number(slotsByLevel[level]) || 0
    const prepared = Number(preparedCountByLevel[level]) || 0
    if (slotTotal > 0 || prepared > 0) pages.push(level)
  }
  return pages.length ? pages : [0]
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run:
```bash
cd "d:/dnd车卡/DND-create" && node test/spellbookPages.test.mjs
```
Expected: PASS — `全部通过`。

- [ ] **Step 5: 提交**

```bash
git add src/composables/spellbookPages.js test/spellbookPages.test.mjs && git commit -m "feat: 抽 computeFlipPages 纯函数（法术书页集快照）"
```

---

## Task 3: useFlipBook composable（封装 StPageFlip 命令式逻辑）

唯一允许 import page-flip / 操作 DOM 的文件（spec §4.3）。

**Files:**
- Create: `src/composables/useFlipBook.js`

- [ ] **Step 1: 实现 composable**

Create `src/composables/useFlipBook.js`:
```js
import { ref, nextTick } from 'vue'
import { PageFlip } from 'page-flip'

/**
 * 封装 StPageFlip 的命令式生命周期。
 * 全项目只有此文件能 import 'page-flip' / 碰 PageFlip 实例 / 调 querySelector。
 *
 * @param {import('vue').Ref<HTMLElement|null>} containerRef  翻页容器 DOM ref
 * @param {object} opts
 * @param {string} opts.pageSelector  页节点选择器，如 '.flip-page'
 * @param {(pageIndex:number)=>void} opts.onFlip  翻页时回调（StPageFlip 'flip' 事件，data=页码）
 * @param {()=>void} [opts.onFlipStart]  翻页开始回调（用于关闭施法弹窗）
 * @returns {{ currentPage: import('vue').Ref<number>, init: Function, destroy: Function, flipTo: Function, ok: import('vue').Ref<boolean> }}
 */
export function useFlipBook(containerRef, { pageSelector, onFlip, onFlipStart }) {
  const currentPage = ref(0)
  const ok = ref(false) // 初始化是否成功；false 时调用方降级为滚动列表
  let pageFlip = null

  async function init() {
    await nextTick() // 确保 Vue 已渲染出页节点
    const el = containerRef.value
    if (!el) return
    const pages = el.querySelectorAll(pageSelector)
    if (!pages.length) return
    try {
      pageFlip = new PageFlip(el, {
        size: 'stretch',
        minWidth: 280,
        maxWidth: 600,
        minHeight: 360,
        maxHeight: 900,
        usePortrait: true,
        showCover: false,
        maxShadowOpacity: 0.5,
        mobileScrollSupport: true,
        disableFlipByClick: true, // 点法术卡不触发翻页，只拖拽/书签翻
        flippingTime: 700,
      })
      pageFlip.loadFromHtml(pages)
      pageFlip.on('flip', e => {
        currentPage.value = e.data
        onFlip?.(e.data)
      })
      if (onFlipStart) {
        pageFlip.on('changeState', e => {
          if (e.data === 'flipping') onFlipStart()
        })
      }
      ok.value = true
    } catch (err) {
      // 初始化失败 → 降级：调用方用普通滚动列表，不白屏
      console.warn('翻页初始化失败，降级为滚动列表。', err)
      ok.value = false
      pageFlip = null
    }
  }

  /**
   * 跳到指定页。
   * @param {number} index   页节点索引（0-based）
   * @param {{ animated?: boolean }} [o]
   */
  function flipTo(index, { animated = true } = {}) {
    if (!pageFlip) return
    if (animated) pageFlip.flip(index)
    else pageFlip.turnToPage(index)
    currentPage.value = index
  }

  function destroy() {
    if (pageFlip) {
      try { pageFlip.destroy() } catch { /* 已销毁则忽略 */ }
      pageFlip = null
    }
    ok.value = false
  }

  return { currentPage, ok, init, destroy, flipTo }
}
```

- [ ] **Step 2: 确认构建可解析（无下游消费者，仅验证语法/import）**

Run:
```bash
cd "d:/dnd车卡/DND-create" && node -e "import('./src/composables/useFlipBook.js').then(()=>console.log('ok')).catch(e=>{console.error(e.message);process.exit(1)})"
```
Expected: 输出 `ok`（page-flip 已装、import 路径正确；Vue 的 ref/nextTick 在 node 下能解析）。
> 注：若 node 因 vue 浏览器依赖报错，改为 `npx vite build` 在 Task 5 一并验证，本步可跳过——但优先尝试本步。

- [ ] **Step 3: 提交**

```bash
git add src/composables/useFlipBook.js && git commit -m "feat: useFlipBook 封装 StPageFlip 命令式生命周期"
```

---

## Task 4: SpellbookView 模板——环阶页改为冻结的 .flip-page 列表

把"单个 currentLevel 页"改成"一次性渲染所有 flipPages 对应的页节点"，让 StPageFlip 接管翻页。
施法弹层迁移与书签跳页在 Task 5/6，本任务先把页结构与 useFlipBook 接好，保证翻页能跑。

**Files:**
- Modify: `src/views/SpellbookView.vue`（script setup + template + 少量 style）

参考当前结构（Read 确认行号后再改）：
- script 顶部已 import flip 帧图（`flipFrame1~4`）、`playFlip`、`switchLevel`、`flipFrame`、`flipTimer` —— 这些是旧伪翻页，本任务移除。
- 现有 `currentLevel` / `currentSpells` / `availableTabs` 保留供书外宝石栏与书签使用。

- [ ] **Step 1: script——引入 useFlipBook 与 computeFlipPages，移除旧伪翻页**

在 `src/views/SpellbookView.vue` 的 `<script setup>` 中：

1）顶部 import 增加：
```js
import { useFlipBook } from '../composables/useFlipBook.js'
import { computeFlipPages } from '../composables/spellbookPages.js'
```

2）删除旧伪翻页相关：import 的 `flipFrame1~4`、常量 `FLIP_FRAMES`、`flipFrame` ref、`flipTimer`、`playFlip()` 函数、`switchLevel()` 里的 `playFlip()` 调用与 onMounted 中 `FLIP_FRAMES.forEach 预加载`、onUnmounted 中 `clearInterval(flipTimer)`、模板里的 `<div v-if="flipFrame" class="flip-overlay">`、相关 `.flip-overlay`/`@keyframes flip-fade` CSS。

3）新增 flipPages 快照（进入时计算一次，冻结）：
```js
const bookRef = ref(null) // 翻页容器 DOM

// 进入页面时快照，之后冻结，不随施法/长休增删（spec §5 核心约束）
const flipPages = computeFlipPages({
  hasCantrips: preparedCantrips.value.length > 0,
  slotsByLevel: Object.fromEntries(slotLevels.value.map(lv => [lv, slotTotal(lv)])),
  preparedCountByLevel: Object.fromEntries(
    Array.from({ length: 9 }, (_, i) => i + 1).map(lv => [lv, preparedByLevel.value[lv]?.length || 0])
  ),
})

function pageSpells(level) {
  return level === 0 ? preparedCantrips.value : (preparedByLevel.value[level] ?? [])
}

const { currentPage, ok: flipOk, init: initFlip, destroy: destroyFlip, flipTo } =
  useFlipBook(bookRef, {
    pageSelector: '.flip-page',
    onFlip: index => { currentLevel.value = flipPages[index] ?? 0 },
    onFlipStart: () => { activeSpell.value = null },
  })
```

4）`onMounted` 末尾加 `initFlip()`；`onUnmounted` 加 `destroyFlip()`。
保留现有 `loadRuntime()`。最终 onMounted：
```js
onMounted(() => {
  loadRuntime()
  initFlip()
})
onUnmounted(() => {
  destroyFlip()
  if (burnTimer) clearTimeout(burnTimer)
  if (restTimer) clearTimeout(restTimer)
  if (ritualTimer) clearTimeout(ritualTimer)
})
```
（注意：旧 onUnmounted 里的 `clearInterval(flipTimer)` 一并删除。）

- [ ] **Step 2: template——把单页区改为 .flip-page 列表**

把现有 `<section class="page-viewport">` 内的 `parchment-page`（只渲染 currentSpells 单页）替换为：渲染 flipPages 每一页。容器绑定 `ref="bookRef"`。

将原本的：
```html
<section class="page-viewport">
  <div class="parchment-page">
    <div class="spell-scroll">
      ...（单页内容，用 currentSpells）
    </div>
  </div>
</section>
```
改为：
```html
<section class="page-viewport">
  <div ref="bookRef" :class="['flip-book', { 'flip-fallback': !flipOk }]">
    <section
      v-for="level in flipPages"
      :key="level"
      class="flip-page"
      data-density="soft"
    >
      <div class="parchment-page">
        <div class="spell-scroll">
          <div class="section-title">
            <span></span>
            <strong>{{ CHINESE_LEVELS[level] }}{{ level ? '法术' : '' }}</strong>
            <span></span>
          </div>

          <div v-if="!pageSpells(level).length" class="empty-state">
            <b>∴</b>
            <p>{{ level === 0 ? '尚未选择法师戏法' : '此环暂无已准备法术' }}</p>
          </div>

          <article
            v-for="spell in pageSpells(level)"
            :key="spell.id"
            :class="['spell-entry', { open: activeSpell?.id === spell.id }]"
            :style="{ '--school': schoolColor(spell.school) }"
            @click="openSpell(spell)"
          >
            <div class="spell-entry-content">
              <div class="spell-name-row">
                <h2>{{ spell.name }}</h2>
                <i>{{ spell.nameEn }}</i>
              </div>
              <div class="spell-tags">
                <span>{{ spell.school }}</span>
                <span v-if="spell.castingTime">{{ spell.castingTime }}</span>
                <span v-if="spell.range">{{ spell.range }}</span>
                <span v-if="spell.concentration" class="tag-concentration">专注</span>
                <span v-if="spell.ritual" class="tag-ritual">仪式</span>
              </div>
              <p>{{ shortDescription(spell) }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</section>
```
> 注意：原来卡内的 `<div v-if="activeSpell?.id===spell.id" class="cast-panel">…</div>` 整块**从此处移除**（Task 5 迁到 Teleport 弹窗）。本任务先让它不再出现在页内。

- [ ] **Step 3: style——加 flip-book 容器与降级样式**

在 `<style scoped>` 中，`.page-viewport` 相关附近新增：
```css
.flip-book {
  position: absolute;
  inset: 0;
}
.flip-page {
  width: 100%;
  height: 100%;
  background: var(--page-texture) center / cover;
}
/* 初始化失败降级：普通竖向滚动，不依赖 StPageFlip */
.flip-fallback {
  position: absolute;
  inset: 0;
  overflow-y: auto;
}
.flip-fallback .flip-page {
  height: auto;
  min-height: 60%;
  border-bottom: 1px solid rgba(88, 61, 32, 0.26);
}
```
（保留现有 `.parchment-page` / `.spell-scroll` / `.spell-entry` 等样式，它们现在作用在每个 flip-page 内。）

- [ ] **Step 4: 构建验证**

Run:
```bash
cd "d:/dnd车卡/DND-create" && npx vite build 2>&1 | grep -E "built|error|Error" | head -5
```
Expected: `✓ built` 无 error。

- [ ] **Step 5: 提交**

```bash
git add src/views/SpellbookView.vue && git commit -m "feat: 法术书环阶页改为 StPageFlip 真实翻页（移除伪翻页帧图）"
```

---

## Task 5: 施法弹层迁移到 Teleport 居中弹窗

把原 `cast-panel`（卡内绝对定位覆盖层）改为 Teleport 到 body 的居中弹窗（spec §2/§4.2），
内容（魔法环 SVG + 环阶选择 + 升环提示 + 施法/仪式按钮）原样搬过去。

**Files:**
- Modify: `src/views/SpellbookView.vue`（template + style）

- [ ] **Step 1: template——新增施法 Teleport 弹窗**

在现有其它 `<Teleport>`（pendingCast/showRecovery/...）旁，新增一个施法弹窗。`v-if="activeSpell"` 控制：
```html
<Teleport to="body">
  <div v-if="activeSpell" class="modal-backdrop cast-backdrop" @click.self="activeSpell = null">
    <section class="cast-modal" :style="{ '--ring': schoolRingColor(activeSpell.school) }">
      <button class="close-panel" type="button" title="关闭" @click="activeSpell = null">×</button>

      <svg class="magic-ring" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <g class="ring-outer">
          <circle cx="40" cy="40" r="34" :stroke="schoolRingColor(activeSpell.school)" stroke-width="1.5" stroke-dasharray="8 4"/>
          <circle cx="40" cy="40" r="29" :stroke="schoolRingColor(activeSpell.school)" stroke-width="0.6"/>
        </g>
        <g class="ring-inner">
          <circle cx="40" cy="40" r="20" :stroke="schoolRingColor(activeSpell.school)" stroke-width="1" stroke-dasharray="5 3"/>
        </g>
        <circle cx="40" cy="40" r="9" :fill="schoolRingColor(activeSpell.school)" class="ring-core"/>
        <circle cx="40" cy="40" r="5" :fill="schoolRingColor(activeSpell.school)"/>
      </svg>

      <h2 class="cast-title">{{ activeSpell.name }}</h2>
      <p class="cast-en">{{ activeSpell.nameEn }}</p>

      <div class="cast-controls">
        <template v-if="activeSpell.level === 0">
          <small>戏法不消耗法术位</small>
          <button class="primary-cast" type="button" @click="prepareCast(activeSpell, 'cantrip')">施法</button>
        </template>
        <template v-else>
          <div class="slot-options">
            <button
              v-for="level in castableSlotLevels"
              :key="level"
              type="button"
              :class="{ selected: selectedSlotLevel === level }"
              @click="selectedSlotLevel = level"
            >
              {{ level }}环 <small>{{ slotRemaining(level) }}</small>
            </button>
          </div>
          <small v-if="upcastHint(activeSpell)" class="upcast-hint">{{ upcastHint(activeSpell) }}</small>
          <small v-if="!castableSlotLevels.length && !activeSpell.ritual" class="no-slots">没有可用法术位</small>
          <small v-else-if="!castableSlotLevels.length && activeSpell.ritual" class="ritual-only">无可用法术位，可改用仪式施法</small>
          <small v-if="activeSpell.ritual" class="ritual-hint">仪式：不消耗法术位，施法 +10 分钟</small>
          <div class="cast-actions">
            <button v-if="activeSpell.ritual" type="button" class="ritual-cast" @click="prepareCast(activeSpell, 'ritual')">仪式施展</button>
            <button
              v-if="castableSlotLevels.length"
              class="primary-cast"
              type="button"
              @click="prepareCast(activeSpell)"
            >施法</button>
          </div>
        </template>
      </div>
    </section>
  </div>
</Teleport>
```
> `castableSlotLevels`、`upcastHint`、`prepareCast`、`slotRemaining`、`selectedSlotLevel`、`schoolRingColor` 都已存在，直接复用。

- [ ] **Step 2: style——加 cast 弹窗样式，复用魔法环动画**

魔法环动画类（`.magic-ring`/`.ring-outer`/`.ring-inner`/`.ring-core` 及其 `@keyframes ring-spin`/`core-pulse`）已存在，保留。新增弹窗外壳样式：
```css
.cast-backdrop { z-index: 110; }
.cast-modal {
  position: relative;
  width: min(320px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 20px 20px;
  border: 1px solid rgba(201, 167, 76, 0.4);
  border-radius: 6px;
  color: #d7c7a2;
  background: #14110d;
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.6);
}
.cast-modal .magic-ring { width: 88px; height: 88px; flex: none; }
.cast-title { color: #efd67f; font: 700 18px var(--font-title); }
.cast-en { color: #93805d; font-size: 11px; margin-top: -4px; }
.cast-modal .cast-controls { width: 100%; align-items: stretch; color: #bda875; }
.cast-modal .slot-options { justify-content: center; }
.cast-modal .cast-actions { justify-content: center; }
```
（原 `.cast-panel` / `@keyframes cast-reveal` 若不再被引用，删除以免死代码。）

- [ ] **Step 3: 构建验证**

Run:
```bash
cd "d:/dnd车卡/DND-create" && npx vite build 2>&1 | grep -E "built|error|Error" | head -5
```
Expected: `✓ built` 无 error。

- [ ] **Step 4: 提交**

```bash
git add src/views/SpellbookView.vue && git commit -m "feat: 施法弹层迁移到 Teleport 居中弹窗（脱离翻页 DOM）"
```

---

## Task 6: 书签导航改为翻页跳转 + 双向同步

书签从"切 currentLevel"改为"调 flipTo 翻到该页"；拖拽翻页时书签高亮跟随（已由 onFlip 同步 currentLevel 实现）。

**Files:**
- Modify: `src/views/SpellbookView.vue`（template 书签点击 + 移除旧 switchLevel）

- [ ] **Step 1: 书签点击改为 flipTo**

现有 `bookmark-nav` 里按钮 `@click="switchLevel(level)"`。把 `switchLevel` 改为新函数 `goToLevel`：

script 中新增（并删除旧 `switchLevel`）：
```js
function goToLevel(level) {
  const index = flipPages.indexOf(level)
  if (index < 0) return
  if (flipOk.value) {
    flipTo(index, { animated: true }) // onFlip 会同步 currentLevel
  } else {
    currentLevel.value = level // 降级模式：直接切（滚动列表）
  }
}
```
template 书签按钮改：
```html
@click="goToLevel(level)"
```
并把 `availableTabs` 的来源对齐为 `flipPages`（书签应与页一一对应）。把书签 `v-for="level in availableTabs"` 改为 `v-for="level in flipPages"`。
（`availableTabs` computed 若不再被其它地方使用，可删除；否则保留。）

- [ ] **Step 2: 当前页书签高亮**

书签 `active` 判定已是 `currentLevel === level`，而 `currentLevel` 由 onFlip 同步——拖拽翻页时自动高亮正确页。无需额外改动，确认 template 中：
```html
:class="['bookmark', { active: currentLevel === level, ... }]"
```
保持不变即可。

- [ ] **Step 3: 构建验证**

Run:
```bash
cd "d:/dnd车卡/DND-create" && npx vite build 2>&1 | grep -E "built|error|Error" | head -5
```
Expected: `✓ built` 无 error。

- [ ] **Step 4: 提交**

```bash
git add src/views/SpellbookView.vue && git commit -m "feat: 书签导航改为 flipTo 翻页跳转，与拖拽翻页双向同步"
```

---

## Task 7: 手动验收 + 逻辑回归

无新代码，按 spec §7 清单逐项验证。先跑已有逻辑测试确保未破坏，再人工验翻页。

**Files:** 无

- [ ] **Step 1: 逻辑回归——跑所有已有测试**

Run:
```bash
cd "d:/dnd车卡/DND-create" && for f in test/*.test.mjs; do echo "== $f =="; node "$f" || echo "FAIL: $f"; done
```
Expected: 全部 PASS（含新增 `spellbookPages.test.mjs`），无 FAIL。

- [ ] **Step 2: 启动 dev 服务器手动验收**

Run:
```bash
cd "d:/dnd车卡/DND-create" && npm run dev
```
然后用法师角色进入 `/spellbook`，逐项确认（spec §7）：
- [ ] 拖拽翻页流畅、不错位，页内法术文字清晰
- [ ] 点书签跳到对应环阶页，书签高亮跟随当前页
- [ ] 点法术卡 → 居中 Teleport 弹窗出现（不被翻页裁剪）
- [ ] 选环阶 + 升环提示正确；点"施法"扣对应环法术位，该页/底部宝石实时 -1
- [ ] 仪式法术点"仪式施展"→ toast 出现、不扣位
- [ ] 翻页时若弹窗开着，弹窗自动关闭
- [ ] 专注法术施法 → 专注条出现；已专注时再施专注法术 → 替换确认
- [ ] 长休 → 所有页宝石恢复，页集（页数）不变
- [ ] 奥术回想 → 按上限恢复法术位
- [ ] 移动端竖屏（或窄窗口）：单页显示、自适应、拖拽手感正常
- [ ] 某环法术位耗尽 → 该页仍在，显示空/已耗尽，不消失
- [ ] 离开 `/spellbook` 再返回，无控制台报错、无残留 DOM

- [ ] **Step 3: 若初始化失败降级验证**

临时在 `useFlipBook.init()` 的 try 块首行 `throw new Error('test')`，确认页面降级为可滚动的 `.flip-fallback` 列表而非白屏；验证后删除该行。

- [ ] **Step 4: 收尾提交（如有验收中的微调）**

```bash
git add -A && git commit -m "chore: 法术书真实翻页手动验收微调"
```

---

## 回归保障清单（实施时牢记）

- **施法/规则逻辑零改动**：`executeCast`/`prepareCast`/`slotRemaining`/`setSpellSlotUsed`/奥术回想/长休/仪式 toast 全部沿用，只搬位置不改逻辑。
- **flipPages 冻结**：用普通 `const`（非 computed），进入时算一次。耗尽环页保留。
- **命令式隔离**：page-flip 只在 `useFlipBook.js` 出现。
- **disableFlipByClick:true**：防止点法术卡被当翻页。
- **Teleport**：施法弹窗、专注替换、奥术回想、长休、toast 全在 body，不进翻页 DOM。
