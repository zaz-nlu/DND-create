export const toolCategories = [
  { id: 'artisan', name: "Artisan's Tools", nameZh: '工匠工具' },
  { id: 'other', name: 'Other Tools', nameZh: '其他工具' },
  { id: 'gaming', name: 'Gaming Sets', nameZh: '赌具' },
  { id: 'instrument', name: 'Musical Instruments', nameZh: '乐器' },
]

export const toolRules = [
  {
    id: 'tool-proficiency',
    title: 'Tool Proficiency',
    titleZh: '工具熟练',
    desc: 'If you have proficiency with a tool, add your proficiency bonus to ability checks using that tool. If you also have proficiency in the relevant skill, you have advantage on the check.',
  },
  {
    id: 'utilize',
    title: 'Utilize',
    titleZh: '利用',
    desc: 'When you take the Utilize action with a tool, choose one listed use and make the listed ability check.',
  },
  {
    id: 'craft',
    title: 'Craft',
    titleZh: '制造',
    desc: 'Tools with a craft list can be used to craft the listed items, subject to the crafting rules.',
  },
]

export const tools = [
  {
    id: 'alchemists-supplies',
    name: "Alchemist's Supplies",
    nameZh: '炼金工具',
    category: 'artisan',
    ability: 'intelligence',
    price: '50 GP',
    weight: 8,
    utilize: [
      { text: 'Identify a substance', textZh: '辨析一种物质', dc: 15 },
      { text: 'Start a fire', textZh: '生起一场火', dc: 15 },
    ],
    craft: ['Acid', "Alchemist's Fire", 'Component Pouch', 'Oil', 'Paper', 'Perfume'],
  },
  {
    id: 'brewers-supplies',
    name: "Brewer's Supplies",
    nameZh: '酿酒工具',
    category: 'artisan',
    ability: 'intelligence',
    price: '20 GP',
    weight: 9,
    utilize: [
      { text: 'Detect poisoned drink', textZh: '检测饮品是否下毒', dc: 15 },
      { text: 'Identify alcohol', textZh: '辨识酒精', dc: 10 },
    ],
    craft: ['Antitoxin'],
  },
  {
    id: 'calligraphers-supplies',
    name: "Calligrapher's Supplies",
    nameZh: '书法工具',
    category: 'artisan',
    ability: 'dexterity',
    price: '10 GP',
    weight: 5,
    utilize: [
      { text: 'Write in ornate script to prevent forgery', textZh: '以华丽字迹撰写文字防止造假', dc: 15 },
    ],
    craft: ['Ink', 'Spell Scroll'],
  },
  {
    id: 'carpenters-tools',
    name: "Carpenter's Tools",
    nameZh: '木匠工具',
    category: 'artisan',
    ability: 'strength',
    price: '8 GP',
    weight: 6,
    utilize: [
      { text: 'Seal or pry open a door or container', textZh: '封死或撬开一扇门或容器', dc: 20 },
    ],
    craft: ['Club', 'Greatclub', 'Quarterstaff', 'Barrel', 'Chest', 'Ladder', 'Pole', 'Portable Ram', 'Torch'],
  },
  {
    id: 'cartographers-tools',
    name: "Cartographer's Tools",
    nameZh: '制图工具',
    category: 'artisan',
    ability: 'wisdom',
    price: '15 GP',
    weight: 6,
    utilize: [
      { text: 'Map a small area', textZh: '为一小片区域绘制地图', dc: 15 },
    ],
    craft: ['Map'],
  },
  {
    id: 'cobblers-tools',
    name: "Cobbler's Tools",
    nameZh: '鞋匠工具',
    category: 'artisan',
    ability: 'dexterity',
    price: '5 GP',
    weight: 5,
    utilize: [
      { text: "Modify footwear to grant advantage on the wearer's next Dexterity (Acrobatics) check", textZh: '修改足部装备，使穿戴者下一次敏捷（特技）检定具有优势', dc: 10 },
    ],
    craft: ["Climber's Kit"],
  },
  {
    id: 'cooks-utensils',
    name: "Cook's Utensils",
    nameZh: '厨师工具',
    category: 'artisan',
    ability: 'wisdom',
    price: '1 GP',
    weight: 8,
    utilize: [
      { text: 'Improve food flavor', textZh: '改善食物风味', dc: 10 },
      { text: 'Check food for spoilage or poison', textZh: '检查食物是否腐坏或有毒', dc: 15 },
    ],
    craft: ['Rations'],
  },
  {
    id: 'glassblowers-tools',
    name: "Glassblower's Tools",
    nameZh: '玻璃匠工具',
    category: 'artisan',
    ability: 'intelligence',
    price: '30 GP',
    weight: 5,
    utilize: [
      { text: 'Identify what a glass object held in the past 24 hours', textZh: '判断玻璃物件在过去24小时内盛过什么', dc: 15 },
    ],
    craft: ['Glass Bottle', 'Magnifying Glass', 'Spyglass', 'Vial'],
  },
  {
    id: 'jewelers-tools',
    name: "Jeweler's Tools",
    nameZh: '珠宝匠工具',
    category: 'artisan',
    ability: 'intelligence',
    price: '25 GP',
    weight: 2,
    utilize: [
      { text: 'Assess gem value', textZh: '判断珠宝价值', dc: 15 },
    ],
    craft: ['Arcane Focus', 'Holy Symbol'],
  },
  {
    id: 'leatherworkers-tools',
    name: "Leatherworker's Tools",
    nameZh: '皮匠工具',
    category: 'artisan',
    ability: 'dexterity',
    price: '5 GP',
    weight: 5,
    utilize: [
      { text: 'Add a design to a leather item', textZh: '对皮制品进行图案设计', dc: 10 },
    ],
    craft: ['Sling', 'Whip', 'Hide Armor', 'Leather Armor', 'Studded Leather Armor', 'Backpack', 'Crossbow Bolt Case', 'Map or Scroll Case', 'Parchment', 'Pouch', 'Quiver', 'Waterskin'],
  },
  {
    id: 'masons-tools',
    name: "Mason's Tools",
    nameZh: '石匠工具',
    category: 'artisan',
    ability: 'strength',
    price: '10 GP',
    weight: 8,
    utilize: [
      { text: 'Chisel a symbol or hole in stone', textZh: '在石头上凿出符号或洞', dc: 10 },
    ],
    craft: ['Block and Tackle'],
  },
  {
    id: 'painters-supplies',
    name: "Painter's Supplies",
    nameZh: '画家工具',
    category: 'artisan',
    ability: 'wisdom',
    price: '10 GP',
    weight: 5,
    utilize: [
      { text: 'Paint a recognizable image of something you have seen', textZh: '画出所见事物的可辨图像', dc: 10 },
    ],
    craft: ['Druidic Focus', 'Holy Symbol'],
  },
  {
    id: 'potters-tools',
    name: "Potter's Tools",
    nameZh: '陶匠工具',
    category: 'artisan',
    ability: 'intelligence',
    price: '10 GP',
    weight: 3,
    utilize: [
      { text: 'Identify what a ceramic object held in the past 24 hours', textZh: '判断陶瓷物件在过去24小时内盛过什么', dc: 15 },
    ],
    craft: ['Jug', 'Lamp'],
  },
  {
    id: 'smiths-tools',
    name: "Smith's Tools",
    nameZh: '铁匠工具',
    category: 'artisan',
    ability: 'strength',
    price: '20 GP',
    weight: 8,
    utilize: [
      { text: 'Pry open a door or container', textZh: '撬开一扇门或容器', dc: 20 },
    ],
    craft: ['Melee Weapons except Club, Greatclub, Quarterstaff, and Whip', 'Medium Armor except Hide Armor', 'Heavy Armor', 'Ball Bearings', 'Bucket', 'Caltrops', 'Chain', 'Crowbar', 'Firearm Bullets', 'Grappling Hook', 'Iron Pot', 'Iron Spikes', 'Sling Bullets'],
  },
  {
    id: 'tinkers-tools',
    name: "Tinker's Tools",
    nameZh: '修补工具',
    category: 'artisan',
    ability: 'dexterity',
    price: '50 GP',
    weight: 10,
    utilize: [
      { text: 'Repair a broken Tiny object from the past minute', textZh: '修好过去一分钟内碎成数块的小型物件', dc: 20 },
    ],
    craft: ['Musket', 'Pistol', 'Bell', "Bullseye Lantern", 'Flask', 'Hooded Lantern', 'Hunting Trap', 'Lock', 'Manacles', 'Mirror', 'Shovel', 'Signal Whistle', 'Tinderbox'],
  },
  {
    id: 'weavers-tools',
    name: "Weaver's Tools",
    nameZh: '织布工具',
    category: 'artisan',
    ability: 'dexterity',
    price: '1 GP',
    weight: 5,
    utilize: [
      { text: 'Mend a tear in clothing', textZh: '修补衣服破口', dc: 10 },
      { text: 'Sew a small design', textZh: '缝制小图案', dc: 10 },
    ],
    craft: ['Padded Armor', 'Basket', 'Bedroll', 'Blanket', 'Fine Clothes', 'Net', 'Robe', 'Rope', 'Sack', 'String', 'Tent', "Traveler's Clothes"],
  },
  {
    id: 'woodcarvers-tools',
    name: "Woodcarver's Tools",
    nameZh: '木雕工具',
    category: 'artisan',
    ability: 'dexterity',
    price: '1 GP',
    weight: 5,
    utilize: [
      { text: 'Carve a pattern in wood', textZh: '在木头上雕刻图案', dc: 10 },
    ],
    craft: ['Club', 'Greatclub', 'Quarterstaff', 'Ranged Weapons except Pistol, Musket, and Sling', 'Arcane Focus', 'Arrows', 'Crossbow Bolts', 'Druidic Focus', 'Ink Pen', 'Blowgun Needles'],
  },
  {
    id: 'disguise-kit',
    name: 'Disguise Kit',
    nameZh: '易容工具',
    category: 'other',
    ability: 'charisma',
    price: '25 GP',
    weight: 3,
    utilize: [
      { text: 'Apply makeup', textZh: '化妆', dc: 10 },
    ],
    craft: ['Costume'],
  },
  {
    id: 'forgery-kit',
    name: 'Forgery Kit',
    nameZh: '文书伪造工具',
    category: 'other',
    ability: 'dexterity',
    price: '15 GP',
    weight: 5,
    utilize: [
      { text: "Mimic another person's handwriting, 10 words or fewer", textZh: '模仿他人笔迹，10个词或更少', dc: 15 },
      { text: 'Forge a wax seal', textZh: '伪造火漆', dc: 20 },
    ],
    craft: [],
  },
  {
    id: 'gaming-set',
    name: 'Gaming Set',
    nameZh: '赌具',
    category: 'gaming',
    ability: 'wisdom',
    price: 'Varies',
    weight: null,
    utilize: [
      { text: 'Tell whether someone is cheating', textZh: '判断某人是否作弊', dc: 10 },
      { text: 'Win the game', textZh: '赢取游戏', dc: 20 },
    ],
    variants: [
      { id: 'dice-set', name: 'Dice', nameZh: '骰子', price: '1 SP', weight: null },
      { id: 'dragonchess-set', name: 'Dragonchess', nameZh: '龙棋', price: '1 GP', weight: null },
      { id: 'playing-card-set', name: 'Playing Cards', nameZh: '纸牌', price: '5 SP', weight: null },
      { id: 'three-dragon-ante-set', name: 'Three-Dragon Ante', nameZh: '三龙牌', price: '1 GP', weight: null },
    ],
    craft: [],
  },
  {
    id: 'herbalism-kit',
    name: 'Herbalism Kit',
    nameZh: '草药工具',
    category: 'other',
    ability: 'intelligence',
    price: '5 GP',
    weight: 3,
    utilize: [
      { text: 'Identify a plant', textZh: '辨认植物', dc: 10 },
    ],
    craft: ['Antitoxin', 'Candle', "Healer's Kit", 'Potion of Healing'],
  },
  {
    id: 'musical-instrument',
    name: 'Musical Instrument',
    nameZh: '乐器',
    category: 'instrument',
    ability: 'charisma',
    price: 'Varies',
    weight: null,
    utilize: [
      { text: 'Play a known tune', textZh: '演奏熟知曲调', dc: 10 },
      { text: 'Improvise a song', textZh: '演奏即兴乐曲', dc: 15 },
    ],
    variants: [
      { id: 'bagpipes', name: 'Bagpipes', nameZh: '风笛', price: '30 GP', weight: 6 },
      { id: 'drum', name: 'Drum', nameZh: '鼓', price: '6 GP', weight: 3 },
      { id: 'dulcimer', name: 'Dulcimer', nameZh: '扬琴', price: '25 GP', weight: 10 },
      { id: 'flute', name: 'Flute', nameZh: '长笛', price: '2 GP', weight: 1 },
      { id: 'horn', name: 'Horn', nameZh: '号角', price: '3 GP', weight: 2 },
      { id: 'lute', name: 'Lute', nameZh: '鲁特琴', price: '35 GP', weight: 2 },
      { id: 'lyre', name: 'Lyre', nameZh: '里拉琴', price: '30 GP', weight: 2 },
      { id: 'pan-flute', name: 'Pan Flute', nameZh: '排箫', price: '12 GP', weight: 2 },
      { id: 'shawm', name: 'Shawm', nameZh: '芦笛', price: '2 GP', weight: 1 },
      { id: 'viol', name: 'Viol', nameZh: '提琴', price: '30 GP', weight: 1 },
    ],
    craft: [],
  },
  {
    id: 'navigators-tools',
    name: "Navigator's Tools",
    nameZh: '领航工具',
    category: 'other',
    ability: 'wisdom',
    price: '25 GP',
    weight: 2,
    utilize: [
      { text: 'Plot a course', textZh: '计划路线', dc: 10 },
      { text: 'Determine position by stargazing', textZh: '通过观星判断位置', dc: 15 },
    ],
    craft: [],
  },
  {
    id: 'poisoners-kit',
    name: "Poisoner's Kit",
    nameZh: '毒药工具',
    category: 'other',
    ability: 'intelligence',
    price: '50 GP',
    weight: 2,
    utilize: [
      { text: 'Detect a poisonous object', textZh: '侦测有毒物件', dc: 10 },
    ],
    craft: ['Basic Poison'],
  },
  {
    id: 'thieves-tools',
    name: "Thieves' Tools",
    nameZh: '盗贼工具',
    category: 'other',
    ability: 'dexterity',
    price: '25 GP',
    weight: 1,
    utilize: [
      { text: 'Pick a lock', textZh: '撬锁', dc: 15 },
      { text: 'Disarm a trap', textZh: '解除陷阱', dc: 15 },
    ],
    craft: [],
  },
]

export const artisanTools = tools.filter(tool => tool.category === 'artisan')
export const otherTools = tools.filter(tool => tool.category === 'other')

export function getToolById(id) {
  return tools.find(tool => tool.id === id) ?? null
}

export function getToolsByCategory(category) {
  return tools.filter(tool => tool.category === category)
}

export function getToolVariantById(id) {
  for (const tool of tools) {
    const variant = tool.variants?.find(item => item.id === id)
    if (variant) return { ...variant, parentToolId: tool.id }
  }
  return null
}
