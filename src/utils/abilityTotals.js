import { classes } from '../data/classes.js'
import { findGeneralFeatById } from '../data/generalFeats.js'
import { ABILITY_IDS, abilityMod, modStr } from './abilities.js'

export function getBaseAbilityScores(character) {
  return Object.fromEntries(
    ABILITY_IDS.map(id => [id, Number(character.abilities?.scores?.[id]) || 0])
  )
}

export function hasCompleteBaseAbilityScores(character) {
  const scores = character.abilities?.scores ?? {}
  return ABILITY_IDS.every(id => Number.isFinite(Number(scores[id])) && Number(scores[id]) > 0)
}

export function getBackgroundAbilityBonuses(character) {
  const bonuses = character.background?.choices?.abilityBonuses ?? {}
  return Object.fromEntries(
    ABILITY_IDS.map(id => [id, Number(bonuses[id]) || 0])
  )
}

function getGeneralFeatSlotIds(character) {
  const cls = classes.find(c => c.id === character.class?.id)
  const level = character.level ?? 1
  if (cls?.progression) {
    return cls.progression
      .filter(step => step.level <= level)
      .flatMap(step => step.choices.filter(c => c.kind === 'generalFeat').map(c => c.id))
  }
  return level >= 4 ? ['generalFeatId'] : []
}

export function getGeneralFeatAbilityBonuses(character) {
  const bonuses = Object.fromEntries(ABILITY_IDS.map(id => [id, 0]))
  const slots = getGeneralFeatSlotIds(character)
  const choices = character.class?.choices ?? {}

  for (const slotId of slots) {
    const featId = choices[slotId]
    if (!featId) continue
    const feat = findGeneralFeatById(featId)
    if (!feat?.abilityBonus) continue

    const ab = feat.abilityBonus

    if (ab.mode === 'asi') {
      const mode = choices[slotId + '_asiMode']
      if (mode === '2') {
        const a1 = choices[slotId + '_asiA1']
        if (a1 && bonuses[a1] !== undefined) bonuses[a1] += 2
      } else if (mode === '1+1') {
        const a1 = choices[slotId + '_asiA1']
        const a2 = choices[slotId + '_asiA2']
        if (a1 && bonuses[a1] !== undefined) bonuses[a1] += 1
        if (a2 && a2 !== a1 && bonuses[a2] !== undefined) bonuses[a2] += 1
      }
    } else if (ab.fixed) {
      if (bonuses[ab.fixed] !== undefined) bonuses[ab.fixed] += 1
    } else if (ab.options) {
      const chosen = choices[slotId + '_asi']
      if (chosen && bonuses[chosen] !== undefined) bonuses[chosen] += 1
    }
  }

  return bonuses
}

export function getAbilityTotalRows(character) {
  const baseScores = getBaseAbilityScores(character)
  const backgroundBonuses = getBackgroundAbilityBonuses(character)
  const featBonuses = getGeneralFeatAbilityBonuses(character)

  return ABILITY_IDS.map(id => {
    const base = baseScores[id]
    const background = backgroundBonuses[id]
    const feat = featBonuses[id]
    const total = base + background + feat

    return {
      id,
      base,
      background,
      feat,
      total,
      mod: abilityMod(total),
      modText: modStr(total),
    }
  })
}

export function getAbilityTotalScores(character) {
  return Object.fromEntries(
    getAbilityTotalRows(character).map(row => [row.id, row.total])
  )
}
