// PDF字段映射配置 - 将character对象映射到PDF表单字段
import { classes } from '../data/classes.js'
import { races } from '../data/races.js'
import { backgrounds } from '../data/backgrounds.js'
import { ABILITY_IDS, ABILITY_EN } from './abilities.js'
import { getAbilityTotalRows } from './abilityTotals.js'
import { calculateCharacterAc } from './equipment.js'
import { getSkillMap } from './skillProficiencies.js'

export function generatePdfData(character) {
  const selectedRace = races.find(r => r.id === character.race.id)
  const selectedClass = classes.find(c => c.id === character.class.id)
  const selectedBackground = backgrounds.find(b => b.id === character.background.id)
  const selectedSubclass = selectedClass?.subclasses?.find(s => s.id === character.class.subclassId)

  const level = character.level ?? 1
  const profBonus = Math.ceil(level / 4) + 1
  const abilityRows = getAbilityTotalRows(character)
  const abilityMap = Object.fromEntries(abilityRows.map(r => [r.id, r]))

  const pdfData = {}

  // ===== 基本信息 (Page 1 Top) =====
  pdfData['Text59'] = character.name || '无名冒险者'  // 角色名
  pdfData['Text60'] = level.toString()  // 等级
  pdfData['Text57'] = selectedClass?.name || ''  // 职业
  pdfData['Text58'] = selectedRace?.name || ''  // 种族

  // ===== 属性 + 修正值 (Page 1 Left) =====
  // 六个属性的圆形区域显示修正值
  const abilityFields = {
    '力量': ['Text19', 'Text20'],    // 属性值，修正值
    '敏捷': ['Text21', 'Text22'],
    '体质': ['Text23', 'Text24'],    // 实际应该是24,25
    '智力': ['Text25', 'Text26'],    // 实际应该是26,27
    '感知': ['Text27', 'Text28'],
    '魅力': ['Text29', 'Text30'],
  }

  // 根据你的JSON字段位置调整
  const abilityMapping = [
    { ability: '力量', valueField: 'Text19', modField: 'Text20' },
    { ability: '敏捷', valueField: 'Text21', modField: 'Text22' },
    { ability: '体质', valueField: 'Text24', modField: 'Text25' },
    { ability: '智力', valueField: 'Text26', modField: 'Text27' },
    { ability: '感知', valueField: 'Text28', modField: 'Text29' },
    { ability: '魅力', valueField: 'Text30', modField: 'Text31' },
  ]

  abilityMapping.forEach(({ ability, valueField, modField }) => {
    const row = abilityMap[ability]
    if (row) {
      pdfData[valueField] = row.total.toString()
      pdfData[modField] = (row.mod >= 0 ? '+' : '') + row.mod.toString()
    }
  })

  // ===== 战斗数值 (Page 1 Right Top) =====
  const dexMod = abilityMap['敏捷']?.mod ?? 0
  const acBase = calculateCharacterAc({ character, selectedClass, selectedSubclass, abilityMap })

  pdfData['Text11'] = acBase.toString()  // 护甲等级
  pdfData['Text12'] = (dexMod >= 0 ? '+' : '') + dexMod.toString()  // 先攻
  pdfData['Text13'] = (selectedRace?.speed ?? 30).toString()  // 速度
  pdfData['Text14'] = '中型'  // 体型 (简化)
  pdfData['Text15'] = character.hp?.max?.toString() || '0'  // HP上限
  pdfData['Text16'] = character.hp?.current?.toString() || '0'  // 当前HP
  pdfData['Text17'] = (character.hp?.temp || 0).toString()  // 临时HP
  pdfData['Text18'] = `${level}${selectedClass?.hitDie || 'd8'}`  // 生命骰

  // ===== 豁免 (Page 1 Skills) =====
  const classSaves = selectedClass?.saves ?? []
  const savingThrowFields = [
    { ability: '力量', field: 'Text69', checkBox: 'Check Box16' },
    { ability: '敏捷', field: 'Text70', checkBox: 'Check Box17' },
    { ability: '体质', field: 'Text71', checkBox: 'Check Box18' },
    { ability: '智力', field: 'Text72', checkBox: 'Check Box19' },
    { ability: '感知', field: 'Text73', checkBox: 'Check Box20' },
    { ability: '魅力', field: 'Text74', checkBox: 'Check Box21' },
  ]

  savingThrowFields.forEach(({ ability, field, checkBox }) => {
    const row = abilityMap[ability]
    const isProficient = classSaves.includes(ability)
    const bonus = (row?.mod ?? 0) + (isProficient ? profBonus : 0)
    pdfData[field] = (bonus >= 0 ? '+' : '') + bonus.toString()
    if (isProficient) pdfData[checkBox] = 'Yes'
  })

  // ===== 技能 (Page 1 Skills List) =====
  const skillLookup = Object.fromEntries(
    getSkillMap(character, { selectedClass, selectedBackground }).map(s => [s.skill, s])
  )

  const skillFields = [
    { skill: '运动', valueField: 'Text75', checkBox: 'Check Box22' },
    { skill: '体操', valueField: 'Text76', checkBox: 'Check Box23' },
    { skill: '巧手', valueField: 'Text77', checkBox: 'Check Box24' },
    { skill: '隐匿', valueField: 'Text78', checkBox: 'Check Box25' },
    { skill: '奥秘', valueField: 'Text79', checkBox: 'Check Box26' },
    { skill: '历史', valueField: 'Text80', checkBox: 'Check Box27' },
    { skill: '调查', valueField: 'Text81', checkBox: 'Check Box28' },
    { skill: '自然', valueField: 'Text82', checkBox: 'Check Box29' },
    { skill: '宗教', valueField: 'Text83', checkBox: 'Check Box30' },
    { skill: '驯兽', valueField: 'Text84', checkBox: 'Check Box31' },
    { skill: '洞悉', valueField: 'Text85', checkBox: 'Check Box32' },
    { skill: '医学', valueField: 'Text86', checkBox: 'Check Box33' },
    { skill: '察觉', valueField: 'Text87', checkBox: 'Check Box34' },
    { skill: '求生', valueField: 'Text88', checkBox: 'Check Box35' },
    { skill: '欺瞒', valueField: 'Text89', checkBox: 'Check Box36' },
    { skill: '威吓', valueField: 'Text90', checkBox: 'Check Box37' },
    { skill: '表演', valueField: 'Text91', checkBox: 'Check Box38' },
    { skill: '游说', valueField: 'Text92', checkBox: 'Check Box39' },
  ]

  skillFields.forEach(({ skill, valueField, checkBox }) => {
    const s = skillLookup[skill] ?? { multiplier: 0, proficient: false, expert: false, ability: '力量' }
    const row = abilityMap[s.ability]
    const total = (row?.mod ?? 0) + s.multiplier * profBonus
    pdfData[valueField] = (total >= 0 ? '+' : '') + total.toString()
    if (s.proficient || s.expert) pdfData[checkBox] = 'Yes'
  })

  // ===== 背景和装备信息 =====
  // 暂时留空，可以根据需要添加

  return pdfData
}

