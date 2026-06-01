import { reactive, watch } from 'vue'

const STORAGE_KEYS = {
  drafts: 'dndcc:drafts:v1',
  activeDraftId: 'dndcc:activeDraftId',
}

const CURRENT_VERSION = 1

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createDraftId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `draft_${crypto.randomUUID()}`
  }
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function clampLevel(value) {
  const level = Number.parseInt(value, 10)
  if (Number.isNaN(level)) return 3
  return Math.min(20, Math.max(1, level))
}

function createDefaultCharacter(id = createDraftId()) {
  const now = Date.now()
  return {
    version: CURRENT_VERSION,
    id,
    createdAt: now,
    updatedAt: now,
    name: '',
    level: 3,
    ruleset: 'dnd-2024',
    race: {
      id: null,
      choices: {},
    },
    background: {
      id: null,
      choices: {},
    },
    class: {
      id: null,
      level: 3,
      subclassId: null,
      choices: {},
    },
    abilities: {
      method: null,
      scores: {},
    },
    hp: {
      max: 0,
      current: 0,
      temp: 0,
      method: null,
      rolls: [],
    },
    skills: {},
    spells: {
      cantrips: [],
      slotsUsed: {},
      prepared: [],
    },
    inventory: {
      gold: 0,
      items: [],
    },
    equipment: {
      armorId: null,
      shield: false,
    },
    notes: '',
  }
}

function normalizeChoiceBlock(value) {
  if (typeof value === 'string') {
    return { id: value, choices: {} }
  }
  return {
    id: value?.id ?? null,
    choices: value?.choices && typeof value.choices === 'object' ? value.choices : {},
  }
}

function normalizeClassBlock(value, characterLevel) {
  if (typeof value === 'string') {
    return {
      id: value,
      level: characterLevel,
      subclassId: null,
      choices: {},
    }
  }

  return {
    id: value?.id ?? null,
    level: clampLevel(value?.level ?? characterLevel),
    subclassId: value?.subclassId ?? null,
    choices: value?.choices && typeof value.choices === 'object' ? value.choices : {},
  }
}

function normalizeDraft(raw) {
  const base = createDefaultCharacter(raw?.id ?? createDraftId())
  const level = clampLevel(raw?.level ?? raw?.class?.level ?? 3)

  return {
    ...base,
    version: CURRENT_VERSION,
    createdAt: typeof raw?.createdAt === 'number' ? raw.createdAt : base.createdAt,
    updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt : base.updatedAt,
    name: typeof raw?.name === 'string' ? raw.name : '',
    level,
    ruleset: raw?.ruleset ?? base.ruleset,
    race: normalizeChoiceBlock(raw?.race),
    background: normalizeChoiceBlock(raw?.background),
    class: normalizeClassBlock(raw?.class, level),
    abilities: {
      method: raw?.abilities?.method ?? raw?.attributes?.method ?? null,
      scores:
        raw?.abilities?.scores && typeof raw.abilities.scores === 'object'
          ? raw.abilities.scores
          : raw?.attributes && typeof raw.attributes === 'object'
            ? raw.attributes
            : {},
    },
    hp: {
      max: Number.isFinite(raw?.hp?.max) ? raw.hp.max : 0,
      current: Number.isFinite(raw?.hp?.current) ? raw.hp.current : 0,
      temp: Number.isFinite(raw?.hp?.temp) ? raw.hp.temp : 0,
      method: raw?.hp?.method ?? null,
      rolls: Array.isArray(raw?.hp?.rolls) ? raw.hp.rolls : [],
    },
    skills: raw?.skills && typeof raw.skills === 'object' ? raw.skills : {},
    spells: {
      cantrips: Array.isArray(raw?.spells?.cantrips) ? raw.spells.cantrips : [],
      slotsUsed: raw?.spells?.slotsUsed && typeof raw.spells.slotsUsed === 'object' ? raw.spells.slotsUsed : {},
      prepared: Array.isArray(raw?.spells?.prepared) ? raw.spells.prepared : [],
    },
    inventory: {
      gold: Number.isFinite(raw?.inventory?.gold) ? raw.inventory.gold : 0,
      items: Array.isArray(raw?.inventory?.items) ? raw.inventory.items : [],
    },
    equipment: {
      armorId: raw?.equipment?.armorId ?? null,
      shield: Boolean(raw?.equipment?.shield),
    },
    notes: typeof raw?.notes === 'string' ? raw.notes : '',
  }
}

