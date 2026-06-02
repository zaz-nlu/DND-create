# 法师施法页（SpellbookView）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Vue 项目中实现一个规则完整的法师施法页（`/spellbook`），支持升环施法、专注、完整准备机制、奥术回想（Arcane Recovery）和长休，视觉沿用 spellbook-prototype.html 书本风格。

**Architecture:** 从 `SpellsView.vue` 抽出共用计算到 `useSpellcasting.js` composable；`store/character.js` 增加 `concentratingOn` 和 `arcaneRecoveryUsed` 两个字段；新增 `SpellbookView.vue` 作为施法专用页面，不修改已有的车卡流程。

**Tech Stack:** Vue 3 Composition API、响应式 `character` store（reactive object + localStorage 持久化）、CSS3 动画（沿用原型）、Google Fonts（Cinzel、IM Fell English）

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|---|---|---|
| **新建** | `src/composables/useSpellcasting.js` | 施法计算逻辑（DC、法术位、等），SpellsView 和 SpellbookView 共用 |
| **修改** | `src/store/character.js` | 增加 `concentratingOn`、`arcaneRecoveryUsed`；增加对应 setter |
| **修改** | `src/views/SpellsView.vue` | 改为消费 useSpellcasting composable，行为不变 |
| **新建** | `src/views/SpellbookView.vue` | 施法主页面，书本 UI + 施法弹层 + 奥术回想 + 长休 |
| **新建** | `src/data/spellUpcastHints.js` | 约 25 条常见法师法术的升环效果文案函数 |
| **修改** | `src/router/index.js` | 注册 `/spellbook` 路由 |
| **修改** | `src/views/CharacterSheet.vue` | 在角色卡添加"打开法术书"入口链接 |

---

## Task 1：抽取 `useSpellcasting.js` composable

**Files:**
- Create: `src/composables/useSpellcasting.js`

**背景：** `SpellsView.vue` 中的 `currentClass / spellcastingRow / slots / slotLevels / maxSpellLevel / cantripLimit / preparedLimit / hasSpellcasting / availableSpells / raceSpellGrants` 这些 computed 在施法页也需要，需要抽出来共享。另外新增 `spellSaveDC / spellAttackBonus / profBonus / slotsTotal / slotsRemaining`。

- [ ] **Step 1: 创建 composable 文件**

```js
// src/composables/useSpellcasting.js
import { computed } from 'vue'
import { classes } from '../data/classes.js'
import { races } from '../data/races.js'
import { getSpellListById, getSpellsByList } from '../data/spells.js'
import { character } from '../store/character.js'
import { getRaceSpellGrants } from '../utils/raceSpells.js'
import { abilityMod } from '../utils/abilities.js'
import { getAbilityTotalRows } from '../utils/abilityTotals.js'

export function useSpellcasting() {
  const currentClass = computed(() =>
    classes.find(cls => cls.id === character.class.id) ?? null
  )

  const currentRace = computed(() =>
    races.find(r => r.id === character.race.id) ?? null
  )

  const raceSpellGrants = computed(() =>
    getRaceSpellGrants(character, currentRace.value)
  )

  const currentSubclass = computed(() =>
    currentClass.value?.subclasses?.find(item => item.id === character.class.subclassId) ?? null
  )

  const spellList = computed(() => {
    const listId = currentSubclass.value?.spellList ?? currentClass.value?.spellList
    return listId ? getSpellListById(listId) : null
  })

  const spellcastingAbility = computed(() =>
    currentSubclass.value?.spellcastingAbility ?? currentClass.value?.spellcastingAbility ?? '—'
  )

  const spellcastingRow = computed(() => {
    const cls = currentClass.value
    const subclass = currentSubclass.value
    if (!cls && !subclass) return null

    const subclassNormal = subclass?.spellcastingProgression?.find(r => r.level === character.level)
    if (subclassNormal) return { ...subclassNormal, type: subclass.spellcastingType ?? 'standard' }

    const subclassPact = subclass?.pactMagicProgression?.find(r => r.level === character.level)
    if (subclassPact) return { ...subclassPact, type: 'pact' }

    const normal = cls?.spellcastingProgression?.find(r => r.level === character.level)
    if (normal) return { ...normal, type: cls.spellcastingType ?? 'standard' }

    const pact = cls?.pactMagicProgression?.find(r => r.level === character.level)
    if (pact) return { ...pact, type: 'pact' }

    return null
  })

  const slots = computed(() => spellcastingRow.value?.slots ?? {})

  const slotLevels = computed(() =>
    Object.keys(slots.value)
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b)
  )

  const maxSpellLevel = computed(() => {
    if (spellcastingRow.value?.pactSlotLevel) return spellcastingRow.value.pactSlotLevel
    return slotLevels.value.at(-1) ?? 0
  })

  const cantripLimit = computed(() => spellcastingRow.value?.cantrips ?? 0)
  const preparedLimit = computed(() => spellcastingRow.value?.prepared ?? 0)
  const hasSpellcasting = computed(() => Boolean(spellcastingRow.value))

  const availableSpells = computed(() => {
    if (!spellList.value) return []
    return getSpellsByList(spellList.value.id)
      .filter(spell => spell.level === 0 || spell.level <= maxSpellLevel.value)
  })

  // ── 新增：施法属性调整值 ──────────────────────────────────────
  const spellcastingAbilityMod = computed(() => {
    const ability = spellcastingAbility.value
    if (ability === '—') return 0
    const rows = getAbilityTotalRows(character)
    const row = rows.find(r => r.id === ability)
    return row?.mod ?? 0
  })

  // 熟练加值：ceil(level/4)+1（与 CharacterSheet 一致）
  const profBonus = computed(() => Math.ceil(character.level / 4) + 1)

  // 法术豁免 DC = 8 + 熟练加值 + 施法属性调整值
  const spellSaveDC = computed(() => 8 + profBonus.value + spellcastingAbilityMod.value)

  // 法术攻击调整 = 熟练加值 + 施法属性调整值
  const spellAttackBonus = computed(() => profBonus.value + spellcastingAbilityMod.value)

  // 该环总法术位数
  function slotsTotal(level) {
    return slots.value[level] ?? 0
  }

  // 该环剩余法术位数（兜底 max 0）
  function slotsRemaining(level) {
    const total = slotsTotal(level)
    const used = Number(character.spells.slotsUsed[String(level)]) || 0
    return Math.max(0, total - used)
  }

  // 奥术回想可恢复总环阶上限：ceil(level/2)
  const arcaneRecoveryMaxSlotLevels = computed(() =>
    Math.ceil(character.level / 2)
  )

  // 法师是否有奥术回想（1级即有，检查职业ID）
  const hasArcaneRecovery = computed(() =>
    currentClass.value?.id === 'wizard'
  )

  return {
    currentClass,
    currentRace,
    currentSubclass,
    spellList,
    spellcastingAbility,
    spellcastingRow,
    slots,
    slotLevels,
    maxSpellLevel,
    cantripLimit,
    preparedLimit,
    hasSpellcasting,
    availableSpells,
    raceSpellGrants,
    spellcastingAbilityMod,
    profBonus,
    spellSaveDC,
    spellAttackBonus,
    slotsTotal,
    slotsRemaining,
    arcaneRecoveryMaxSlotLevels,
    hasArcaneRecovery,
  }
}
```

- [ ] **Step 2: 验证 composable 可导入（在项目根目录执行）**

```bash
cd d:/dnd车卡/DND-create && node --input-type=module --eval "
import { useSpellcasting } from './src/composables/useSpellcasting.js'
console.log('composable loaded ok')
" 2>&1 | head -5
```

预期输出：`composable loaded ok`（或因 Vue 环境限制报 computed 错误，但无导入路径错误）

- [ ] **Step 3: commit**

```bash
git add src/composables/useSpellcasting.js
git commit -m "feat: extract useSpellcasting composable with DC/attack/slot helpers"
```

---

## Task 2：更新 store/character.js 增加施法运行时字段

**Files:**
- Modify: `src/store/character.js`

**背景：** 需要两个新的运行时字段：
- `spells.concentratingOn`：正在专注的法术 ID（string | null）
- `spells.arcaneRecoveryUsed`：本次长休间奥术回想是否已用（boolean）

这两个字段需要持久化（玩家中途退出游戏，专注和奥术回想状态应保持）。

- [ ] **Step 1: 修改 `createDefaultCharacter` 中的 spells 初始值**

在 `src/store/character.js` 第 63-67 行，将 `spells` 块改为：

```js
    spells: {
      cantrips: [],
      slotsUsed: {},
      prepared: [],
      concentratingOn: null,
      arcaneRecoveryUsed: false,
    },
```

- [ ] **Step 2: 修改 `normalizeDraft` 中的 spells 读取**

在 `src/store/character.js` 第 140-144 行，将 `spells` 块改为：

```js
    spells: {
      cantrips: Array.isArray(raw?.spells?.cantrips) ? raw.spells.cantrips : [],
      slotsUsed: raw?.spells?.slotsUsed && typeof raw.spells.slotsUsed === 'object' ? raw.spells.slotsUsed : {},
      prepared: Array.isArray(raw?.spells?.prepared) ? raw.spells.prepared : [],
      concentratingOn: typeof raw?.spells?.concentratingOn === 'string' ? raw.spells.concentratingOn : null,
      arcaneRecoveryUsed: Boolean(raw?.spells?.arcaneRecoveryUsed),
    },
```

