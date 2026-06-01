import { getGeneralFeatAvailability } from '../data/generalFeats.js'

/**
 * 为没有手写 progression 的职业（通常是 DM 新建职业）
 * 按 DnD 2024 标准自动生成一份基础 progression。
 *
 * 已有 progression 的职业不受影响。
 */
export function buildStandardProgression(classDef) {
  const subclassLevel = classDef.subclassLevel ?? 3
  const featLevels = [4, 8, 12, 16, 19]
  const entries = [
    { level: 1, choices: [{ id: 'skills', kind: 'skillProficiency', source: 'classSkillChoices' }] },
    { level: subclassLevel, choices: [{ id: 'subclass', kind: 'subclass' }] },
    ...featLevels.map(lv => ({ level: lv, choices: [{ id: `feat-${lv}`, kind: 'generalFeat', minLevel: lv }] })),
  ]
  // 若 subclassLevel 恰好是 1，避免重复 level 1 条目
  return entries.filter((e, i, arr) =>
    arr.findIndex(x => x.level === e.level) === i
  )
}

export function getClassTraits(classDef) {
  const armorText = (classDef?.armor ?? []).join(' ')
  const featureText = (classDef?.level1Features ?? [])
    .map(f => `${f.name} ${f.nameEn} ${f.desc}`)
    .join(' ')
  return {
    spellcasting: /spellcasting|pact magic|施法|契约魔法/i.test(featureText),
    lightArmorTraining: armorText.includes('轻甲'),
    mediumArmorTraining: armorText.includes('中甲') || armorText.includes('重甲'),
    heavyArmorTraining: armorText.includes('重甲'),
    shieldTraining: armorText.includes('盾'),
  }
}

export function getRequirementsForLevel(classDef, level) {
  if (!classDef?.progression) return []
  const result = []
  for (const entry of classDef.progression) {
    if (entry.level <= level) {
      for (const choice of entry.choices) {
        result.push({ ...choice, unlockedAt: entry.level })
      }
    }
  }
  return result
}

function resolveSkillPool(classDef, raceDef, backgroundDef) {
  const classOptions = classDef?.skillChoices?.options ?? []
  const takenByRace = raceDef?.skillProficiencies ?? []
  const takenByBackground = backgroundDef?.skillProficiencies ?? []
  const taken = new Set([...takenByRace, ...takenByBackground])
  return {
    options: classOptions,
    available: classOptions.filter(s => !taken.has(s)),
    count: classDef?.skillChoices?.count ?? 0,
  }
}

export function getUnmetChoices(character, classDef, raceDef, backgroundDef, abilityScores) {
  const level = character.class?.level ?? character.level ?? 1
  const requirements = getRequirementsForLevel(classDef, level)
  const classChoices = character.class?.choices ?? {}
  const traits = getClassTraits(classDef)
  const scores = abilityScores ?? {}

  return requirements.map(req => {
    switch (req.kind) {
      case 'subclass': {
        const subclassId = character.class?.subclassId
        const valid = subclassId && (classDef?.subclasses ?? []).some(sc => sc.id === subclassId)
        return {
          id: req.id,
          kind: req.kind,
          label: '子职业',
          unlockedAt: req.unlockedAt,
          isMet: Boolean(valid),
          reason: valid ? '' : '尚未选择子职业',
        }
      }

      case 'skillProficiency': {
        const pool = resolveSkillPool(classDef, raceDef, backgroundDef)
        const chosen = classChoices.skills
        const chosenCount = Array.isArray(chosen) ? chosen.length : 0
        const isMet = chosenCount >= pool.count
        return {
          id: req.id,
          kind: req.kind,
          label: `技能熟练 (${chosenCount}/${pool.count})`,
          unlockedAt: req.unlockedAt,
          isMet,
          reason: isMet ? '' : `还需选择 ${pool.count - chosenCount} 项技能`,
          pool,
        }
      }

      case 'generalFeat': {
        const pickedId = classChoices[req.id]
        const minLevel = req.minLevel ?? 4
        if (level < minLevel) {
          return { id: req.id, kind: req.kind, label: `${minLevel}级专长`, unlockedAt: req.unlockedAt, isMet: true, reason: '' }
        }
        if (!pickedId) {
          return { id: req.id, kind: req.kind, label: `${minLevel}级专长`, unlockedAt: req.unlockedAt, isMet: false, reason: '尚未选择通用专长' }
        }
        const { canSelect, reasons } = getGeneralFeatAvailability(
          { prerequisites: { minLevel } },
          { level, scores, traits }
        )
        return {
          id: req.id,
          kind: req.kind,
          label: `${minLevel}级专长`,
          unlockedAt: req.unlockedAt,
          isMet: canSelect,
          reason: reasons.join('，'),
        }
      }

      case 'expertise': {
        const chosen = Array.isArray(classChoices[req.id]) ? classChoices[req.id] : []
        const needed = req.count ?? 1
        const isMet = chosen.length >= needed
        return {
          id: req.id,
          kind: req.kind,
          label: `${req.unlockedAt}级专精`,
          unlockedAt: req.unlockedAt,
          isMet,
          reason: isMet ? '' : `还需选择 ${needed - chosen.length} 项专精技能`,
          count: needed,
          pool: req.pool ?? null,
        }
      }

      case 'enum': {
        const picked = classChoices[req.id]
        const valid = picked && (req.options ?? []).some(o => o.id === picked)
        return {
          id: req.id,
          kind: req.kind,
          label: req.label ?? req.id,
          unlockedAt: req.unlockedAt,
          isMet: Boolean(valid),
          reason: valid ? '' : `尚未选择 ${req.label ?? req.id}`,
        }
      }

      default:
        return { id: req.id, kind: req.kind, label: req.id, unlockedAt: req.unlockedAt, isMet: true, reason: '' }
    }
  })
}