function readStoredDraft() {
  if (!canUseStorage()) return createDefaultCharacter()

  try {
    const drafts = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.drafts) ?? '[]')
    const activeDraftId = window.localStorage.getItem(STORAGE_KEYS.activeDraftId)
    const activeDraft = Array.isArray(drafts)
      ? drafts.find(draft => draft?.id === activeDraftId) ?? drafts[0]
      : null

    return normalizeDraft(activeDraft ?? createDefaultCharacter())
  } catch (error) {
    console.warn('无法读取本地角色草稿，已创建新草稿。', error)
    return createDefaultCharacter()
  }
}

export const character = reactive(readStoredDraft())

function snapshotCharacter() {
  return JSON.parse(JSON.stringify(character))
}

function writeStoredDraft() {
  if (!canUseStorage()) return

  const snapshot = snapshotCharacter()
  const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.drafts) ?? '[]')
  const drafts = Array.isArray(stored) ? stored : []
  const index = drafts.findIndex(draft => draft?.id === snapshot.id)

  if (index >= 0) {
    drafts[index] = snapshot
  } else {
    drafts.unshift(snapshot)
  }

  window.localStorage.setItem(STORAGE_KEYS.drafts, JSON.stringify(drafts))
  window.localStorage.setItem(STORAGE_KEYS.activeDraftId, snapshot.id)
}

function replaceCharacter(nextCharacter) {
  Object.keys(character).forEach(key => {
    delete character[key]
  })
  Object.assign(character, normalizeDraft(nextCharacter))
}

function touchDraft() {
  character.updatedAt = Date.now()
}

export function setCharacterName(name) {
  character.name = name
  touchDraft()
}

export function setCharacterLevel(level) {
  const nextLevel = clampLevel(level)
  const prevLevel = character.level

  character.level = nextLevel
  character.class.level = nextLevel

  // 降级时清理超出当前等级的 generalFeat 槽及其关联属性选择键
  if (nextLevel < prevLevel && character.class.choices) {
    const featSlotPattern = /^feat-(\d+)/
    Object.keys(character.class.choices).forEach(key => {
      const match = key.match(featSlotPattern)
      if (match && Number(match[1]) > nextLevel) {
        delete character.class.choices[key]
      }
    })
  }

  touchDraft()
}

export function setRuleset(ruleset) {
  character.ruleset = ruleset
  touchDraft()
}

export function setRace(raceId) {
  if (character.race.id !== raceId) {
    // 清理旧种族的所有选择（技能、法术、施法属性等）
    character.race.choices = {}
  }
  character.race.id = raceId
  touchDraft()
}

export function setRaceChoice(key, value) {
  character.race.choices[key] = value
  touchDraft()
}

export function setBackground(bgId) {
  if (character.background.id !== bgId) {
    character.background.choices = {}
  }
  character.background.id = bgId
  touchDraft()
}

export function setBackgroundChoice(key, value) {
  character.background.choices[key] = value
  touchDraft()
}

export function setBackgroundAbilityBonuses(mode, bonuses) {
  character.background.choices.abilityBonusMode = mode
  character.background.choices.abilityBonuses = bonuses && typeof bonuses === 'object' ? bonuses : {}
  touchDraft()
}

export function setClass(classId) {
  if (character.class.id !== classId) {
    character.class.subclassId = null
    character.class.choices = {}
    character.spells.cantrips = []
    character.spells.prepared = []
    character.spells.slotsUsed = {}
  }
  character.class.id = classId
  character.class.level = character.level
  touchDraft()
}

export function setSubclass(subclassId) {
  character.class.subclassId = subclassId
  touchDraft()
}