- [ ] **Step 3: 在 setSpellSlotUsed 下方添加新的 setter 函数**

在 `src/store/character.js` 第 369 行（`toggleCantripSpell` 函数之前）添加：

```js
export function setConcentration(spellId) {
  character.spells.concentratingOn = spellId ?? null
  touchDraft()
}

export function setArcaneRecoveryUsed(value) {
  character.spells.arcaneRecoveryUsed = Boolean(value)
  touchDraft()
}
```

- [ ] **Step 4: 验证 store 改动不影响现有功能（手动，启动开发服务器确认没有 console 报错）**

```bash
cd d:/dnd车卡/DND-create && npm run dev
```

打开浏览器 `http://localhost:5173/spells`，确认法术选择页面正常显示，无控制台错误。

- [ ] **Step 5: commit**

```bash
git add src/store/character.js
git commit -m "feat: add concentratingOn and arcaneRecoveryUsed to character spell state"
```

---

## Task 3：重构 SpellsView.vue 消费 composable（不改功能）

**Files:**
- Modify: `src/views/SpellsView.vue`

**目标：** 删除 SpellsView.vue 中重复定义的 computed，改为从 `useSpellcasting` 导入。行为和 UI **完全不变**。

- [ ] **Step 1: 替换 SpellsView.vue 的 `<script setup>` 顶部 imports 和 computed**

将 `src/views/SpellsView.vue` 的 `<script setup>` 顶部（第 1-71 行）替换为：

```js
<script setup>
import { computed, onUnmounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import AbilityBar from '../components/AbilityBar.vue'
import { spellPreparationRules, spellRuleSections } from '../data/spellRules.js'
import { searchSpells } from '../data/spells.js'
import { character, toggleCantripSpell, togglePreparedSpell } from '../store/character.js'
import { findSpellByBaseId } from '../data/spells.js'
import { useSpellcasting } from '../composables/useSpellcasting.js'
import StepNav from './StepNav.vue'

const router = useRouter()
const query = ref('')
const activeLevel = ref('all')
const activeStepId = ref(null)
const detailSpell = ref(null)
const showSpellRules = ref(false)

watchEffect(() => {
  document.body.style.overflow = (detailSpell.value || showSpellRules.value) ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

const {
  currentClass,
  spellList,
  spellcastingAbility,
  spellcastingRow,
  slots,
  slotLevels,
  maxSpellLevel,
  cantripLimit,
  preparedLimit,
  hasSpellcasting,
  availableSpells,
  raceSpellGrants,
} = useSpellcasting()
```

**注意：** 删除原来第 29-94 行中手动定义的 `currentClass / currentRace / raceSpellGrants / currentSubclass / spellList / spellcastingAbility / spellcastingRow / slots / slotLevels / maxSpellLevel / cantripLimit / preparedLimit / hasSpellcasting / availableSpells`，改为从 composable 解构。其余代码（`alwaysPrepared` 以后的所有函数和变量）保持不变。

- [ ] **Step 2: 验证 SpellsView 功能不变**

```bash
npm run dev
```

浏览器打开 `/spells`，检查：
- 戏法、准备法术数量显示正确
- 点击法术卡片能选中/取消
- 切换环阶过滤器正常
- 搜索功能正常
- 无控制台报错

- [ ] **Step 3: commit**

```bash
git add src/views/SpellsView.vue
git commit -m "refactor: SpellsView consumes useSpellcasting composable, no behavior change"
```

---

## Task 4：创建 `spellUpcastHints.js` 升环效果提示数据

**Files:**
- Create: `src/data/spellUpcastHints.js`

**背景：** 法术的升环效果描述藏在 `spell.desc` 文本里，难以结构化解析全部。维护一张轻量映射表，覆盖约 25 条最常见的法师法术，未命中时给通用文案。

- [ ] **Step 1: 创建文件**

```js
// src/data/spellUpcastHints.js
// 映射 baseId → (slotLevel, spellBaseLevel) => 升环效果说明文字
// 未命中的法术显示通用文案

const hints = {
  'magic-missile': (slot) => `飞弹 ${2 + slot} 枚（每升一环多一枚）`,
  'burning-hands': (slot) => `伤害 ${slot + 2}d6`,
  'thunderwave': (slot) => `伤害 ${slot + 1}d8`,
  'sleep': (slot) => `沉睡 ${slot * 2 + 3}d8 生命值目标`,
  'charm-person': (slot) => `同时魅惑 ${slot} 名目标`,
  'color-spray': (slot) => `影响 ${slot * 2 + 4}d10 生命值目标`,
  'ice-knife': (slot) => `爆裂伤害 ${slot + 1}d6`,
  'shield-of-faith': () => `（无升环加强效果）`,
  'detect-magic': () => `（仪式施法时不耗法术位）`,
  'mage-armor': () => `（无升环加强效果）`,
  'witch-bolt': (slot) => `初始伤害 ${slot}d12`,
  'scorching-ray': (slot) => `额外 ${slot - 1} 束射线`,
  'shatter': (slot) => `伤害 ${slot + 1}d8`,
  'web': () => `（无升环加强效果）`,
  'hold-person': (slot) => `同时定身 ${slot} 名目标`,
  'misty-step': () => `（无升环加强效果）`,
  'mirror-image': () => `（无升环加强效果）`,
  'fireball': (slot) => `伤害 ${slot + 5}d6`,
  'lightning-bolt': (slot) => `伤害 ${slot + 5}d6`,
  'fly': () => `（无升环加强效果，除非多目标）`,
  'haste': () => `（无升环加强效果）`,
  'slow': () => `（无升环加强效果）`,
  'counterspell': (slot) => slot >= 4 ? `自动反制 ${slot} 环以下法术` : `自动反制三环以下法术`,
  'dimension-door': () => `（无升环加强效果）`,
  'banishment': (slot) => `同时驱逐 ${slot - 3} 名额外目标`,
  'polymorph': () => `（无升环加强效果）`,
  'cone-of-cold': (slot) => `伤害 ${slot + 4}d8`,
  'wall-of-force': () => `（无升环加强效果）`,
  'disintegrate': (slot) => `伤害 ${slot + 7}d6+40`,
  'chain-lightning': (slot) => `额外 ${slot - 5} 个次级目标`,
  'finger-of-death': () => `（无升环加强效果）`,
  'power-word-kill': () => `（无升环加强效果）`,
  'cure-wounds': (slot) => `治疗 ${slot}d8+施法属性调整值`,
  'healing-word': (slot) => `治疗 ${slot}d4+施法属性调整值`,
}

/**
 * 获取法术升环效果说明。
 * @param {string} baseId - 法术 baseId（如 'fireball'）
 * @param {number} slotLevel - 实际使用的法术位环阶
 * @param {number} spellBaseLevel - 法术本身的环阶
 * @returns {string} 升环效果说明（若无命中则给通用文案）
 */
export function getUpcastHint(baseId, slotLevel, spellBaseLevel) {
  if (slotLevel <= spellBaseLevel) return ''
  const fn = hints[baseId]
  if (!fn) return `以 ${slotLevel} 环施展（效果见法术描述）`
  return fn(slotLevel, spellBaseLevel)
}
```

- [ ] **Step 2: commit**

```bash
git add src/data/spellUpcastHints.js
git commit -m "feat: add spellUpcastHints for common wizard spells"
```

---

## Task 5：构建 SpellbookView.vue 骨架（header、书签、页面区、slot-bar）

**Files:**
- Create: `src/views/SpellbookView.vue`

**目标：** 先把书本 UI 骨架搭好，从真实 character 数据渲染，但施法弹层、奥术回想弹层先不实现（用空函数占位）。先确保视觉层和数据绑定正确。

- [ ] **Step 1: 创建 SpellbookView.vue 文件**

