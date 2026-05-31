# DnD 角色创建器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建独立 Vue 3 + Vite 项目，实现书本翻开动画 + 三个 DnD 种族选择页面。

**Architecture:** BookCover.vue 负责 3D 书本动画，点击后路由跳转至 RaceSelect.vue；种族数据集中在 races.js；角色选择状态通过 src/store/character.js 的 reactive 对象跨路由共享，无需 Pinia。

**Tech Stack:** Vue 3 (Composition API), Vite 6, Vue Router 4, 纯 CSS (无 UI 库), Google Fonts (Cinzel + Crimson Pro)

---

## 文件职责速览

| 文件 | 职责 |
|------|------|
| `index.html` | HTML 入口，引入 Google Fonts |
| `src/main.js` | 挂载 Vue app，注册 router |
| `src/App.vue` | 路由出口 + 页面切换过渡动画 |
| `src/router/index.js` | 路由定义（/ 和 /race） |
| `src/store/character.js` | 全局 reactive 角色状态 |
| `src/data/races.js` | 三个种族的完整数据 |
| `src/views/BookCover.vue` | 书本封面 + 3D 翻开动画 |
| `src/views/RaceSelect.vue` | 种族卡片列表 + 选择逻辑 |
| `src/styles/main.css` | 全局 design tokens + reset |
| `src/styles/book.css` | 书本 3D 动画相关样式 |
| `src/styles/races.css` | 种族卡片相关样式 |

---

## Task 1: 脚手架 — 创建项目并安装依赖

**Files:**
- Create: `d:\dnd-character-creator\` (新目录)

- [ ] **Step 1: 在 D 盘根目录创建项目**

```powershell
cd d:\
npm create vite@latest dnd-character-creator -- --template vue
cd dnd-character-creator
npm install
```

预期输出末尾包含：`Done. Now run: cd dnd-character-creator && npm run dev`

- [ ] **Step 2: 安装 Vue Router**

```powershell
npm install vue-router@4
```

预期：`added 2 packages` 或类似

- [ ] **Step 3: 删除 Vite 模板自带的无关文件**

```powershell
Remove-Item src\assets -Recurse -Force
Remove-Item src\components -Recurse -Force
Remove-Item src\App.vue
Remove-Item src\style.css
Remove-Item src\main.js
```

- [ ] **Step 4: 验证目录结构**

```powershell
Get-ChildItem src
```

预期：src 目录为空（无 assets、components、App.vue、style.css、main.js）

- [ ] **Step 5: 创建必要的子目录**

```powershell
New-Item -ItemType Directory src\views
New-Item -ItemType Directory src\styles
New-Item -ItemType Directory src\data
New-Item -ItemType Directory src\store
New-Item -ItemType Directory src\router
```

---

## Task 2: 全局样式 — Design Tokens + Reset

**Files:**
- Create: `src/styles/main.css`

- [ ] **Step 1: 创建 main.css（design tokens + reset）**

```css
/* src/styles/main.css */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cinzel+Decorative:wght@400;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; }

:root {
  --bg:          #0C0A17;
  --bg-surface:  #13102A;
  --bg-card:     #181430;
  --bg-card-sel: #1E1A38;

  --gold:        #C9A84C;
  --gold-light:  #E5C97A;
  --gold-bright: #F2DC98;
  --gold-dim:    rgba(201, 168, 76, 0.22);
  --gold-glow:   rgba(201, 168, 76, 0.12);

  --border-dark:   rgba(100, 75, 35, 0.25);
  --border-gold:   rgba(201, 168, 76, 0.38);
  --border-active: #C9A84C;

  --text:       #EAD9C1;
  --text-muted: #9A8868;
  --text-dim:   #5A4E3C;

  --font-title: 'Cinzel', 'Noto Serif SC', Georgia, serif;
  --font-deco:  'Cinzel Decorative', serif;
  --font-body:  'Crimson Pro', 'Noto Serif SC', Georgia, serif;

  --r-sm: 3px;
  --r:    6px;
  --r-lg: 10px;

  --t-fast: 160ms ease;
  --t:      220ms ease;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--text);
  background: var(--bg);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

