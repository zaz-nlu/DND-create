# 种族法术 / 自选法术 / 管理系统数据入引擎 — 设计方案

日期：2026-06-01

## 背景与问题

三个相互关联的"数据模型缺一层"问题：

1. **种族戏法/法术不进引擎**：种族给的戏法（如阿斯莫光亮术、卓尔舞光术）只是 `traits[].desc` 纯文本 + `mechanics.cantrips` 字符串数组。`SpellsView` 只读职业法表，种族法术既不进法术选择步骤、不算 cantrip 上限、也不上角色卡 / PDF。
2. **精灵高等血系自选戏法无法选择**：`elven-lineage` trait 写着"自选一个法师戏法"是纯文本；`raceChoices` 没有"选戏法"这种结构化选项，引擎不知道该多给一个戏法槽。
3. **DM 新建职业不进引擎**：内置职业靠手写 `progression[]` 数组提供专长槽 / 子职 / 战斗风格槽。ClassForm 不生成 `progression`，所以 DM 新建职业到 4 级不出现专长选择，子职解锁也失效。另有种族技能字段 admin 写 `{choose,options}`、引擎读 `options`（单选）的 schema 不匹配。

## 设计目标

在不破坏现有功能的前提下，补齐三层缺失的数据模型，让种族法术、自选法术、DM 自建数据都正确进入车卡引擎。遵循 DnD 2024 官方规则。

---

## 第一部分：种族法术数据模型（问题 1 + 2）

### 数据结构（races.js）

为种族新增两个**结构化**字段（与现有 `mechanics.cantrips` 文本描述并存，文本仅用于展示）：

```js
// 固定授予的法术（无需选择）
raceSpells: {
  cantrips: [                       // 戏法
    { baseId: 'light', ability: '魅力' },        // ability 可省略（由 spellcastingAbilityChoice 决定）
  ],
  // 按等级解锁的、长休一次的法术（2024 血系法术）
  leveled: [
    { baseId: 'faerie-fire', level: 3 },
    { baseId: 'darkness', level: 5 },
  ],
}

// 血系/世系驱动的法术（依 raceChoices 的某个选择项不同而不同）
// 挂在 raceChoices[].options[].grants 上：
raceChoices: [
  {
    id: 'elvenLineage', label: '精灵血系', driveSpells: true,
    options: [
      { id: 'drow', label: '卓尔', detail: '…',
        grants: {
          cantrips: [{ baseId: 'dancing-lights' }],
          leveled: [{ baseId: 'faerie-fire', level: 3 }, { baseId: 'darkness', level: 5 }],
        } },
      { id: 'high-elf', label: '高等精灵', detail: '…',
        grants: {
          cantripChoice: { count: 1, fromList: 'wizard' },   // ★ 自选戏法
          leveled: [{ baseId: 'detect-magic', level: 3 }, { baseId: 'misty-step', level: 5 }],
        } },
      { id: 'wood-elf', label: '木精灵', detail: '…',
        grants: {
          cantrips: [{ baseId: 'druidcraft' }],
          leveled: [{ baseId: 'longstrider', level: 3 }, { baseId: 'pass-without-trace', level: 5 }],
        } },
    ],
  },
]

// 施法属性三选一（精灵：智力/感知/魅力）
spellcastingAbilityChoice: ['智力', '感知', '魅力']
```

**关键点**：`cantripChoice` 是问题 2 的解法 —— 它声明"从某法表选 N 个戏法"，由聚合层生成一个选择步骤。

### 聚合层（新文件 `src/utils/raceSpells.js`）

单一数据源，所有读取方都走它：

```js
// 返回该角色因种族获得的所有法术（已解析血系选择、等级、自选）
getRaceSpellGrants(character, selectedRace) => {
  fixedCantrips: [{ baseId, name, nameEn, ability, source }],   // 固定戏法
  cantripChoiceSlots: [{ id, count, fromList, chosen: [...] }], // 需玩家选的戏法槽
  leveledSpells: [{ baseId, name, nameEn, level, source }],     // 按等级解锁的法术（≤ 当前等级）
  spellcastingAbility: '智力'|null,                              // 已选施法属性
}
```

