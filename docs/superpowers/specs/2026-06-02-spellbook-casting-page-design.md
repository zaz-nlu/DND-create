# 法师施法页（Spellbook Casting Page）设计文档

> 日期：2026-06-02
> 状态：待用户确认

## 1. 目标

为已完成车卡的施法职业（首期聚焦法师）提供一个**实时、规则完整的施法页面**：
玩家在游戏中点击法术即可施法，系统按 DND 2024 规则自动维护法术位、升环、专注、准备状态，并支持长休恢复。

视觉沿用已完成的 `spellbook-prototype.html`（书本质感、宝石法术位、火焰/翻页动画），
但交互模型升级为"可决策的施法工具"，而非静态展示板。

## 2. 范围

### 本期做（In Scope）
- 法师（wizard）施法页，正式集成进 Vue 项目，从真实角色数据读取
- **升环施法**：点法术后选择用哪一环法术位施展，实时显示升环效果提示
- **专注（Concentration）**：同时只能专注一个法术，施放新专注法术时提示替换
- **完整准备机制**：区分"法术书全集"与"今日已准备"，长休时可重新准备，准备数量 = `prepared`
- **实时计算**：法术豁免 DC、法术攻击调整、各环法术位总数/剩余、可施展的最高环阶
- **长休**：恢复全部法术位（已准备法术保留，可选择重新准备）
- **种族赠予法术**：纳入可施展列表（复用 `getRaceSpellGrants`）

- **奥术恢复（Arcane Recovery）**：法师1级职业特性，每天一次，短休时主动激活，可自由组合恢复一批法术位（总环阶 ≤ ceil(等级/2)，单个 ≤ 6环），长休后重置使用机会

### 本期不做（Out of Scope，YAGNI）
- 短休自动恢复法术位（法师短休本身不回位，只有奥术恢复才回）
- 魔契师契约魔法（pact magic）的特殊回复——首期只做法师标准施法
- 多职业（multiclass）法术位合并
- 法术实际伤害骰投掷 / 战斗结算（这是工具页，不是战斗模拟器）
- 仪式施法计时器（仅标注 R 标签，提供"仪式施法"不耗位入口即可，不做10分钟倒计时）

## 3. 数据来源（全部已存在，无需新建数据）

| 需要的数据 | 来源 | 说明 |
|---|---|---|
| 角色等级 | `character.level` | store |
| 职业/子职业 | `character.class.{id,subclassId}` + `classes.js` | |
| 施法进度行 | `spellcastingProgression[level]` → `{cantrips, prepared, slots}` | classes.js，已有 |
| 法术全集 | `getSpellsByList(listId)` | spells.js，已有完整元数据 |
| 法术元数据 | `spell.{level,school,concentration,ritual,castingTime,range,components,desc}` | 已有 |
| 已选戏法 | `character.spells.cantrips: string[]` | store，已有 |
| 已准备法术 | `character.spells.prepared: string[]` | store，已有 |
| 法术位消耗 | `character.spells.slotsUsed: {[lv]: number}` | store，已有 |
| 施法属性 | `currentClass.spellcastingAbility`（法师='智力'） | classes.js |
| 属性调整值 | `abilityMod()` + `getAbilityTotalRows()` | utils/abilities.js、abilityTotals.js，已有 |
| 熟练加值 | `Math.ceil(level/4)+1` | 与 CharacterSheet 一致 |

**结论：这是一个纯前端逻辑 + UI 任务，数据层零改动。**

## 4. 架构

### 4.1 抽取共享 composable：`useSpellcasting.js`

`SpellsView.vue`（车卡时选法术）已实现了大量计算：`spellcastingRow`、`slots`、`slotLevels`、
`maxSpellLevel`、`cantripLimit`、`preparedLimit`、`availableSpells`、种族赠予合并等。

将这些计算逻辑抽到 `src/composables/useSpellcasting.js`，两个页面共享，避免重复与漂移：

```
useSpellcasting() 返回：
  currentClass, currentSubclass, spellList, spellcastingAbility
  spellcastingRow, slots, slotLevels, maxSpellLevel
  cantripLimit, preparedLimit, hasSpellcasting
  availableSpells, raceSpellGrants
  // 新增（施法页需要）：
  spellSaveDC      = 8 + profBonus + 施法属性调整值
  spellAttackBonus =     profBonus + 施法属性调整值
  profBonus
  slotsTotal(level)     // 该环总位数
  slotsRemaining(level) // 该环剩余 = total - slotsUsed[level]
```

`SpellsView.vue` 改为消费这个 composable（保持现有行为不变，仅去重）。

### 4.2 新页面：`SpellbookView.vue`

路由：新增 `/spellbook`（车卡完成后从角色卡进入；DM/玩家游戏中使用）。
内部沿用原型的书本结构，分为四个区：

```
┌─────────────────────────────────────┐
│ 书脊·包角·标题                        │
│ 角色名 · 职业第N级 · DC{实时} · 攻击{实时} │ ← header，DC/攻击实时算
├─────────────────────────────────────┤
│ [戏][I][II][III]...[IX]  书签导航      │ ← 仅显示"有位或有法术"的环
├─────────────────────────────────────┤
│  当前环页：已准备的该环法术列表         │ ← page-scroll
│  · 专注中指示条（若有）🔮 飞行术 [结束] │
│  · 法术卡 × N                         │
├─────────────────────────────────────┤
│  N环法术位  ●●●○○   [长休]            │ ← slot-bar（只读宝石）
└─────────────────────────────────────┘
```

### 4.3 施法弹层（核心交互，方案 A）

点法术卡 → 卡片上浮现魔法环背景 + **环阶选择器**：

