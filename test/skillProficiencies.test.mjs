/**
 * 轻量 Node 测试：skillProficiencies.js 聚合层
 * 运行：node test/skillProficiencies.test.mjs
 */

// ── 内联 getSkillMap（避免 Vue 模块依赖，直接 copy 逻辑测试）──────────────────

const SKILL_ABILITY = {
  '运动': '力量',
  '体操': '敏捷', '巧手': '敏捷', '隐匿': '敏捷',
  '奥秘': '智力', '历史': '智力', '调查': '智力', '自然': '智力', '宗教': '智力',
  '驯兽': '感知', '洞悉': '感知', '医学': '感知', '察觉': '感知', '求生': '感知',
  '欺瞒': '魅力', '威吓': '魅力', '表演': '魅力', '游说': '魅力',
}
const DND_SKILLS = Object.keys(SKILL_ABILITY)

// 模拟 findGeneralFeatById
function findGeneralFeatById(id) {
  const feats = {
    'skill-expert': {
      id: 'skill-expert',
      grants: { skillProficiency: { count: 1 }, expertise: { count: 1 } },
    },
  }
  return feats[id] ?? null
}

function getSkillMap(character, { selectedClass, selectedBackground } = {}) {
  const proficientSet = new Set()
  const expertSet = new Set()

  const bgSkills = selectedBackground?.skills ?? []
  for (const s of bgSkills) proficientSet.add(s)

  const classSkills = character.class?.choices?.skills
  if (Array.isArray(classSkills)) for (const s of classSkills) proficientSet.add(s)

  const raceSkillArr = character.race?.choices?.skillProficiencies
  if (Array.isArray(raceSkillArr)) {
    for (const s of raceSkillArr) if (s) proficientSet.add(s)
  } else {
    const raceSkill = character.race?.choices?.skillProficiency
    if (raceSkill) proficientSet.add(raceSkill)
  }

  const skilledSkills = character.race?.choices?.skilledSkills
  if (Array.isArray(skilledSkills)) for (const s of skilledSkills) proficientSet.add(s)

  const classChoices = character.class?.choices ?? {}
  for (const [key, value] of Object.entries(classChoices)) {
    if (key.endsWith('_skillProf') && Array.isArray(value)) {
      for (const s of value) proficientSet.add(s)
    }
    if (key.endsWith('_expertise') && Array.isArray(value)) {
      for (const s of value) expertSet.add(s)
    }
  }

  if (selectedClass?.progression) {
    const level = character.level ?? 1
    for (const entry of selectedClass.progression) {
      if (entry.level > level) continue
      for (const req of entry.choices) {
        if (req.kind !== 'expertise') continue
        const chosen = classChoices[req.id]
        if (Array.isArray(chosen)) for (const s of chosen) expertSet.add(s)
      }
    }
  }

  const legacyMap = character.skills ?? {}
  for (const [skill, value] of Object.entries(legacyMap)) {
    if (value === 'proficient') proficientSet.add(skill)
    if (value === 'expert') { proficientSet.add(skill); expertSet.add(skill) }
  }

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

// ── 测试工具 ─────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ ${label}`)
    failed++
  }
}

function skill(map, name) {
  return map.find(s => s.skill === name)
}

function section(title) {
  console.log(`\n── ${title}`)
}

// ── 基础角色 stub ─────────────────────────────────────────────────────────────

function makeChar(overrides = {}) {
  return {
    level: 1,
    race: { id: 'elf', choices: {} },
    background: { id: 'sage', choices: {} },
    class: { id: 'wizard', level: 1, choices: {} },
    abilities: { method: 'standard', scores: {} },
    skills: {},
    spells: { cantrips: [], prepared: [], slotsUsed: {} },
    ...overrides,
  }
}

// ── 测试 1：不熟练 = multiplier 0 ────────────────────────────────────────────

section('不熟练（默认状态）')
{
  const char = makeChar()
  const map = getSkillMap(char)
  assert(skill(map, '运动').multiplier === 0, '运动 multiplier = 0')
  assert(skill(map, '运动').proficient === false, '运动 proficient = false')
  assert(skill(map, '运动').expert === false, '运动 expert = false')
}