button { font: inherit; cursor: pointer; border: none; background: none; }
h1, h2, h3 { font-family: var(--font-title); font-weight: 600; margin: 0; }
p { margin: 0; }

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.page-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
```

---

## Task 3: Router + App.vue + main.js

**Files:**
- Create: `src/router/index.js`
- Create: `src/App.vue`
- Create: `src/main.js`
- Create: `index.html`

- [ ] **Step 1: 创建路由文件**

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import BookCover from '../views/BookCover.vue'
import RaceSelect from '../views/RaceSelect.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',     component: BookCover  },
    { path: '/race', component: RaceSelect },
  ],
})
```

- [ ] **Step 2: 创建 App.vue（路由出口 + 页面过渡）**

```vue
<!-- src/App.vue -->
<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>
```

- [ ] **Step 3: 创建 main.js**

```js
// src/main.js
import { createApp } from 'vue'
import router from './router/index.js'
import App from './App.vue'
import './styles/main.css'

createApp(App).use(router).mount('#app')
```

- [ ] **Step 4: 更新 index.html（引入 Google Fonts 预连接）**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>命运之书 — DnD 角色创建器</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cinzel+Decorative:wght@400;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 5: 启动开发服务器，验证无报错**

```powershell
npm run dev
```

预期：终端显示 `VITE ready in xxx ms`，浏览器打开 `http://localhost:5173` 显示空白页（无 console 报错）

---

## Task 4: 角色状态 Store

**Files:**
- Create: `src/store/character.js`

- [ ] **Step 1: 创建 character store**

```js
// src/store/character.js
import { reactive } from 'vue'

export const character = reactive({
  race: null,       // 选定的种族 id 字符串，如 'aasimar'
  background: null, // Phase 2
  class: null,      // Phase 2
  attributes: {},   // Phase 3（叙事问卷生成）
})

export function setRace(raceId) {
  character.race = raceId
}

export function resetCharacter() {
  character.race = null
  character.background = null
  character.class = null
  character.attributes = {}
}
```

---

## Task 5: 种族数据

**Files:**
- Create: `src/data/races.js`

- [ ] **Step 1: 创建 races.js（三个种族完整数据）**