```vue
<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { character, setSpellSlotUsed, setConcentration, setArcaneRecoveryUsed } from '../store/character.js'
import { useSpellcasting } from '../composables/useSpellcasting.js'
import { findSpellByBaseId } from '../data/spells.js'
import { getUpcastHint } from '../data/spellUpcastHints.js'

const router = useRouter()

const {
  currentClass,
  currentSubclass,
  spellcastingAbility,
  spellSaveDC,
  spellAttackBonus,
  slots,
  slotLevels,
  maxSpellLevel,
  cantripLimit,
  preparedLimit,
  hasSpellcasting,
  availableSpells,
  raceSpellGrants,
  slotsTotal,
  slotsRemaining,
  arcaneRecoveryMaxSlotLevels,
  hasArcaneRecovery,
} = useSpellcasting()

// ── 当前显示的环级（0=戏法，1~9=法术环） ─────────────────────────
const currentTab = ref(0)

// 可用的 tab 列表（有法术或有位的环）
const availableTabs = computed(() => {
  const tabs = []
  // 戏法 tab（有戏法才显示）
  const cantripCount = preparedCantrips.value.length
  if (cantripCount > 0 || cantripLimit.value > 0) tabs.push(0)
  // 1~9 环
  for (let lv = 1; lv <= 9; lv++) {
    const hasSlot = (slots.value[lv] ?? 0) > 0
    const hasPrepared = preparedSpellsByLevel.value[lv]?.length > 0
    if (hasSlot || hasPrepared) tabs.push(lv)
  }
  return tabs
})

// ── 已准备法术 ─────────────────────────────────────────────────
// 已准备的戏法（ID 转法术对象）
const preparedCantrips = computed(() => {
  const all = availableSpells.value.filter(s => s.level === 0)
  return character.spells.cantrips
    .map(id => all.find(s => s.id === id))
    .filter(Boolean)
})

// 种族赠予戏法（合并进戏法页）
const raceCantrips = computed(() => {
  const fixed = raceSpellGrants.value.fixedCantrips
  const chosen = raceSpellGrants.value.cantripChoiceSlots.flatMap(slot =>
    slot.chosen.map(baseId => {
      const spell = findSpellByBaseId(baseId)
      return spell ? { ...spell, source: slot.source } : null
    }).filter(Boolean)
  )
  return [...fixed.map(c => ({ ...findSpellByBaseId(c.baseId), source: c.source })), ...chosen].filter(s => s?.baseId)
})

// 已准备的1~9环法术，按环级分组
const preparedSpellsByLevel = computed(() => {
  const map = {}
  for (let lv = 1; lv <= 9; lv++) map[lv] = []
  const all = availableSpells.value.filter(s => s.level > 0)
  for (const id of character.spells.prepared) {
    const spell = all.find(s => s.id === id)
    if (spell && spell.level >= 1 && spell.level <= 9) {
      map[spell.level].push(spell)
    }
  }
  // 种族赠予的有等级法术也加入对应分组
  for (const ls of raceSpellGrants.value.leveledSpells) {
    const spell = findSpellByBaseId(ls.baseId)
    if (spell && spell.level >= 1 && spell.level <= 9) {
      if (!map[spell.level].find(s => s.baseId === ls.baseId)) {
        map[spell.level].push({ ...spell, source: ls.source })
      }
    }
  }
  return map
})

// 当前 tab 展示的法术列表
const currentTabSpells = computed(() => {
  if (currentTab.value === 0) return [...preparedCantrips.value, ...raceCantrips.value]
  return preparedSpellsByLevel.value[currentTab.value] ?? []
})

// ── 专注状态 ────────────────────────────────────────────────
const concentratingSpell = computed(() => {
  const id = character.spells.concentratingOn
  if (!id) return null
  return findSpellByBaseId(id.replace(/^[^-]+-/, '')) ?? availableSpells.value.find(s => s.id === id) ?? null
})

// ── 施法弹层状态 ─────────────────────────────────────────────
const castingSpell = ref(null)     // 当前点击的法术对象
const selectedSlotLevel = ref(1)   // 弹层内选中的环阶

// 当前法术可用的施法环阶列表（有剩余位 + >= 法术基础环）
const castableSlotLevels = computed(() => {
  if (!castingSpell.value || castingSpell.value.level === 0) return []
  return slotLevels.value.filter(lv =>
    lv >= castingSpell.value.level && slotsRemaining(lv) > 0
  )
})

const upcastHint = computed(() => {
  if (!castingSpell.value) return ''
  return getUpcastHint(castingSpell.value.baseId, selectedSlotLevel.value, castingSpell.value.level)
})

// ── 奥术回想弹层状态 ──────────────────────────────────────────
const showArcaneRecovery = ref(false)
// 奥术回想界面：各环选择恢复数量
const arcaneRecoverySelections = ref({}) // { '1': 0, '2': 0, ... }

// 奥术回想本次已选总环阶
const arcaneRecoverySelectedTotal = computed(() =>
  Object.entries(arcaneRecoverySelections.value)
    .reduce((sum, [lv, cnt]) => sum + Number(lv) * Number(cnt), 0)
)

// 奥术回想剩余可选环阶
const arcaneRecoveryRemaining = computed(() =>
  arcaneRecoveryMaxSlotLevels.value - arcaneRecoverySelectedTotal.value
)

// ── 长休确认状态 ──────────────────────────────────────────────
const showLongRestConfirm = ref(false)
const showLongRestDone = ref(false)

// ── 专注替换确认 ──────────────────────────────────────────────
const pendingConcentrationSpell = ref(null) // 等待用户确认替换的新专注法术

// ── 翻页动画 ──────────────────────────────────────────────────
const flipAnimating = ref(false)
const FLIP_FRAME_PATHS = [
  '/src/assets/images/fanye1.png',
  '/src/assets/images/fanye2.png',
  '/src/assets/images/fanye3.png',
  '/src/assets/images/fanye4.png',
]
const currentFlipFrame = ref(null)
const flipOpacity = ref(0)

function playFlipFrames() {
  const FRAME_MS = 160
  const FADE_MS = 200
  flipAnimating.value = true
  let frame = 0
  currentFlipFrame.value = FLIP_FRAME_PATHS[0]
  flipOpacity.value = 1

  const iv = setInterval(() => {
    frame++
    if (frame < FLIP_FRAME_PATHS.length) {
      currentFlipFrame.value = FLIP_FRAME_PATHS[frame]
    } else {
      clearInterval(iv)
      flipOpacity.value = 0
      setTimeout(() => {
        flipAnimating.value = false
        currentFlipFrame.value = null
      }, FADE_MS + 20)
    }
  }, FRAME_MS)
}

// ── 宝石燃烧状态 ──────────────────────────────────────────────
const burningGemLevel = ref(null)   // 触发燃烧动画的环阶
const burningGemIndex = ref(null)   // 在该环中燃烧的宝石索引（最后一个有值宝石）
const slotBarBurning = ref(false)   // 该环全耗尽时整行燃烧

// ── 切换 tab ──────────────────────────────────────────────────
function switchTab(level) {
  if (level === currentTab.value) return
  playFlipFrames()
  castingSpell.value = null
  currentTab.value = level
}

// ── 点击法术卡 ────────────────────────────────────────────────
function onSpellClick(spell) {
  if (castingSpell.value?.id === spell.id) {
    castingSpell.value = null
    return
  }
  castingSpell.value = spell
  // 默认选中该法术最低可用环阶
  if (spell.level === 0) {
    selectedSlotLevel.value = 0
  } else {
    selectedSlotLevel.value = castableSlotLevels.value[0] ?? spell.level
  }
}

// ── 施法 ──────────────────────────────────────────────────────
function castSpell() {
  const spell = castingSpell.value
  if (!spell) return

  if (spell.level === 0) {
    // 戏法：无消耗
    castingSpell.value = null
    return
  }

  const lv = selectedSlotLevel.value
  if (slotsRemaining(lv) <= 0) return

  // 专注检查
  if (spell.concentration && character.spells.concentratingOn) {
    // 已有专注，需要用户确认
    pendingConcentrationSpell.value = spell
    castingSpell.value = null
    return
  }

  executeCast(spell, lv)
}

function executeCast(spell, slotLevel) {
  const used = Number(character.spells.slotsUsed[String(slotLevel)]) || 0
  setSpellSlotUsed(slotLevel, used + 1)

  // 触发宝石燃烧动画
  const total = slotsTotal(slotLevel)
  const remaining = slotsRemaining(slotLevel) // 已经扣了
  burningGemLevel.value = slotLevel
  burningGemIndex.value = remaining // 第 remaining 个宝石（0-indexed）消失
  setTimeout(() => {
    burningGemLevel.value = null
    burningGemIndex.value = null
    if (remaining === 0) {
      // 全部耗尽：slot-bar 行燃烧效果
      slotBarBurning.value = true
      setTimeout(() => { slotBarBurning.value = false }, 1500)
    }
  }, 700)

  // 更新专注
  if (spell.concentration) {
    setConcentration(spell.id)
  }

  castingSpell.value = null
}

// 专注替换确认
function confirmConcentrationReplace() {
  const spell = pendingConcentrationSpell.value
  if (!spell) return
  const lv = slotLevels.value.find(l => l >= spell.level && slotsRemaining(l) > 0) ?? spell.level
  executeCast(spell, lv)
  pendingConcentrationSpell.value = null
}

function cancelConcentrationReplace() {
  pendingConcentrationSpell.value = null
}

function endConcentration() {
  setConcentration(null)
}

// ── 奥术回想 ──────────────────────────────────────────────────
function openArcaneRecovery() {
  if (character.spells.arcaneRecoveryUsed) return
  // 初始化选择（可恢复：有消耗的环，且 <= 6 环）
  const sels = {}
  for (const lv of slotLevels.value) {
    if (lv <= 6) {
      const used = Number(character.spells.slotsUsed[String(lv)]) || 0
      if (used > 0) sels[String(lv)] = 0
    }
  }
  arcaneRecoverySelections.value = sels
  showArcaneRecovery.value = true
}

function arcaneRecoveryAdjust(lv, delta) {
  const key = String(lv)
  const current = arcaneRecoverySelections.value[key] ?? 0
  const maxRecover = Number(character.spells.slotsUsed[key]) || 0
  const newVal = Math.min(
    maxRecover,
    Math.max(0, current + delta)
  )
  // 检查总环阶不超限
  const newTotal = arcaneRecoverySelectedTotal.value - current * lv + newVal * lv
  if (newTotal > arcaneRecoveryMaxSlotLevels.value) return
  arcaneRecoverySelections.value[key] = newVal
}

function confirmArcaneRecovery() {
  for (const [lvStr, cnt] of Object.entries(arcaneRecoverySelections.value)) {
    if (cnt > 0) {
      const lv = Number(lvStr)
      const used = Number(character.spells.slotsUsed[lvStr]) || 0
      setSpellSlotUsed(lv, Math.max(0, used - cnt))
    }
  }
  setArcaneRecoveryUsed(true)
  showArcaneRecovery.value = false
}

// ── 长休 ──────────────────────────────────────────────────────
function triggerLongRest() {
  showLongRestConfirm.value = true
}

function confirmLongRest() {
  // 恢复所有法术位
  for (const lv of slotLevels.value) {
    setSpellSlotUsed(lv, 0)
  }
  // 重置奥术回想
  setArcaneRecoveryUsed(false)
  // 清除专注
  setConcentration(null)

  showLongRestConfirm.value = false
  showLongRestDone.value = true
  setTimeout(() => { showLongRestDone.value = false }, 2500)
}

function cancelLongRest() {
  showLongRestConfirm.value = false
}

// ── 学派颜色 ──────────────────────────────────────────────────
const SCHOOL_COLORS = {
  '塑能': '#8b2020', '防护': '#205080', '预言': '#206040',
  '惑控': '#602080', '变化': '#804020', '死灵': '#303030',
  '咒法': '#406020', '幻术': '#602880', '治疗': '#205040',
}
const SCHOOL_RING_COLORS = {
  '塑能': '#ff4020', '防护': '#2080ff', '预言': '#20c060',
  '惑控': '#c040ff', '变化': '#ff8020', '死灵': '#60ff80',
  '咒法': '#80ff40', '幻术': '#c040c0', '治疗': '#40ffb0',
}

function schoolColor(school) {
  return SCHOOL_COLORS[school] ?? 'rgba(80,45,10,0.5)'
}
function schoolRingColor(school) {
  return SCHOOL_RING_COLORS[school] ?? '#c8a428'
}

// 宝石颜色（按环阶）
function gemColor(level) {
  if (level <= 2) return 'gold'
  if (level <= 5) return 'blue'
  return 'purple'
}

// tab 显示名
const TAB_LABELS = ['戏', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

// 预加载翻页帧
onMounted(() => {
  FLIP_FRAME_PATHS.forEach(src => { const img = new Image(); img.src = src })
})
</script>
```

