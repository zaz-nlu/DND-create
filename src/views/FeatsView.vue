<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { backgrounds } from '../data/backgrounds.js'
import { classes } from '../data/classes.js'
import { fightingStyleFeats, findFightingStyleFeatById } from '../data/fightingStyleFeats.js'
import { generalFeats, findGeneralFeatById, getGeneralFeatAvailability } from '../data/generalFeats.js'
import { originFeats, findOriginFeatById, findOriginFeatByNameEn } from '../data/originFeats.js'
import { races } from '../data/races.js'
import { character, setBackgroundAbilityBonuses, setClassChoice, setRaceChoice } from '../store/character.js'
import { getAbilityTotalScores } from '../utils/abilityTotals.js'
import { getRequirementsForLevel } from '../utils/progression.js'
import { DND_SKILLS, getSkillMap } from '../utils/skillProficiencies.js'
import FeatDetailModal from './FeatDetailModal.vue'
import StepNav from './StepNav.vue'
import AbilityBar from '../components/AbilityBar.vue'

// 专长详情弹窗状态
const detailFeat = ref(null)
const detailKind = ref('origin') // 'origin' | 'general'
const detailSlotId = ref(null)

function openFeatDetail(feat, kind, slotId = null) {
  detailFeat.value = feat
  detailKind.value = kind
  detailSlotId.value = slotId
}

function closeFeatDetail() {
  detailFeat.value = null
  detailSlotId.value = null
}

function pickFromModal(feat) {
  if (detailKind.value === 'origin') {
    if (isHuman.value) selectHumanFeat(feat)
  } else {
    selectGeneralFeat(feat, detailSlotId.value)
  }
  closeFeatDetail()
}

const router = useRouter()

const selectedRace = computed(() =>
  races.find(race => race.id === character.race.id) ?? null
)

const selectedClass = computed(() =>
  classes.find(cls => cls.id === character.class.id) ?? null
)

const selectedBackground = computed(() =>
  backgrounds.find(background => background.id === character.background.id) ?? null
)

// ─── 技能聚合层（单一事实来源）────────────────────────────────────────────────
const skillMap = computed(() =>
  getSkillMap(character, {
    selectedClass: selectedClass.value,
    selectedBackground: selectedBackground.value,
  })
)

// 当前已熟练技能列表（用于专精候选池）
const allProficientSkills = computed(() =>
  skillMap.value.filter(s => s.proficient).map(s => s.skill)
)

// 职业 progression 中所有 expertise 类型槽位
const expertiseProgressionSlots = computed(() => {
  if (!selectedClass.value?.progression) return []
  return getRequirementsForLevel(selectedClass.value, character.level)
    .filter(r => r.kind === 'expertise')
})

function getExpertiseSlotChoices(slotId) {
  const raw = character.class.choices?.[slotId]
  return Array.isArray(raw) ? raw : []
}

function toggleExpertiseChoice(slotId, skill, count) {
  const current = [...getExpertiseSlotChoices(slotId)]
  const idx = current.indexOf(skill)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else if (current.length < count) {
    current.push(skill)
  }
  setClassChoice(slotId, current)
}

// 某个专精槽的候选池：已熟练 且 未被其他来源专精
function expertiseCandidates(slotId, pool) {
  const currentChoices = getExpertiseSlotChoices(slotId)
  return skillMap.value
    .filter(s => {
      if (!s.proficient) return false
      if (pool && !pool.includes(s.skill)) return false
      if (!s.expert) return true
      return currentChoices.includes(s.skill) // 专精来自本槽，可重选/取消
    })
    .map(s => s.skill)
}

// 通用专长授予的技能熟练和专精
function getFeatSkillProfChoices(slotId) {
  const raw = character.class.choices?.[slotId + '_skillProf']
  return Array.isArray(raw) ? raw : []
}

function getFeatExpertiseChoices(slotId) {
  const raw = character.class.choices?.[slotId + '_expertise']
  return Array.isArray(raw) ? raw : []
}

function toggleFeatSkillProf(slotId, skill, count) {
  const current = [...getFeatSkillProfChoices(slotId)]
  const idx = current.indexOf(skill)
  if (idx >= 0) {
    current.splice(idx, 1)
    // 取消熟练时同步清除此技能的专精
    const expArr = [...getFeatExpertiseChoices(slotId)]
    const expIdx = expArr.indexOf(skill)
    if (expIdx >= 0) {
      expArr.splice(expIdx, 1)
      setClassChoice(slotId + '_expertise', expArr.length ? expArr : null)
    }
  } else if (current.length < count) {
    current.push(skill)
  }
  setClassChoice(slotId + '_skillProf', current.length ? current : null)
}

function toggleFeatExpertise(slotId, skill, count) {
  const current = [...getFeatExpertiseChoices(slotId)]
  const idx = current.indexOf(skill)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else if (current.length < count) {
    current.push(skill)
  }
  setClassChoice(slotId + '_expertise', current.length ? current : null)
}

// 专长授予技能熟练的候选池：排除已通过其他来源获得的熟练
function featSkillProfCandidates(slotId) {
  const slotChoices = getFeatSkillProfChoices(slotId)
  // 所有熟练技能中，排除本槽自己选的，剩余为"其他来源熟练"
  const otherProficient = new Set(
    skillMap.value
      .filter(s => s.proficient && !slotChoices.includes(s.skill))
      .map(s => s.skill)
  )
  return DND_SKILLS.filter(s => !otherProficient.has(s))
}

// 专长授予专精的候选池：已熟练 且 未被其他来源专精
function featExpertiseCandidates(slotId) {
  const currentChoices = getFeatExpertiseChoices(slotId)
  return skillMap.value
    .filter(s => {
      if (!s.proficient) return false
      if (!s.expert) return true
      return currentChoices.includes(s.skill)
    })
    .map(s => s.skill)
}

const backgroundFeat = computed(() => selectedBackground.value?.feat ?? null)
const backgroundOriginFeat = computed(() =>
  backgroundFeat.value ? findOriginFeatByNameEn(backgroundFeat.value.nameEn) : null
)
const backgroundFeatVariant = computed(() => {
  const match = backgroundFeat.value?.nameEn?.match(/\((.+)\)/)
  return match?.[1] ?? ''
})

const allowedAbilities = computed(() => selectedBackground.value?.abilityScores ?? [])
const backgroundChoices = computed(() => character.background.choices ?? {})
const bonusMode = computed(() => backgroundChoices.value.abilityBonusMode ?? '2+1')
const abilityBonuses = computed(() => backgroundChoices.value.abilityBonuses ?? {})

const pendingClassFeats = computed(() => {
  const features = selectedClass.value?.level1Features ?? []
  return features.filter(feature => {
    const text = `${feature.name} ${feature.nameEn} ${feature.desc}`.toLowerCase()
    return text.includes('feat') || text.includes('专长')
  })
})

const isHuman = computed(() => selectedRace.value?.id === 'human')
const humanOriginFeatId = computed(() => character.race.choices?.originFeatId ?? null)
const selectedHumanFeat = computed(() => findOriginFeatById(humanOriginFeatId.value))
const isSkilled = computed(() => humanOriginFeatId.value === 'skilled')
const skilledChoices = computed(() => character.race.choices?.skilledSkills ?? [])
const isHumanFeatValid = computed(() => {
  if (!isHuman.value) return true
  if (!selectedHumanFeat.value || !canPickHumanFeat(selectedHumanFeat.value)) return false
  if (isSkilled.value) return skilledChoices.value.length === 3
  return true
})
const prerequisiteScores = computed(() => getAbilityTotalScores(character))
const classTraits = computed(() => {
  const cls = selectedClass.value
  const armorText = (cls?.armor ?? []).join(' ')
  const featureText = (cls?.level1Features ?? [])
    .map(feature => `${feature.name} ${feature.nameEn} ${feature.desc}`)
    .join(' ')

  return {
    spellcasting: /spellcasting|pact magic|施法|契约魔法/i.test(featureText),
    lightArmorTraining: armorText.includes('轻甲'),
    mediumArmorTraining: armorText.includes('中甲') || armorText.includes('重甲'),
    heavyArmorTraining: armorText.includes('重甲'),
    shieldTraining: armorText.includes('盾'),
  }
})

