/**
 * 轻量 Node 测试：职业技能候选池过滤逻辑（FeatsView classSkillOptions）
 * 运行：node test/skillCandidatePool.test.mjs
 *
 * 验证客户需求：
 *  - 已从其他来源（背景/种族单项/种族数组/Skilled/专长授予）熟练的技能
 *    不应出现在职业技能可选列表中（避免"重复熟练 / 误以为双熟练=专精"）。
 */

// ── 内联 getSkillMap（与 skillProficiencies.js 同步，含新格式数组）────────────

const SKILL_ABILITY = {
  '运动': '力量',
  '体操': '敏捷', '巧手': '敏捷', '隐匿': '敏捷',
  '奥秘': '智力', '历史': '智力', '调查': '智力', '自然': '智力', '宗教': '智力',
  '驯兽': '感知', '洞悉': '感知', '医学': '感知', '察觉': '感知', '求生': '感知',
  '欺瞒': '魅力', '威吓': '魅力', '表演': '魅力', '游说': '魅力',
}
const DND_SKILLS = Object.keys(SKILL_ABILITY)

function getSkillMap(character, { selectedClass, selectedBackground } = {}) {
  const proficientSet = new Set()
  const expertSet = new Set()

  // 1. 背景
  const bgSkills = selectedBackground?.skills ?? []
  for (const s of bgSkills) proficientSet.add(s)

  // 2. 职业技能选择
  const classSkills = character.class?.choices?.skills
  if (Array.isArray(classSkills)) for (const s of classSkills) proficientSet.add(s)

  // 3. 种族技能：新格式数组 skillProficiencies 或旧格式字符串 skillProficiency
  const raceSkillArr = character.race?.choices?.skillProficiencies
  if (Array.isArray(raceSkillArr)) {
    for (const s of raceSkillArr) if (s) proficientSet.add(s)
  } else {
    const raceSkill = character.race?.choices?.skillProficiency
    if (raceSkill) proficientSet.add(raceSkill)
  }

  // 4. Skilled 起源专长
  const skilledSkills = character.race?.choices?.skilledSkills
  if (Array.isArray(skilledSkills)) for (const s of skilledSkills) proficientSet.add(s)

  // 5 & 6. 通用专长授予
  const classChoices = character.class?.choices ?? {}
  for (const [key, value] of Object.entries(classChoices)) {
    if (key.endsWith('_skillProf') && Array.isArray(value)) for (const s of value) proficientSet.add(s)
    if (key.endsWith('_expertise') && Array.isArray(value)) for (const s of value) expertSet.add(s)
  }

  // 7. 职业 progression 专精
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

  // 8. 旧格式兼容
  const legacyMap = character.skills ?? {}
  for (const [skill, value] of Object.entries(legacyMap)) {
    if (value === 'proficient') proficientSet.add(skill)
    if (value === 'expert') { proficientSet.add(skill); expertSet.add(skill) }
  }

  return DND_SKILLS.map(skill => {
    const prof = proficientSet.has(skill)
    const exp  = expertSet.has(skill) && prof
    return { skill, ability: SKILL_ABILITY[skill], proficient: prof, expert: exp, multiplier: exp ? 2 : prof ? 1 : 0 }
  })
}

// ── 内联候选池逻辑（FeatsView classSkillOptions 修复后版本）──────────────────

// 已通过"职业选择以外的来源"熟练的技能集合
function skillsProficientElsewhere(character, { selectedClass, selectedBackground }) {
  const fromClassChoice = new Set(
    Array.isArray(character.class?.choices?.skills) ? character.class.choices.skills : []
  )
  const map = getSkillMap(character, { selectedClass, selectedBackground })
  return new Set(
    map.filter(s => s.proficient && !fromClassChoice.has(s.skill)).map(s => s.skill)
  )
}

// 职业技能可选列表
function classSkillOptions(character, { selectedClass, selectedBackground }) {
  const options = selectedClass?.skillChoices?.options ?? []
  const exclude = skillsProficientElsewhere(character, { selectedClass, selectedBackground })
  return options.filter(skill => !exclude.has(skill))
}

// ── 测试工具 ─────────────────────────────────────────────────────────────────

let passed = 0, failed = 0
function assert(cond, label) {
  if (cond) { console.log(`  ✓ ${label}`); passed++ }
  else { console.error(`  ✗ ${label}`); failed++ }
}
function section(t) { console.log(`\n── ${t}`) }

function makeChar(overrides = {}) {
  return {
    level: 1,
    race: { id: 'elf', choices: {} },
    background: { id: 'sage', choices: {} },
    class: { id: 'rogue', level: 1, choices: {} },
    skills: {},
    ...overrides,
  }
}

// 盗贼职业技能列表（含若干会与其他来源冲突的技能）
const ROGUE = {
  id: 'rogue',
  skillChoices: { count: 4, options: ['体操','运动','欺瞒','洞悉','威吓','调查','察觉','巧手','表演','游说','隐匿'] },
}

// ── 测试 1：背景技能从职业候选池移除 ─────────────────────────────────────────