```
┌──────────── 魔法环背景 ────────────┐
│           ✦ 魔法飞弹 ✦             │
│         以哪一环施展？             │
│   [1环]   [2环]   [3环]   [4环]    │ ← 只渲染"剩余>0"且">=法术基础环"的按钮
│    ●3      ●2      —       ●1      │ ← 每环剩余数；无位的灰掉
│                                   │
│   ⚡ 升至 2 环：飞弹 4 枚           │ ← 实时升环效果（见 4.4）
│          [ 施  法 ]               │
└───────────────────────────────────┘
```

- 默认选中"该法术最低可用环"
- 选不同环 → 实时刷新升环效果文案
- 点"施法" → 扣对应环法术位（`setSpellSlotUsed`）→ 烧一颗对应环宝石（动画）→ 收起弹层
- 若该法术为专注法术：施法后顶部出现专注指示；若已有专注法术，先弹"替换 X？"确认
- 戏法：无环阶选择器，直接"施法"，无消耗
- 仪式法术（R）：弹层多一个"仪式施法（不耗位 ·+10分钟）"入口

### 4.4 升环效果提示（数据驱动，轻量）

2024 升环效果写在法术 `desc` 里，难以结构化解析全部法术。本期采用**分级策略**：

- **第一期**：对常见法师法术维护一张轻量升环表 `spellUpcastHints`（约 20~30 条），
  形如 `{ baseId: (slotLevel, baseLevel) => '飞弹 ' + (3 + (slotLevel-1)) + ' 枚' }`。
  命中则显示具体数值，未命中则显示通用文案"以 N 环施展（效果见描述）"。
- 这是纯展示提示，不影响扣位逻辑；后续可逐步补全。

### 4.5 专注管理

- store 新增 `character.spells.concentratingOn: string|null`（存 spellId）
- 施放 `concentration` 法术成功后写入；点专注指示条"结束"清空
- 施放新专注法术且已有专注 → 确认替换
- 新增 store 方法 `setConcentration(spellId|null)`

### 4.6 准备机制

- "法术书全集"= `availableSpells`（该职业法术表 + 已学，本期等同职业全表，法师严格应是"已抄入法术书的"，可用 `character.spells.knownBook` 后续扩展；**本期先用职业表全集**，避免阻塞）
- "今日已准备"= `character.spells.prepared`，数量上限 = `preparedLimit`
- 施法页**只列出已准备的法术**（+ 始终可用的种族赠予 + 戏法）
- 长休结束弹"是否重新准备法术"→ 跳转准备界面（复用 SpellsView 的准备 step，或页内简化准备面板）
- 准备超额时禁止再勾选并提示

### 4.7 长休 / 火焰动画的归属调整

- 长休：`slotsUsed` 全清零、宝石恢复动画、长休覆盖层（沿用原型）
- **火焰烧尽动画只作用于"法术位栏 slot-bar"**，不再烧毁法术内容区
  （工具页不应让用户正在看的法术描述消失）

## 5. 数据流

```
长休 → setSpellSlotUsed(lv,0) for all → 宝石恢复 → (可选)重新准备
点法术卡 → 读 slotsRemaining(各环) → 渲染可用环阶按钮
选环阶 → 查 spellUpcastHints → 显示升环提示
点施法 → setSpellSlotUsed(lv, used+1) → 烧宝石动画 → 若专注法术 setConcentration
        → slot-bar 实时刷新 → 该环耗尽则烧 slot-bar
header DC/攻击 → useSpellcasting 实时 computed，属性/等级变即刷新
```

## 6. 错误与边界处理

- 非施法职业进入 `/spellbook` → 显示"该角色无施法能力"占位
- 某环 0 法术位 → 书签灰锁、施法弹层不显示该环按钮
- 已准备列表为空 → 页面提示"长休时尚未准备法术"
- slotsUsed 超过 total（数据异常）→ `slotsRemaining` 取 `max(0, …)` 兜底
- 专注法术指向的 spellId 已不在准备列表 → 容错清空

## 7. 测试策略

逻辑集中在 composable，优先对纯函数做单元测试（vitest，若项目已配；否则手测脚本）：

- `spellSaveDC` / `spellAttackBonus`：给定等级+属性，断言数值（法师7级智力16 → DC=8+3+3=14）
- `slotsTotal/slotsRemaining`：给定 progression + slotsUsed，断言剩余
- 升环可用环阶筛选：基础环=1、当前有 1/3/4 环位 → 返回 [1,3,4]
- 专注替换逻辑：已专注 A，施放专注 B → 状态变 B
- UI 层手动验收：施法扣位、长休恢复、准备超额拦截、动画归属

## 8. 实现顺序（供 writing-plans 细化）

1. 抽 `useSpellcasting.js`，让 `SpellsView.vue` 改用它（回归测试现有车卡流程不变）
2. composable 增补 DC/攻击/slotsTotal/slotsRemaining + 单测
3. store 增 `concentratingOn` + `setConcentration` + 持久化兜底
4. `SpellbookView.vue` 骨架（header/书签/页/slot-bar）只读渲染真实数据
5. 施法弹层 + 升环选择器 + `spellUpcastHints` 表
6. 专注指示与替换确认
7. 长休 + 重新准备入口
8. 火焰/翻页/宝石动画接入（移植原型，动画归属改为 slot-bar）
9. 移动端适配回归（沿用原型 clamp + 媒体查询）
10. 路由接入 + 非施法职业兜底

## 9. 风险

- **升环效果文案覆盖不全**：用分级策略缓解，未命中给通用文案，不阻塞。
- **SpellsView 重构引入回归**：抽 composable 时保持 API 等价，逐项对照原 computed。
- **"法术书全集"近似为职业全表**：法师严格规则是"已抄录"，本期简化，后续可加 `knownBook`，已在 spec 标注为已知偏差。