// 职业技能熟练选择
const classSkillSlot = computed(() =>
  selectedClass.value?.progression
    ? getRequirementsForLevel(selectedClass.value, character.level).find(r => r.kind === 'skillProficiency')
    : null
)
const classSkillCount = computed(() => selectedClass.value?.skillChoices?.count ?? 0)
const classSkillChoices = computed(() => {
  const raw = character.class.choices?.skills
  return Array.isArray(raw) ? raw : []
})
// 已通过「职业技能选择以外的来源」熟练的技能（背景/种族单项/种族数组/Skilled/专长授予）
// 复用单一数据源 skillMap，自动覆盖所有现有及未来的熟练来源，避免逐一手拼遗漏。
const skillsProficientElsewhere = computed(() => {
  const fromClassChoice = new Set(classSkillChoices.value)
  return new Set(
    skillMap.value
      .filter(s => s.proficient && !fromClassChoice.has(s.skill))
      .map(s => s.skill)
  )
})
// 职业技能可选列表：排除已从其他来源熟练的技能（专精 ≠ 双熟练，重复熟练会浪费名额）
const classSkillOptions = computed(() => {
  const options = selectedClass.value?.skillChoices?.options ?? []
  return options.filter(skill => !skillsProficientElsewhere.value.has(skill))
})
const isClassSkillValid = computed(() => {
  if (!classSkillSlot.value) return true
  return classSkillChoices.value.length === classSkillCount.value
})

// 下游专精槽若限定了 pool（如法师学者限选 奥秘/历史/自然/宗教），
// 在职业技能步骤就提示玩家：至少要从池内选一项，否则后面无法满足专精。
const expertisePoolHint = computed(() => {
  const pooledSlot = expertiseProgressionSlots.value.find(s => Array.isArray(s.pool) && s.pool.length)
  if (!pooledSlot) return null
  const options = selectedClass.value?.skillChoices?.options ?? []
  // 池内 ∩ 职业可选技能：玩家能在职业技能步骤实际选到的项
  const selectable = pooledSlot.pool.filter(skill => options.includes(skill))
  if (!selectable.length) return null
  const satisfied = classSkillChoices.value.some(skill => pooledSlot.pool.includes(skill))
  return { skills: selectable, satisfied }
})

function toggleClassSkill(skill) {
  const current = [...classSkillChoices.value]
  const idx = current.indexOf(skill)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else if (current.length < classSkillCount.value) {
    current.push(skill)
  }
  setClassChoice('skills', current)
}

const fightingStyleSlots = computed(() => {
  if (!selectedClass.value?.progression) return []
  return getRequirementsForLevel(selectedClass.value, character.level)
    .filter(r => r.kind === 'fightingStyleFeat')
})

const isFightingStyleValid = computed(() => {
  if (fightingStyleSlots.value.length === 0) return true
  return fightingStyleSlots.value.every(slot => !!character.class.choices?.[slot.id])
})

function selectFightingStyleFeat(feat, slotId) {
  setClassChoice(slotId, feat.id)
}

// 从 progression 拿所有已解锁的 generalFeat 槽；无 progression 时回退到旧单槽逻辑
const generalFeatSlots = computed(() => {
  const cls = selectedClass.value
  if (cls?.progression) {
    return getRequirementsForLevel(cls, character.level)
      .filter(r => r.kind === 'generalFeat' && character.level >= (r.minLevel ?? 4))
  }
  // 旧职业回退：level >= 4 时给一个 generalFeatId 槽
  if (character.level >= 4) {
    return [{ id: 'generalFeatId', kind: 'generalFeat', minLevel: 4, unlockedAt: 4 }]
  }
  return []
})

const ALL_ABILITIES = ['力量', '敏捷', '体质', '智力', '感知', '魅力']

function getAsiOptions(featId) {
  const feat = findGeneralFeatById(featId)
  if (!feat?.abilityBonus?.options) return []
  return feat.abilityBonus.options === 'any' ? ALL_ABILITIES : feat.abilityBonus.options
}

function isFeatAbilityChoiceDone(slotId, feat) {
  if (!feat?.abilityBonus) return true
  const ab = feat.abilityBonus
  if (ab.fixed) return true
  const choices = character.class.choices ?? {}
  if (ab.mode === 'asi') {
    const mode = choices[slotId + '_asiMode']
    if (!mode) return false
    const a1 = choices[slotId + '_asiA1']
    if (!a1) return false
    if (mode === '1+1') {
      const a2 = choices[slotId + '_asiA2']
      if (!a2 || a2 === a1) return false
    }
    return true
  }
  return !!choices[slotId + '_asi']
}

const isGeneralFeatSelectionValid = computed(() => {
  if (generalFeatSlots.value.length === 0) return true
  return generalFeatSlots.value.every(slot => {
    const pickedId = character.class.choices?.[slot.id]
    if (!pickedId) return false
    const feat = findGeneralFeatById(pickedId)
    if (!feat || !canPickGeneralFeat(feat)) return false
    return isFeatAbilityChoiceDone(slot.id, feat)
  })
})

const isBonusValid = computed(() => {
  const entries = Object.entries(abilityBonuses.value)
    .filter(([ability, value]) => allowedAbilities.value.includes(ability) && value > 0)

  if (!selectedBackground.value) return false
  if (bonusMode.value === '1+1+1') {
    return allowedAbilities.value.length === 3 &&
      allowedAbilities.value.every(ability => abilityBonuses.value[ability] === 1)
  }

  return entries.length === 2 &&
    entries.some(([, value]) => value === 2) &&
    entries.some(([, value]) => value === 1)
})

const isExpertiseProgressionValid = computed(() =>
  expertiseProgressionSlots.value.every(slot =>
    getExpertiseSlotChoices(slot.id).length >= slot.count
  )
)

const isFeatGrantsValid = computed(() =>
  generalFeatSlots.value.every(slot => {
    const feat = findGeneralFeatById(character.class.choices?.[slot.id])
    if (feat?.grants?.skillProficiency) {
      if (getFeatSkillProfChoices(slot.id).length < feat.grants.skillProficiency.count) return false
    }
    if (feat?.grants?.expertise) {
      if (getFeatExpertiseChoices(slot.id).length < feat.grants.expertise.count) return false
    }
    return true
  })
)

