/**
 * 轻量 Node 测试：raceSpells.js 聚合层
 * 运行：node test/raceSpells.test.mjs
 */

// ── 内联 getRaceSpellGrants（避免 Vue 模块依赖）──────────────────────────────

function getRaceSpellGrants(character, selectedRace) {
  if (!selectedRace) {
    return { fixedCantrips: [], cantripChoiceSlots: [], leveledSpells: [], spellcastingAbility: null, spellcastingAbilityOptions: [] }
  }

  const raceChoices = character.race?.choices ?? {}
  const charLevel = character.level ?? 1

  const abilityOptions = selectedRace.spellcastingAbilityChoice ?? []
  const spellcastingAbility = raceChoices.raceSpellcastingAbility
    ?? (abilityOptions.length === 1 ? abilityOptions[0] : null)

  const fixedCantrips = []
  const cantripChoiceSlots = []
  const leveledSpells = []

  const raceSpells = selectedRace.raceSpells ?? {}
  for (const entry of (raceSpells.cantrips ?? [])) {
    fixedCantrips.push({ baseId: entry.baseId, name: entry.baseId, nameEn: entry.baseId, ability: entry.ability ?? spellcastingAbility, source: selectedRace.name })
  }
  for (const entry of (raceSpells.leveled ?? [])) {
    if (entry.level <= charLevel) {
      leveledSpells.push({ baseId: entry.baseId, name: entry.baseId, nameEn: entry.baseId, level: entry.level, source: selectedRace.name })
    }
  }

  for (const choiceDef of (selectedRace.raceChoices ?? [])) {
    if (!choiceDef.driveSpells) continue
    const chosenOptionId = raceChoices[choiceDef.id]
    if (!chosenOptionId) continue
    const option = choiceDef.options.find(o => o.id === chosenOptionId)
    if (!option?.grants) continue
    const grants = option.grants
    const sourceLabel = `${selectedRace.name}（${option.label}）`

    for (const entry of (grants.cantrips ?? [])) {
      fixedCantrips.push({ baseId: entry.baseId, name: entry.baseId, nameEn: entry.baseId, ability: entry.ability ?? spellcastingAbility, source: sourceLabel })
    }

    if (grants.cantripChoice) {
      const slotId = `raceCantrip_${choiceDef.id}`
      const chosen = Array.isArray(raceChoices[slotId]) ? raceChoices[slotId] : []
      cantripChoiceSlots.push({ id: slotId, count: grants.cantripChoice.count ?? 1, fromList: grants.cantripChoice.fromList, chosen, label: `${option.label} 自选戏法`, source: sourceLabel })
    }

    for (const entry of (grants.leveled ?? [])) {
      if (entry.level <= charLevel) {
        leveledSpells.push({ baseId: entry.baseId, name: entry.baseId, nameEn: entry.baseId, level: entry.level, source: sourceLabel })
      }
    }
  }

  return { fixedCantrips, cantripChoiceSlots, leveledSpells, spellcastingAbility, spellcastingAbilityOptions: abilityOptions }
}

function isRaceSpellGrantsValid(character, selectedRace) {
  const grants = getRaceSpellGrants(character, selectedRace)
  for (const slot of grants.cantripChoiceSlots) {
    if (slot.chosen.length < slot.count) return false
  }
  if (grants.spellcastingAbilityOptions.length > 1 && !grants.spellcastingAbility) return false
  return true
}

// ── 测试工具 ─────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++ }
  else { console.error(`  ✗ ${label}`); failed++ }
}

function section(title) { console.log(`\n── ${title}`) }

function makeChar(overrides = {}) {
  return {
    level: 1,
    race: { id: null, choices: {} },
    class: { id: null, choices: {} },
    abilities: {}, skills: {}, spells: { cantrips: [], prepared: [], slotsUsed: {} },
    ...overrides,
  }
}

// ── 种族数据 stubs ─────────────────────────────────────────────────────────

const aasimar = {
  id: 'aasimar', name: '阿斯莫',
  raceSpells: {
    cantrips: [{ baseId: 'light', ability: '魅力' }],
    leveled: [],
  },
  raceChoices: [],
  spellcastingAbilityChoice: [],
}