```js
// src/data/races.js
export const races = [
  {
    id: 'aasimar',
    name: '阿斯莫',
    nameEn: 'Aasimar',
    lore: '灵魂承载上层位面之火花，却仍有凡性。他们能用那火花的力量引来光明、治愈，或是天怒。',
    type: '类人',
    size: '中型或小型（选择时决定）',
    speed: 30,
    lifespan: 160,
    color: '#C9A84C',
    traits: [
      {
        id: 'celestial-resistance',
        name: '天界抗性',
        nameEn: 'Celestial Resistance',
        desc: '你对光耀和暗蚀伤害有抗性。',
      },
      {
        id: 'darkvision',
        name: '黑暗视觉',
        nameEn: 'Darkvision',
        desc: '你拥有 60 尺黑暗视觉。',
      },
      {
        id: 'healing-hands',
        name: '治愈之手',
        nameEn: 'Healing Hands',
        desc: '以一个魔法动作，你触碰一个生物，并掷数量等于你熟练加值的 d4 骰。该生物恢复等于掷骰总值的生命值。每次长休后可重新使用。',
      },
      {
        id: 'light-bearer',
        name: '光辉掌者',
        nameEn: 'Light Bearer',
        desc: '你习得光亮术（Light）戏法，施法属性为魅力。',
      },
      {
        id: 'celestial-revelation',
        name: '天启',
        nameEn: 'Celestial Revelation',
        desc: '3 级时，你获得以一个附赠动作变身的能力，持续 1 分钟。变身期间每回合一次，对目标造成伤害时可额外造成等于熟练加值的伤害（光耀或暗蚀）。每次长休后可重新使用。\n\n三种变身选项：\n• 天堂飞翼——获得等于速度的飞行速度\n• 内耀辉光——散发 10 尺明亮光照和再往外 10 尺微光，每回合结束时 10 尺内生物受熟练加值光耀伤害\n• 死灵环绕——双目变暗，翅膀涌出，10 尺内可见你的非盟友必须通过魅力豁免（DC = 8 + 熟练 + 魅力调整值）否则恐慌至你的下一回合结束',
      },
    ],
  },
  {
    id: 'dwarf',
    name: '矮人',
    nameEn: 'Dwarf',
    lore: '被锻造之神从大地中唤醒，矮人对石头与金属有天然的亲和力，如同群山一样坚韧不拔。',
    type: '类人',
    size: '中型（约 5-6 尺高）',
    speed: 30,
    lifespan: 350,
    color: '#8B6914',
    traits: [
      {
        id: 'darkvision',
        name: '黑暗视觉',
        nameEn: 'Darkvision',
        desc: '你拥有 120 尺黑暗视觉。',
      },
      {
        id: 'dwarven-resilience',
        name: '矮人体魄',
        nameEn: 'Dwarven Resilience',
        desc: '你对毒素伤害具有抗性。在进行避免或结束中毒状态的豁免检定时具有优势。',
      },
      {
        id: 'dwarven-toughness',
        name: '矮人刚毅',
        nameEn: 'Dwarven Toughness',
        desc: '你的生命值最大值加 1，且此后每次升级时再加 1。',
      },
      {
        id: 'stonecunning',
        name: '石中精妙',
        nameEn: 'Stonecunning',
        desc: '以一个附赠动作，你获得 60 尺震颤感知，持续 10 分钟（需位于或触碰石质平面）。可使用次数等于熟练加值，长休后重获全部使用次数。',
      },
    ],
  },
  {
    id: 'halfling',
    name: '半身人',
    nameEn: 'Halfling',
    lore: '受生命、家园与壁炉之神的宠爱，生来便有着令人惊叹的好运，以及勇于冒险的精神。',
    type: '类人',
    size: '小型（约 2-3 尺高）',
    speed: 30,
    lifespan: 450,
    color: '#5AA060',
    traits: [
      {
        id: 'brave',
        name: '勇气',
        nameEn: 'Brave',
        desc: '你在进行避免或结束恐慌（Frightened）状态的豁免时具有优势。',
      },
      {
        id: 'halfling-nimbleness',
        name: '半身人灵巧',
        nameEn: 'Halfling Nimbleness',
        desc: '你可以穿越任何体形比你大的生物所在空间，但不能在其内停下。',
      },
      {
        id: 'lucky',
        name: '幸运',
        nameEn: 'Lucky',
        desc: '当你在 d20 检定上掷出 1 时，你可以重掷一次，但必须使用重掷的结果。',
      },
      {
        id: 'naturally-stealthy',
        name: '天生善匿',
        nameEn: 'Naturally Stealthy',
        desc: '当你仅被比你大 1 级的生物遮蔽时，你也可以进行躲藏动作。',
      },
    ],
  },
]
```

---

## Task 6: 书本封面动画（BookCover.vue）

**Files:**
- Create: `src/views/BookCover.vue`
- Create: `src/styles/book.css`

- [ ] **Step 1: 创建 book.css（3D 书本样式）**

