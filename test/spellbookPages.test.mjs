/**
 * 轻量 Node 测试：computeFlipPages
 * 运行：node test/spellbookPages.test.mjs
 */
import { computeFlipPages } from '../src/composables/spellbookPages.js'

let failed = 0
function assert(cond, label) {
  if (cond) { console.log('  ✓', label) }
  else { failed++; console.error('  ✗', label) }
}

// 有戏法 + 1环法术位 + 3环已准备法术 → [0,1,3]
assert(
  JSON.stringify(computeFlipPages({
    hasCantrips: true,
    slotsByLevel: { 1: 2, 2: 0 },
    preparedCountByLevel: { 3: 1 },
  })) === JSON.stringify([0, 1, 3]),
  '戏法+1环位+3环已准备 → [0,1,3]'
)

// 无戏法 → 不含 0
assert(
  JSON.stringify(computeFlipPages({
    hasCantrips: false,
    slotsByLevel: { 1: 2 },
    preparedCountByLevel: {},
  })) === JSON.stringify([1]),
  '无戏法 → 不含戏法页'
)

// 全空 → 至少返回 [0]（兜底，避免空书）
assert(
  JSON.stringify(computeFlipPages({
    hasCantrips: false,
    slotsByLevel: {},
    preparedCountByLevel: {},
  })) === JSON.stringify([0]),
  '全空 → 兜底 [0]'
)

// 某环只有法术位没准备法术 → 仍成页
assert(
  JSON.stringify(computeFlipPages({
    hasCantrips: false,
    slotsByLevel: { 5: 1 },
    preparedCountByLevel: {},
  })) === JSON.stringify([5]),
  '只有法术位也成页'
)

if (failed) { console.error(`\n${failed} 个断言失败`); process.exit(1) }
console.log('\n全部通过')
