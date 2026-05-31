# DND-create

# RPG 技能选择器

一个面向 D&D 2024 规则的中文角色创建器原型。项目用 Vue 3 + Vite 构建，目标是把建卡流程拆成清晰的步骤，让玩家可以按“等级、种族、职业、背景、专长、法术、属性、生命值、装备、角色卡”的顺序快速整理角色。

> 当前项目仍在开发中。法术、职业、专长、属性与角色草稿流程已经可用；装备选择、完整 AC 自动计算、导入模板文档仍在继续完善。

线上地址:http://47.120.19.14:8088

## 主要功能

- 封面 + 多步建卡流程：基础设置、基础属性、种族、职业、背景、专长、法术、属性总览、生命值、装备、角色卡。
- 中文化 D&D 2024 数据：内置种族、职业、背景、起源专长、通用专长、战斗风格、邪术祈唤和法术资料。
- 职业联动：根据当前职业和等级展示可用子职、职业选项、技能熟练、专长槽位和法术选择。
- 法术选择器：支持中文名、英文名、学派和特殊标签搜索；支持环阶筛选；会根据职业法表、等级和施法进度限制可选法术。
- 法术详情：可查看施法时间、距离、成分、持续时间和法术描述。
- 施法规则页：内置准备法术规则、魔法学派说明和基础施法规则摘要。
- 属性汇总：整合基础属性、背景属性加值和专长属性加值。
- 生命值计算：支持标准生命值和掷骰生命值流程。
- 本地草稿：角色数据保存到浏览器 localStorage，刷新后仍可继续编辑。
- 职业 JSON 导入：可以导入自定义职业规则 JSON，用于扩展开源数据。

## 当前状态

已完成或基本可用：

- 种族选择与种族特性展示
- 职业选择、子职展示、职业 JSON 导入
- 背景选择与背景属性加值
- 专长选择、战斗风格选择、技能熟练步骤
- 0-9 环法术列表与大量法术详情
- 法术搜索、环阶 tab、职业法表联动
- 属性总览、生命值设置、角色卡展示

待完善：

- 装备页目前主要展示职业和背景起始装备，还不是完整装备选择器。
- AC 目前只在角色卡中显示基础无甲算法，完整的护甲、盾牌、职业无甲防御、法术和战斗风格联动尚未接入。
- 自定义 JSON 导入目前以职业为主，法术、装备、怪物等模块可以后续继续扩展。
- 法术详情数据量较大，后续可以考虑拆分文件或按需加载。

## 技术栈

- Vue 3
- Vue Router
- Vite
- 原生 CSS
- localStorage 本地持久化

## 快速开始

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认开发地址：

```text
http://localhost:5200
```

打包生产版本：

```bash
npm run build
```

本地预览生产包：

```bash
npm run preview
```

## 项目结构

```text
src/
  assets/              图片资源
  components/          通用组件
  data/                规则数据
    backgrounds.js     背景数据
    classes.js         职业、子职、职业进度
    importedRules.js   JSON 导入与校验
    races.js           种族数据
    spells.js          法术列表与法术详情
    spellRules.js      施法规则摘要
  router/              路由
  store/               角色草稿状态
  styles/              页面样式
  utils/               属性、生命值、进度等工具函数
  views/               页面视图
```

## 建卡流程

当前路由流程如下：

```text
/               封面
/setup          基础设置
/ability-base   基础属性
/race           种族
/class          职业
/background     背景
/feats          专长与技能
/spells         法术
/abilities      属性总览
/hp             生命值
/equipment      装备
/sheet          角色卡
```

## 职业 JSON 导入

职业导入入口在职业选择页。导入文件需要是一个职业对象，或包含 `class` 字段的对象。

最小示例：

```json
{
  "id": "custom-class",
  "name": "自定义职业",
  "nameEn": "Custom Class",
  "tagline": "一条简短的职业描述",
  "color": "#7A6A2A",
  "hitDie": "d8",
  "primaryAbility": "敏捷或智力",
  "saves": ["敏捷", "智力"],
  "armor": ["轻甲"],
  "weapons": ["简易武器"],
  "tools": [],
  "skillChoices": {
    "count": 2,
    "options": ["奥秘", "调查", "察觉", "隐匿"]
  },
  "equipment": {
    "a": "方案 A 装备描述",
    "b": "方案 B 金币或装备描述"
  },
  "subclassLevel": 3,
  "level1Features": [
    {
      "level": 1,
      "name": "一级特性",
      "nameEn": "Level 1 Feature",
      "desc": "特性说明。"
    }
  ],
  "notableFeatures": [],
  "subclasses": [
    {
      "id": "custom-subclass",
      "name": "自定义子职",
      "nameEn": "Custom Subclass",
      "color": "#7A6A2A",
      "tagline": "子职简介",
      "desc": "子职说明",
      "features": []
    }
  ],
  "classProgression": []
}
```

如果职业是施法者，可以额外加入：

```json
{
  "spellList": "wizard",
  "spellcastingAbility": "智力",
  "spellcastingProgression": [
    {
      "level": 1,
      "cantrips": 3,
      "prepared": 4,
      "slots": { "1": 2 }
    }
  ]
}
```

魔契施法可以使用 `pactMagicProgression`。

## 数据扩展建议

- 新增内置职业：编辑 `src/data/classes.js`。
- 新增种族：编辑 `src/data/races.js`。
- 新增背景：编辑 `src/data/backgrounds.js`。
- 新增专长：编辑 `src/data/originFeats.js`、`src/data/generalFeats.js` 或 `src/data/fightingStyleFeats.js`。
- 新增法术：编辑 `src/data/spells.js`，保持法术列表和详情的英文名一致，方便搜索和详情匹配。
- 新增通用规则说明：编辑 `src/data/spellRules.js`。

## 本地数据

角色草稿会保存在浏览器 localStorage 中，主要键名包括：

```text
dndcc:drafts:v1
dndcc:activeDraftId
dndcc:importedClasses:v1
```

清空浏览器站点数据会删除本地草稿和导入职业。

## 开发备注

- 目前没有后端服务，所有数据都在前端静态文件和浏览器本地存储中。
- 中文规则文本较多，构建产物可能出现 chunk 偏大的提示，这是当前数据集中在前端包内导致的。
- 项目数据用于建卡辅助和规则速查，具体规则裁定仍以桌面主持人与所使用规则书为准。

## Roadmap

- 完整装备选择器
- 护甲、盾牌、无甲防御、法术和专长联动的 AC 自动计算
- 导入 JSON 模板文档
- 法术数据拆分与按需加载
- 角色卡导出和打印
- 更多自定义规则模块