```css
/* src/styles/book.css */

/* ── 场景容器 ── */
.book-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 30% 60%, rgba(100, 40, 140, 0.2) 0%, transparent 55%),
    radial-gradient(ellipse at 75% 30%, rgba(80, 60, 160, 0.15) 0%, transparent 50%),
    linear-gradient(175deg, #1A1042 0%, #0C0A17 100%);
  padding: 40px 20px;
  overflow: hidden;
}

/* 标题区域 */
.book-scene-title {
  font-family: var(--font-deco);
  font-size: 13px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--gold-dim);
  margin-bottom: 48px;
  opacity: 0;
  animation: fadeInDown 0.8s ease 0.3s forwards;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── 3D 书本 ── */
.book-wrap {
  perspective: 1400px;
  cursor: pointer;
  filter: drop-shadow(0 30px 60px rgba(0,0,0,0.8));
  transition: filter 0.3s ease;
  opacity: 0;
  animation: fadeInUp 0.8s ease 0.5s forwards;
}

.book-wrap:hover {
  filter: drop-shadow(0 30px 80px rgba(201, 168, 76, 0.2));
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.book {
  position: relative;
  width: 220px;
  height: 300px;
  transform-style: preserve-3d;
  transform: rotateY(-25deg) rotateX(4deg);
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  animation: bookFloat 4s ease-in-out 1.4s infinite;
}

.book.opening {
  transform: rotateY(-165deg) rotateX(4deg) !important;
  animation: none !important;
}

@keyframes bookFloat {
  0%, 100% { transform: rotateY(-25deg) rotateX(4deg) translateY(0); }
  50%       { transform: rotateY(-25deg) rotateX(4deg) translateY(-10px); }
}

/* ── 书封面（正面） ── */
.book-front {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 2px 6px 6px 2px;
  background:
    linear-gradient(160deg, #3D2210 0%, #1E0E04 60%, #2A1508 100%);
  border: 1px solid rgba(120, 80, 20, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  overflow: hidden;
}

/* 封面纹理 */
.book-front::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(0,0,0,0.04) 4px,
    rgba(0,0,0,0.04) 5px
  );
}

/* 封面金色边框 */
.book-front::after {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid var(--border-gold);
  border-radius: 2px;
  pointer-events: none;
}

.book-crest {
  position: relative;
  z-index: 1;
  width: 72px;
  height: 72px;
  filter: drop-shadow(0 0 8px rgba(201, 168, 76, 0.5));
}

.book-title {
  position: relative;
  z-index: 1;
  text-align: center;
}

.book-title-main {
  font-family: var(--font-deco);
  font-size: 18px;
  font-weight: 700;
  color: var(--gold-bright);
  letter-spacing: 0.08em;
  text-shadow: 0 0 20px rgba(201, 168, 76, 0.6);
  display: block;
  line-height: 1.3;
}

.book-title-sub {
  display: block;
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: 6px;
}

.book-click-hint {
  position: relative;
  z-index: 1;
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold-dim);
  margin-top: 8px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

/* ── 书内页（翻开后可见） ── */
.book-inner {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
  backface-visibility: hidden;
  border-radius: 2px 6px 6px 2px;
  background: linear-gradient(160deg, #F0E6D0, #E8D8BE);
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-inner-text {
  font-family: var(--font-title);
  font-size: 13px;
  color: #3D2210;
  letter-spacing: 0.1em;
  opacity: 0.6;
}

/* ── 书脊（左侧厚度） ── */
.book-spine {
  position: absolute;
  top: 0;
  left: -28px;
  width: 28px;
  height: 300px;
  transform: rotateY(-90deg) translateZ(14px);
  background: linear-gradient(180deg, #2A1508 0%, #1A0F05 50%, #2A1508 100%);
  border-radius: 2px 0 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-spine-text {
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.3em;
  color: var(--gold-dim);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
}

/* ── 书页边缘（右侧） ── */
.book-pages {
  position: absolute;
  top: 4px;
  right: -18px;
  width: 18px;
  height: 292px;
  transform: rotateY(90deg) translateZ(202px);
  background: repeating-linear-gradient(
    to top,
    #E8D8BE,
    #E8D8BE 1px,
    #D4C4A4 1px,
    #D4C4A4 2px
  );
}

/* ── 提示文字 ── */
.book-hint {
  margin-top: 40px;
  font-family: var(--font-title);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--text-dim);
  text-transform: uppercase;
  opacity: 0;
  animation: fadeInUp 0.8s ease 1.2s forwards;
}
```

- [ ] **Step 2: 创建 BookCover.vue**

