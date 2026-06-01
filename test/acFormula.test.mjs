/**
 * 轻量 Node 测试：acFormula 计算逻辑
 * 运行：node test/acFormula.test.mjs
 */

// ── 内联 calculateFormulaAc + calculateCharacterAc ───────────────────────────

function calculateFormulaAc(formula, abilityMap, fallbackDexMod = 0) {
  if (!formula) return 10 + fallbackDexMod
  return formula.base + formula.abilities.reduce(
    (sum, ability) => sum + (abilityMap[ability]?.mod ?? 0),
    0
  )
}

function calculateArmorAc(armor, dexMod = 0) {
  if (!armor) return 10 + dexMod
  const dexBonus = armor.ac.dex
    ? Math.min(dexMod, armor.ac.dexMax ?? dexMod)
    : 0
  return armor.ac.base + dexBonus
}

const SHIELD_BONUS = 2

function calculateCharacterAc({ character, selectedClass, selectedSubclass, abilityMap }) {
  const dexMod = abilityMap['敏捷']?.mod ?? 0
  const armorId = character.equipment?.armorId
  const armor = armorId ? ARMORS[armorId] : null
  const shieldBonus = character.equipment?.shield && hasShieldTraining(selectedClass) ? SHIELD_BONUS : 0

  if (armor) {
    return calculateArmorAc(armor, dexMod) + shieldBonus
  }

  const formula = selectedSubclass?.acFormula ?? selectedClass?.acFormula
  return calculateFormulaAc(formula, abilityMap, dexMod) + shieldBonus
}

function hasShieldTraining(cls) {
  return Boolean(cls?.armor?.includes('盾牌'))
}

// ── 测试用护甲数据 ────────────────────────────────────────────────────────────
const ARMORS = {
  leather: { id: 'leather', category: 'light', ac: { base: 11, dex: true } },
  'chain-mail': { id: 'chain-mail', category: 'heavy', ac: { base: 16, dex: false } },
}

// ── 测试工具 ─────────────────────────────────────────────────────────────────
let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++ }
  else { console.error(`  ✗ ${label}`); failed++ }
}
function section(title) { console.log(`\n── ${title}`) }

function makeAbilityMap(overrides = {}) {
  const defaults = { '力量': 0, '敏捷': 2, '体质': 3, '智力': 0, '感知': 1, '魅力': 0 }
  const mods = { ...defaults, ...overrides }
  return Object.fromEntries(Object.entries(mods).map(([k, v]) => [k, { mod: v }]))
}

function makeChar(overrides = {}) {
  return { equipment: { armorId: null, shield: false }, ...overrides }
}

// ── 测试 1：普通职业无甲（无 acFormula）────────────────────────────────────
section('普通职业：无甲时 10 + 敏捷')
{
  const cls = { id: 'fighter', armor: ['轻甲', '中甲', '重甲', '盾牌'] }
  const map = makeAbilityMap({ '敏捷': 3 })
  const ac = calculateCharacterAc({ character: makeChar(), selectedClass: cls, abilityMap: map })
  assert(ac === 13, `无甲无公式 = 10 + 3 = 13，实际 ${ac}`)
}

// ── 测试 2：旧版野蛮人 acFormula ─────────────────────────────────────────────
section('旧版野蛮人：10 + 敏捷 + 体质')
{
  const cls = { id: 'barbarian', acFormula: { base: 10, abilities: ['敏捷', '体质'] } }
  const map = makeAbilityMap({ '敏捷': 2, '体质': 3 })
  const ac = calculateCharacterAc({ character: makeChar(), selectedClass: cls, abilityMap: map })
  assert(ac === 15, `野蛮人无甲 = 10 + 2 + 3 = 15，实际 ${ac}`)
}

// ── 测试 3：旧版武僧 acFormula ───────────────────────────────────────────────
section('旧版武僧：10 + 敏捷 + 感知')
{
  const cls = { id: 'monk', acFormula: { base: 10, abilities: ['敏捷', '感知'] } }
  const map = makeAbilityMap({ '敏捷': 4, '感知': 2 })
  const ac = calculateCharacterAc({ character: makeChar(), selectedClass: cls, abilityMap: map })
  assert(ac === 16, `武僧无甲 = 10 + 4 + 2 = 16，实际 ${ac}`)
}