// ── 测试 2：背景技能 ──────────────────────────────────────────────────────────

section('背景技能熟练')
{
  const char = makeChar()
  const bg = { skills: ['历史', '奥秘'] }
  const map = getSkillMap(char, { selectedBackground: bg })
  assert(skill(map, '历史').proficient === true, '历史 proficient = true')
  assert(skill(map, '历史').multiplier === 1, '历史 multiplier = 1')
  assert(skill(map, '运动').proficient === false, '运动 不受影响')
}

// ── 测试 3：职业技能选择 ──────────────────────────────────────────────────────

section('职业技能选择')
{
  const char = makeChar({ class: { id: 'wizard', level: 3, choices: { skills: ['调查', '察觉'] } } })
  const map = getSkillMap(char)
  assert(skill(map, '调查').proficient === true, '调查 proficient = true')
  assert(skill(map, '察觉').proficient === true, '察觉 proficient = true')
}

// ── 测试 4：种族单技能 & Skilled ─────────────────────────────────────────────

section('种族技能 & Skilled 起源专长')
{
  const char = makeChar({
    race: { id: 'elf', choices: {
      skillProficiency: '洞悉',
      skilledSkills: ['威吓', '欺瞒', '游说'],
    } },
    class: { id: 'wizard', level: 1, choices: {} },
  })
  const map = getSkillMap(char)
  assert(skill(map, '洞悉').proficient === true, '洞悉 (种族) proficient = true')
  assert(skill(map, '威吓').proficient === true, '威吓 (Skilled) proficient = true')
  assert(skill(map, '欺瞒').proficient === true, '欺瞒 (Skilled) proficient = true')
  assert(skill(map, '游说').proficient === true, '游说 (Skilled) proficient = true')
  assert(skill(map, '运动').proficient === false, '运动 不受影响')
}

// ── 测试 5：旧格式兼容（character.skills map）────────────────────────────────

section('旧格式兼容（character.skills）')
{
  const char = makeChar({ skills: { '历史': 'proficient', '奥秘': 'expert' } })
  const map = getSkillMap(char)
  assert(skill(map, '历史').proficient === true, '历史 proficient = true')
  assert(skill(map, '历史').multiplier === 1, '历史 multiplier = 1')
  assert(skill(map, '奥秘').proficient === true, '奥秘 (旧expert) 自动补熟练')
  assert(skill(map, '奥秘').expert === true, '奥秘 expert = true')
  assert(skill(map, '奥秘').multiplier === 2, '奥秘 multiplier = 2')
}

// ── 测试 6：专精要求先熟练（官方规则约束）───────────────────────────────────

section('专精约束：专精必须建立在熟练之上')
{
  // expertSet 有 '运动'，但 proficientSet 没有 → expert 应被拒绝
  const char = makeChar({
    class: { id: 'ranger', level: 2, choices: {
      'expertise-ranger-2': ['运动'], // 选了运动专精，但没有运动熟练
    } },
  })
  const rangerClass = {
    progression: [
      { level: 2, choices: [{ kind: 'expertise', id: 'expertise-ranger-2', count: 1 }] },
    ],
  }
  const map = getSkillMap(char, { selectedClass: rangerClass })
  assert(skill(map, '运动').expert === false, '运动 expert = false（无熟练不能专精）')
  assert(skill(map, '运动').multiplier === 0, '运动 multiplier = 0')
}

// ── 测试 7：职业 progression 专精（游侠）────────────────────────────────────

section('职业 progression 专精（游侠）')
{
  const char = makeChar({
    level: 9,
    race: { id: 'human', choices: {} },
    background: { id: 'soldier', choices: {} },
    class: { id: 'ranger', level: 9, choices: {
      skills: ['察觉', '隐匿'],
      'expertise-ranger-2': ['察觉'],
      'expertise-ranger-9': ['隐匿', '驯兽'],
    } },
  })
  const rangerClass = {
    progression: [
      { level: 1, choices: [{ kind: 'skillProficiency', id: 'skills' }] },
      { level: 2, choices: [{ kind: 'expertise', id: 'expertise-ranger-2', count: 1 }] },
      { level: 9, choices: [{ kind: 'expertise', id: 'expertise-ranger-9', count: 2 }] },
    ],
  }
  // 额外给驯兽 proficiency 通过背景
  const bg = { skills: ['驯兽'] }
  const map = getSkillMap(char, { selectedClass: rangerClass, selectedBackground: bg })

  assert(skill(map, '察觉').multiplier === 2, '察觉 专精 multiplier = 2 (2级特性)')
  assert(skill(map, '隐匿').multiplier === 2, '隐匿 专精 multiplier = 2 (9级特性)')
  assert(skill(map, '驯兽').multiplier === 2, '驯兽 专精 multiplier = 2 (9级特性)')
}