const elf = {
  id: 'elf', name: '精灵',
  raceSpells: { cantrips: [], leveled: [] },
  spellcastingAbilityChoice: ['智力', '感知', '魅力'],
  raceChoices: [
    {
      id: 'elvenLineage',
      label: '精灵血系',
      driveSpells: true,
      options: [
        {
          id: 'drow', label: '卓尔',
          grants: {
            cantrips: [{ baseId: 'dancing-lights' }],
            leveled: [{ baseId: 'faerie-fire', level: 3 }, { baseId: 'darkness', level: 5 }],
          },
        },
        {
          id: 'high-elf', label: '高等精灵',
          grants: {
            cantripChoice: { count: 1, fromList: 'wizard' },
            leveled: [{ baseId: 'detect-magic', level: 3 }, { baseId: 'misty-step', level: 5 }],
          },
        },
        {
          id: 'wood-elf', label: '木精灵',
          grants: {
            cantrips: [{ baseId: 'druidcraft' }],
            leveled: [{ baseId: 'longstrider', level: 3 }, { baseId: 'pass-without-trace', level: 5 }],
          },
        },
      ],
    },
  ],
}

const tiefling = {
  id: 'tiefling', name: '提夫林',
  raceSpells: { cantrips: [{ baseId: 'thaumaturgy' }], leveled: [] },
  spellcastingAbilityChoice: ['智力', '感知', '魅力'],
  raceChoices: [
    {
      id: 'fiendishLegacy',
      label: '邪魔遗赠',
      driveSpells: true,
      options: [
        {
          id: 'infernal', label: '炼狱',
          grants: {
            cantrips: [{ baseId: 'fire-bolt' }],
            leveled: [{ baseId: 'hellish-rebuke', level: 3 }, { baseId: 'darkness', level: 5 }],
          },
        },
      ],
    },
  ],
}

// ── 测试 1：空种族 ────────────────────────────────────────────────────────────
section('无种族时返回空结构')
{
  const result = getRaceSpellGrants(makeChar(), null)
  assert(result.fixedCantrips.length === 0, 'fixedCantrips 为空')
  assert(result.leveledSpells.length === 0, 'leveledSpells 为空')
  assert(result.spellcastingAbility === null, 'spellcastingAbility = null')
}

// ── 测试 2：阿斯莫固定戏法 ───────────────────────────────────────────────────
section('阿斯莫：固定戏法 light（魅力）')
{
  const char = makeChar({ race: { id: 'aasimar', choices: {} } })
  const g = getRaceSpellGrants(char, aasimar)
  assert(g.fixedCantrips.length === 1, 'fixedCantrips 有 1 项')
  assert(g.fixedCantrips[0].baseId === 'light', 'baseId = light')
  assert(g.fixedCantrips[0].ability === '魅力', 'ability = 魅力')
  assert(g.leveledSpells.length === 0, '无按等级法术')
  assert(g.cantripChoiceSlots.length === 0, '无自选戏法槽')
}

// ── 测试 3：卓尔血系戏法 + 按等级法术 ───────────────────────────────────────
section('精灵卓尔：舞光术 + 3级妖火 + 5级黑暗术（等级过滤）')
{
  const char3 = makeChar({ level: 3, race: { id: 'elf', choices: { elvenLineage: 'drow', raceSpellcastingAbility: '智力' } } })
  const g3 = getRaceSpellGrants(char3, elf)
  assert(g3.fixedCantrips.some(c => c.baseId === 'dancing-lights'), '3级：有舞光术')
  assert(g3.leveledSpells.some(s => s.baseId === 'faerie-fire'), '3级：有妖火')
  assert(!g3.leveledSpells.some(s => s.baseId === 'darkness'), '3级：无黑暗术（需5级）')
  assert(g3.spellcastingAbility === '智力', '施法属性 = 智力')

  const char5 = makeChar({ level: 5, race: { id: 'elf', choices: { elvenLineage: 'drow', raceSpellcastingAbility: '感知' } } })
  const g5 = getRaceSpellGrants(char5, elf)
  assert(g5.leveledSpells.some(s => s.baseId === 'darkness'), '5级：有黑暗术')
}