const isFeatValid = computed(() =>
  isBonusValid.value &&
  isClassSkillValid.value &&
  isHumanFeatValid.value &&
  isFightingStyleValid.value &&
  isGeneralFeatSelectionValid.value &&
  isExpertiseProgressionValid.value &&
  isFeatGrantsValid.value
)
const featFooterHint = computed(() => {
  if (!isClassSkillValid.value) return `请选择 ${classSkillCount.value} 项职业技能熟练（已选 ${classSkillChoices.value.length}）`
  if (!isBonusValid.value) return '先完成背景属性加值'
  if (!isHumanFeatValid.value) {
    if (isSkilled.value) {
      const remaining = 3 - skilledChoices.value.length
      return `还需选择 ${remaining} 项技能熟练（熟习专长）`
    }
    return '请选择额外起源专长'
  }
  if (!isFightingStyleValid.value) return '请选择战斗风格专长'
  if (!isExpertiseProgressionValid.value) {
    const unmet = expertiseProgressionSlots.value.find(s =>
      getExpertiseSlotChoices(s.id).length < s.count
    )
    return unmet ? `请完成 ${unmet.unlockedAt} 级专精选择` : '请完成专精选择'
  }
  if (!isGeneralFeatSelectionValid.value) return `请完成通用专长选择（${generalFeatSlots.value.length} 个槽位）`
  if (!isFeatGrantsValid.value) return '请完成专长附带的技能熟练/专精选择'
  return ''
})

// ─── Step flow ────────────────────────────────────────────────────────
const infoOpen = ref(false)
const activeStepId = ref(null)

function summaryBonus() {
  if (bonusMode.value === '1+1+1') {
    return allowedAbilities.value.map(a => `+1${a}`).join('  ')
  }
  return allowedAbilities.value
    .filter(a => (abilityBonuses.value[a] ?? 0) > 0)
    .map(a => `+${abilityBonuses.value[a]}${a}`)
    .join('  ')
}

const featSteps = computed(() => {
  const items = []

  items.push({
    id: 'bonus', kind: 'bonus',
    label: '背景属性加值',
    kicker: 'BACKGROUND · ABILITY BONUS',
    isValid: isBonusValid.value,
    summary: isBonusValid.value ? summaryBonus() : '',
  })

  if (classSkillSlot.value) {
    items.push({
      id: 'class-skills', kind: 'class-skills',
      label: '职业技能熟练',
      kicker: 'CLASS · SKILL PROFICIENCY',
      isValid: isClassSkillValid.value,
      summary: classSkillChoices.value.join('、'),
    })
  }

  // 职业 progression 专精槽（法师学者2级、游侠2/9级）
  for (const slot of expertiseProgressionSlots.value) {
    const choices = getExpertiseSlotChoices(slot.id)
    items.push({
      id: slot.id, kind: 'class-expertise',
      label: `${slot.unlockedAt} 级 · 技能专精`,
      kicker: `CLASS · EXPERTISE · LV.${slot.unlockedAt}`,
      isValid: choices.length >= slot.count,
      summary: choices.join('、'),
      count: slot.count,
      pool: slot.pool ?? null,
    })
  }

  for (const slot of fightingStyleSlots.value) {
    const chosen = findFightingStyleFeatById(character.class.choices?.[slot.id])
    items.push({
      id: slot.id, kind: 'fighting-style',
      label: '战斗风格专长',
      kicker: 'FIGHTING STYLE FEAT',
      isValid: !!chosen,
      summary: chosen?.name ?? '',
    })
  }

  if (isHuman.value) {
    const basePicked = !!selectedHumanFeat.value && canPickHumanFeat(selectedHumanFeat.value)
    items.push({
      id: 'human-feat', kind: 'human-feat',
      label: '额外起源专长',
      kicker: '人类 · ORIGIN FEAT',
      isValid: basePicked,
      summary: selectedHumanFeat.value?.name ?? '',
    })
    if (isSkilled.value) {
      items.push({
        id: 'skilled-skills', kind: 'skilled-skills',
        label: '熟习 · 技能选择',
        kicker: 'SKILLED · SKILL PROFICIENCY',
        isValid: skilledChoices.value.length === 3,
        summary: skilledChoices.value.join('、'),
      })
    }
  }

  for (const slot of generalFeatSlots.value) {
    const feat = findGeneralFeatById(character.class.choices?.[slot.id])
    const done = !!feat && canPickGeneralFeat(feat) && isFeatAbilityChoiceDone(slot.id, feat)
    items.push({
      id: slot.id, kind: 'general-feat',
      label: `${slot.minLevel ?? 4} 级通用专长`,
      kicker: `GENERAL FEAT · LV.${slot.minLevel ?? 4}`,
      isValid: done,
      summary: feat?.name ?? '',
    })

    // 专长授予技能熟练（如技艺专家 skill-expert）
    if (feat?.grants?.skillProficiency) {
      const profCount = feat.grants.skillProficiency.count
      const choices = getFeatSkillProfChoices(slot.id)
      items.push({
        id: slot.id + '_skillProf', kind: 'feat-skill-prof',
        label: '专长 · 技能熟练',
        kicker: `FEAT GRANT · SKILL PROFICIENCY · ${feat.nameEn}`,
        isValid: choices.length >= profCount,
        summary: choices.join('、'),
        slotId: slot.id,
        count: profCount,
      })
    }

    // 专长授予专精（如技艺专家 skill-expert）
    if (feat?.grants?.expertise) {
      const expCount = feat.grants.expertise.count
      const choices = getFeatExpertiseChoices(slot.id)
      items.push({
        id: slot.id + '_expertise', kind: 'feat-expertise',
        label: '专长 · 专精',
        kicker: `FEAT GRANT · EXPERTISE · ${feat.nameEn}`,
        isValid: choices.length >= expCount,
        summary: choices.join('、'),
        slotId: slot.id,
        count: expCount,
      })
    }
  }

  return items
})

const activeId = computed(() => {
  if (activeStepId.value !== null && featSteps.value.some(s => s.id === activeStepId.value)) {
    return activeStepId.value
  }
  return featSteps.value.find(s => !s.isValid)?.id ?? featSteps.value.at(-1)?.id ?? null
})

watch(
  () => featSteps.value.map(s => s.isValid),
  (cur, prev) => {
    if (!prev) return
    const idx = featSteps.value.findIndex(s => s.id === activeId.value)
    if (idx >= 0 && !prev[idx] && cur[idx]) {
      const next = featSteps.value.slice(idx + 1).find(s => !s.isValid)
      if (next) activeStepId.value = next.id
    }
  }
)

function focusStep(id) { activeStepId.value = id }
function isFightingStyleStep(id) { return fightingStyleSlots.value.some(s => s.id === id) }
function getGeneralFeatSlot(id) { return generalFeatSlots.value.find(s => s.id === id) }

function selectMode(mode) {
  if (!selectedBackground.value) return

  if (mode === '1+1+1') {
    setBackgroundAbilityBonuses(
      mode,
      Object.fromEntries(allowedAbilities.value.map(ability => [ability, 1]))
    )
    return
  }

  setBackgroundAbilityBonuses('2+1', {})
}

function selectSplitBonus(ability, value) {
  if (!allowedAbilities.value.includes(ability)) return

  const next = Object.fromEntries(
    Object.entries(abilityBonuses.value)
      .filter(([key, bonus]) => allowedAbilities.value.includes(key) && bonus > 0)
  )

  Object.keys(next).forEach(key => {
    if (next[key] === value || key === ability) {
      delete next[key]
    }
  })

  next[ability] = value
  setBackgroundAbilityBonuses('2+1', next)
}

function canPickHumanFeat(feat) {
  return !backgroundOriginFeat.value ||
    feat.id !== backgroundOriginFeat.value.id ||
    feat.repeatable
}

function selectHumanFeat(feat) {
  if (!isHuman.value || !canPickHumanFeat(feat)) return
  setRaceChoice('originFeatId', feat.id)
  if (feat.id !== 'skilled') setRaceChoice('skilledSkills', [])
}

