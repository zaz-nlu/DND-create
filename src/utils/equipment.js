import { calculateArmorAc, getArmorById, shield } from '../data/armor.js'

const ARMOR_TRAINING = {
  light: '轻甲',
  medium: '中甲',
  heavy: '重甲',
}

export function getEquippedArmor(character) {
  return getArmorById(character.equipment?.armorId)
}

export function hasArmorTraining(selectedClass, armor) {
  if (!armor) return true
  const training = ARMOR_TRAINING[armor.category]
  return training ? Boolean(selectedClass?.armor?.includes(training)) : true
}

export function hasShieldTraining(selectedClass) {
  return Boolean(selectedClass?.armor?.includes('盾牌'))
}

export function calculateFormulaAc(formula, abilityMap, fallbackDexMod = 0) {
  if (!formula) return 10 + fallbackDexMod
  return formula.base + formula.abilities.reduce(
    (sum, ability) => sum + (abilityMap[ability]?.mod ?? 0),
    0
  )
}

export function calculateCharacterAc({ character, selectedClass, selectedSubclass, abilityMap }) {
  const dexMod = abilityMap['敏捷']?.mod ?? 0
  const armor = getEquippedArmor(character)
  const shieldBonus = character.equipment?.shield && hasShieldTraining(selectedClass)
    ? shield.acBonus
    : 0

  if (armor) {
    return calculateArmorAc(armor, dexMod, false) + shieldBonus
  }

  const formula = selectedSubclass?.acFormula ?? selectedClass?.acFormula
  return calculateFormulaAc(formula, abilityMap, dexMod) + shieldBonus
}
