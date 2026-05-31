const IMPORTED_CLASSES_KEY = 'dndcc:importedClasses:v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function normalizeStringArray(value) {
  return asArray(value).filter(item => typeof item === 'string' && item.trim()).map(item => item.trim())
}

function normalizeFeatureList(value) {
  return asArray(value)
    .map((feature, index) => {
      const item = asObject(feature)
      if (!item) return null
      return {
        id: typeof item.id === 'string' ? item.id : undefined,
        level: Number.isFinite(Number(item.level)) ? Number(item.level) : undefined,
        name: typeof item.name === 'string' ? item.name : `特性 ${index + 1}`,
        nameEn: typeof item.nameEn === 'string' ? item.nameEn : '',
        desc: typeof item.desc === 'string' ? item.desc : '',
      }
    })
    .filter(Boolean)
}

function normalizeSubclasses(value) {
  return asArray(value)
    .map((subclass, index) => {
      const item = asObject(subclass)
      if (!item) return null
      return {
        ...item,
        id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `subclass-${index + 1}`,
        name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `子职 ${index + 1}`,
        nameEn: typeof item.nameEn === 'string' ? item.nameEn : '',
        color: typeof item.color === 'string' && item.color.trim() ? item.color.trim() : '#7A6A2A',
        tagline: typeof item.tagline === 'string' ? item.tagline : '',
        desc: typeof item.desc === 'string' ? item.desc : '',
        features: normalizeFeatureList(item.features),
      }
    })
    .filter(Boolean)
}

export function unwrapClassDefinition(raw) {
  const root = asObject(raw)
  if (!root) return null
  return asObject(root.class) ?? root
}

export function validateImportedClass(raw) {
  const source = unwrapClassDefinition(raw)
  const errors = []
  const warnings = []

  if (!source) {
    return { ok: false, errors: ['JSON 顶层必须是职业对象，或包含 class 字段。'], warnings, value: null }
  }

  const id = typeof source.id === 'string' ? source.id.trim() : ''
  if (!id) {
    errors.push('缺少 id。')
  } else if (!/^[a-z][a-z0-9-]*$/i.test(id)) {
    errors.push('id 只能包含英文、数字和短横线，并且需要以英文开头。')
  }

  const requiredStrings = [
    ['name', '缺少中文职业名 name。'],
    ['nameEn', '缺少英文职业名 nameEn。'],
    ['hitDie', '缺少生命骰 hitDie。'],
    ['primaryAbility', '缺少主要属性 primaryAbility。'],
  ]

  requiredStrings.forEach(([key, message]) => {
    if (typeof source[key] !== 'string' || !source[key].trim()) errors.push(message)
  })

  const saves = normalizeStringArray(source.saves)
  if (saves.length === 0) errors.push('saves 至少需要一个豁免熟练。')

  const skillChoices = asObject(source.skillChoices)
  if (!skillChoices || !Number.isFinite(Number(skillChoices.count)) || normalizeStringArray(skillChoices.options).length === 0) {
    errors.push('skillChoices 需要包含 count 和 options。')
  }

  const equipment = asObject(source.equipment)
  if (!equipment) warnings.push('没有 equipment，详情页会显示为空装备。')
  if (!source.fullLore) warnings.push('没有 fullLore，职业背景会较空。')
  if (!Array.isArray(source.level1Features)) warnings.push('没有 level1Features。')
  if (!Array.isArray(source.notableFeatures)) warnings.push('没有 notableFeatures。')
  if (!Array.isArray(source.subclasses)) warnings.push('没有 subclasses。')

  if (errors.length > 0) {
    return { ok: false, errors, warnings, value: null }
  }

  const value = {
    ...JSON.parse(JSON.stringify(source)),
    id,
    source: 'imported',
    name: source.name.trim(),
    nameEn: source.nameEn.trim(),
    tagline: typeof source.tagline === 'string' ? source.tagline : '导入规则职业',
    color: typeof source.color === 'string' && source.color.trim() ? source.color.trim() : '#7A6A2A',
    subclassLevel: Number.isFinite(Number(source.subclassLevel)) ? Number(source.subclassLevel) : 3,
    fullLore: typeof source.fullLore === 'string' ? source.fullLore : source.lore ?? '',
    lore: typeof source.lore === 'string' ? source.lore : '',
    primaryAbility: source.primaryAbility.trim(),
    hitDie: source.hitDie.trim(),
    saves,
    skillChoices: {
      count: Number(skillChoices.count),
      options: normalizeStringArray(skillChoices.options),
    },
    weapons: normalizeStringArray(source.weapons),
    tools: normalizeStringArray(source.tools),
    armor: normalizeStringArray(source.armor),
    equipment: {
      a: typeof equipment?.a === 'string' ? equipment.a : '',
      b: typeof equipment?.b === 'string' ? equipment.b : '',
    },
    level1Features: normalizeFeatureList(source.level1Features),
    notableFeatures: normalizeFeatureList(source.notableFeatures),
    subclasses: normalizeSubclasses(source.subclasses),
    progression: asArray(source.progression),
  }

  return { ok: true, errors, warnings, value }
}

export function readImportedClasses() {
  if (!canUseStorage()) return []

  try {
    const raw = JSON.parse(window.localStorage.getItem(IMPORTED_CLASSES_KEY) ?? '[]')
    return asArray(raw)
      .map(item => validateImportedClass(item).value)
      .filter(Boolean)
  } catch (error) {
    console.warn('无法读取导入职业规则。', error)
    return []
  }
}

export function writeImportedClasses(importedClasses) {
  if (!canUseStorage()) return
  window.localStorage.setItem(IMPORTED_CLASSES_KEY, JSON.stringify(importedClasses))
}

export function upsertImportedClass(classDef) {
  const importedClasses = readImportedClasses()
  const index = importedClasses.findIndex(item => item.id === classDef.id)

  if (index >= 0) {
    importedClasses[index] = classDef
  } else {
    importedClasses.push(classDef)
  }

  writeImportedClasses(importedClasses)
  return importedClasses
}

export function summarizeClassDefinition(classDef) {
  const progression =
    classDef.spellcastingProgression ??
    classDef.pactMagicProgression ??
    classDef.classProgression ??
    []

  return {
    name: classDef.name,
    nameEn: classDef.nameEn,
    id: classDef.id,
    hitDie: classDef.hitDie,
    primaryAbility: classDef.primaryAbility,
    progressionRows: Array.isArray(progression) ? progression.length : 0,
    subclassCount: Array.isArray(classDef.subclasses) ? classDef.subclasses.length : 0,
    level1FeatureCount: Array.isArray(classDef.level1Features) ? classDef.level1Features.length : 0,
    notableFeatureCount: Array.isArray(classDef.notableFeatures) ? classDef.notableFeatures.length : 0,
  }
}
