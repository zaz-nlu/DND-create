export const ABILITY_IDS = ['力量', '敏捷', '体质', '智力', '感知', '魅力']

export const ABILITY_EN = {
  '力量': 'STR', '敏捷': 'DEX', '体质': 'CON',
  '智力': 'INT', '感知': 'WIS', '魅力': 'CHA',
}

// 27点加点费用表：score → 累计花费
export const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
export const POINT_TOTAL = 27
export const PB_MIN = 8
export const PB_MAX = 15

export function abilityMod(score) {
  return Math.floor(((score ?? 8) - 10) / 2)
}

export function modStr(score) {
  const m = abilityMod(score)
  return (m >= 0 ? '+' : '') + m
}

// 计算27点加点已花费总点数
export function pointsSpent(scores) {
  return ABILITY_IDS.reduce((sum, id) => {
    const s = Math.min(Math.max(scores[id] ?? PB_MIN, PB_MIN), PB_MAX)
    return sum + (POINT_COST[s] ?? 0)
  }, 0)
}

// 4d6 去掉最低值
export function roll4d6DropLowest() {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
  dice.sort((a, b) => a - b)
  const dropped = dice[0]
  const kept = dice.slice(1)
  return { total: kept.reduce((s, d) => s + d, 0), dice, dropped, kept }
}

// 一次生成全部6组
export function rollAllSix() {
  return Array.from({ length: 6 }, () => roll4d6DropLowest())
}