- [ ] **Step 2: commit（仅 script 部分，template 下一步写）**

```bash
git add src/views/SpellbookView.vue
git commit -m "feat: SpellbookView script setup with full spellcasting state"
```

---

## Task 6：SpellbookView.vue template 和样式

**Files:**
- Modify: `src/views/SpellbookView.vue`（追加 template + style）

- [ ] **Step 1: 在 SpellbookView.vue 追加 template**

```vue
<template>
  <!-- 无施法能力兜底 -->
  <div v-if="!hasSpellcasting" class="sb-no-spells">
    <p>当前角色没有施法能力。</p>
    <button @click="router.push('/sheet')">← 返回角色卡</button>
  </div>

  <div v-else class="sb-book-shell">
    <!-- 翻页帧覆盖层 -->
    <div
      v-if="flipAnimating"
      class="sb-flip-overlay"
      :style="{ backgroundImage: `url('${currentFlipFrame}')`, opacity: flipOpacity }"
    />

    <!-- 书脊 -->
    <div class="sb-spine" />

    <!-- ── Header ── -->
    <header class="sb-header">
      <div class="sb-header-title">Arcane Grimoire</div>
      <div class="sb-header-sub">法 术 书</div>
      <div class="sb-header-char">
        <div>
          <div class="sb-char-name">{{ character.name || '无名冒险者' }}</div>
          <div class="sb-char-class">
            {{ currentSubclass?.name ?? currentClass?.name ?? '—' }}
            · 第 {{ character.level }} 级
          </div>
        </div>
        <div class="sb-char-stats">
          <span>DC <strong>{{ spellSaveDC }}</strong></span>
          <span>攻击 <strong>+{{ spellAttackBonus }}</strong></span>
        </div>
      </div>
      <button class="sb-back-btn" @click="router.push('/sheet')">← 角色卡</button>
    </header>

    <!-- ── 书签导航 ── -->
    <nav class="sb-bookmark-nav">
      <button
        v-for="lv in availableTabs"
        :key="lv"
        class="sb-bookmark"
        :class="{
          'sb-bookmark--active': lv === currentTab,
          'sb-bookmark--exhausted': lv > 0 && slotsRemaining(lv) === 0 && slotsTotal(lv) > 0,
        }"
        @click="switchTab(lv)"
      >
        <span class="sb-bookmark-label">{{ TAB_LABELS[lv] }}</span>
        <span
          v-if="lv > 0 && slotsTotal(lv) > 0"
          class="sb-bookmark-remain"
          :class="{ 'sb-bookmark-remain--zero': slotsRemaining(lv) === 0 }"
        >{{ slotsRemaining(lv) }}</span>
        <span class="sb-bookmark-dot" />
      </button>
    </nav>

    <!-- ── 专注指示条 ── -->
    <div v-if="concentratingSpell" class="sb-concentration-bar">
      <span class="sb-conc-icon">🔮</span>
      <span class="sb-conc-name">专注：{{ concentratingSpell.name }}</span>
      <button class="sb-conc-end" @click="endConcentration">结束</button>
    </div>

    <!-- ── 页面内容区 ── -->
    <div class="sb-page-viewport">
      <div class="sb-page-sheet">
        <div class="sb-page-scroll">

          <!-- 无法术准备提示 -->
          <div v-if="currentTabSpells.length === 0" class="sb-empty">
            <div class="sb-empty-icon">📜</div>
            <div class="sb-empty-text">
              {{ currentTab === 0 ? '未选择戏法' : '此环未准备法术' }}
            </div>
            <button class="sb-empty-link" @click="router.push('/spells')">前往准备法术</button>
          </div>

          <!-- 法术卡列表 -->
          <template v-else>
            <div class="sb-section-heading">
              {{ currentTab === 0 ? '戏 法' : `${TAB_LABELS[currentTab]} 环 法 术` }}
            </div>

            <div
              v-for="spell in currentTabSpells"
              :key="spell.id"
              class="sb-spell-card"
              :class="{ 'sb-spell-card--casting': castingSpell?.id === spell.id }"
              :style="{ '--school-color': schoolColor(spell.school) }"
              @click="onSpellClick(spell)"
            >
              <!-- 正常内容 -->
              <div class="sb-spell-content">
                <span v-if="spell.level === 0" class="sb-cantrip-badge">CANTRIP</span>
                <div class="sb-spell-name-row">
                  <span class="sb-spell-name-zh">{{ spell.name }}</span>
                  <span class="sb-spell-name-en">{{ spell.nameEn }}</span>
                </div>
                <div class="sb-spell-tags">
                  <span class="sb-spell-tag">{{ spell.school }}</span>
                  <span v-if="spell.castingTime" class="sb-spell-tag">{{ spell.castingTime }}</span>
                  <span v-if="spell.range" class="sb-spell-tag">{{ spell.range }}</span>
                  <span v-if="spell.concentration" class="sb-spell-tag sb-spell-tag--conc">专注</span>
                  <span v-if="spell.ritual" class="sb-spell-tag sb-spell-tag--ritual">仪式</span>
                </div>
                <div class="sb-spell-desc">{{ spell.desc }}</div>
              </div>

              <!-- 施法弹层（点击后展开） -->
              <div v-if="castingSpell?.id === spell.id" class="sb-cast-overlay" @click.stop>
                <!-- 魔法环 SVG -->
                <div class="sb-magic-ring-wrap">
                  <svg viewBox="0 0 80 80" fill="none">
                    <g class="sb-ring-outer">
                      <circle cx="40" cy="40" r="34" :stroke="schoolRingColor(spell.school)" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.8"/>
                      <circle cx="40" cy="40" r="30" :stroke="schoolRingColor(spell.school)" stroke-width="0.5" opacity="0.4"/>
                    </g>
                    <g class="sb-ring-inner">
                      <circle cx="40" cy="40" r="20" :stroke="schoolRingColor(spell.school)" stroke-width="1" stroke-dasharray="5 3" opacity="0.7"/>
                    </g>
                    <circle cx="40" cy="40" r="10" :fill="schoolRingColor(spell.school)" opacity="0.4" class="sb-ring-glow"/>
                    <circle cx="40" cy="40" r="6" :fill="schoolRingColor(spell.school)" opacity="0.9"/>
                  </svg>
                </div>

                <!-- 戏法：直接施法 -->
                <div v-if="spell.level === 0" class="sb-cast-controls">
                  <div class="sb-upcast-hint">无限使用 · 无消耗</div>
                  <button class="sb-cast-btn" @click="castSpell">施 法</button>
                </div>

                <!-- 有等级法术：环阶选择 -->
                <div v-else class="sb-cast-controls">
                  <div class="sb-slot-selector">
                    <button
                      v-for="lv in castableSlotLevels"
                      :key="lv"
                      class="sb-slot-btn"
                      :class="{ 'sb-slot-btn--active': selectedSlotLevel === lv }"
                      @click="selectedSlotLevel = lv"
                    >
                      <span class="sb-slot-btn-lv">{{ lv }}环</span>
                      <span class="sb-slot-btn-remain">剩余{{ slotsRemaining(lv) }}</span>
                    </button>
                  </div>
                  <div v-if="castableSlotLevels.length === 0" class="sb-no-slots-hint">
                    ✕ 无可用法术位
                  </div>
                  <div v-if="upcastHint" class="sb-upcast-hint">⚡ {{ upcastHint }}</div>
                  <!-- 仪式施法入口 -->
                  <div v-if="spell.ritual" class="sb-ritual-hint">
                    <button class="sb-ritual-btn" @click="castingSpell = null">
                      仪式施法（不耗位·+10分钟）
                    </button>
                  </div>
                  <button
                    v-if="castableSlotLevels.length > 0"
                    class="sb-cast-btn"
                    @click="castSpell"
                  >施 法</button>
                </div>

                <!-- 关闭按钮 -->
                <button class="sb-cast-close" @click.stop="castingSpell = null">✕</button>
              </div>
            </div>
          </template>

        </div>
        <div class="sb-scroll-hint">▾</div>
      </div>
    </div>

    <!-- ── 底部法术位栏 ── -->
    <footer class="sb-slot-bar" :class="{ 'sb-slot-bar--burning': slotBarBurning }">
      <div class="sb-slot-bar-header">
        <span class="sb-slot-bar-label">
          {{ currentTab === 0 ? '戏 法' : `${TAB_LABELS[currentTab]} 环 法 术 位` }}
        </span>
        <span class="sb-slot-bar-count">
          {{ currentTab === 0 ? '∞' : `${slotsRemaining(currentTab)} / ${slotsTotal(currentTab)}` }}
        </span>
      </div>

      <!-- 宝石行 -->
      <div class="sb-gems-row">
        <template v-if="currentTab === 0">
          <span class="sb-cantrip-note">无限使用 · 无消耗</span>
        </template>
        <template v-else-if="slotsTotal(currentTab) === 0">
          <span class="sb-cantrip-note">此环无法术位</span>
        </template>
        <template v-else>
          <div
            v-for="i in slotsTotal(currentTab)"
            :key="i"
            class="sb-gem"
            :class="[
              i <= slotsRemaining(currentTab) ? gemColor(currentTab) : 'empty',
              burningGemLevel === currentTab && burningGemIndex === i - 1 ? 'burning' : '',
            ]"
          />
        </template>
      </div>

      <!-- 操作按钮区 -->
      <div class="sb-slot-bar-actions">
        <!-- 奥术回想 -->
        <button
          v-if="hasArcaneRecovery"
          class="sb-action-btn"
          :class="{ 'sb-action-btn--used': character.spells.arcaneRecoveryUsed }"
          :disabled="character.spells.arcaneRecoveryUsed"
          @click="openArcaneRecovery"
          title="奥术回想（短休后每天一次）"
        >
          <span class="sb-action-icon">✦</span>
          <span class="sb-action-label">奥术回想</span>
        </button>
        <!-- 长休 -->
        <button class="sb-action-btn" @click="triggerLongRest">
          <span class="sb-action-icon">☽</span>
          <span class="sb-action-label">长休</span>
        </button>
      </div>
    </footer>

    <!-- ── 专注替换确认弹窗 ── -->
    <Teleport to="body">
      <div v-if="pendingConcentrationSpell" class="sb-modal-backdrop" @click.self="cancelConcentrationReplace">
        <div class="sb-modal">
          <div class="sb-modal-title">替换专注法术？</div>
          <div class="sb-modal-body">
            当前正在专注 <strong>{{ concentratingSpell?.name }}</strong>，
            施放 <strong>{{ pendingConcentrationSpell.name }}</strong> 将结束当前专注。
          </div>
          <div class="sb-modal-actions">
            <button class="sb-modal-btn sb-modal-btn--cancel" @click="cancelConcentrationReplace">取消</button>
            <button class="sb-modal-btn sb-modal-btn--confirm" @click="confirmConcentrationReplace">确认替换</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── 奥术回想弹窗 ── -->
    <Teleport to="body">
      <div v-if="showArcaneRecovery" class="sb-modal-backdrop" @click.self="showArcaneRecovery = false">
        <div class="sb-modal sb-modal--recovery">
          <div class="sb-modal-title">✦ 奥术回想</div>
          <div class="sb-modal-sub">
            可恢复总环阶：<strong>{{ arcaneRecoveryRemaining }}</strong> / {{ arcaneRecoveryMaxSlotLevels }}
            （单个法术位不超过 6 环）
          </div>
          <div class="sb-recovery-list">
            <template v-for="(cnt, lvStr) in arcaneRecoverySelections" :key="lvStr">
              <div class="sb-recovery-row">
                <span class="sb-recovery-lv">{{ lvStr }} 环</span>
                <span class="sb-recovery-used">
                  已耗 {{ character.spells.slotsUsed[lvStr] ?? 0 }} 个
                </span>
                <div class="sb-recovery-stepper">
                  <button @click="arcaneRecoveryAdjust(Number(lvStr), -1)" :disabled="cnt <= 0">−</button>
                  <span>{{ cnt }}</span>
                  <button
                    @click="arcaneRecoveryAdjust(Number(lvStr), 1)"
                    :disabled="arcaneRecoveryRemaining < Number(lvStr) || cnt >= (character.spells.slotsUsed[lvStr] ?? 0)"
                  >＋</button>
                </div>
              </div>
            </template>
            <div v-if="Object.keys(arcaneRecoverySelections).length === 0" class="sb-recovery-empty">
              没有已消耗的法术位（仅支持 1~6 环）
            </div>
          </div>
          <div class="sb-modal-actions">
            <button class="sb-modal-btn sb-modal-btn--cancel" @click="showArcaneRecovery = false">取消</button>
            <button
              class="sb-modal-btn sb-modal-btn--confirm"
              :disabled="arcaneRecoverySelectedTotal <= 0"
              @click="confirmArcaneRecovery"
            >确认恢复</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── 长休确认弹窗 ── -->
    <Teleport to="body">
      <div v-if="showLongRestConfirm" class="sb-modal-backdrop" @click.self="cancelLongRest">
        <div class="sb-modal">
          <div class="sb-modal-title">☽ 长休</div>
          <div class="sb-modal-body">长休将恢复所有法术位并重置奥术回想。是否继续？</div>
          <div class="sb-modal-actions">
            <button class="sb-modal-btn sb-modal-btn--cancel" @click="cancelLongRest">取消</button>
            <button class="sb-modal-btn sb-modal-btn--confirm" @click="confirmLongRest">开始长休</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── 长休完成提示 ── -->
    <Teleport to="body">
      <div v-if="showLongRestDone" class="sb-rest-done">
        <div class="sb-rest-done-title">☽ 长 休 结 束</div>
        <div class="sb-rest-done-sub">· 法 术 位 已 恢 复 ·</div>
      </div>
    </Teleport>

  </div>
</template>
```