section('背景技能不出现在职业候选池')
{
  const char = makeChar()
  const bg = { skills: ['洞悉', '察觉'] }
  const opts = classSkillOptions(char, { selectedClass: ROGUE, selectedBackground: bg })
  assert(!opts.includes('洞悉'), '洞悉（背景）已从职业候选池移除')
  assert(!opts.includes('察觉'), '察觉（背景）已从职业候选池移除')
  assert(opts.includes('隐匿'), '隐匿（未冲突）仍可选')
}

// ── 测试 2：种族单项技能（旧格式）从候选池移除 ──────────────────────────────

section('种族单项技能（旧格式 skillProficiency）移除')
{
  const char = makeChar({ race: { id: 'half-elf', choices: { skillProficiency: '游说' } } })
  const opts = classSkillOptions(char, { selectedClass: ROGUE, selectedBackground: { skills: [] } })
  assert(!opts.includes('游说'), '游说（种族旧格式）已移除')
}

// ── 测试 3：种族数组技能（新格式）从候选池移除 ★核心修复点 ──────────────────

section('种族数组技能（新格式 skillProficiencies）移除 ★')
{
  // 精灵新格式：keen-senses 选了「洞悉」
  const char = makeChar({ race: { id: 'elf', choices: { skillProficiencies: ['洞悉'] } } })
  const opts = classSkillOptions(char, { selectedClass: ROGUE, selectedBackground: { skills: [] } })
  assert(!opts.includes('洞悉'), '洞悉（种族新格式数组）已移除 — 修复前会漏掉')
}

// ── 测试 4：Skilled 起源专长的 3 项移除 ──────────────────────────────────────

section('Skilled 起源专长技能移除')
{
  const char = makeChar({ race: { id: 'human', choices: { skilledSkills: ['威吓','欺瞒','表演'] } } })
  const opts = classSkillOptions(char, { selectedClass: ROGUE, selectedBackground: { skills: [] } })
  assert(!opts.includes('威吓'), '威吓（Skilled）已移除')
  assert(!opts.includes('欺瞒'), '欺瞒（Skilled）已移除')
  assert(!opts.includes('表演'), '表演（Skilled）已移除')
}

// ── 测试 5：通用专长授予的熟练移除 ───────────────────────────────────────────

section('通用专长授予技能熟练移除')
{
  const char = makeChar({
    level: 4,
    class: { id: 'rogue', level: 4, choices: {
      'feat-4': 'skill-expert',
      'feat-4_skillProf': ['调查'],
    } },
  })
  const opts = classSkillOptions(char, { selectedClass: ROGUE, selectedBackground: { skills: [] } })
  assert(!opts.includes('调查'), '调查（专长授予）已移除')
}

// ── 测试 6：玩家本槽已选的职业技能仍保留（可取消）──────────────────────────

section('本槽已选职业技能仍保留在列表（用于显示选中态/取消）')
{
  const char = makeChar({ class: { id: 'rogue', level: 1, choices: { skills: ['隐匿','巧手'] } } })
  const opts = classSkillOptions(char, { selectedClass: ROGUE, selectedBackground: { skills: [] } })
  assert(opts.includes('隐匿'), '隐匿（本槽自己选的）仍在列表')
  assert(opts.includes('巧手'), '巧手（本槽自己选的）仍在列表')
}

// ── 测试 7：综合 — 多来源同时排除 ───────────────────────────────────────────

section('综合：背景+种族数组+Skilled 多来源同时排除')
{
  const char = makeChar({
    race: { id: 'elf', choices: { skillProficiencies: ['察觉'], skilledSkills: [] } },
  })
  const bg = { skills: ['洞悉', '历史'] }
  const opts = classSkillOptions(char, { selectedClass: ROGUE, selectedBackground: bg })
  assert(!opts.includes('察觉'), '察觉（种族数组）已排除')
  assert(!opts.includes('洞悉'), '洞悉（背景）已排除')
  // 历史不在盗贼列表里，本来就不会出现
  assert(opts.includes('体操'), '体操（无冲突）仍可选')
  assert(opts.includes('运动'), '运动（无冲突）仍可选')
}

// ── 测试 8：核心规则 — 两个熟练来源不产生专精 ───────────────────────────────

section('核心规则：同技能两个熟练来源 ≠ 专精')
{
  const char = makeChar({
    race: { id: 'elf', choices: { skillProficiencies: ['历史'] } },
    class: { id: 'wizard', level: 1, choices: { skills: ['历史'] } },
  })
  const bg = { skills: ['历史'] }
  const map = getSkillMap(char, { selectedBackground: bg })
  const hist = map.find(s => s.skill === '历史')
  assert(hist.proficient === true, '历史 熟练 = true')
  assert(hist.expert === false, '历史 三来源熟练 仍非专精')
  assert(hist.multiplier === 1, '历史 multiplier = 1（不叠加成2）')
}

// ── 汇总 ─────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`)
console.log(`测试结果：${passed} 通过 / ${failed} 失败`)
if (failed > 0) process.exit(1)