function toggleSkilledSkill(skill) {
  const current = [...skilledChoices.value]
  const idx = current.indexOf(skill)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else if (current.length < 3) {
    current.push(skill)
  }
  setRaceChoice('skilledSkills', current)
}

function generalFeatLockReason(feat) {
  return getGeneralFeatAvailability(feat, {
    level: character.level,
    scores: prerequisiteScores.value,
    traits: classTraits.value,
  }).reasons.join('，')
}

function canPickGeneralFeat(feat) {
  return getGeneralFeatAvailability(feat, {
    level: character.level,
    scores: prerequisiteScores.value,
    traits: classTraits.value,
  }).canSelect
}

function selectGeneralFeat(feat, slotId) {
  if (!canPickGeneralFeat(feat)) return
  // 切换专长时清除旧属性选择和旧的技能熟练/专精授予
  ;[
    slotId + '_asi', slotId + '_asiMode', slotId + '_asiA1', slotId + '_asiA2',
    slotId + '_skillProf', slotId + '_expertise',
  ].forEach(k => {
    if (character.class.choices?.[k] !== undefined) setClassChoice(k, null)
  })
  setClassChoice(slotId, feat.id)
}

function goNext() {
  if (!isFeatValid.value) return
  router.push('/spells')
}
</script>

<template>
  <div class="feat-page">
    <StepNav step="6 / 10" label="专长与天赋" back-to="/background" />
    <AbilityBar />

    <header class="feat-header">
      <div class="feat-step-badge">步骤 6 / 10 · 专长</div>
      <h1 class="feat-title">写下你的起源印记</h1>
      <p class="feat-sub">依次完成下方每一步。背景专长已自动记录，属性加值在此分配，专长选完后继续。</p>
    </header>

    <!-- 背景专长 info banner（只读，可折叠） -->
    <div :class="['feat-info-banner', { empty: !backgroundFeat }]">
      <button v-if="backgroundFeat" class="feat-info-toggle" type="button" @click="infoOpen = !infoOpen">
        <div class="feat-info-left">
          <span class="feat-info-kicker">背景专长 · {{ selectedBackground?.name }}</span>
          <span class="feat-info-name">{{ backgroundOriginFeat?.name ?? backgroundFeat.name }}</span>
        </div>
        <span class="feat-info-chevron" :class="{ open: infoOpen }">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
            <path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
      <div v-else class="feat-info-empty-row">
        <span class="feat-info-kicker">背景专长</span>
        <span class="feat-info-placeholder">返回上一步先选择背景</span>
      </div>
      <Transition name="info-slide">
        <div v-if="infoOpen && backgroundFeat" class="feat-info-body">
          <p class="feat-info-summary">{{ backgroundOriginFeat?.summary ?? '' }}</p>
          <div v-if="backgroundOriginFeat" class="feat-benefit-list">
            <article v-for="benefit in backgroundOriginFeat.benefits" :key="benefit.nameEn" class="feat-benefit">
              <strong>{{ benefit.name }}</strong>
              <span>{{ benefit.nameEn }}</span>
              <p>{{ benefit.desc }}</p>
            </article>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 顺序步进 -->
    <div class="feat-steps">
      <template v-for="step in featSteps" :key="step.id">

        <!-- 已完成 → 可点击重选 -->
        <button
          v-if="step.isValid && activeId !== step.id"
          class="step-done"
          type="button"
          @click="focusStep(step.id)"
        >
          <span class="step-done-check">✦</span>
          <div class="step-done-info">
            <span class="step-done-label">{{ step.label }}</span>
            <span class="step-done-summary">{{ step.summary }}</span>
          </div>
          <span class="step-done-action">重选 ›</span>
        </button>

        <!-- 当前活跃 → 展开 -->
        <div v-else-if="activeId === step.id" class="step-active">
          <div class="step-active-head">
            <div>
              <div class="step-active-kicker">{{ step.kicker }}</div>
              <h2 class="step-active-title">{{ step.label }}</h2>
            </div>
            <span class="step-active-badge">当前</span>
          </div>

          <div class="step-active-body">

            <!-- ── 背景属性加值 ── -->
            <template v-if="step.kind === 'bonus'">
              <p class="step-desc">只能在背景提供的三项属性中选择。</p>
              <div class="bonus-mode-grid">
                <button type="button" :class="['bonus-mode', { active: bonusMode === '2+1' }]" @click="selectMode('2+1')">
                  <strong>+2 / +1</strong><span>专精一项，兼顾另一项</span>
                </button>
                <button type="button" :class="['bonus-mode', { active: bonusMode === '1+1+1' }]" @click="selectMode('1+1+1')">
                  <strong>+1 / +1 / +1</strong><span>三项平均提升</span>
                </button>
              </div>
              <div v-if="selectedBackground" class="ability-bonus-grid" style="margin-top:14px">
                <div v-for="ability in allowedAbilities" :key="ability" class="ability-bonus-card">
                  <div>
                    <span class="ability-name">{{ ability }}</span>
                    <span class="ability-current">+{{ abilityBonuses[ability] ?? 0 }}</span>
                  </div>
                  <div v-if="bonusMode === '2+1'" class="bonus-buttons">
                    <button type="button" :class="{ active: abilityBonuses[ability] === 2 }" @click="selectSplitBonus(ability, 2)">+2</button>
                    <button type="button" :class="{ active: abilityBonuses[ability] === 1 }" @click="selectSplitBonus(ability, 1)">+1</button>
                  </div>
                  <div v-else class="bonus-locked">固定 +1</div>
                </div>
              </div>
              <p v-else class="step-desc" style="color:rgba(220,140,80,0.8);margin-top:10px">返回上一步先选择背景。</p>
              <p :class="['step-status', { complete: isBonusValid }]">
                {{ isBonusValid ? '✦ 背景加值已记录' : '请选择背景属性加值' }}
              </p>
            </template>

            <!-- ── 职业技能熟练 ── -->
            <template v-else-if="step.kind === 'class-skills'">
              <p class="step-desc">
                从职业技能列表中选择 {{ classSkillCount }} 项获得熟练。
                <template v-if="skillsProficientElsewhere.size">
                  <span style="color:var(--text-dim);font-size:12px">已从背景/种族/专长获得熟练的技能（{{ [...skillsProficientElsewhere].join('、') }}）已从列表移除——重复熟练不会叠加成专精。</span>
                </template>
              </p>
              <p
                v-if="expertisePoolHint && !expertisePoolHint.satisfied"
                class="step-desc expertise-pool-hint"
              >
                ⚠ 本职业的技能专精限选 {{ expertisePoolHint.skills.join('、') }}。
                请至少选择其中一项，否则后续无法获得专精。
              </p>
              <div class="step-chip-grid">
                <button
                  v-for="skill in classSkillOptions"
                  :key="skill"
                  type="button"
                  :class="['step-chip', {
                    active: classSkillChoices.includes(skill),
                    disabled: !classSkillChoices.includes(skill) && classSkillChoices.length >= classSkillCount,
                    'pool-required': expertisePoolHint && !expertisePoolHint.satisfied && expertisePoolHint.skills.includes(skill),
                  }]"
                  @click="toggleClassSkill(skill)"
                >{{ skill }}</button>
              </div>
              <p :class="['step-status', { complete: isClassSkillValid }]">
                {{ isClassSkillValid ? `✦ 已选 ${classSkillCount} 项技能熟练` : `已选 ${classSkillChoices.length} / ${classSkillCount}` }}
              </p>
            </template>

            <!-- ── 职业专精（法师学者、游侠专精等）── -->
            <template v-else-if="step.kind === 'class-expertise'">
              <p class="step-desc">
                从已熟练的技能中选择
                <strong>{{ step.count }}</strong> 项获得专精（专精加值 = 熟练加值 × 2）。
                <template v-if="step.pool">
                  <span style="color:var(--text-dim);font-size:12px">限选：{{ step.pool.join('、') }}</span>
                </template>
              </p>
              <div v-if="expertiseCandidates(step.id, step.pool).length === 0" class="expertise-empty">
                <p class="step-desc" style="color:rgba(220,140,80,0.9);margin:0">
                  <template v-if="step.pool">
                    此专精限选 {{ step.pool.join('、') }}，但你目前未熟练其中任何一项。
                    请先回到「职业技能熟练」，从中选择至少一项。
                  </template>
                  <template v-else>
                    你目前还没有可用于专精的已熟练技能，请先完成职业技能熟练。
                  </template>
                </p>
                <button
                  v-if="classSkillSlot"
                  type="button"
                  class="expertise-jump"
                  @click="focusStep('class-skills')"
                >前往职业技能熟练 ›</button>
              </div>
              <div v-else class="step-chip-grid">
                <button
                  v-for="skill in expertiseCandidates(step.id, step.pool)"
                  :key="skill"
                  type="button"
                  :class="['step-chip', {
                    active: getExpertiseSlotChoices(step.id).includes(skill),
                    disabled: !getExpertiseSlotChoices(step.id).includes(skill) && getExpertiseSlotChoices(step.id).length >= step.count,
                  }]"
                  @click="toggleExpertiseChoice(step.id, skill, step.count)"
                >{{ skill }}</button>
              </div>
              <p :class="['step-status', { complete: step.isValid }]">
                {{ step.isValid
                  ? `✦ 已选 ${step.count} 项专精`
                  : `已选 ${getExpertiseSlotChoices(step.id).length} / ${step.count}` }}
              </p>
            </template>

            <!-- ── 专长授予技能熟练 ── -->
            <template v-else-if="step.kind === 'feat-skill-prof'">
              <p class="step-desc">
                专长额外授予 <strong>{{ step.count }}</strong> 项技能熟练，从你尚未熟练的技能中选择。
              </p>
              <div class="step-chip-grid">
                <button
                  v-for="skill in featSkillProfCandidates(step.slotId)"
                  :key="skill"
                  type="button"
                  :class="['step-chip', {
                    active: getFeatSkillProfChoices(step.slotId).includes(skill),
                    disabled: !getFeatSkillProfChoices(step.slotId).includes(skill) && getFeatSkillProfChoices(step.slotId).length >= step.count,
                  }]"
                  @click="toggleFeatSkillProf(step.slotId, skill, step.count)"
                >{{ skill }}</button>
              </div>
              <p :class="['step-status', { complete: step.isValid }]">
                {{ step.isValid
                  ? `✦ 已选 ${step.count} 项技能熟练`
                  : `已选 ${getFeatSkillProfChoices(step.slotId).length} / ${step.count}` }}
              </p>
            </template>

            <!-- ── 专长授予专精 ── -->
            <template v-else-if="step.kind === 'feat-expertise'">
              <p class="step-desc">
                专长额外授予 <strong>{{ step.count }}</strong> 项专精，从已熟练（含上方新选）的技能中选择。
              </p>
              <div v-if="featExpertiseCandidates(step.slotId).length === 0" class="step-desc" style="color:rgba(220,140,80,0.8)">
                请先选择技能熟练后，再来此处选择专精。
              </div>
              <div v-else class="step-chip-grid">
                <button
                  v-for="skill in featExpertiseCandidates(step.slotId)"
                  :key="skill"
                  type="button"
                  :class="['step-chip', {
                    active: getFeatExpertiseChoices(step.slotId).includes(skill),
                    disabled: !getFeatExpertiseChoices(step.slotId).includes(skill) && getFeatExpertiseChoices(step.slotId).length >= step.count,
                  }]"
                  @click="toggleFeatExpertise(step.slotId, skill, step.count)"
                >{{ skill }}</button>
              </div>
              <p :class="['step-status', { complete: step.isValid }]">
                {{ step.isValid
                  ? `✦ 已选 ${step.count} 项专精`
                  : `已选 ${getFeatExpertiseChoices(step.slotId).length} / ${step.count}` }}
              </p>
            </template>

            <!-- ── 战斗风格专长 ── -->
            <template v-else-if="step.kind === 'fighting-style'">
              <p class="step-desc">选择一种战斗风格，提供持续的被动增益。</p>
              <div class="fighting-style-grid">
                <button
                  v-for="feat in fightingStyleFeats"
                  :key="feat.id"
                  type="button"
                  :class="['fighting-style-card', { active: character.class.choices?.[step.id] === feat.id }]"
                  @click="selectFightingStyleFeat(feat, step.id)"
                >
                  <span>{{ feat.name }}</span>
                  <small>{{ feat.nameEn }}</small>
                </button>
              </div>
              <article v-if="character.class.choices?.[step.id] && findFightingStyleFeatById(character.class.choices[step.id])" class="selected-feat-detail">
                <strong>{{ findFightingStyleFeatById(character.class.choices[step.id]).name }} · {{ findFightingStyleFeatById(character.class.choices[step.id]).nameEn }}</strong>
                <p>{{ findFightingStyleFeatById(character.class.choices[step.id]).desc }}</p>
              </article>
            </template>

            <!-- ── 额外起源专长（人类）── -->
            <template v-else-if="step.kind === 'human-feat'">
              <p class="step-desc">人类额外获得一项起源专长。</p>
              <div class="origin-feat-grid">
                <button
                  v-for="feat in originFeats"
                  :key="feat.id"
                  type="button"
                  :class="['origin-feat-card', { active: humanOriginFeatId === feat.id, disabled: !canPickHumanFeat(feat) }]"
                  @click="openFeatDetail(feat, 'origin')"
                >
                  <span>{{ feat.name }}</span>
                  <small>{{ feat.nameEn }}</small>
                </button>
              </div>
              <article v-if="selectedHumanFeat" class="selected-feat-detail">
                <strong>{{ selectedHumanFeat.name }} · {{ selectedHumanFeat.nameEn }}</strong>
                <p>{{ selectedHumanFeat.summary }}</p>
              </article>
            </template>

            <!-- ── 熟习 · 技能选择 ── -->
            <template v-else-if="step.kind === 'skilled-skills'">
              <p class="step-desc">从所有技能中自由选取 3 项，已选 <strong>{{ skilledChoices.length }} / 3</strong>。</p>
              <div class="step-chip-grid">
                <button
                  v-for="skill in DND_SKILLS"
                  :key="skill"
                  type="button"
                  :class="['step-chip', { active: skilledChoices.includes(skill), disabled: !skilledChoices.includes(skill) && skilledChoices.length >= 3 }]"
                  @click="toggleSkilledSkill(skill)"
                >{{ skill }}</button>
              </div>
              <p :class="['step-status', { complete: skilledChoices.length === 3 }]">
                {{ skilledChoices.length === 3 ? '✦ 已选择 3 项技能熟练' : `还需选择 ${3 - skilledChoices.length} 项` }}
              </p>
            </template>

            <!-- ── 通用专长 ── -->
            <template v-else-if="step.kind === 'general-feat'">
              <p class="step-desc">
                通用专长需要 {{ getGeneralFeatSlot(step.id)?.minLevel ?? 4 }} 级以上。已用当前属性与背景加值判断先决条件。
              </p>
              <div class="general-feat-grid">
                <button
                  v-for="feat in generalFeats"
                  :key="feat.id"
                  type="button"
                  :class="['general-feat-card', { active: character.class.choices?.[step.id] === feat.id, disabled: !canPickGeneralFeat(feat) }]"
                  @click="openFeatDetail(feat, 'general', step.id)"
                >
                  <span>{{ feat.name }}</span>
                  <small>{{ feat.nameEn }}</small>
                  <em>{{ feat.prerequisiteText }}</em>
                  <b v-if="generalFeatLockReason(feat)">{{ generalFeatLockReason(feat) }}</b>
                </button>
              </div>
              <article v-if="character.class.choices?.[step.id] && findGeneralFeatById(character.class.choices[step.id])" class="selected-feat-detail">
                <strong>
                  {{ findGeneralFeatById(character.class.choices[step.id]).name }} ·
                  {{ findGeneralFeatById(character.class.choices[step.id]).nameEn }}
                </strong>
                <p>{{ findGeneralFeatById(character.class.choices[step.id]).summary }}</p>
              </article>
              <template v-if="character.class.choices?.[step.id] && findGeneralFeatById(character.class.choices[step.id])?.abilityBonus">
                <div class="feat-asi-block">
                  <template v-if="findGeneralFeatById(character.class.choices[step.id]).abilityBonus.fixed">
                    <div class="feat-asi-fixed">
                      <span>属性加值</span>
                      <strong>{{ findGeneralFeatById(character.class.choices[step.id]).abilityBonus.fixed }} +1</strong>
                      <em>已自动计入</em>
                    </div>
                  </template>
                  <template v-else-if="findGeneralFeatById(character.class.choices[step.id]).abilityBonus.options">
                    <div class="feat-asi-label">选择 +1 加值的属性</div>
                    <div class="feat-asi-chips">
                      <button v-for="ability in getAsiOptions(character.class.choices[step.id])" :key="ability" type="button"
                        :class="['feat-asi-chip', { active: character.class.choices?.[step.id + '_asi'] === ability }]"
                        @click="setClassChoice(step.id + '_asi', ability)">{{ ability }}</button>
                    </div>
                  </template>
                  <template v-else-if="findGeneralFeatById(character.class.choices[step.id]).abilityBonus.mode === 'asi'">
                    <div class="feat-asi-label">选择加值方式</div>
                    <div class="feat-asi-mode-row">
                      <button type="button" :class="['feat-asi-mode-btn', { active: character.class.choices?.[step.id + '_asiMode'] === '2' }]" @click="setClassChoice(step.id + '_asiMode', '2')">一项 +2</button>
                      <button type="button" :class="['feat-asi-mode-btn', { active: character.class.choices?.[step.id + '_asiMode'] === '1+1' }]" @click="setClassChoice(step.id + '_asiMode', '1+1')">两项各 +1</button>
                    </div>
                    <template v-if="character.class.choices?.[step.id + '_asiMode'] === '2'">
                      <div class="feat-asi-label" style="margin-top:10px">选择提升哪项属性 (+2)</div>
                      <div class="feat-asi-chips">
                        <button v-for="ability in ALL_ABILITIES" :key="ability" type="button"
                          :class="['feat-asi-chip', { active: character.class.choices?.[step.id + '_asiA1'] === ability }]"
                          @click="setClassChoice(step.id + '_asiA1', ability)">{{ ability }}</button>
                      </div>
                    </template>
                    <template v-if="character.class.choices?.[step.id + '_asiMode'] === '1+1'">
                      <div class="feat-asi-label" style="margin-top:10px">第一项属性 (+1)</div>
                      <div class="feat-asi-chips">
                        <button v-for="ability in ALL_ABILITIES" :key="ability" type="button"
                          :class="['feat-asi-chip', { active: character.class.choices?.[step.id + '_asiA1'] === ability }]"
                          @click="setClassChoice(step.id + '_asiA1', ability)">{{ ability }}</button>
                      </div>
                      <div class="feat-asi-label" style="margin-top:10px">第二项属性 (+1)</div>
                      <div class="feat-asi-chips">
                        <button v-for="ability in ALL_ABILITIES.filter(a => a !== character.class.choices?.[step.id + '_asiA1'])" :key="ability" type="button"
                          :class="['feat-asi-chip', { active: character.class.choices?.[step.id + '_asiA2'] === ability }]"
                          @click="setClassChoice(step.id + '_asiA2', ability)">{{ ability }}</button>
                      </div>
                    </template>
                  </template>
                </div>
              </template>
            </template>

          </div>
        </div>

        <!-- 收起状态（已完成 or 待完成，均可点击展开） -->
        <button v-else class="step-pending" type="button" @click="focusStep(step.id)">
          <span class="step-pending-dot" :class="{ complete: step.isValid }"></span>
          <span class="step-pending-label">{{ step.label }}</span>
          <span class="step-pending-hint">{{ step.isValid ? '✦ 已完成' : '展开 ›' }}</span>
        </button>

      </template>
    </div>

    <footer class="feat-footer">
      <span v-if="!isFeatValid" class="feat-footer-hint">
        {{ featFooterHint }}
      </span>
      <button class="feat-next" type="button" :disabled="!isFeatValid" @click="goNext">继续法术选择</button>
    </footer>

    <FeatDetailModal
      :feat="detailFeat"
      :kind="detailKind"
      :can-pick="detailKind === 'origin'
        ? (detailFeat ? canPickHumanFeat(detailFeat) : false)
        : (detailFeat ? canPickGeneralFeat(detailFeat) : false)"
      :is-selected="detailKind === 'origin'
        ? humanOriginFeatId === detailFeat?.id
        : character.class.choices?.[detailSlotId] === detailFeat?.id"
      :lock-reason="detailKind === 'general' && detailFeat ? generalFeatLockReason(detailFeat) : ''"
      @pick="pickFromModal"
      @close="closeFeatDetail"
    />
  </div>
