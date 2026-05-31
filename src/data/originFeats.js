export const originFeats = [
  {
    id: 'alert',
    name: '警戒',
    nameEn: 'Alert',
    category: '起源专长',
    summary: '更快进入战斗节奏，并能与盟友交换先攻位置。',
    benefits: [
      {
        name: '先攻熟练',
        nameEn: 'Initiative Proficiency',
        desc: '当你投掷先攻时，可以将熟练加值加入结果。',
      },
      {
        name: '先攻互换',
        nameEn: 'Initiative Swap',
        desc: '掷完先攻后，你可以立即与同一场战斗中一名自愿盟友交换先攻；若任一方失能，则不能交换。',
      },
    ],
  },
  {
    id: 'crafter',
    name: '工匠',
    nameEn: 'Crafter',
    category: '起源专长',
    summary: '获得多项工匠工具熟练，并能在休息后临时制作实用装备。',
    benefits: [
      {
        name: '工具熟练',
        nameEn: 'Tool Proficiency',
        desc: '从快速制作表中选择三项不同的工匠工具，获得其熟练。',
      },
      {
        name: '折扣',
        nameEn: 'Discount',
        desc: '购买非魔法物品时获得 20% 折扣。',
      },
      {
        name: '快速制作',
        nameEn: 'Fast Crafting',
        desc: '完成长休时，你可以用对应工具和熟练制作一件快速制作装备；该物品会持续到你下次完成长休。',
      },
    ],
    tableTitle: '快速制作',
    table: [
      { tool: '木匠工具', toolEn: "Carpenter's Tools", gear: '梯子，火把' },
      { tool: '皮匠工具', toolEn: "Leatherworker's Tools", gear: '小箱子，小包' },
      { tool: '石匠工具', toolEn: "Mason's Tools", gear: '滑轮组' },
      { tool: '陶匠工具', toolEn: "Potter's Tools", gear: '壶，油灯' },
      { tool: '铁匠工具', toolEn: "Smith's Tools", gear: '滚珠，桶，铁蒺藜，爪钩，铁壶' },
      { tool: '修补工具', toolEn: "Tinker's Tools", gear: '铃铛，铲子，火绒盒' },
      { tool: '织布工具', toolEn: "Weaver's Tools", gear: '篮子，绳索，捕网，帐篷' },
      { tool: '木雕工具', toolEn: "Woodcarver's Tools", gear: '短棒，巨棒，长棍' },
    ],
  },
  {
    id: 'healer',
    name: '医疗师',
    nameEn: 'Healer',
    category: '起源专长',
    summary: '用医疗包在战斗间隙救人，并让治疗骰的低点更稳定。',
    benefits: [
      {
        name: '战地医师',
        nameEn: 'Battle Medic',
        desc: '若你有医疗包，可以用动作消耗一次使用次数护理 5 尺内生物；该生物消耗一个生命骰，由你掷骰并恢复骰值加熟练加值的生命值。',
      },
      {
        name: '治疗重掷',
        nameEn: 'Healing Rerolls',
        desc: '当你为法术或本专长的战地医师掷治疗骰时，若掷出 1，可以重掷一次，但必须使用新结果。',
      },
    ],
  },
  {
    id: 'lucky',
    name: '幸运',
    nameEn: 'Lucky',
    category: '起源专长',
    summary: '获得与熟练加值相等的幸运点，用来影响 d20 检定。',
    benefits: [
      {
        name: '幸运点',
        nameEn: 'Lucky Point',
        desc: '你的幸运点数量等同于熟练加值；完成长休后恢复所有已消耗的幸运点。',
      },
      {
        name: '优势',
        nameEn: 'Advantage',
        desc: '当你为一次 d20 检定投掷 d20 时，可以花费 1 点幸运点，使该检定具有优势。',
      },
      {
        name: '劣势',
        nameEn: 'Disadvantage',
        desc: '当一个生物为对你发动的攻击检定投掷 d20 时，可以花费 1 点幸运点，使该检定具有劣势。',
      },
    ],
  },
  {
    id: 'magic-initiate',
    name: '魔法学徒',
    nameEn: 'Magic Initiate',
    category: '起源专长',
    summary: '从牧师、德鲁伊或法师法术列表中习得戏法和一个一环法术。',
    repeatable: true,
    benefits: [
      {
        name: '两道戏法',
        nameEn: 'Two Cantrips',
        desc: '从牧师、德鲁伊或法师法术列表中选择两道戏法；施法关键属性在选择本专长时从智力、感知或魅力中确定。',
      },
      {
        name: '一环法术',
        nameEn: 'Level 1 Spell',
        desc: '选择一道同法术列表的一环法术并始终准备。你可以不消耗法术位施展一次，完成长休后恢复，也可以用已有法术位施展。',
      },
      {
        name: '改变法术',
        nameEn: 'Spell Change',
        desc: '每当你获得一级新等级，可以将通过本专长习得的一道法术替换为同法术列表中同等级的另一道法术。',
      },
      {
        name: '复选',
        nameEn: 'Repeatable',
        desc: '可以多次选择本专长，但每次必须选择不同的法术列表。',
      },
    ],
  },
  {
    id: 'musician',
    name: '音乐家',
    nameEn: 'Musician',
    category: '起源专长',
    summary: '获得乐器熟练，并在休息后用演奏给予盟友英雄激励。',
    benefits: [
      {
        name: '乐器训练',
        nameEn: 'Instrument Training',
        desc: '自选三项乐器，获得其熟练。',
      },
      {
        name: '鼓舞之歌',
        nameEn: 'Encouraging Song',
        desc: '完成短休或长休后，你可以用熟练乐器演奏，给予听到乐歌的盟友英雄激励；影响盟友数量最多等于熟练加值。',
      },
    ],
  },
  {
    id: 'savage-attacker',
    name: '凶蛮打手',
    nameEn: 'Savage Attacker',
    category: '起源专长',
    summary: '每回合一次，让武器伤害骰更可靠。',
    benefits: [
      {
        name: '凶蛮打击',
        nameEn: 'Savage Attacker',
        desc: '每回合一次，当你使用武器命中目标时，可以掷两次武器伤害骰，并自选其中一次应用。',
      },
    ],
  },
  {
    id: 'skilled',
    name: '熟习',
    nameEn: 'Skilled',
    category: '起源专长',
    summary: '获得三项自选技能或工具熟练。',
    repeatable: true,
    benefits: [
      {
        name: '额外熟练',
        nameEn: 'Additional Proficiencies',
        desc: '获得三项自选的技能或工具熟练。',
      },
      {
        name: '复选',
        nameEn: 'Repeatable',
        desc: '可以多次选择本专长。',
      },
    ],
  },
  {
    id: 'tavern-brawler',
    name: '酒馆斗殴者',
    nameEn: 'Tavern Brawler',
    category: '起源专长',
    summary: '强化徒手攻击、临时武器和近身推离能力。',
    benefits: [
      {
        name: '强化徒手打击',
        nameEn: 'Enhanced Unarmed Strike',
        desc: '当你使用徒手攻击命中并造成伤害时，可以造成 1d4 加力量调整值的钝击伤害。',
      },
      {
        name: '伤害重掷',
        nameEn: 'Damage Rerolls',
        desc: '当你为徒手攻击掷伤害骰时，若掷出 1，可以重掷一次，但必须使用新结果。',
      },
      {
        name: '临时武器专家',
        nameEn: 'Improvised Weaponry',
        desc: '你拥有临时武器熟练。',
      },
      {
        name: '推离',
        nameEn: 'Push',
        desc: '在你的回合内，如果你用攻击动作中的一次徒手打击命中一个生物，可以同时造成伤害并把目标推离 5 尺；每回合一次。',
      },
    ],
  },
  {
    id: 'tough',
    name: '健壮',
    nameEn: 'Tough',
    category: '起源专长',
    summary: '立刻提高生命值上限，并在之后升级时继续额外成长。',
    benefits: [
      {
        name: '坚韧体魄',
        nameEn: 'Tough',
        desc: '获得该专长时，生命值上限增加当前角色等级两倍；随后每次升级时，生命值上限额外加 2。',
      },
    ],
  },
]

export function normalizeOriginFeatName(nameEn = '') {
  return String(nameEn)
    .replace(/\s*\(.+\)\s*$/, '')
    .trim()
    .toLowerCase()
}

export function findOriginFeatByNameEn(nameEn) {
  const key = normalizeOriginFeatName(nameEn)
  return originFeats.find(feat => feat.nameEn.toLowerCase() === key) ?? null
}

export function findOriginFeatById(id) {
  return originFeats.find(feat => feat.id === id) ?? null
}
