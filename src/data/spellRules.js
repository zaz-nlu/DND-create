export const spellPreparationRules = [
  { classId: 'bard', className: '吟游诗人', timing: '升级时', amount: '一道' },
  { classId: 'cleric', className: '牧师', timing: '完成一次长休', amount: '任意' },
  { classId: 'druid', className: '德鲁伊', timing: '完成一次长休', amount: '任意' },
  { classId: 'paladin', className: '圣武士', timing: '完成一次长休', amount: '一道' },
  { classId: 'ranger', className: '游侠', timing: '完成一次长休', amount: '一道' },
  { classId: 'sorcerer', className: '术士', timing: '升级时', amount: '一道' },
  { classId: 'warlock', className: '魔契师', timing: '升级时', amount: '一道' },
  { classId: 'wizard', className: '法师', timing: '完成一次长休', amount: '任意' },
]

export const magicSchools = [
  { name: '防护', nameEn: 'Abjuration', effect: '抵御或逆转有害效应' },
  { name: '咒法', nameEn: 'Conjuration', effect: '传送生物或物件' },
  { name: '预言', nameEn: 'Divination', effect: '揭露资讯' },
  { name: '惑控', nameEn: 'Enchantment', effect: '影响心智' },
  { name: '塑能', nameEn: 'Evocation', effect: '引导能量创造效应，通常偏破坏性' },
  { name: '幻术', nameEn: 'Illusion', effect: '欺骗感官与心灵' },
  { name: '死灵', nameEn: 'Necromancy', effect: '操纵生与死' },
  { name: '变化', nameEn: 'Transmutation', effect: '转变生物或物件' },
]

export const spellRuleSections = [
  {
    id: 'gaining',
    title: '获得与准备法术',
    points: [
      '要施展一道法术，你必须准备了它，或依靠能施展该法术的魔法物品。',
      '始终准备的法术不会计入你的准备法术数量。',
      '可施法怪物通常不会更改准备法术列表，但 DM 可以自行调整。',
    ],
  },
  {
    id: 'slots',
    title: '法术位与升环',
    points: [
      '施展 1 环或更高法术通常需要消耗相应环阶或更高环阶的法术位。',
      '已消耗的法术位通常在完成一次长休后恢复；魔契师的契约魔法按职业特性处理。',
      '用更高环阶法术位施展低环法术时，该法术视为以更高环阶施展；是否增强取决于法术描述。',
      '每个回合中，你通过施展法术的方式至多只能消耗一个法术位。',
    ],
  },
  {
    id: 'free-casting',
    title: '无需法术位',
    points: [
      '戏法无需消耗法术位。',
      '带有 R 标签的法术可作为仪式施展，仪式版本通常多花 10 分钟且不消耗法术位；施法者仍必须准备该法术。',
      '某些职业特性、怪物能力或魔法物品可以让你无需法术位施展法术。',
    ],
  },
  {
    id: 'casting',
    title: '施法条件',
    points: [
      '施法时间可能是魔法动作、附赠动作、反应，或更长时间。',
      '长时间施法期间，施法者通常必须每回合执行魔法动作并保持专注。',
      '穿甲施法时，必须具备对应护甲受训，否则无法施展法术。',
      '法术可能需要言语 V、姿势 S、材料 M 成分；材料可被材料包或合适法器替代，除非材料有价格或会被消耗。',
    ],
  },
  {
    id: 'targets',
    title: '目标与效果',
    points: [
      '指定目标时，施法者与目标之间必须畅通无阻，目标不能处于全身掩护之后。',
      '如果法术目标是由你指定的生物，通常可以选择自己，除非法术另有说明。',
      '无效目标不会受到影响；若法术消耗法术位，法术位仍会被消耗。',
      '相同法术的多次效果不会叠加，重叠期间只保留其中最强者。',
    ],
  },
  {
    id: 'checks',
    title: '豁免与攻击',
    points: [
      '法术豁免 DC = 8 + 施法属性调整值 + 熟练加值。',
      '法术攻击调整 = 施法属性调整值 + 熟练加值。',
      '可以通过可见效果辨识持续中的非立即法术，通常需要研究动作并通过 DC15 的智力（奥秘）检定。',
    ],
  },
]