// ── 测试 4：高等精灵自选戏法槽 ───────────────────────────────────────────────
section('精灵高等精灵：自选戏法槽 + 已选 + 未完成校验')
{
  const charNoChoice = makeChar({ level: 1, race: { id: 'elf', choices: { elvenLineage: 'high-elf', raceSpellcastingAbility: '魅力' } } })
  const g0 = getRaceSpellGrants(charNoChoice, elf)
  assert(g0.cantripChoiceSlots.length === 1, '有 1 个自选戏法槽')
  assert(g0.cantripChoiceSlots[0].count === 1, 'count = 1')
  assert(g0.cantripChoiceSlots[0].chosen.length === 0, '未选时 chosen 为空')
  assert(!isRaceSpellGrantsValid(charNoChoice, elf), '未选时校验不通过')

  const charChosen = makeChar({ level: 1, race: { id: 'elf', choices: { elvenLineage: 'high-elf', raceSpellcastingAbility: '魅力', 'raceCantrip_elvenLineage': ['fire-bolt'] } } })
  assert(isRaceSpellGrantsValid(charChosen, elf), '已选时校验通过')
}

// ── 测试 5：施法属性未选时校验失败 ──────────────────────────────────────────
section('施法属性三选一：未选时校验失败，选后通过')
{
  const charNoAbility = makeChar({ level: 1, race: { id: 'elf', choices: { elvenLineage: 'wood-elf' } } })
  // wood-elf 无 cantripChoice，只验证施法属性
  assert(!isRaceSpellGrantsValid(charNoAbility, elf), '施法属性未选时校验失败')

  const charWithAbility = makeChar({ level: 1, race: { id: 'elf', choices: { elvenLineage: 'wood-elf', raceSpellcastingAbility: '感知' } } })
  assert(isRaceSpellGrantsValid(charWithAbility, elf), '施法属性已选时校验通过')
}

// ── 测试 6：木精灵戏法 ───────────────────────────────────────────────────────
section('精灵木精灵：德鲁伊伎俩 + 3级大步奔行')
{
  const char = makeChar({ level: 3, race: { id: 'elf', choices: { elvenLineage: 'wood-elf', raceSpellcastingAbility: '魅力' } } })
  const g = getRaceSpellGrants(char, elf)
  assert(g.fixedCantrips.some(c => c.baseId === 'druidcraft'), '有德鲁伊伎俩')
  assert(g.leveledSpells.some(s => s.baseId === 'longstrider'), '3级有大步奔行')
  assert(!g.leveledSpells.some(s => s.baseId === 'pass-without-trace'), '3级无行动无踪')
}

// ── 测试 7：提夫林固定戏法 + 血系法术 ───────────────────────────────────────
section('提夫林：固定奇术 + 炼狱血系火焰箭 + 3级炼狱叱喝')
{
  const char = makeChar({ level: 3, race: { id: 'tiefling', choices: { fiendishLegacy: 'infernal', raceSpellcastingAbility: '魅力' } } })
  const g = getRaceSpellGrants(char, tiefling)
  assert(g.fixedCantrips.some(c => c.baseId === 'thaumaturgy'), '固定戏法：奇术')
  assert(g.fixedCantrips.some(c => c.baseId === 'fire-bolt'), '血系戏法：火焰箭')
  assert(g.leveledSpells.some(s => s.baseId === 'hellish-rebuke'), '3级：炼狱叱喝')
}

// ── 测试 8：driveSpells 未设置时跳过血系法术 ────────────────────────────────
section('raceChoices 无 driveSpells 时不产生法术')
{
  const raceNoDrive = {
    id: 'test', name: '测试',
    raceSpells: { cantrips: [], leveled: [] },
    spellcastingAbilityChoice: [],
    raceChoices: [
      { id: 'lineage', label: '血系', options: [{ id: 'a', label: 'A', grants: { cantrips: [{ baseId: 'light' }] } }] },
    ],
  }
  const char = makeChar({ race: { id: 'test', choices: { lineage: 'a' } } })
  const g = getRaceSpellGrants(char, raceNoDrive)
  assert(g.fixedCantrips.length === 0, 'driveSpells=false 时不产生法术')
}

// ── 汇总 ─────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`测试结果：${passed} 通过 / ${failed} 失败`)
if (failed > 0) process.exit(1)
