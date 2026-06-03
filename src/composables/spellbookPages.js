/**
 * 计算法术书的"页集快照"——哪些环阶成为一页。
 * 纯函数，无副作用，便于单测。
 *
 * 规则（等价于旧 availableTabs）：
 *  - 若有已准备戏法 → 包含戏法页 0
 *  - 1~9 环中，任一环有法术位总数 > 0 或有已准备法术 → 该环成页
 *  - 全空兜底返回 [0]，避免空书导致 StPageFlip 加载 0 页报错
 *
 * @param {object} args
 * @param {boolean} args.hasCantrips           是否有已准备戏法
 * @param {Object<number,number>} args.slotsByLevel          各环法术位总数 { 1: 4, 2: 3, ... }
 * @param {Object<number,number>} args.preparedCountByLevel  各环已准备法术数 { 3: 2, ... }
 * @returns {number[]} 升序页码数组，如 [0,1,3]
 */
export function computeFlipPages({ hasCantrips, slotsByLevel = {}, preparedCountByLevel = {} }) {
  const pages = []
  if (hasCantrips) pages.push(0)
  for (let level = 1; level <= 9; level += 1) {
    const slotTotal = Number(slotsByLevel[level]) || 0
    const prepared = Number(preparedCountByLevel[level]) || 0
    if (slotTotal > 0 || prepared > 0) pages.push(level)
  }
  return pages.length ? pages : [0]
}