// ── 测试 8：专长授予技能熟练 + 专精（skill-expert）──────────────────────────

section('专长授予：skill-expert 技能熟练 + 专精')
{
  // 职业技能：调查；skill-expert 授予体操熟练 + 体操专精
  const char = makeChar({
    level: 4,
    class: { id: 'wizard', level: 4, choices: {
      skills: ['调查'],
      'feat-4': 'skill-expert',
      'feat-4_skillProf': ['体操'],
      'feat-4_expertise': ['体操'],
    } },
  })
  const map = getSkillMap(char)
  assert(skill(map, '调查').proficient === true, '调查 (职业) proficient = true')
  assert(skill(map, '体操').proficient === true, '体操 (专长授予) proficient = true')
  assert(skill(map, '体操').expert === true, '体操 (专长授予) expert = true')
  assert(skill(map, '体操').multiplier === 2, '体操 multiplier = 2')
}

// ── 测试 9：多来源不叠加 ─────────────────────────────────────────────────────

section('多来源熟练不叠加（multiplier 最多 × 2）')
{
  const char = makeChar({
    level: 4,
    race: { id: 'elf', choices: { skillProficiency: '历史' } },
    class: { id: 'wizard', level: 4, choices: { skills: ['历史'] } },
  })
  const bg = { skills: ['历史'] }
  const map = getSkillMap(char, { selectedBackground: bg })
  assert(skill(map, '历史').multiplier === 1, '历史 三来源不叠加，multiplier = 1')
}

// ── 测试 9b：新格式数组 skillProficiencies 多来源也不叠加 ────────────────────

section('新格式数组 skillProficiencies 多来源不叠加')
{
  const char = makeChar({
    level: 4,
    race: { id: 'elf', choices: { skillProficiencies: ['察觉'] } },
    class: { id: 'wizard', level: 4, choices: { skills: ['察觉'] } },
  })
  const bg = { skills: ['察觉'] }
  const map = getSkillMap(char, { selectedBackground: bg })
  assert(skill(map, '察觉').proficient === true, '察觉 熟练 = true')
  assert(skill(map, '察觉').expert === false, '察觉 三来源（含种族数组）仍非专精')
  assert(skill(map, '察觉').multiplier === 1, '察觉 multiplier = 1（不叠加成2）')
}

// ── 测试 10：法师学者专精（受 pool 限制的职业专精）──────────────────────────

section('法师学者专精（pool 约束由 UI 层保障，聚合层信任存储数据）')
{
  const char = makeChar({
    level: 2,
    class: { id: 'wizard', level: 2, choices: {
      skills: ['奥秘', '历史'],
      'expertise-wizard-2': ['奥秘'],
    } },
  })
  const wizardClass = {
    progression: [
      { level: 1, choices: [{ kind: 'skillProficiency', id: 'skills' }] },
      { level: 2, choices: [{ kind: 'expertise', id: 'expertise-wizard-2', count: 1, pool: ['奥秘', '历史', '自然', '宗教'] }] },
    ],
  }
  const map = getSkillMap(char, { selectedClass: wizardClass })
  assert(skill(map, '奥秘').expert === true, '奥秘 学者专精 = true')
  assert(skill(map, '奥秘').multiplier === 2, '奥秘 multiplier = 2')
  assert(skill(map, '历史').expert === false, '历史 未选专精 = false')
}

// ── 汇总 ─────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`)
console.log(`测试结果：${passed} 通过 / ${failed} 失败`)
if (failed > 0) {
  process.exit(1)
}