export function setClassChoice(key, value) {
  if (value === null) {
    delete character.class.choices[key]
  } else {
    character.class.choices[key] = value
  }
  touchDraft()
}

export function setAbilityMethod(method) {
  character.abilities.method = method
  touchDraft()
}

export function setAbilityScore(ability, score) {
  character.abilities.scores[ability] = Number.parseInt(score, 10)
  touchDraft()
}

export function createNewCharacter() {
  replaceCharacter(createDefaultCharacter())
  touchDraft()
}

export function resetCharacter() {
  replaceCharacter(createDefaultCharacter(character.id))
  touchDraft()
}

// HP
export function setHpMethod(method) {
  character.hp.method = method
  character.hp.rolls = []
  touchDraft()
}

export function setHpRoll(levelIndex, value) {
  character.hp.rolls[levelIndex] = value
  touchDraft()
}

export function commitHpMax(value) {
  character.hp.max = Math.max(0, Number.parseInt(value, 10) || 0)
  character.hp.current = character.hp.max
  touchDraft()
}

export function setHpMax(value) {
  character.hp.max = Math.max(0, Number.parseInt(value, 10) || 0)
  character.hp.current = Math.min(character.hp.current, character.hp.max)
  touchDraft()
}

export function setHpCurrent(value) {
  const n = Number.parseInt(value, 10) || 0
  character.hp.current = Math.min(Math.max(0, n), character.hp.max)
  touchDraft()
}

export function setHpTemp(value) {
  character.hp.temp = Math.max(0, Number.parseInt(value, 10) || 0)
  touchDraft()
}

// 技能熟练（null | 'proficient' | 'expert'）
export function setSkillProficiency(skillId, proficiency) {
  if (proficiency === null) {
    delete character.skills[skillId]
  } else {
    character.skills[skillId] = proficiency
  }
  touchDraft()
}

// 法术槽消耗（level 为环阶字符串如 '1'~'9'）
export function setSpellSlotUsed(level, count) {
  character.spells.slotsUsed[level] = Math.max(0, Number.parseInt(count, 10) || 0)
  touchDraft()
}

export function toggleCantripSpell(spellId) {
  const idx = character.spells.cantrips.indexOf(spellId)
  if (idx >= 0) {
    character.spells.cantrips.splice(idx, 1)
  } else {
    character.spells.cantrips.push(spellId)
  }
  touchDraft()
}

export function togglePreparedSpell(spellId) {
  const idx = character.spells.prepared.indexOf(spellId)
  if (idx >= 0) {
    character.spells.prepared.splice(idx, 1)
  } else {
    character.spells.prepared.push(spellId)
  }
  touchDraft()
}

// 物品栏
export function addInventoryItem(item) {
  // item: { id, name, qty, type, desc }
  character.inventory.items.push({
    id: item.id ?? `item_${Date.now()}`,
    sourceId: item.sourceId ?? null,
    name: item.name ?? '',
    qty: Number.isFinite(item.qty) ? item.qty : 1,
    type: item.type ?? 'misc',
    desc: item.desc ?? '',
    damage: item.damage ?? '',
    damageType: item.damageType ?? '',
    range: item.range ?? '',
    mastery: item.mastery ?? '',
    properties: Array.isArray(item.properties) ? item.properties : [],
  })
  touchDraft()
}

export function updateInventoryItem(itemId, patch) {
  const item = character.inventory.items.find(i => i.id === itemId)
  if (item) Object.assign(item, patch)
  touchDraft()
}

export function removeInventoryItem(itemId) {
  const idx = character.inventory.items.findIndex(i => i.id === itemId)
  if (idx >= 0) character.inventory.items.splice(idx, 1)
  touchDraft()
}

export function setGold(value) {
  character.inventory.gold = Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0)
  touchDraft()
}

export function setEquippedArmor(armorId) {
  character.equipment.armorId = armorId || null
  touchDraft()
}

export function setEquippedShield(value) {
  character.equipment.shield = Boolean(value)
  touchDraft()
}

if (canUseStorage()) {
  writeStoredDraft()
  watch(character, writeStoredDraft, { deep: true })
}