```vue
<!-- src/views/BookCover.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import '../styles/book.css'

const router = useRouter()
const isOpening = ref(false)

function openBook() {
  if (isOpening.value) return
  isOpening.value = true
  setTimeout(() => {
    router.push('/race')
  }, 900)
}
</script>

<template>
  <div class="book-scene">
    <p class="book-scene-title">命运之书 · Tome of Destiny</p>

    <div class="book-wrap" @click="openBook" role="button" aria-label="打开命运之书，开始角色创建">
      <div :class="['book', { opening: isOpening }]">
        <!-- 书封面（正面） -->
        <div class="book-front">
          <!-- 纹章 SVG -->
          <svg class="book-crest" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="32" stroke="rgba(201,168,76,0.5)" stroke-width="1"/>
            <circle cx="36" cy="36" r="26" stroke="rgba(201,168,76,0.3)" stroke-width="1" stroke-dasharray="3 4"/>
            <polygon points="36,12 40,30 56,30 43,40 48,58 36,48 24,58 29,40 16,30 32,30"
                     fill="rgba(201,168,76,0.15)" stroke="rgba(201,168,76,0.6)" stroke-width="1"/>
            <circle cx="36" cy="36" r="4" fill="rgba(201,168,76,0.8)"/>
          </svg>

          <div class="book-title">
            <span class="book-title-main">命运之书</span>
            <span class="book-title-sub">Dungeons &amp; Dragons · 5e</span>
          </div>

          <span class="book-click-hint">✦ 点击翻开 ✦</span>
        </div>

        <!-- 书内页（翻开后背面） -->
        <div class="book-inner">
          <span class="book-inner-text">命运等待着你……</span>
        </div>

        <!-- 书脊 -->
        <div class="book-spine">
          <span class="book-spine-text">命运之书</span>
        </div>

        <!-- 书页边缘 -->
        <div class="book-pages"></div>
      </div>
    </div>

    <p class="book-hint">点击书本，开始你的冒险</p>
  </div>
</template>
```

- [ ] **Step 3: 在浏览器验证书本动画**

打开 `http://localhost:5173`，应看到：
- 深色背景，中央一本 3D 棕色皮革书本，有书脊和页面厚度
- 书本轻微上下浮动
- 点击后书皮向左翻开（约 800ms）
- 翻开后路由跳转到 `/race`（目前为空白页）

---

## Task 7: 种族卡片样式

**Files:**
- Create: `src/styles/races.css`

- [ ] **Step 1: 创建 races.css**