// 获取所有应该填充的字段列表
export function getPdfFieldsList() {
  return [
    // 基本信息
    'Text59', 'Text60', 'Text57', 'Text58',
    // 属性
    'Text19', 'Text20', 'Text21', 'Text22', 'Text24', 'Text25', 'Text26', 'Text27', 'Text28', 'Text29', 'Text30', 'Text31',
    // 战斗数值
    'Text11', 'Text12', 'Text13', 'Text14', 'Text15', 'Text16', 'Text17', 'Text18',
    // 豁免和技能
    'Text69', 'Text70', 'Text71', 'Text72', 'Text73', 'Text74',
    'Text75', 'Text76', 'Text77', 'Text78', 'Text79', 'Text80', 'Text81', 'Text82', 'Text83',
    'Text84', 'Text85', 'Text86', 'Text87', 'Text88', 'Text89', 'Text90', 'Text91', 'Text92',
    // 复选框
    'Check Box16', 'Check Box17', 'Check Box18', 'Check Box19', 'Check Box20', 'Check Box21',
    'Check Box22', 'Check Box23', 'Check Box24', 'Check Box25', 'Check Box26', 'Check Box27',
    'Check Box28', 'Check Box29', 'Check Box30', 'Check Box31', 'Check Box32', 'Check Box33',
    'Check Box34', 'Check Box35', 'Check Box36', 'Check Box37', 'Check Box38', 'Check Box39',
  ]
}