- [ ] **Step 2: 在 SpellbookView.vue 追加样式**

```vue
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&display=swap');

:root {
  --sb-leather: #1a0e06;
  --sb-parch: #c8a464;
  --sb-parch-hi: #d8b878;
  --sb-ink: #1a0c04;
  --sb-ink-faded: #6a4020;
  --sb-gold: #c88c28;
  --sb-gold-hi: #f0c840;
  --sb-gold-lo: #7a5010;
  --sb-gold-glow: rgba(200,140,40,0.4);
  --sb-blood: #7a1818;
}

/* ── 非施法职业兜底 ── */
.sb-no-spells {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 100dvh; gap: 16px;
  font-family: 'Cinzel', serif; color: var(--sb-gold);
  background: #0a0604;
}
.sb-no-spells button {
  font-family: 'Cinzel', serif; color: var(--sb-gold);
  background: transparent; border: 1px solid rgba(200,140,40,0.3);
  padding: 8px 20px; border-radius: 3px; cursor: pointer;
}

/* ── 书本外壳 ── */
.sb-book-shell {
  position: relative;
  width: min(420px, 100vw);
  height: 100dvh;
  max-height: 820px;
  margin: 0 auto;
  display: flex; flex-direction: column;
  background: url('/src/assets/images/fengmian.png') center / cover no-repeat;
  box-shadow: 4px 0 0 #0e0804, 8px 0 0 #080402, 0 20px 60px rgba(0,0,0,0.95);
  font-family: 'IM Fell English', serif;
  overflow: hidden;
}

.sb-spine {
  position: absolute; top: 10px; bottom: 10px; left: 0; width: 3px;
  background: linear-gradient(to bottom, transparent, var(--sb-gold-lo) 15%, var(--sb-gold) 50%, var(--sb-gold-lo) 85%, transparent);
  opacity: 0.4; z-index: 5; pointer-events: none;
}

/* ── 翻页帧覆盖 ── */
.sb-flip-overlay {
  position: absolute; inset: 0; z-index: 50;
  background-size: cover; background-position: center; background-repeat: no-repeat;
  pointer-events: none; transition: opacity 0.2s;
}

/* ── Header ── */
.sb-header {
  position: relative; z-index: 10;
  padding: clamp(6px,1.8vw,12px) 14px clamp(5px,1.5vw,9px);
  border-bottom: 1px solid rgba(200,140,40,0.2);
  background: linear-gradient(to bottom, rgba(10,6,2,0.45), transparent);
  flex-shrink: 0;
}
.sb-header-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: clamp(12px,3.8vw,15px);
  color: var(--sb-gold-hi); text-align: center; letter-spacing: 3px;
  text-shadow: 0 0 20px var(--sb-gold-glow);
}
.sb-header-sub {
  font-family: 'Cinzel', serif; font-size: 8px; color: var(--sb-gold-lo);
  text-align: center; letter-spacing: 4px; opacity: 0.7; margin-top: 1px;
}
.sb-header-char {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 5px; padding: 4px 8px;
  background: rgba(0,0,0,0.25); border: 1px solid rgba(200,140,40,0.12); border-radius: 2px;
}
.sb-char-name {
  font-family: 'Cinzel', serif; font-size: clamp(10px,2.5vw,11px);
  color: var(--sb-parch-hi); letter-spacing: 1px;
}
.sb-char-class { font-size: 9px; font-style: italic; color: rgba(200,160,80,0.6); }
.sb-char-stats { display: flex; gap: 12px; font-family: 'Cinzel', serif; }
.sb-char-stats span { font-size: 9px; color: rgba(200,140,40,0.6); }
.sb-char-stats strong { font-size: 15px; color: var(--sb-blood); margin-left: 3px; }
.sb-back-btn {
  position: absolute; top: 8px; right: 10px;
  font-family: 'Cinzel', serif; font-size: 8px; letter-spacing: 1px;
  color: rgba(200,140,40,0.5); background: transparent; border: none; cursor: pointer;
  padding: 2px 4px;
}

/* ── 书签导航 ── */
.sb-bookmark-nav {
  display: flex; position: relative; z-index: 10;
  padding: 0 4px; gap: 2px;
  border-bottom: 1px solid rgba(200,140,40,0.15);
  flex-shrink: 0; overflow-x: auto; scrollbar-width: none;
}
.sb-bookmark-nav::-webkit-scrollbar { display: none; }
.sb-bookmark {
  flex: 1; min-width: 0;
  padding: 5px 2px 4px;
  cursor: pointer; position: relative; text-align: center;
  border: none; background: transparent;
  border-radius: 2px 2px 0 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 44px; transition: background 0.2s;
  user-select: none;
}
.sb-bookmark--active { background: rgba(200,140,40,0.08); }
.sb-bookmark--active::after {
  content: ''; position: absolute; bottom: 0; left: 6px; right: 6px; height: 2px;
  background: linear-gradient(to right, transparent, var(--sb-gold), transparent);
}
.sb-bookmark-label {
  font-family: 'Cinzel', serif; font-size: clamp(8px,2.2vw,11px);
  font-weight: 600; color: rgba(200,140,40,0.45); line-height: 1; display: block;
  transition: color 0.2s;
}
.sb-bookmark--active .sb-bookmark-label { color: var(--sb-gold-hi); text-shadow: 0 0 10px var(--sb-gold-glow); }
.sb-bookmark-remain {
  font-family: 'Cinzel', serif; font-size: 9px;
  color: rgba(200,140,40,0.55); margin-top: 1px; display: block;
}
.sb-bookmark-remain--zero { color: rgba(150,30,30,0.7); }
.sb-bookmark--exhausted .sb-bookmark-label { color: rgba(150,30,30,0.55); }
.sb-bookmark-dot {
  display: block; width: 3px; height: 3px; border-radius: 50%;
  background: transparent; margin: 2px auto 0; transition: background 0.2s;
}
.sb-bookmark--active .sb-bookmark-dot { background: var(--sb-gold); box-shadow: 0 0 6px var(--sb-gold-glow); }

/* ── 专注条 ── */
.sb-concentration-bar {
  position: relative; z-index: 10;
  display: flex; align-items: center; gap: 8px;
  padding: 5px 12px;
  background: rgba(80,20,80,0.25); border-bottom: 1px solid rgba(180,80,200,0.2);
  flex-shrink: 0;
}
.sb-conc-icon { font-size: 13px; }
.sb-conc-name {
  font-family: 'Cinzel', serif; font-size: 10px;
  color: rgba(200,160,220,0.85); letter-spacing: 0.5px; flex: 1;
}
.sb-conc-end {
  font-family: 'Cinzel', serif; font-size: 8px; letter-spacing: 1px;
  color: rgba(200,100,220,0.7); background: transparent;
  border: 1px solid rgba(180,80,200,0.3); border-radius: 2px;
  padding: 2px 8px; cursor: pointer;
}

/* ── 页面主体 ── */
.sb-page-viewport { flex: 1; position: relative; overflow: hidden; }
.sb-page-sheet {
  position: absolute; inset: 0;
  background: url('/src/assets/images/page.png') center / cover no-repeat;
  overflow: hidden;
}
.sb-page-scroll {
  position: absolute; inset: 0;
  overflow-y: auto; overflow-x: hidden;
  padding: 18px 18px 28px 18px;
  scrollbar-width: thin; scrollbar-color: rgba(80,45,10,0.3) transparent;
  -webkit-overflow-scrolling: touch;
  mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 88%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 88%, transparent 100%);
}
.sb-page-scroll::-webkit-scrollbar { width: 3px; }
.sb-page-scroll::-webkit-scrollbar-thumb { background: rgba(80,45,10,0.3); border-radius: 2px; }
.sb-scroll-hint {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  font-size: 13px; color: rgba(80,45,10,0.4); pointer-events: none;
  animation: sbHintBob 1.8s ease-in-out infinite; z-index: 5;
}
@keyframes sbHintBob {
  0%,100% { transform: translateX(-50%) translateY(0); opacity: 0.4; }
  50% { transform: translateX(-50%) translateY(4px); opacity: 0.7; }
}

/* ── 空状态 ── */
.sb-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 50px 20px; gap: 12px; text-align: center;
}
.sb-empty-icon { font-size: 28px; opacity: 0.4; }
.sb-empty-text {
  font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 2px;
  color: var(--sb-ink-faded);
}
.sb-empty-link {
  font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 1.5px;
  color: var(--sb-gold); background: transparent;
  border: 1px solid rgba(200,140,40,0.3); padding: 5px 14px; border-radius: 2px;
  cursor: pointer; margin-top: 4px;
}

/* ── 分区标题 ── */
.sb-section-heading {
  font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 3px;
  color: var(--sb-ink-faded); text-align: center; margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
.sb-section-heading::before,.sb-section-heading::after {
  content: ''; flex: 1; height: 0.5px;
  background: linear-gradient(to right, transparent, var(--sb-ink-faded), transparent); opacity: 0.5;
}

/* ── 法术卡 ── */
.sb-spell-card {
  background: rgba(20,10,4,0.10);
  border: 1px solid rgba(80,45,10,0.32); border-radius: 3px;
  padding: 10px 12px 9px 15px; margin-bottom: 9px;
  cursor: pointer; position: relative; overflow: hidden;
  transition: background 0.15s, border-color 0.15s;
  -webkit-touch-callout: none;
}
.sb-spell-card::before {
  content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 4px;
  background: var(--school-color, rgba(80,45,10,0.5)); border-radius: 3px 0 0 3px;
}
.sb-spell-card:active { background: rgba(20,10,4,0.2); }
.sb-spell-card--casting { border-color: rgba(200,140,40,0.4); background: rgba(20,10,4,0.06); }
.sb-spell-content { position: relative; z-index: 1; }
.sb-cantrip-badge {
  position: absolute; top: 0; right: 0;
  font-family: 'Cinzel', serif; font-size: 7px;
  color: rgba(80,45,10,0.5); letter-spacing: 1.5px;
}
.sb-spell-name-row {
  display: flex; align-items: baseline; gap: 7px; margin-bottom: 5px; flex-wrap: wrap;
}
.sb-spell-name-zh {
  font-family: 'Cinzel', serif; font-size: clamp(13px,3.8vw,15px);
  font-weight: 700; color: #1a0a02; letter-spacing: 0.5px;
}
.sb-spell-name-en { font-size: 10px; color: #5a3010; font-style: italic; opacity: 0.8; }
.sb-spell-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.sb-spell-tag {
  font-size: clamp(8px,2.2vw,9px); font-family: 'Cinzel', serif; color: #3a1c08;
  background: rgba(20,10,4,0.12); border: 1px solid rgba(80,45,10,0.35);
  padding: 1px 6px; border-radius: 2px; letter-spacing: 0.5px; font-weight: 600;
}
.sb-spell-tag--conc { color: #7a1010; border-color: rgba(120,20,20,0.5); background: rgba(120,20,20,0.08); }
.sb-spell-tag--ritual { color: #2a5010; border-color: rgba(50,90,20,0.45); background: rgba(50,90,20,0.08); }
.sb-spell-desc { font-size: clamp(9px,2.5vw,11px); color: #2a1206; line-height: 1.6; font-style: italic; }

/* ── 施法弹层（覆盖在卡片上） ── */
.sb-cast-overlay {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 10px;
  background: rgba(8,4,0,0.88); border-radius: 3px;
}
.sb-magic-ring-wrap {
  width: 64px; height: 64px; flex-shrink: 0; position: relative;
}
.sb-magic-ring-wrap svg { width: 100%; height: 100%; }
.sb-ring-outer { animation: sbRingRotate 3s linear infinite; transform-origin: 50% 50%; }
.sb-ring-inner { animation: sbRingRotate 2s linear infinite reverse; transform-origin: 50% 50%; }
.sb-ring-glow { animation: sbRingPulse 1.4s ease-in-out infinite; }
@keyframes sbRingRotate { to { transform: rotate(360deg); } }
@keyframes sbRingPulse {
  0%,100% { r: 10px; opacity: 0.4; }
  50% { r: 14px; opacity: 0.8; }
}
.sb-cast-controls { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.sb-slot-selector { display: flex; flex-wrap: wrap; gap: 4px; }
.sb-slot-btn {
  display: flex; flex-direction: column; align-items: center;
  padding: 4px 8px; background: rgba(200,140,40,0.1);
  border: 1px solid rgba(200,140,40,0.3); border-radius: 2px; cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.sb-slot-btn--active {
  background: rgba(200,140,40,0.25); border-color: rgba(200,140,40,0.7);
}
.sb-slot-btn-lv { font-family: 'Cinzel', serif; font-size: 10px; color: var(--sb-gold-hi); font-weight: 600; }
.sb-slot-btn-remain { font-size: 8px; color: rgba(200,140,40,0.5); margin-top: 1px; }
.sb-no-slots-hint { font-family: 'Cinzel', serif; font-size: 9px; color: rgba(200,60,40,0.8); letter-spacing: 1px; }
.sb-upcast-hint { font-size: 9px; color: rgba(200,160,80,0.8); font-style: italic; }
.sb-ritual-btn {
  font-family: 'Cinzel', serif; font-size: 8px; letter-spacing: 1px;
  color: rgba(50,140,50,0.8); background: transparent;
  border: 1px solid rgba(50,140,50,0.3); border-radius: 2px;
  padding: 3px 8px; cursor: pointer;
}
.sb-cast-btn {
  font-family: 'Cinzel', serif; font-size: clamp(11px,3.2vw,13px); font-weight: 700;
  letter-spacing: 2px; color: #f0c840; background: transparent;
  border: 1.5px solid rgba(220,160,40,0.6); border-radius: 3px;
  padding: 8px 14px; cursor: pointer;
  text-shadow: 0 0 12px rgba(220,160,40,0.8);
  box-shadow: 0 0 12px rgba(220,160,40,0.12);
  transition: box-shadow 0.15s, background 0.15s;
  align-self: flex-end;
}
.sb-cast-btn:active { background: rgba(220,160,40,0.15); box-shadow: 0 0 24px rgba(220,160,40,0.5); }
.sb-cast-close {
  position: absolute; top: 6px; right: 6px;
  font-size: 10px; color: rgba(200,140,40,0.4); background: transparent; border: none; cursor: pointer;
}

/* ── 底部法术位栏 ── */
.sb-slot-bar {
  flex-shrink: 0; position: relative; z-index: 10;
  border-top: 1px solid rgba(200,140,40,0.15);
  background: linear-gradient(to top, rgba(10,6,2,0.5), rgba(10,6,2,0.2));
  padding: 8px 12px clamp(10px,2.5vw,14px);
  transition: filter 0.3s;
}
.sb-slot-bar--burning { filter: brightness(2) saturate(3) hue-rotate(10deg); animation: sbSlotBurn 1.5s ease both; }
@keyframes sbSlotBurn {
  0% { filter: brightness(1); }
  40% { filter: brightness(3) saturate(5) hue-rotate(20deg); }
  100% { filter: brightness(1); }
}
.sb-slot-bar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.sb-slot-bar-label {
  font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 2px; color: var(--sb-gold-lo); opacity: 0.8;
}
.sb-slot-bar-count { font-family: 'Cinzel', serif; font-size: 11px; color: var(--sb-gold-hi); }
.sb-gems-row { display: flex; justify-content: center; align-items: center; gap: clamp(5px,1.8vw,9px); flex-wrap: wrap; min-height: 32px; }
.sb-cantrip-note { font-family: 'Cinzel', serif; font-size: 9px; color: rgba(200,140,40,0.4); letter-spacing: 2px; }

/* 宝石 */
.sb-gem { width: clamp(22px,6.5vw,30px); height: clamp(22px,6.5vw,30px); border-radius: 50%; flex-shrink: 0; }
.sb-gem.empty { background: transparent; border: 2px solid rgba(200,140,40,0.2); }
.sb-gem.gold {
  background: radial-gradient(circle at 38% 30%, #fff0b0, #d4a030 40%, #8a6010 75%, #3a2008);
  border: 1.5px solid rgba(200,150,40,0.6);
  box-shadow: 0 0 10px rgba(220,160,40,0.45), inset 0 1.5px 3px rgba(255,240,160,0.4);
}
.sb-gem.blue {
  background: radial-gradient(circle at 38% 30%, #d8eeff, #5090d8 40%, #1840a0 75%, #080f30);
  border: 1.5px solid rgba(80,140,220,0.6);
  box-shadow: 0 0 10px rgba(80,140,220,0.45), inset 0 1.5px 3px rgba(180,220,255,0.4);
}
.sb-gem.purple {
  background: radial-gradient(circle at 38% 30%, #f0d8ff, #b060e0 40%, #601898 75%, #180830);
  border: 1.5px solid rgba(160,80,220,0.6);
  box-shadow: 0 0 10px rgba(160,80,220,0.45), inset 0 1.5px 3px rgba(220,180,255,0.4);
}
.sb-gem.burning { animation: sbGemBurn 0.7s ease forwards; pointer-events: none; }
@keyframes sbGemBurn {
  0% { transform: scale(1); filter: brightness(1) hue-rotate(0deg); opacity: 1; }
  20% { transform: scale(1.35); filter: brightness(3.5) hue-rotate(0deg); opacity: 1; }
  55% { transform: scale(0.7) translateY(-8px); filter: brightness(2) hue-rotate(30deg) saturate(3); opacity: 0.6; }
  100% { transform: scale(0) translateY(-18px); opacity: 0; }
}

/* ── 底部操作按钮 ── */
.sb-slot-bar-actions {
  position: absolute; right: 10px; bottom: clamp(8px,2vw,12px);
  display: flex; gap: 6px; align-items: center;
}
.sb-action-btn {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  cursor: pointer; padding: 4px 7px;
  border: 1px solid rgba(200,140,40,0.2); border-radius: 2px;
  background: rgba(0,0,0,0.2); transition: background 0.2s; font-family: 'Cinzel', serif;
}
.sb-action-btn:active { background: rgba(0,0,0,0.35); }
.sb-action-btn--used { opacity: 0.35; cursor: not-allowed; }
.sb-action-btn[disabled] { opacity: 0.35; cursor: not-allowed; }
.sb-action-icon { font-size: 12px; line-height: 1; }
.sb-action-label { font-size: 6px; letter-spacing: 1.5px; color: rgba(200,140,40,0.5); }

/* ── 弹窗通用样式 ── */
.sb-modal-backdrop {
  position: fixed; inset: 0; background: rgba(4,2,0,0.88);
  display: flex; align-items: center; justify-content: center;
  z-index: 500;
}
.sb-modal {
  background: #1a0e06; border: 1px solid rgba(200,140,40,0.3);
  border-radius: 4px; padding: 24px; max-width: 340px; width: 90%;
  box-shadow: 0 0 40px rgba(0,0,0,0.9);
}
.sb-modal--recovery { max-width: 380px; }
.sb-modal-title {
  font-family: 'Cinzel Decorative', serif; font-size: 16px;
  color: var(--sb-gold-hi); letter-spacing: 2px; margin-bottom: 10px; text-align: center;
}
.sb-modal-sub {
  font-family: 'Cinzel', serif; font-size: 10px;
  color: var(--sb-gold); letter-spacing: 1px; text-align: center;
  margin-bottom: 14px; opacity: 0.8;
}
.sb-modal-body {
  font-size: 12px; color: var(--sb-parch); line-height: 1.7;
  margin-bottom: 16px; text-align: center;
}
.sb-modal-body strong { color: var(--sb-gold-hi); }
.sb-modal-actions { display: flex; gap: 8px; justify-content: center; margin-top: 16px; }
.sb-modal-btn {
  font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 1.5px;
  padding: 8px 20px; border-radius: 3px; cursor: pointer; border: 1px solid;
  transition: background 0.15s;
}
.sb-modal-btn--cancel { color: rgba(200,140,40,0.6); border-color: rgba(200,140,40,0.25); background: transparent; }
.sb-modal-btn--cancel:hover { background: rgba(200,140,40,0.08); }
.sb-modal-btn--confirm { color: var(--sb-gold-hi); border-color: rgba(200,140,40,0.55); background: rgba(200,140,40,0.12); }
.sb-modal-btn--confirm:hover { background: rgba(200,140,40,0.22); }
.sb-modal-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── 奥术回想弹窗列表 ── */
.sb-recovery-list { display: flex; flex-direction: column; gap: 8px; margin: 0 0 4px; }
.sb-recovery-row {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 10px; background: rgba(200,140,40,0.06);
  border: 1px solid rgba(200,140,40,0.15); border-radius: 3px;
}
.sb-recovery-lv { font-family: 'Cinzel', serif; font-size: 12px; color: var(--sb-gold); flex: 0 0 36px; }
.sb-recovery-used { font-size: 10px; color: rgba(200,140,40,0.5); flex: 1; font-family: 'Cinzel', serif; }
.sb-recovery-stepper { display: flex; align-items: center; gap: 8px; }
.sb-recovery-stepper button {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(200,140,40,0.12); border: 1px solid rgba(200,140,40,0.35);
  color: var(--sb-gold-hi); font-size: 14px; cursor: pointer; line-height: 1;
}
.sb-recovery-stepper button:disabled { opacity: 0.3; cursor: not-allowed; }
.sb-recovery-stepper span { font-family: 'Cinzel', serif; font-size: 14px; color: var(--sb-gold-hi); min-width: 16px; text-align: center; }
.sb-recovery-empty { font-family: 'Cinzel', serif; font-size: 10px; color: rgba(200,140,40,0.4); text-align: center; padding: 12px 0; }

/* ── 长休完成提示 ── */
.sb-rest-done {
  position: fixed; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(4,2,0,0.92); z-index: 600;
  animation: sbRestFade 2.5s ease both;
  pointer-events: none;
}
@keyframes sbRestFade {
  0% { opacity: 0; } 15% { opacity: 1; } 75% { opacity: 1; } 100% { opacity: 0; }
}
.sb-rest-done-title {
  font-family: 'Cinzel Decorative', serif; font-size: clamp(18px,5vw,22px);
  color: var(--sb-gold-hi); letter-spacing: 3px;
  text-shadow: 0 0 40px rgba(220,160,40,0.9); margin-bottom: 8px;
}
.sb-rest-done-sub {
  font-family: 'Cinzel', serif; font-size: 10px;
  color: var(--sb-gold); letter-spacing: 5px; opacity: 0.6;
}

/* ── 响应式 ── */
@media (max-width: 380px) {
  .sb-header-title { font-size: 12px; letter-spacing: 2px; }
  .sb-header-sub { display: none; }
  .sb-char-name { font-size: 10px; }
  .sb-spell-name-zh { font-size: 13px; }
  .sb-spell-desc { font-size: 9px; }
  .sb-gem { width: 20px; height: 20px; }
  .sb-cast-btn { font-size: 11px; padding: 7px 10px; }
  .sb-magic-ring-wrap { width: 52px; height: 52px; }
}
@media (max-height: 600px) {
  .sb-header { padding: 5px 12px 4px; }
  .sb-header-sub { display: none; }
  .sb-slot-bar { padding: 6px 12px 8px; }
  .sb-bookmark { min-height: 36px; }
}
</style>
```

