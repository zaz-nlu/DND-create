import { findGeneralFeatById } from '../data/generalFeats.js'

// 规范技能→属性映射（所有消费方的单一来源）
export const SKILL_ABILITY = {
  '运动': '力量',
  '体操': '敏捷', '巧手': '敏捷', '隐匿': '敏捷',
  '奥秘': '智力', '历史': '智力', '调查': '智力', '侦查': '智力', '自然': '智力', '宗教': '智力',
  '驯兽': '感知', '洞悉': '感知', '医学': '感知', '察觉': '感知', '求生': '感知',
  '欺瞒': '魅力', '威吓': '魅力', '表演': '魅力', '游说': '魅力',
}

export const DND_SKILLS = Object.keys(SKILL_ABILITY)

/**
 * 聚合角色所有技能熟练/专精来源，返回每项技能的最终状态。
 *
 * 来源（按优先级/叠加顺序）：
 *   1. 背景技能 (background.skills)
 *   2. 职业技能选择 (class.choices.skills)
 *   3. 种族单项技能 (race.choices.skillProficiency)
 *   4. 熟习起源专长 (race.choices.skilledSkills)
 *   5. 通用专长授予 (class.choices[slotId + '_skillProf'])
 *   6. 通用专长专精 (class.choices[slotId + '_expertise'])
 *   7. 职业 progression 专精条目 (class.choices[reqId] — kind: 'expertise')
 *   8. 旧格式兼容 (character.skills = { skill: 'proficient' | 'expert' })
 *
 * 官方规则约束：专精必须建立在熟练之上；同来源不叠加。
 *
 * @param {object} character - reactive 角色对象
 * @param {object} opts
 * @param {object|null} opts.selectedClass - 当前职业定义
 * @param {object|null} opts.selectedBackground - 当前背景定义
 * @returns {Array<{skill, ability, proficient, expert, multiplier}>}
 */
export function getSkillMap(character, { selectedClass, selectedBackground } = {}) {
  const proficientSet = new Set()
  const expertSet = new Set()

  // 1. 背景
  const bgSkills = selectedBackground?.skills ?? []
  for (const s of bgSkills) proficientSet.add(s)

  // 2. 职业技能选择
  const classSkills = character.class?.choices?.skills
  if (Array.isArray(classSkills)) {
    for (const s of classSkills) proficientSet.add(s)
  }

  // 3. 种族技能：新格式数组（skillProficiencies，支持 choose > 1）或旧格式字符串（skillProficiency）
  const raceSkillArr = character.race?.choices?.skillProficiencies
  if (Array.isArray(raceSkillArr)) {
    for (const s of raceSkillArr) if (s) proficientSet.add(s)
  } else {
    const raceSkill = character.race?.choices?.skillProficiency
    if (raceSkill) proficientSet.add(raceSkill)
  }

  // 4. 熟习起源专长（Skilled）选的 3 项技能
  const skilledSkills = character.race?.choices?.skilledSkills
  if (Array.isArray(skilledSkills)) {
    for (const s of skilledSkills) proficientSet.add(s)
  }

  // 5 & 6. 通用专长授予：扫描 class.choices 所有 _skillProf / _expertise 后缀键
  const classChoices = character.class?.choices ?? {}
  for (const [key, value] of Object.entries(classChoices)) {
    if (key.endsWith('_skillProf') && Array.isArray(value)) {
      for (const s of value) proficientSet.add(s)
    }
    if (key.endsWith('_expertise') && Array.isArray(value)) {
      for (const s of value) expertSet.add(s)
    }
  }

  // 7. 职业 progression 中 kind:'expertise' 条目（法师学者、游侠专精等）
  if (selectedClass?.progression) {
    const level = character.level ?? 1
    for (const entry of selectedClass.progression) {
      if (entry.level > level) continue
      for (const req of entry.choices) {
        if (req.kind !== 'expertise') continue
        const chosen = classChoices[req.id]
        if (Array.isArray(chosen)) {
          for (const s of chosen) expertSet.add(s)
        }
      }
    }
  }

  // 8. 旧格式兼容：character.skills = { skill: 'proficient' | 'expert' }
  const legacyMap = character.skills ?? {}
  for (const [skill, value] of Object.entries(legacyMap)) {
    if (value === 'proficient') proficientSet.add(skill)
    if (value === 'expert') {
      proficientSet.add(skill)
      expertSet.add(skill)
    }
  }

  // 组装结果，专精必须同时满足熟练
  return DND_SKILLS.map(skill => {
    const prof = proficientSet.has(skill)
    const exp  = expertSet.has(skill) && prof
    return {
      skill,
      ability: SKILL_ABILITY[skill],
      proficient: prof,
      expert: exp,
      multiplier: exp ? 2 : prof ? 1 : 0,
    }
  })
}