实现要点：
- 固定戏法：`race.raceSpells.cantrips` + 命中的 `raceChoices[].options[].grants.cantrips`
- 自选戏法槽：`grants.cantripChoice`，已选值存 `character.race.choices['raceCantrip_<lineageId>']`
- 按等级法术：`leveled` 中 `level <= character.level` 的项
- 通过 `findSpellByBaseId(baseId)` 补全中英文名（需在 spells.js 新增此导出）

### spells.js 新增导出

```js
export function findSpellByBaseId(baseId) {
  return spells.find(s => s.baseId === baseId) ?? null
}
```

### RaceSelect.vue 改动

- 新增"自选戏法"选择区：当选定血系的 `grants.cantripChoice` 存在时，从 `fromList` 法表的戏法里选 `count` 个，存 `character.race.choices['raceCantrip_<lineageId>']`（数组）。
- 新增"施法属性"选择区：`spellcastingAbilityChoice` 存在时三选一，存 `character.race.choices.raceSpellcastingAbility`。
- 校验：这两项纳入 `goNext` 的 valid 判断。

### SpellsView.vue 改动

- 顶部新增"种族法术"展示块（只读）：列出固定戏法 + 按等级法术 + 已选的自选戏法。
- 种族固定戏法**不占职业戏法上限**（DnD 规则：种族戏法是额外的）。展示清楚来源即可，无需混入职业选择列表。
- 自选戏法的选择仍在 RaceSelect 完成（种族页），SpellsView 仅展示，避免重复 UI。

### CharacterSheet.vue / PrintSheet.vue / pdfMapping.js 改动

- 角色卡"种族戏法"栏改为读 `getRaceSpellGrants`，显示结构化的戏法/法术（带中文名 + 来源），而非 `mechanics.cantrips` 原始字符串。
- PDF：种族戏法目前没有独立字段映射，保持现有职业法术映射不变；种族法术合并进"已知戏法"展示文本（PDF 无对应格子时不强行塞）。

### Admin RaceForm 改动

- 新增"种族法术"区块：可视化编辑 `raceSpells.cantrips`（baseId + ability）与 `raceSpells.leveled`（baseId + level）。
- 血系驱动法术：在 traits/raceChoices 编辑区为每个 option 增加 grants 编辑（范围较大，见"分期"）。

---

## 第二部分：DM 新建职业自动生成 progression（问题 3）

### 标准 progression 生成器（progression.js 新增）

```js
// 按 DnD 2024 通用规则，为缺少 progression 的职业合成一份
export function buildStandardProgression(classDef) {
  const featLevels = [4, 8, 12, 16, 19]   // 通用职业能力值提升/专长节点
  const prog = [
    { level: 1, choices: [{ id: 'skills', kind: 'skillProficiency', source: 'classSkillChoices' }] },
    { level: classDef.subclassLevel ?? 3, choices: [{ id: 'subclass', kind: 'subclass' }] },
    ...featLevels.map(lv => ({ level: lv, choices: [{ id: `feat-${lv}`, kind: 'generalFeat', minLevel: lv }] })),
  ]
  return prog
}
```

### 应用位置（races.js 的 applyRaceOverrides 同款模式 — classes.js 的 applyClassOverrides）

在合并 override 时：**若 merged 没有 `progression`，调用 `buildStandardProgression` 补上**。这样：
- DM 新建职业 → 自动获得 1 级技能、3 级子职、4/8/12/16/19 专长槽。
- DM 编辑内置职业（已有 progression）→ 不覆盖，保留手写的精细 progression（如战士的战斗风格、法师的学者专精）。