// ── 测试 4：DM 新建职业"程序员"：10 + 体质 ──────────────────────────────────
section('DM 新建职业：程序员 10 + 体质')
{
  const cls = { id: 'programmer', acFormula: { base: 10, abilities: ['体质'] } }
  const map = makeAbilityMap({ '敏捷': 1, '体质': 4 })
  const ac = calculateCharacterAc({ character: makeChar(), selectedClass: cls, abilityMap: map })
  assert(ac === 14, `程序员无甲 = 10 + 4 = 14，实际 ${ac}`)
}

// ── 测试 5：穿甲时 acFormula 失效，用护甲 AC ─────────────────────────────────
section('穿护甲时：忽略 acFormula，用护甲计算')
{
  const cls = { id: 'barbarian', acFormula: { base: 10, abilities: ['敏捷', '体质'] } }
  const map = makeAbilityMap({ '敏捷': 2, '体质': 5 })
  // 穿皮甲（base 11 + 敏捷）
  const ac = calculateCharacterAc({
    character: makeChar({ equipment: { armorId: 'leather', shield: false } }),
    selectedClass: cls,
    abilityMap: map,
  })
  assert(ac === 13, `穿皮甲 = 11 + 2 = 13（acFormula 失效），实际 ${ac}`)
}

// ── 测试 6：持盾受训 +2 ──────────────────────────────────────────────────────
section('持盾受训时 +2')
{
  const cls = { id: 'fighter', armor: ['轻甲', '盾牌'] }
  const map = makeAbilityMap({ '敏捷': 2 })
  const ac = calculateCharacterAc({
    character: makeChar({ equipment: { armorId: null, shield: true } }),
    selectedClass: cls,
    abilityMap: map,
  })
  assert(ac === 14, `无甲 + 盾牌受训 = 10 + 2 + 2 = 14，实际 ${ac}`)
}

// ── 测试 7：野蛮人 + 盾牌受训 ────────────────────────────────────────────────
section('野蛮人持盾（受训）：acFormula + 盾牌 +2')
{
  const cls = { id: 'barbarian', armor: ['盾牌'], acFormula: { base: 10, abilities: ['敏捷', '体质'] } }
  const map = makeAbilityMap({ '敏捷': 2, '体质': 3 })
  const ac = calculateCharacterAc({
    character: makeChar({ equipment: { armorId: null, shield: true } }),
    selectedClass: cls,
    abilityMap: map,
  })
  assert(ac === 17, `野蛮人 + 盾 = 10 + 2 + 3 + 2 = 17，实际 ${ac}`)
}

// ── 测试 8：持盾未受训不加 +2 ────────────────────────────────────────────────
section('持盾但未受训：不加 +2')
{
  const cls = { id: 'wizard', armor: [] }  // 无盾牌受训
  const map = makeAbilityMap({ '敏捷': 1 })
  const ac = calculateCharacterAc({
    character: makeChar({ equipment: { armorId: null, shield: true } }),
    selectedClass: cls,
    abilityMap: map,
  })
  assert(ac === 11, `无受训持盾 = 10 + 1 = 11（无 +2），实际 ${ac}`)
}

// ── 测试 9：acFormula = null 的 DM 新建职业走默认 ───────────────────────────
section('DM 新建职业 acFormula = null：走默认 10 + 敏捷')
{
  const cls = { id: 'custom-class', acFormula: null }
  const map = makeAbilityMap({ '敏捷': 3 })
  const ac = calculateCharacterAc({ character: makeChar(), selectedClass: cls, abilityMap: map })
  assert(ac === 13, `acFormula=null = 10 + 3 = 13，实际 ${ac}`)
}

// ── 测试 10：calculateFormulaAc 单独测试 ─────────────────────────────────────
section('calculateFormulaAc 独立测试')
{
  const map = makeAbilityMap({ '敏捷': 2, '体质': 4 })
  assert(calculateFormulaAc(null, map, 2) === 12, 'formula=null fallback = 10 + 2 = 12')
  assert(calculateFormulaAc({ base: 12, abilities: ['体质'] }, map) === 16, 'base=12 + 体质4 = 16')
  assert(calculateFormulaAc({ base: 10, abilities: [] }, map) === 10, 'base=10 无属性 = 10')
}

// ── 汇总 ─────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`测试结果：${passed} 通过 / ${failed} 失败`)
if (failed > 0) process.exit(1)