- [ ] **Step 3: commit**

```bash
git add src/views/SpellbookView.vue
git commit -m "feat: SpellbookView template + styles with full casting UI"
```

---

## Task 6：注册路由 + CharacterSheet 入口

**Files:**
- Modify: `src/router/index.js`
- Modify: `src/views/CharacterSheet.vue`

- [ ] **Step 1: 在 router/index.js 注册路由**

在 `src/router/index.js` 中，在现有 import 块末尾追加：

```js
import SpellbookView from '../views/SpellbookView.vue'
```

在 `routes` 数组中，`{ path: '/sheet', ... }` 之后追加：

```js
    { path: '/spellbook', component: SpellbookView },
```

- [ ] **Step 2: 在 CharacterSheet.vue 找到法术展示区域，添加"打开法术书"按钮**

先搜索 CharacterSheet.vue 中与法术/法术位相关的区域：

```bash
grep -n "spell\|slotsUsed\|法术\|施法" d:/dnd车卡/DND-create/src/views/CharacterSheet.vue | head -20
```

然后在合适的位置（法术相关 section 的标题旁）添加路由链接。若 CharacterSheet 有类似以下结构：

```html
<section class="sheet-section">
  <h3>法术</h3>
  <!-- ... -->
</section>
```

则在该 `<h3>` 旁添加：