```css
/* src/styles/races.css */

/* ── 页面容器 ── */
.race-page {
  min-height: 100vh;
  padding: 0 0 80px;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(120, 50, 160, 0.12) 0%, transparent 50%),
    var(--bg);
}

/* ── 顶部页头 ── */
.race-header {
  padding: 32px 20px 24px;
  text-align: center;
  border-bottom: 1px solid var(--border-dark);
  position: relative;
}

.race-header::after {
  content: '';
  position: absolute;
  bottom: 0; left: 20%; right: 20%;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-gold), transparent);
}

.race-step-badge {
  display: inline-block;
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 10px;
  padding: 4px 14px;
  border: 1px solid var(--border-gold);
  border-radius: 999px;
}

.race-page-title {
  font-family: var(--font-deco);
  font-size: clamp(22px, 5vw, 32px);
  color: var(--gold-bright);
  text-shadow: 0 0 20px var(--gold-dim);
  margin: 4px 0 8px;
}

.race-page-sub {
  font-size: 14px;
  color: var(--text-muted);
  font-style: italic;
}

/* ── 种族卡片网格 ── */
.race-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  padding: 24px 20px;
  max-width: 960px;
  margin: 0 auto;
}

/* ── 单张种族卡片 ── */
.race-card {
  background: var(--bg-card);
  border: 1px solid var(--border-dark);
  border-radius: var(--r-lg);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  position: relative;
}

.race-card::before {
  content: '';
  display: block;
  height: 3px;
  background: var(--card-accent, var(--gold));
  transition: box-shadow 0.2s ease;
}

.race-card:hover {
  border-color: var(--border-gold);
  box-shadow: 0 6px 24px rgba(0,0,0,0.5);
  transform: translateY(-2px);
}

.race-card.selected {
  border-color: var(--gold);
  background: var(--bg-card-sel);
  box-shadow:
    0 0 0 1px rgba(201,168,76,0.3),
    0 0 24px rgba(201,168,76,0.15),
    inset 0 0 30px rgba(201,168,76,0.04);
}

.race-card.selected::before {
  box-shadow: 0 0 8px var(--card-accent, var(--gold));
}

/* 选中角标 */
.race-card.selected::after {
  content: '✦';
  position: absolute;
  top: 14px; right: 14px;
  font-size: 14px;
  color: var(--gold);
  text-shadow: 0 0 8px var(--gold-dim);
}

/* 卡片内容 */
.race-card-body {
  padding: 16px 18px 14px;
}

.race-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.race-name {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 600;
  color: var(--gold-light);
  letter-spacing: 0.03em;
  line-height: 1.2;
}

.race-name-en {
  display: block;
  font-family: var(--font-title);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--text-dim);
  margin-top: 2px;
  font-weight: 400;
}

.race-lifespan {
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  white-space: nowrap;
  padding: 3px 8px;
  border: 1px solid var(--border-dark);
  border-radius: 999px;
  flex-shrink: 0;
}

.race-lore {
  font-size: 14px;
  font-style: italic;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 12px;
}

/* 标签行 */
.race-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.race-tag {
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  padding: 3px 9px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-dark);
  border-radius: 999px;
}

/* 展开/折叠特质按钮 */
.race-expand-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  font-family: var(--font-title);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  background: rgba(255,255,255,0.02);
  border-top: 1px solid var(--border-dark);
  transition: color 0.2s ease, background 0.2s ease;
}

.race-expand-btn:hover {
  color: var(--gold);
  background: var(--gold-glow);
}

.race-expand-icon {
  transition: transform 0.3s ease;
  font-size: 10px;
}

.race-expand-icon.expanded {
  transform: rotate(180deg);
}

/* 特质列表 */
.race-traits {
  overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.35s ease;
  max-height: 0;
  opacity: 0;
}

.race-traits.open {
  max-height: 800px;
  opacity: 1;
}

.trait-item {
  padding: 12px 18px;
  border-top: 1px solid var(--border-dark);
  display: grid;
  gap: 4px;
}

.trait-name {
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--gold-light);
  font-weight: 600;
}

.trait-name-en {
  font-size: 11px;
  color: var(--text-dim);
  font-weight: 400;
  letter-spacing: 0.05em;
}

.trait-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.65;
  white-space: pre-line;
}

/* ── 底部确认栏 ── */
.race-footer {
  position: fixed;
  bottom: 0;
  left: 0; right: 0;
  padding: 16px 20px env(safe-area-inset-bottom, 0px);
  background: linear-gradient(to bottom, rgba(12,10,23,0.9), var(--bg));
  border-top: 1px solid var(--border-dark);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.race-footer::before {
  content: '';
  position: absolute;
  top: 0; left: 15%; right: 15%;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-gold), transparent);
}

.race-selected-name {
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--gold);
}

.race-selected-placeholder {
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--text-dim);
  font-style: italic;
}

.race-next-btn {
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--bg);
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  padding: 10px 28px;
  border-radius: var(--r);
  min-height: 44px;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.race-next-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none !important;
}

.race-next-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201,168,76,0.3);
}

.race-next-btn:not(:disabled):active {
  transform: scale(0.97);
}
```

---

## Task 8: 种族选择页（RaceSelect.vue）

**Files:**
- Create: `src/views/RaceSelect.vue`
- Modify: `src/store/character.js` (已在 Task 4 创建，不修改)

- [ ] **Step 1: 创建 RaceSelect.vue**

