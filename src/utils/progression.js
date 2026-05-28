import { getGeneralFeatAvailability } from '../data/generalFeats.js'

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