```html
<router-link to="/spellbook" class="sheet-spellbook-link">打开法术书 →</router-link>
```

并在 `<style>` 中添加：

```css
.sheet-spellbook-link {
  font-family: var(--font-title, 'Cinzel', serif);
  font-size: 10px; letter-spacing: 1.5px;
  color: rgba(200,140,40,0.7); text-decoration: none;
  border: 1px solid rgba(200,140,40,0.25); border-radius: 2px;
  padding: 2px 8px; margin-left: 10px;
  transition: background 0.15s;
}
.sheet-spellbook-link:hover { background: rgba(200,140,40,0.08); }
```

- [ ] **Step 3: 验证路由可访问**

```bash
npm run dev
```

浏览器访问 `http://localhost:5173/spellbook`，确认页面加载、书签和法术列表根据真实角色数据渲染，无控制台报错。

- [ ] **Step 4: commit**

```bash
git add src/router/index.js src/views/CharacterSheet.vue
git commit -m "feat: register /spellbook route and add link from CharacterSheet"
```

---

## Task 7：集成测试与边界检查

**Files:**
- 无新文件，手动验收清单

- [ ] **Step 1: 施法流程测试**

启动 dev server，确保 character 选择了法师职业且有已准备法术，访问 `/spellbook`：

1. header 显示正确的 DC（8+熟练加值+智力调整值）和攻击加值
2. 书签只显示有法术或有法术位的环级
3. 点法术卡 → 弹层出现，显示魔法环 + 可用环阶按钮（剩余数正确）
4. 选不同环 → 升环提示文字更新
5. 点"施法" → 宝石燃烧动画 → 法术位计数减一 → 书签上剩余数更新
6. 全环耗尽 → slot-bar 行闪光效果，书签标签变红色
7. 戏法：点施法直接关闭弹层，无消耗