</template>

<style scoped>
.feat-page {
  min-height: 100dvh;
  padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(ellipse at 20% 14%, rgba(90, 130, 120, 0.12), transparent 46%),
    radial-gradient(ellipse at 80% 20%, rgba(160, 80, 90, 0.1), transparent 44%),
    var(--bg);
}

.feat-header {
  padding: 42px 20px 20px;
  text-align: center;
}

.feat-step-badge,
.feat-kicker {
  font-family: var(--font-title);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
}

.feat-step-badge {
  display: inline-block;
  font-size: 10px;
  border: 1px solid var(--border-gold);
  border-radius: 999px;
  padding: 4px 14px;
  background: rgba(201, 168, 76, 0.08);
  margin-bottom: 12px;
}

.feat-title {
  font-family: var(--font-deco);
  font-size: clamp(25px, 5vw, 38px);
  color: var(--gold-bright);
}

.feat-sub {
  max-width: 680px;
  margin: 8px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.feat-layout {
  width: min(1080px, calc(100% - 32px));
  margin: 24px auto 0;
  display: grid;
  gap: 14px;
}

.feat-panel {
  border: 1px solid var(--border-dark);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.035), transparent 38%),
    rgba(19, 16, 42, 0.76);
  padding: 18px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
}

.feat-panel-primary,
.ability-panel {
  border-color: rgba(201, 168, 76, 0.34);
}

