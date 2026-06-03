/**
 * 种族法术聚合层
 *
 * 统一入口：所有读取方（SpellsView、CharacterSheet、PDF）都走 getRaceSpellGrants。
 * 不直接修改 character；存储仍由 store/character.js 负责。
 *
 * 数据约定（races.js 种族数据）：
 *   race.raceSpells = {
 *     cantrips: [{ baseId, ability? }],          // 固定戏法（如阿斯莫的 light）
 *     leveled: [{ baseId, level }],               // 按等级解锁的血系法术
 *   }
 *   race.raceChoices[].options[].grants = {
 *     cantrips?: [{ baseId, ability? }],          // 血系固定戏法
 *     cantripChoice?: { count, fromList },        // 自选戏法（高等精灵）
 *     leveled?: [{ baseId, level }],              // 血系按等级法术
 *   }
 *   race.spellcastingAbilityChoice = ['智力', '感知', '魅力']  // 施法属性三选一（可选）
 *
 * character.race.choices 存储约定：
 *   choices.raceSpellcastingAbility   — 施法属性（字符串）
 *   choices['raceCantrip_<choiceId>'] — 自选戏法 baseId 数组（如 ['light']）
 */

import { findSpellByBaseId } from '../data/spells.js'

function resolveSpellInfo(baseId, abilityOverride, defaultAbility) {
  const spell = findSpellByBaseId(baseId)
  return {
    baseId,
    name: spell?.name ?? baseId,
    nameEn: spell?.nameEn ?? baseId,
    ability: abilityOverride ?? defaultAbility ?? null,
  }
}

/**
 * 解析该角色因种族获得的所有法术授予。
 *
 * @param {object} character   - 角色对象（来自 store）
 * @param {object} selectedRace - 完整种族数据对象
 * @returns {{
 *   fixedCantrips: Array<{baseId,name,nameEn,ability,source}>,
 *   cantripChoiceSlots: Array<{id,count,fromList,chosen:string[],label}>,
 *   leveledSpells: Array<{baseId,name,nameEn,level,source}>,
 *   spellcastingAbility: string|null,
 *   spellcastingAbilityOptions: string[],
 * }}
 */
export function getRaceSpellGrants(character, selectedRace) {
  if (!selectedRace) {
    return {
      fixedCantrips: [],
      cantripChoiceSlots: [],
      leveledSpells: [],
      spellcastingAbility: null,
      spellcastingAbilityOptions: [],
    }
  }

  const raceChoices = character.race?.choices ?? {}
  const charLevel = character.level ?? 1

  // 施法属性
  const abilityOptions = selectedRace.spellcastingAbilityChoice ?? []
  const spellcastingAbility = raceChoices.raceSpellcastingAbility
    ?? (abilityOptions.length === 1 ? abilityOptions[0] : null)

  const fixedCantrips = []
  const cantripChoiceSlots = []
  const leveledSpells = []

  // ── 1. 种族固定法术（不依赖血系选择）──────────────────────────────────────
  const raceSpells = selectedRace.raceSpells ?? {}

  for (const entry of (raceSpells.cantrips ?? [])) {
    fixedCantrips.push({
      ...resolveSpellInfo(entry.baseId, entry.ability, spellcastingAbility),
      source: selectedRace.name,
    })
  }

  for (const entry of (raceSpells.leveled ?? [])) {
    const minLv = entry.minCharLevel ?? entry.level ?? 1
    if (minLv <= charLevel) {
      const spell = findSpellByBaseId(entry.baseId)
      leveledSpells.push({
        baseId: entry.baseId,
        name: spell?.name ?? entry.baseId,
        nameEn: spell?.nameEn ?? entry.baseId,
        level: entry.spellLevel ?? spell?.level ?? entry.level ?? 1,
        source: selectedRace.name,
      })
    }
  }

  // ── 2. 血系/世系驱动的法术（依 raceChoices 的某个选择项）──────────────────
  for (const choiceDef of (selectedRace.raceChoices ?? [])) {
    if (!choiceDef.driveSpells) continue
    const chosenOptionId = raceChoices[choiceDef.id]
    if (!chosenOptionId) continue
    const option = choiceDef.options.find(o => o.id === chosenOptionId)
    if (!option?.grants) continue

    const grants = option.grants
    const sourceLabel = `${selectedRace.name}（${option.label}）`

    // 血系固定戏法
    for (const entry of (grants.cantrips ?? [])) {
      fixedCantrips.push({
        ...resolveSpellInfo(entry.baseId, entry.ability, spellcastingAbility),
        source: sourceLabel,
      })
    }

    // 自选戏法槽
    if (grants.cantripChoice) {
      const slotId = `raceCantrip_${choiceDef.id}`
      const chosen = Array.isArray(raceChoices[slotId]) ? raceChoices[slotId] : []
      cantripChoiceSlots.push({
        id: slotId,
        count: grants.cantripChoice.count ?? 1,
        fromList: grants.cantripChoice.fromList,
        chosen,
        label: `${option.label} 自选戏法`,
        source: sourceLabel,
      })
    }

    // 血系按等级法术
    for (const entry of (grants.leveled ?? [])) {
      const minLv = entry.minCharLevel ?? entry.level ?? 1
      if (minLv <= charLevel) {
        const spell = findSpellByBaseId(entry.baseId)
        leveledSpells.push({
          baseId: entry.baseId,
          name: spell?.name ?? entry.baseId,
          nameEn: spell?.nameEn ?? entry.baseId,
          level: entry.spellLevel ?? spell?.level ?? entry.level ?? 1,
          source: sourceLabel,
        })
      }
    }
  }

  return {
    fixedCantrips,
    cantripChoiceSlots,
    leveledSpells,
    spellcastingAbility,
    spellcastingAbilityOptions: abilityOptions,
  }
}

/**
 * 检查角色的种族法术选择是否全部完成（用于 RaceSelect 校验）。
 */
export function isRaceSpellGrantsValid(character, selectedRace) {
  const grants = getRaceSpellGrants(character, selectedRace)
  // 每个自选戏法槽必须选满
  for (const slot of grants.cantripChoiceSlots) {
    if (slot.chosen.length < slot.count) return false
  }
  // 若有多个施法属性可选，必须选一个
  if (grants.spellcastingAbilityOptions.length > 1 && !grants.spellcastingAbility) return false
  return true
}