```vue
<!-- src/views/RaceSelect.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { races } from '../data/races.js'
import { character, setRace } from '../store/character.js'
import '../styles/races.css'

const router = useRouter()
const expandedId = ref(null)

const selectedId = computed({
  get: () => character.race,
  set: (id) => setRace(id),
})

const selectedRace = computed(() =>
  races.find(r => r.id === selectedId.value) ?? null
)

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function selectRace(id) {
  selectedId.value = id
}

function goNext() {
  if (!selectedId.value) return
  router.push('/background')
}
</script>

<template>
  <div class="race-page">
    <!-- 页头 -->
    <header class="race-header">
      <div class="race-step-badge">步骤 1 / 3 · 选择种族</div>
      <h1 class="race-page-title">你是什么？</h1>
      <p class="race-page-sub">种族决定你的天赋与传承，塑造你最初的样貌</p>
    </header>

    <!-- 种族卡片网格 -->
    <div class="race-grid">
      <div
        v-for="race in races"
        :key="race.id"
        :class="['race-card', { selected: selectedId === race.id }]"
        :style="{ '--card-accent': race.color }"
        @click="selectRace(race.id)"
      >
        <!-- 色彩顶条由 ::before 渲染 -->
        <div class="race-card-body">
          <div class="race-card-top">
            <div>
              <h2 class="race-name">
                {{ race.name }}
                <span class="race-name-en">{{ race.nameEn }}</span>
              </h2>
            </div>
            <span class="race-lifespan">寿命 {{ race.lifespan }}年</span>
          </div>

          <p class="race-lore">{{ race.lore }}</p>

          <div class="race-tags">
            <span class="race-tag">{{ race.type }}</span>
            <span class="race-tag">{{ race.size }}</span>
            <span class="race-tag">速度 {{ race.speed }} 尺</span>
          </div>
        </div>

        <!-- 展开特质按钮 -->
        <button
          class="race-expand-btn"
          type="button"
          @click.stop="toggleExpand(race.id)"
        >
          <span>种族特质 ({{ race.traits.length }})</span>
          <span :class="['race-expand-icon', { expanded: expandedId === race.id }]">▼</span>
        </button>

        <!-- 特质列表 -->
        <div :class="['race-traits', { open: expandedId === race.id }]">
          <div v-for="trait in race.traits" :key="trait.id" class="trait-item">
            <div class="trait-name">
              {{ trait.name }}
              <span class="trait-name-en"> · {{ trait.nameEn }}</span>
            </div>
            <p class="trait-desc">{{ trait.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部确认栏 -->
    <footer class="race-footer">
      <div>
        <span v-if="selectedRace" class="race-selected-name">✦ {{ selectedRace.name }}</span>
        <span v-else class="race-selected-placeholder">尚未选择种族</span>
      </div>
      <button
        class="race-next-btn"
        type="button"
        :disabled="!selectedId"
        @click="goNext"
      >
        下一步 →
      </button>
    </footer>
  </div>
</template>
```

- [ ] **Step 2: 在浏览器验证完整流程**

1. 打开 `http://localhost:5173`
2. 看到书本封面（3D，浮动动画）
3. 点击书本 → 书皮向左翻开
4. 翻开后自动跳转到 `/race`
5. 看到三张种族卡片（阿斯莫、矮人、半身人）
6. 点击任意卡片 → 卡片被选中（金色边框）
7. 点击「种族特质」按钮 → 展开/折叠特质列表
8. 底部确认栏显示已选种族名，「下一步」按钮可点击
9. 点击「下一步」→ 跳转到 `/background`（目前空白，正常）

- [ ] **Step 3: 验证移动端效果**

在浏览器开发者工具中切换到 375px 视口：
- 卡片应为单列
- 底部固定栏不遮挡内容
- 触摸目标高度 ≥ 44px

---

## Task 9: vite.config.js

**Files:**
- Modify: `vite.config.js`

- [ ] **Step 1: 确认 vite.config.js 内容正确**

Vite 模板默认内容已够用，只需确认：

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

若内容一致，无需修改。

---

## Task 10: 构建并验证生产包

- [ ] **Step 1: 执行生产构建**

```powershell
npm run build
```

预期：`dist/` 目录生成，无 build errors

- [ ] **Step 2: 本地预览生产包**

```powershell
npm run preview
```

打开 `http://localhost:4173`，重走完整流程（封面 → 翻页 → 种族选择）。

- [ ] **Step 3: 确认字体加载正常**

Network 面板中可看到 Google Fonts 的 CSS 和字体文件请求，页面标题使用 Cinzel 字体渲染。

---

## 自检清单

- [x] Task 1-3 覆盖 spec §2（技术栈）和 §3（路由）
- [x] Task 4 覆盖 spec §6（角色状态）
- [x] Task 5 覆盖 spec §5（数据结构，三个种族）
- [x] Task 6 覆盖 spec §4（书本动画，所有视觉和交互细节）
- [x] Task 7-8 覆盖 spec §5（种族选择页，卡片、展开、底部确认栏）
- [x] Task 9-10 覆盖构建与部署验证
- [x] `character.race` 类型在 Task 4 定义为 `null | string`，Task 8 正确读写
- [x] `setRace` 在 Task 4 定义，Task 8 导入使用，名称一致
- [x] `races` 数组在 Task 5 定义，Task 8 导入，字段（id/name/nameEn/lore/color/traits）全部匹配