.feat-kicker {
  font-size: 10px;
  margin-bottom: 8px;
}

.feat-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.feat-panel-title {
  color: var(--gold-light);
  font-size: 22px;
  margin-bottom: 2px;
}

.feat-panel-en {
  color: var(--text-dim);
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.feat-source {
  border: 1px solid rgba(201, 168, 76, 0.22);
  border-radius: 999px;
  color: var(--gold);
  font-family: var(--font-title);
  font-size: 11px;
  padding: 4px 10px;
  white-space: nowrap;
}

.feat-panel-text {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.feat-benefit-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.feat-benefit {
  border-left: 2px solid rgba(201, 168, 76, 0.48);
  padding-left: 12px;
}

.feat-benefit strong {
  display: block;
  color: var(--text);
  font-family: var(--font-title);
  font-size: 14px;
}

.feat-benefit span {
  display: block;
  color: var(--gold);
  font-size: 11px;
  margin-top: 2px;
}

.feat-benefit p {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.65;
  margin-top: 6px;
}

.feat-table-wrap {
  margin-top: 18px;
}

.feat-table-wrap h3 {
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 14px;
  margin-bottom: 8px;
}

.feat-table {
  display: grid;
  gap: 8px;
}

.feat-table-row {
  display: grid;
  grid-template-columns: 92px 132px 1fr;
  gap: 8px;
  align-items: center;
  border-top: 1px solid var(--border-dark);
  padding-top: 8px;
}

.feat-table-row span {
  color: var(--text);
  font-family: var(--font-title);
  font-size: 12px;
}

.feat-table-row small {
  color: var(--text-dim);
  font-size: 11px;
}

.feat-table-row p {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.bonus-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.bonus-mode {
  border: 1px solid var(--border-dark);
  background: rgba(255, 255, 255, 0.025);
  padding: 12px;
  text-align: left;
  border-radius: var(--r);
  display: grid;
  gap: 4px;
}

.bonus-mode strong {
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 14px;
}

.bonus-mode span {
  color: var(--text-muted);
  font-size: 12px;
}

.bonus-mode.active {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
}

.ability-bonus-grid {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.ability-bonus-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border-dark);
  background: rgba(8, 6, 18, 0.42);
  padding: 10px 12px;
  border-radius: var(--r);
}

.ability-name {
  display: block;
  color: var(--text);
  font-family: var(--font-title);
  font-size: 14px;
}

.ability-current {
  color: var(--gold);
  font-family: var(--font-title);
  font-size: 12px;
}

.bonus-buttons {
  display: flex;
  gap: 8px;
}

.bonus-buttons button {
  min-width: 46px;
  min-height: 34px;
  border-radius: var(--r-sm);
  border: 1px solid rgba(201, 168, 76, 0.18);
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.03);
  font-family: var(--font-title);
}

.bonus-buttons button.active {
  color: #120D08;
  border-color: var(--gold);
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
}

.bonus-locked {
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 12px;
}

.bonus-state {
  margin-top: 12px;
  color: var(--text-dim);
  font-size: 13px;
}

.bonus-state.complete {
  color: var(--gold-light);
}

.origin-feat-grid,
.general-feat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.general-feat-grid {
  max-height: 420px;
  overflow: auto;
  padding-right: 4px;
}

.origin-feat-card,
.general-feat-card {
  min-height: 62px;
  border: 1px solid rgba(201, 168, 76, 0.15);
  border-radius: var(--r);
  background: rgba(201, 168, 76, 0.05);
  display: grid;
  align-content: center;
  gap: 3px;
  text-align: left;
  padding: 10px;
  transition: border-color 0.15s, background 0.15s;
}

.origin-feat-card:hover:not(.disabled),
.general-feat-card:hover:not(.disabled) {
  border-color: rgba(201, 168, 76, 0.35);
  background: rgba(201, 168, 76, 0.1);
}

.general-feat-card {
  min-height: 86px;
}

.origin-feat-card span,
.general-feat-card span {
  color: #f0e4c8;
  font-family: var(--font-title);
  font-size: 13px;
}

.origin-feat-card small,
.general-feat-card small {
  color: var(--text-dim);
  font-size: 11px;
}

.general-feat-card em {
  color: var(--gold);
  font-size: 11px;
  font-style: normal;
}

.general-feat-card b {
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 400;
}

.origin-feat-card.active,
.general-feat-card.active {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.12);
}

