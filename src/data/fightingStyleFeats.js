export const fightingStyleFeats = [
  {
    id: 'archery',
    name: '箭术',
    nameEn: 'Archery',
    desc: '你使用远程武器进行的攻击检定获得 +2 加值。',
  },
  {
    id: 'blind-fighting',
    name: '盲斗',
    nameEn: 'Blind Fighting',
    desc: '你获得 10 尺距离的盲视。',
  },
  {
    id: 'defense',
    name: '防御',
    nameEn: 'Defense',
    desc: '当你着装轻甲、中甲或重甲时，你的护甲等级获得 +1 加值。',
  },
  {
    id: 'dueling',
    name: '对决',
    nameEn: 'Dueling',
    desc: '当你单手持用一把近战武器，且也没有持用其他武器时，你使用那把武器进行的伤害掷骰获得 +2 加值。',
  },
  {
    id: 'great-weapon-fighting',
    name: '巨武器战斗',
    nameEn: 'Great Weapon Fighting',
    desc: '当你发动了一次攻击并为其造成的伤害进行掷骰时，如果这次攻击是由一把双手持用的近战武器发动的，你可以将伤害骰中的任何 1 和 2 都视作 3。但这把武器必须拥有双手或多用词条才能享受这个增益。',
  },
  {
    id: 'interception',
    name: '拦截',
    nameEn: 'Interception',
    desc: '当一个你能看见的生物通过攻击检定命中了一个位于你 5 尺内的另一个生物，你可以执行一个反应，将本次攻击对那个目标的伤害降低 1d10 + 你的熟练调整值。你必须正持用着一面盾牌或者一把简易或军用武器才能使用这个反应。',
  },
  {
    id: 'protection',
    name: '守护',
    nameEn: 'Protection',
    desc: '当一个你能看见的生物攻击了一个位于你 5 尺内的除你以外的生物，如果你整持用这一面盾牌，你可以执行一个反应，将你的盾牌挡在其面前。你对触发了这一行动的攻击检定施加劣势，并且只要你还处于守护的目标 5 尺内，此后对该目标进行的所有其他攻击检定都将具有劣势，直到你的下一回合开始为止。',
  },
  {
    id: 'thrown-weapon-fighting',
    name: '投掷武器战斗',
    nameEn: 'Thrown Weapon Fighting',
    desc: '当你使用一把具有投掷属性的武器进行远程攻击检定并命中时，你在该次伤害掷骰中获得 +2 加值。',
  },
  {
    id: 'two-weapon-fighting',
    name: '双武器战斗',
    nameEn: 'Two-Weapon Fighting',
    desc: '当你因使用具有轻型词条的武器而得以发动追加攻击时，如果这次追加攻击的伤害并未已经加入你的属性调整值，你可以加入你的属性调整值。',
  },
  {
    id: 'unarmed-fighting',
    name: '徒手战斗',
    nameEn: 'Unarmed Fighting',
    desc: '当你使用徒手打击命中并造成了伤害时，你可以造成 1d6 + 你的力量调整值的钝击伤害，而不是原本的徒手打击伤害。如果你进行攻击检定时并没有持用任何武器或者盾牌，这个 d6 改为 d8。\n\n每次在你的回合开始时，你还可以对一个被你擒抱的生物造成 1d4 点钝击伤害。',
  },
]

export function findFightingStyleFeatById(id) {
  return fightingStyleFeats.find(f => f.id === id) ?? null
}
