/**
 * 轻量 Node 测试：buildStandardProgression + applyClassOverrides
 * 运行：node test/progression.test.mjs
 */

// ── 内联 buildStandardProgression ────────────────────────────────────────────

function buildStandardProgression(classDef) {
  const subclassLevel = classDef.subclassLevel ?? 3
  const featLevels = [4, 8, 12, 16, 19]
  const entries = [
    { level: 1, choices: [{ id: 'skills', kind: 'skillProficiency', source: 'classSkillChoices' }] },
    { level: subclassLevel, choices: [{ id: 'subclass', kind: 'subclass' }] },
    ...featLevels.map(lv => ({ level: lv, choices: [{ id: `feat-${lv}`, kind: 'generalFeat', minLevel: lv }] })),
  ]
  return entries.filter((e, i, arr) =>
    arr.findIndex(x => x.level === e.level) === i
  )
}

// 模拟 applyClassOverrides 的核心逻辑（测试 progression 补全部分）
function mergeClassOverride(base, override) {
  const merged = { ...base, ...override }
  if (!merged.progression?.length && !base.progression?.length) {
    merged.progression = buildStandardProgression(merged)
  }
  return merged
}

// ── 测试工具 ─────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++ }
  else { console.error(`  ✗ ${label}`); failed++ }
}
function section(title) { console.log(`\n── ${title}`) }

// ── 测试 1：标准 progression 结构 ────────────────────────────────────────────
section('buildStandardProgression：默认结构')
{
  const prog = buildStandardProgression({ subclassLevel: 3 })
  assert(prog.some(e => e.level === 1 && e.choices.some(c => c.kind === 'skillProficiency')), '1级有技能熟练')
  assert(prog.some(e => e.level === 3 && e.choices.some(c => c.kind === 'subclass')), '3级有子职业')
  assert(prog.some(e => e.level === 4 && e.choices.some(c => c.kind === 'generalFeat')), '4级有专长')
  assert(prog.some(e => e.level === 8 && e.choices.some(c => c.kind === 'generalFeat')), '8级有专长')
  assert(prog.some(e => e.level === 12 && e.choices.some(c => c.kind === 'generalFeat')), '12级有专长')
  assert(prog.some(e => e.level === 16 && e.choices.some(c => c.kind === 'generalFeat')), '16级有专长')
  assert(prog.some(e => e.level === 19 && e.choices.some(c => c.kind === 'generalFeat')), '19级有专长')
}

// ── 测试 2：自定义 subclassLevel ─────────────────────────────────────────────
section('buildStandardProgression：自定义 subclassLevel = 2')
{
  const prog = buildStandardProgression({ subclassLevel: 2 })
  assert(prog.some(e => e.level === 2 && e.choices.some(c => c.kind === 'subclass')), '2级有子职业')
  // level 1 应有技能
  assert(prog.some(e => e.level === 1 && e.choices.some(c => c.kind === 'skillProficiency')), '1级有技能')
}

// ── 测试 3：subclassLevel = 1 时不重复 ───────────────────────────────────────
section('buildStandardProgression：subclassLevel = 1 不产生重复 level 1 条目')
{
  const prog = buildStandardProgression({ subclassLevel: 1 })
  const level1entries = prog.filter(e => e.level === 1)
  // 过滤后只有一个，包含 subclass（因为 1 级排序靠前，技能被去重过滤掉了）
  // 实际上 subclass 在 entries 中排第2，1级技能排第1，去重保留第一个（技能）
  assert(level1entries.length === 1, 'level 1 只有一个条目（去重生效）')
}

// ── 测试 4：applyClassOverrides 对无 progression 的新职业补全 ─────────────────
section('applyClassOverrides：DM 新建职业自动补 progression')
{
  const newClass = { id: 'custom-fighter', name: '自定义战士', subclassLevel: 3, skillChoices: { count: 2, options: [] } }
  const merged = mergeClassOverride({}, newClass)
  assert(Array.isArray(merged.progression) && merged.progression.length > 0, '新职业获得 progression')
  assert(merged.progression.some(e => e.level === 4), '含 4 级专长槽')
}

// ── 测试 5：已有 progression 的职业不被覆盖 ──────────────────────────────────
section('applyClassOverrides：内置职业已有 progression 不被覆盖')
{
  const builtinBase = {
    id: 'wizard',
    progression: [
      { level: 1, choices: [{ id: 'skills', kind: 'skillProficiency' }] },
      { level: 2, choices: [{ id: 'expertise-wizard-2', kind: 'expertise' }] },
    ],
  }
  const override = { id: 'wizard', name: '法师（覆盖名称）' }
  const merged = mergeClassOverride(builtinBase, override)
  // base.progression 已有，不应被 buildStandardProgression 覆盖
  assert(merged.progression.length === 2, '内置 progression 被保留（未被标准 progression 覆盖）')
  assert(merged.progression.some(e => e.choices.some(c => c.kind === 'expertise')), '内置专精条目被保留')
}

// ── 测试 6：DM 编辑内置职业但不提供 progression ──────────────────────────────
section('applyClassOverrides：DM 编辑内置职业（base 有 progression，override 无）不补全')
{
  const builtinBase = {
    id: 'druid',
    progression: [
      { level: 1, choices: [{ id: 'skills', kind: 'skillProficiency' }] },
      { level: 4, choices: [{ id: 'feat-4', kind: 'generalFeat', minLevel: 4 }] },
    ],
  }
  // DM 只改了名称，没传 progression
  const override = { id: 'druid', name: '德鲁伊（改名）' }
  const merged = mergeClassOverride(builtinBase, override)
  assert(merged.progression.length === 2, 'DM 改名不影响内置 progression')
}

// ── 汇总 ─────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`测试结果：${passed} 通过 / ${failed} 失败`)
if (failed > 0) process.exit(1)