.origin-feat-card.disabled,
.general-feat-card.disabled {
  opacity: 0.38;
}

.feat-source.locked {
  color: var(--text-dim);
  border-color: var(--border-dark);
}

.selected-feat-detail {
  margin-top: 14px;
  border-top: 1px solid var(--border-dark);
  padding-top: 12px;
}

.selected-feat-detail strong {
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 13px;
}

.selected-feat-detail p {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
  margin-top: 6px;
}

.selected-feat-detail small {
  display: block;
  color: var(--gold);
  font-size: 11px;
  margin-top: 6px;
}

.feat-list {
  display: grid;
  gap: 8px;
}

.feat-list-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  border-top: 1px solid var(--border-dark);
  padding-top: 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.feat-list-item strong {
  color: var(--text);
  font-family: var(--font-title);
  font-weight: 500;
}

.feat-asi-block {
  margin-top: 14px;
  border-top: 1px solid rgba(201, 168, 76, 0.15);
  padding-top: 12px;
}

.feat-asi-fixed {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-muted);
}

.feat-asi-fixed strong {
  color: var(--gold-light);
  font-family: var(--font-title);
}

.feat-asi-fixed em {
  font-style: normal;
  font-size: 11px;
  color: var(--text-dim);
  border: 1px solid var(--border-dark);
  border-radius: 999px;
  padding: 2px 8px;
}

.feat-asi-label {
  font-size: 11px;
  color: var(--gold);
  font-family: var(--font-title);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.feat-asi-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feat-asi-chip {
  min-height: 34px;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-dark);
  background: rgba(8, 6, 18, 0.42);
  color: var(--text-muted);
  font-family: var(--font-title);
  font-size: 12px;
  transition: all 0.15s;
}

.feat-asi-chip:hover {
  border-color: rgba(201, 168, 76, 0.35);
  color: var(--text);
}

.feat-asi-chip.active {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.14);
  color: var(--gold-light);
}

.feat-asi-mode-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.feat-asi-mode-btn {
  flex: 1;
  min-height: 38px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-dark);
  background: rgba(8, 6, 18, 0.42);
  color: var(--text-muted);
  font-family: var(--font-title);
  font-size: 12px;
  transition: all 0.15s;
}

.feat-asi-mode-btn:hover {
  border-color: rgba(201, 168, 76, 0.35);
  color: var(--text);
}

.feat-asi-mode-btn.active {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.12);
  color: var(--gold-light);
}

.skilled-panel {
  border-color: rgba(90, 180, 140, 0.3);
}

.skilled-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.skilled-chip {
  min-height: 36px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(90, 180, 140, 0.22);
  background: rgba(90, 180, 140, 0.07);
  color: #f0e4c8;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.04em;
  transition: all 0.15s;
}

.skilled-chip:hover:not(.disabled):not(.active) {
  border-color: rgba(90, 180, 140, 0.5);
  color: #fff;
  background: rgba(90, 180, 140, 0.14);
}

.skilled-chip.active {
  border-color: rgba(90, 180, 140, 0.7);
  background: rgba(90, 180, 140, 0.14);
  color: #a8e8c8;
}

.skilled-chip.disabled {
  opacity: 0.3;
  pointer-events: none;
}

.feat-footer {
  position: fixed;
  inset: auto 0 var(--pcb-height, 0px);
  padding: 16px 20px env(safe-area-inset-bottom, 0px);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
  border-top: 1px solid var(--border-dark);
  background: rgba(12, 10, 23, 0.96);
  backdrop-filter: blur(12px);
}

.feat-footer-hint {
  color: var(--text-dim);
  font-size: 12px;
}