> 注意：admin ClassForm 的 `subclassLevel` 字段已存在，生成器读它。子职解锁等级因此可由 DM 控制。

### 不在本期做的：

- ClassForm 不新增可视化 progression 编辑器（用户选了"自动生成"，非"手动编辑"）。
- 战斗风格 / 自选专精等高级 progression 仍仅内置职业拥有；DM 职业走标准模板。

---

## 第三部分：种族技能字段对齐（问题 3 子项）

### 统一 schema：`skillProficiency: { choose: N, options: [...] | 'any' }`

- **RaceSelect.vue**：支持 `choose > 1` 多选，存数组 `character.race.choices.skillProficiencies`（复数，数组）。向后兼容旧的单选 `skillProficiency`（字符串）。
- **skillProficiencies.js 聚合层**：读取时同时支持旧 `choices.skillProficiency`（字符串）和新 `choices.skillProficiencies`（数组）。
- **内置精灵数据**：把 `keen-senses` 对应的技能选择补进 `skillProficiency: { choose: 1, options: ['洞悉','察觉','求生'] }`（当前是 `null`，是个 bug）。
- **store**：`setRace` 切换种族时清理 `skillProficiencies` 数组。

---

## 测试策略

扩展 `test/` 下的轻量 node 脚本（无框架）：

1. **`test/raceSpells.test.mjs`**（新）：
   - 阿斯莫固定戏法 light 出现在 fixedCantrips
   - 卓尔血系：dancing-lights 戏法 + faerie-fire(3级) + darkness(5级)，按等级过滤
   - 高等精灵：cantripChoiceSlots 出现，已选戏法回填
   - 木精灵：druidcraft + longstrider/pass-without-trace
   - 施法属性三选一回填
2. **`test/progression.test.mjs`**（新）：
   - buildStandardProgression：1级技能、3级子职（默认）、自定义 subclassLevel、4/8/12/16/19 专长槽
   - applyClassOverrides：无 progression 的新职业被补全；有 progression 的不被覆盖
3. **扩展 `skillProficiencies.test.mjs`**：
   - 新 `choices.skillProficiencies`（数组，choose>1）多技能熟练
   - 旧 `choices.skillProficiency`（字符串）仍兼容

## 改动文件清单

新增：
- `src/utils/raceSpells.js`
- `test/raceSpells.test.mjs`
- `test/progression.test.mjs`

修改：
- `src/data/spells.js`（+ `findSpellByBaseId`）
- `src/data/races.js`（精灵等结构化 raceSpells / grants / skillProficiency 修复）
- `src/data/classes.js`（+ `applyClassOverrides` 自动补 progression，若尚无此函数则确认现有 override 应用点）
- `src/utils/progression.js`（+ `buildStandardProgression`）
- `src/utils/skillProficiencies.js`（兼容 skillProficiencies 数组）
- `src/store/character.js`（setRace 清理 skillProficiencies）
- `src/views/RaceSelect.vue`（自选戏法 + 施法属性 + 多技能熟练 UI）
- `src/views/SpellsView.vue`（种族法术展示块）
- `src/views/CharacterSheet.vue`（种族法术结构化展示）
- `src/views/PrintSheet.vue` / `src/utils/pdfMapping.js`（如需）
- `src/components/admin/RaceForm.vue`（种族法术编辑区 + skillProficiency choose 字段）

## 分期建议

- **阶段 A（引擎核心，本期重点）**：raceSpells.js 聚合层 + spells.js 导出 + 内置种族数据结构化（精灵全血系、阿斯莫、提夫林、卓尔等）+ progression 自动生成 + skillProficiency 对齐 + RaceSelect/SpellsView/CharacterSheet 读取 + 全部 node 测试。
- **阶段 B（admin 编辑器）**：RaceForm 的 raceSpells / grants 可视化编辑。DM 在此之前仍可通过 JSON override 配置，但 UI 编辑后补。

先做阶段 A 跑通引擎，阶段 B 视情况续。