- [ ] **Step 2: 专注测试**

1. 施放含"专注"标签的法术（如"飞行术 Fly"）→ header 下方出现专注条
2. 再施放另一个专注法术 → 弹出"替换专注"确认框
3. 点"取消" → 原专注保留，施法取消
4. 点"确认替换" → 专注换为新法术，法术位被消耗
5. 点专注条上"结束" → 专注条消失

- [ ] **Step 3: 奥术回想测试**

1. 消耗若干 1~3 环法术位
2. 点"奥术回想"按钮 → 弹窗显示可恢复的环级和数量
3. 调整要恢复的数量，总环阶不能超过 ceil(level/2)，超出时 + 按钮灰掉
4. 确认 → 法术位恢复，宝石点亮，"奥术回想"按钮变灰（已用标记）
5. 再次点击灰色按钮 → 无响应

- [ ] **Step 4: 长休测试**

1. 点"长休" → 确认弹窗
2. 取消 → 状态不变
3. 确认 → 全部法术位恢复（宝石全亮）、奥术回想重置（按钮可用）、专注清除、长休完成提示 2.5s 后消失
4. 已准备法术列表不变（不影响 `character.spells.prepared`）

- [ ] **Step 5: 边界测试**

1. 角色无施法能力 → 显示"当前角色没有施法能力"兜底页
2. 无已准备法术 → 显示"此环未准备法术"提示 + "前往准备法术"链接
3. 奥术回想弹窗中无消耗法术位（或全 7+ 环）→ 显示"没有已消耗的法术位"空状态
4. 法术位全为 0 slots（0级角色或某环） → 书签不显示该环

- [ ] **Step 6: 移动端适配验收**

浏览器 DevTools 模拟 375px 宽度、812px 高度（iPhone 14 尺寸），确认：
- 所有文字可读，无溢出
- 书签可横向滚动
- 弹窗在小屏居中显示
- 宝石和按钮触控区域合理

- [ ] **Step 7: 最终 commit**

```bash
git add -A
git commit -m "feat: SpellbookView complete - full 2024 rules wizard spellcasting page"
```

---

## 自检结果

**Spec 覆盖检查：**
- ✅ 升环施法 → Task 5 施法弹层 `castableSlotLevels` + `selectedSlotLevel`
- ✅ 专注管理 → Task 2 store + Task 5 `pendingConcentrationSpell` + 确认弹窗
- ✅ 完整准备机制 → Task 5 `preparedCantrips` / `preparedSpellsByLevel`（只展示已准备）
- ✅ 实时 DC/攻击 → Task 1 composable `spellSaveDC` / `spellAttackBonus`
- ✅ 奥术回想 → Task 5 `openArcaneRecovery` / `arcaneRecoverySelections` / `confirmArcaneRecovery`
- ✅ 长休 → Task 5 `confirmLongRest`，清零所有 slotsUsed + arcaneRecoveryUsed + concentratingOn
- ✅ 种族赠予法术 → Task 5 `raceCantrips` / `preparedSpellsByLevel` 中合并 leveledSpells
- ✅ 仪式施法入口 → Task 5 `sb-ritual-btn`（标注，不耗位）
- ✅ 非施法职业兜底 → Task 5 `v-if="!hasSpellcasting"` 分支
- ✅ 移动端适配 → Task 5 样式 `clamp()` + 两个 media query
- ✅ 火焰动画归属 → `.sb-slot-bar--burning` 仅作用于底部法术位栏，不烧法术内容

**未覆盖的已知偏差（按 spec 标注为 Out of Scope）：**
- 短休自动回位 → 不做，正确
- 多职业合并法术位 → 不做，正确
- 法术书"已抄录"概念 → 本期用职业全表近似，正确

**类型/方法名一致性：**
- `slotsTotal(level)` / `slotsRemaining(level)` 在 composable 定义，Task 5 template 全部使用这两个函数名，一致
- `setSpellSlotUsed / setConcentration / setArcaneRecoveryUsed` 在 Task 2 定义，Task 5 import 使用，一致
- `arcaneRecoverySelections` 在 script 定义，template 直接引用，一致
