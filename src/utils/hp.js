// 将 'd8' 解析为 8
export function parseDie(hitDie) {
  const match = String(hitDie).match(/d(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 6
}

// 体质调整值
export function conMod(conScore) {
  return Math.floor(((Number.isFinite(conScore) ? conScore : 10) - 10) / 2)
}

// 固定法 HP
// 1级取骰子满值，之后每级 = dieMax/2 + 1（向下取整）
// extraFlat：来自专长等的固定附加值（如健壮 = level×2）
export function calcHpStandard(hitDie, level, conScore, extraFlat = 0) {
  const die = parseDie(hitDie)
  const mod = conMod(conScore)
  const perLevel = Math.floor(die / 2) + 1
  return die + mod + (level - 1) * (perLevel + mod) + extraFlat
}

// 随机法 HP：传入每级的骰点数组，长度应等于 level
export function calcHpFromRolls(rolls, level, conScore, extraFlat = 0) {
  const mod = conMod(conScore)
  const filled = Array.from({ length: level }, (_, i) => rolls[i] ?? 0)
  return filled.reduce((sum, r) => sum + r, 0) + level * mod + extraFlat
}

// 随机骰一次（1 ~ dieMax）
export function rollDie(hitDie) {
  const max = parseDie(hitDie)
  return Math.floor(Math.random() * max) + 1
}
