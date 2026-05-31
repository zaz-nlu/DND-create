# DnD 角色创建器 — 设计文档

**日期：** 2026-05-21  
**状态：** 已批准，待实现  
**范围：** MVP — 书本动画 + 种族选择

---

## 1. 项目概述

独立的纯前端 Web 应用，部署在服务器上，无需登录，链接即用。  
最终目标是引导用户完成 DnD 5e (2024版) 角色创建，输出可打印 PDF 角色卡。

**MVP 范围（当前阶段）：** 书本封面动画 + 种族选择页（3个种族先上线）。

---

## 2. 技术栈

- **框架：** Vue 3 + Vite
- **路由：** Vue Router 4
- **样式：** 纯 CSS，博德之门深色奇幻主题（Cinzel + Crimson Pro 字体）
- **无外部 UI 库**
- **构建输出：** 静态文件，可托管在任意服务器

---

## 3. 路由结构

```
/           → BookCover   书本封面（入口动画）
/race       → RaceSelect  种族选择
/background → （后续）背景选择
/class      → （后续）职业选择
/story      → （后续）叙事属性问卷
/sheet      → （后续）角色卡 + PDF 导出
```

角色构建状态通过 Vue 的 provide/inject 或轻量 reactive store 在路由间传递，无需 Pinia/Vuex。

---

## 4. 书本封面动画（BookCover.vue）

### 视觉
- 页面深色背景，中央一本厚书（纯 CSS 3D，无图片依赖）
- 书封面：深棕色皮革质感渐变，金色 Cinzel 字体「命运之书」+ 金色纹章（SVG）
- 书脊可见（左侧 3D 厚度感）

### 交互
1. 页面加载：书静置，轻微上下浮动动画（`translateY`）
2. 用户点击书封面
3. 书皮向左翻开（`rotateY(-180deg)`，约 800ms，`cubic-bezier(0.4, 0, 0.2, 1)`）
4. 翻开后延迟 200ms → `router.push('/race')`，种族页从右滑入

---

## 5. 种族选择（RaceSelect.vue）

### 布局（移动优先，适配桌面）
- 顶部：页面标题「选择种族」+ 进度指示（步骤 1/3）
- 主体：种族卡片网格（移动端 1 列，桌面 2 列）
- 底部：已选种族名 + 「下一步」按钮（选中后才可点击）

### 种族卡片
每张卡片显示：
- 种族名（Cinzel，金色）
- 英文名（小字，哑光）
- 一句 lore 简介（斜体，米黄色）
- 关键特质标签（体型、速度、寿命）
- 点击展开：完整特质列表

选中态：金色发光边框，卡片左上角金色勾选标记。

### 数据结构（`src/data/races.js`）

```js
{
  id: 'aasimar',
  name: '阿斯莫',
  nameEn: 'Aasimar',
  lore: '灵魂承载上层位面之火花，却仍有凡性。',
  type: '类人',
  size: '中型或小型',  // 选择时决定
  speed: 30,
  lifespan: 160,
  color: '#C9A84C',   // 卡片主题色
  traits: [
    {
      id: 'celestial-resistance',
      name: '天界抗性',
      nameEn: 'Celestial Resistance',
      desc: '你对光耀和暗蚀伤害有抗性。'
    },
    // ...
  ]
}
```

### MVP 种族（3个）
- 阿斯莫 Aasimar（天界血脉）
- 矮人 Dwarf（山地锻造者）
- 半身人 Halfling（幸运的小家伙）

---

## 6. 角色状态（共享）

```js
// src/store/character.js
import { reactive } from 'vue'

export const character = reactive({
  race: null,       // 种族 id
  background: null, // 后续
  class: null,      // 后续
  attributes: {},   // 后续（叙事问卷生成）
})
```

---

## 7. 后续阶段（不在 MVP 内）

| 阶段 | 内容 |
|------|------|
| Phase 2 | 背景选择、职业选择 |
| Phase 3 | 叙事属性问卷（10个故事 × 20题） |
| Phase 4 | 角色卡页面 + PDF 导出 |

---

## 8. 不做的事（MVP）

- 无登录、无数据库、无后端
- 不做属性点分配（由叙事问卷代替，Phase 3）
- 不做装备、法术选择
- 不做多角色管理