.feat-next {
  min-height: 44px;
  padding: 10px 26px;
  border-radius: var(--r);
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  color: #120D08;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.1em;
}

.feat-next:disabled {
  opacity: 0.35;
  pointer-events: none;
}

@media (max-width: 640px) {
  .feat-layout {
    width: min(100% - 24px, 1080px);
  }

  .feat-title-row,
  .ability-bonus-card,
  .feat-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .bonus-mode-grid,
  .origin-feat-grid,
  .general-feat-grid {
    grid-template-columns: 1fr;
  }

  .feat-table-row {
    grid-template-columns: 1fr;
  }

  .feat-footer {
    gap: 8px;
  }

  .feat-next {
    width: 100%;
  }
}

.class-skill-panel {
  border-color: rgba(74, 122, 90, 0.4);
}

.class-skill-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.class-skill-chip {
  padding: 7px 14px;
  border: 1px solid rgba(201, 168, 76, 0.22);
  border-radius: 999px;
  background: rgba(201, 168, 76, 0.07);
  color: #f0e4c8;
  font-family: var(--font-title);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.class-skill-chip:hover:not(.disabled):not(.active) {
  border-color: rgba(201, 168, 76, 0.5);
  background: rgba(201, 168, 76, 0.14);
  color: #fff;
}

.class-skill-chip.active {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.22);
  color: var(--gold-light);
}

.class-skill-chip.disabled {
  opacity: 0.35;
  pointer-events: none;
}

.skill-bg-note {
  color: var(--text-dim);
  font-size: 12px;
}

.fighting-style-panel {
  border-color: rgba(139, 80, 58, 0.4);
}

.fighting-style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.fighting-style-card {
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid rgba(200, 120, 80, 0.2);
  border-radius: var(--r);
  background: rgba(139, 58, 40, 0.08);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.fighting-style-card:hover {
  border-color: rgba(200, 120, 80, 0.45);
  background: rgba(139, 58, 40, 0.15);
}

.fighting-style-card span {
  color: #f0e4c8;
  font-family: var(--font-title);
  font-size: 13px;
}

.fighting-style-card small {
  color: var(--text-dim);
  font-size: 10px;
}

.fighting-style-card.active {
  border-color: rgba(200, 120, 80, 0.7);
  background: rgba(139, 58, 40, 0.18);
}

.fighting-style-card.active span {
  color: #e8b090;
}

/* ── Info banner (background feat, collapsible) ── */
.feat-info-banner {
  width: min(720px, calc(100% - 32px));
  margin: 0 auto 12px;
  border: 1px solid rgba(201, 168, 76, 0.22);
  border-radius: var(--r);
  background: rgba(201, 168, 76, 0.06);
  overflow: hidden;
}

.feat-info-banner.empty {
  border-color: var(--border-dark);
  background: rgba(255, 255, 255, 0.02);
}

.feat-info-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
}

.feat-info-empty-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.feat-info-kicker {
  display: block;
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 3px;
}

.feat-info-name {
  color: var(--text);
  font-family: var(--font-title);
  font-size: 14px;
}

.feat-info-placeholder {
  color: var(--text-dim);
  font-size: 13px;
}

.feat-info-chevron {
  color: var(--gold);
  flex-shrink: 0;
  transition: transform 0.2s;
}

.feat-info-chevron.open {
  transform: rotate(180deg);
}

.feat-info-body {
  padding: 0 16px 14px;
}

.feat-info-summary {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.65;
  margin-bottom: 10px;
}

.info-slide-enter-active,
.info-slide-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 600px;
  overflow: hidden;
}

.info-slide-enter-from,
.info-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ── Step flow ── */
.feat-steps {
  width: min(720px, calc(100% - 32px));
  margin: 0 auto;
  display: grid;
  gap: 8px;
  padding-bottom: 100px;
}

/* Completed step row */
.step-done {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(201, 168, 76, 0.18);
  border-radius: var(--r);
  background: rgba(201, 168, 76, 0.04);
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.step-done:hover {
  background: rgba(201, 168, 76, 0.09);
  border-color: rgba(201, 168, 76, 0.35);
}

.step-done-check {
  color: var(--gold);
  font-size: 13px;
  flex-shrink: 0;
}

.step-done-info {
  flex: 1;
  min-width: 0;
}

.step-done-label {
  display: block;
  color: var(--text-muted);
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.step-done-summary {
  display: block;
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 13px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-done-action {
  color: var(--text-dim);
  font-size: 12px;
  flex-shrink: 0;
}

/* Active step card */
.step-active {
  border: 1px solid rgba(201, 168, 76, 0.4);
  border-radius: var(--r);
  background: rgba(19, 16, 42, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.step-active-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border-dark);
}

.step-active-kicker {
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 4px;
}

.step-active-title {
  color: var(--gold-bright);
  font-size: 18px;
  font-family: var(--font-deco);
}

.step-active-badge {
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #120D08;
  background: var(--gold);
  border-radius: 999px;
  padding: 3px 10px;
  flex-shrink: 0;
}

.step-active-body {
  padding: 16px 18px;
}

.step-desc {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.65;
  margin-bottom: 14px;
}

.step-chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.step-chip {
  min-height: 36px;
  padding: 6px 14px;
  border: 1px solid rgba(201, 168, 76, 0.22);
  border-radius: 999px;
  background: rgba(201, 168, 76, 0.07);
  color: var(--text);
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.04em;
  transition: border-color 0.15s, background 0.15s, color 0.15s, opacity 0.15s;
}

.step-chip:hover:not(.disabled):not(.active) {
  border-color: rgba(201, 168, 76, 0.48);
  background: rgba(201, 168, 76, 0.13);
  color: var(--gold-light);
}

.step-chip.active {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.2);
  color: var(--gold-bright);
}

.step-chip.disabled {
  color: var(--text-dim);
  opacity: 0.42;
  pointer-events: none;
}

/* 学者等限定池专精：在职业技能步骤高亮池内必选项 */
.step-chip.pool-required:not(.active) {
  border-color: rgba(220, 140, 80, 0.6);
  background: rgba(220, 140, 80, 0.1);
  color: #e8b890;
}

.expertise-pool-hint {
  margin-top: -2px;
  margin-bottom: 12px;
  color: rgba(220, 140, 80, 0.92);
  font-size: 12.5px;
}

/* 专精候选为空时的引导块 */
.expertise-empty {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(220, 140, 80, 0.28);
  border-radius: var(--r);
  background: rgba(220, 140, 80, 0.06);
}

.expertise-jump {
  align-self: flex-start;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(201, 168, 76, 0.4);
  border-radius: 999px;
  background: rgba(201, 168, 76, 0.1);
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.expertise-jump:hover {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.18);
}

.step-status {
  margin-top: 12px;
  color: var(--text-dim);
  font-family: var(--font-title);
  font-size: 12px;
}

.step-status.complete {
  color: var(--gold-light);
}

/* Collapsed step (pending or done-but-not-active) */
.step-pending {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border: 1px solid var(--border-dark);
  border-radius: var(--r);
  background: rgba(255, 255, 255, 0.015);
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.step-pending:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(201, 168, 76, 0.22);
}

.step-pending-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid var(--text-dim);
  flex-shrink: 0;
}

.step-pending-dot.complete {
  background: var(--gold);
  border-color: var(--gold);
}

.step-pending-label {
  flex: 1;
  color: var(--text-muted);
  font-family: var(--font-title);
  font-size: 13px;
}

.step-pending-hint {
  color: var(--text-dim);
  font-size: 11px;
}

</style>
