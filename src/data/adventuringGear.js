export const gearCategories = [
  { id: 'adventuring-gear', name: 'Adventuring Gear', nameZh: '冒险装备' },
  { id: 'ammunition', name: 'Ammunition', nameZh: '弹药' },
  { id: 'focus', name: 'Spellcasting Focus', nameZh: '施法法器' },
  { id: 'pack', name: 'Equipment Pack', nameZh: '装备套组' },
  { id: 'container', name: 'Container', nameZh: '容器' },
  { id: 'consumable', name: 'Consumable', nameZh: '消耗品' },
  { id: 'clothing', name: 'Clothing', nameZh: '服装' },
]

export const ammunition = [
  { id: 'arrows', name: 'Arrows', nameZh: '箭矢', quantity: 20, container: 'quiver', weight: 1, price: '1 GP' },
  { id: 'crossbow-bolts', name: 'Crossbow Bolts', nameZh: '弩矢', quantity: 20, container: 'crossbow-bolt-case', weight: 1.5, price: '1 GP' },
  { id: 'firearm-bullets', name: 'Firearm Bullets', nameZh: '弹丸，火器', quantity: 10, container: 'pouch', weight: 2, price: '3 GP' },
  { id: 'sling-bullets', name: 'Sling Bullets', nameZh: '弹丸，投石索', quantity: 20, container: 'pouch', weight: 1.5, price: '4 CP' },
  { id: 'blowgun-needles', name: 'Blowgun Needles', nameZh: '吹矢', quantity: 50, container: 'pouch', weight: 1, price: '1 GP' },
]

export const focusVariants = [
  { id: 'crystal', parentId: 'arcane-focus', name: 'Crystal', nameZh: '水晶', weight: 1, price: '10 GP' },
  { id: 'orb', parentId: 'arcane-focus', name: 'Orb', nameZh: '法球', weight: 3, price: '20 GP' },
  { id: 'rod', parentId: 'arcane-focus', name: 'Rod', nameZh: '权杖', weight: 2, price: '10 GP' },
  { id: 'staff-focus', parentId: 'arcane-focus', name: 'Staff', nameZh: '法杖', weight: 4, price: '5 GP', alsoCountsAs: ['quarterstaff'] },
  { id: 'wand', parentId: 'arcane-focus', name: 'Wand', nameZh: '魔杖', weight: 1, price: '10 GP' },
  { id: 'sprig-of-mistletoe', parentId: 'druidic-focus', name: 'Sprig of Mistletoe', nameZh: '槲寄生枝条', weight: null, price: '1 GP' },
  { id: 'wooden-staff', parentId: 'druidic-focus', name: 'Wooden Staff', nameZh: '木杖', weight: 4, price: '5 GP', alsoCountsAs: ['quarterstaff'] },
  { id: 'yew-wand', parentId: 'druidic-focus', name: 'Yew Wand', nameZh: '紫杉魔杖', weight: 1, price: '10 GP' },
  { id: 'amulet', parentId: 'holy-symbol', name: 'Amulet', nameZh: '护符', weight: 1, price: '5 GP', worn: 'worn or held' },
  { id: 'emblem', parentId: 'holy-symbol', name: 'Emblem', nameZh: '纹章', weight: null, price: '5 GP', worn: 'attached to cloth or shield' },
  { id: 'reliquary', parentId: 'holy-symbol', name: 'Reliquary', nameZh: '圣物匣', weight: 2, price: '5 GP', worn: 'held' },
]

export const gearPacks = [
  {
    id: 'burglars-pack',
    name: "Burglar's Pack",
    nameZh: '窃贼套组',
    weight: 42,
    price: '16 GP',
    contents: ['backpack', 'ball-bearings', 'bell', 'candle x10', 'crowbar', 'hooded-lantern', 'oil x7', 'rations x5', 'rope', 'tinderbox', 'waterskin'],
  },
  {
    id: 'diplomats-pack',
    name: "Diplomat's Pack",
    nameZh: '外交套组',
    weight: 39,
    price: '39 GP',
    contents: ['chest', 'fine-clothes', 'ink', 'ink-pen x5', 'lamp', 'map-or-scroll-case x2', 'oil x4', 'paper x5', 'parchment x5', 'perfume', 'tinderbox'],
  },
  {
    id: 'dungeoneers-pack',
    name: "Dungeoneer's Pack",
    nameZh: '地城套组',
    weight: 55,
    price: '12 GP',
    contents: ['backpack', 'caltrops', 'crowbar', 'oil x2', 'rations x10', 'rope', 'tinderbox', 'torch x10', 'waterskin'],
  },
  {
    id: 'entertainers-pack',
    name: "Entertainer's Pack",
    nameZh: '艺人套组',
    weight: 58.5,
    price: '40 GP',
    contents: ['backpack', 'bedroll', 'bell', 'bullseye-lantern', 'costume x3', 'mirror', 'oil x8', 'rations x9', 'tinderbox', 'waterskin'],
  },
  {
    id: 'explorers-pack',
    name: "Explorer's Pack",
    nameZh: '探索套组',
    weight: 55,
    price: '10 GP',
    contents: ['backpack', 'bedroll', 'oil x2', 'rations x10', 'rope', 'tinderbox', 'torch x10', 'waterskin'],
  },
  {
    id: 'priests-pack',
    name: "Priest's Pack",
    nameZh: '祭司套组',
    weight: 29,
    price: '33 GP',
    contents: ['backpack', 'blanket', 'holy-water', 'lamp', 'rations x7', 'robe', 'tinderbox'],
  },
  {
    id: 'scholars-pack',
    name: "Scholar's Pack",
    nameZh: '学者套组',
    weight: 22,
    price: '40 GP',
    contents: ['backpack', 'book', 'ink', 'ink-pen', 'lamp', 'oil x10', 'parchment x10', 'tinderbox'],
  },
]

export const adventuringGear = [
  {
    id: 'acid',
    name: 'Acid',
    nameZh: '强酸',
    category: 'consumable',
    weight: 1,
    price: '25 GP',
    desc: 'As part of the Attack action, replace one attack by throwing acid at a visible creature or object within 20 feet. The target makes a Dexterity save, DC = 8 + Dexterity modifier + proficiency bonus, taking 2d6 acid damage on a failure.',
  },
  {
    id: 'alchemists-fire',
    name: "Alchemist's Fire",
    nameZh: '炽火胶',
    category: 'consumable',
    weight: 1,
    price: '50 GP',
    desc: 'As part of the Attack action, replace one attack by throwing it at a visible creature or object within 20 feet. The target makes a Dexterity save, DC = 8 + Dexterity modifier + proficiency bonus, taking 1d4 fire damage and burning on a failure.',
  },
  { id: 'ammunition', name: 'Ammunition', nameZh: '弹药', category: 'ammunition', weight: null, price: 'Varies', variants: ammunition },
  { id: 'antitoxin', name: 'Antitoxin', nameZh: '抗毒剂', category: 'consumable', weight: null, price: '50 GP', desc: 'As a Bonus Action, drink it to gain advantage for 1 hour on saves to avoid or end the Poisoned condition.' },
  { id: 'arcane-focus', name: 'Arcane Focus', nameZh: '奥术法器', category: 'focus', weight: null, price: 'Varies', variants: focusVariants.filter(item => item.parentId === 'arcane-focus'), users: ['Sorcerer', 'Warlock', 'Wizard'] },
  { id: 'backpack', name: 'Backpack', nameZh: '背包', category: 'container', weight: 5, price: '2 GP', capacity: '30 lb, 1 cubic foot' },
  { id: 'ball-bearings', name: 'Ball Bearings', nameZh: '滚珠', category: 'adventuring-gear', weight: 2, price: '1 GP', desc: 'Use a Utilize action to cover a 10-foot square within 10 feet. A creature entering the area for the first time on a turn must succeed on a DC 10 Dexterity save or fall Prone.' },
  { id: 'barrel', name: 'Barrel', nameZh: '木桶', category: 'container', weight: 70, price: '2 GP', capacity: '40 gallons liquid or 4 cubic feet dry goods' },
  { id: 'basket', name: 'Basket', nameZh: '篮子', category: 'container', weight: 2, price: '4 SP', capacity: '40 lb, 2 cubic feet' },
  { id: 'bedroll', name: 'Bedroll', nameZh: '铺盖', category: 'adventuring-gear', weight: 7, price: '1 GP', desc: 'Sleeps one Small or Medium creature. While in a bedroll, you automatically succeed on saves against extreme cold.' },
  { id: 'bell', name: 'Bell', nameZh: '铃铛', category: 'adventuring-gear', weight: null, price: '1 GP', desc: 'Use a Utilize action to ring it; the sound is audible within 60 feet.' },
  { id: 'blanket', name: 'Blanket', nameZh: '毯子', category: 'adventuring-gear', weight: 3, price: '5 SP', desc: 'While wrapped in a blanket, you have advantage on saves against extreme cold.' },
  { id: 'block-and-tackle', name: 'Block and Tackle', nameZh: '滑轮组', category: 'adventuring-gear', weight: 5, price: '1 GP', desc: 'Lets you lift four times the weight you can normally lift.' },
  { id: 'book', name: 'Book', nameZh: '书籍', category: 'adventuring-gear', weight: 5, price: '25 GP', desc: 'A relevant accurate nonfiction book grants +5 to related Intelligence (Arcana, History, Nature, or Religion) checks.' },
  { id: 'glass-bottle', name: 'Bottle, Glass', nameZh: '玻璃瓶', category: 'container', weight: 2, price: '2 GP', capacity: '1.5 pints' },
  { id: 'bucket', name: 'Bucket', nameZh: '吊桶', category: 'container', weight: 2, price: '5 CP', capacity: '0.5 cubic feet' },
  { id: 'caltrops', name: 'Caltrops', nameZh: '铁蒺藜', category: 'adventuring-gear', weight: 2, price: '1 GP', desc: 'Use a Utilize action to cover a 5-foot square within 5 feet. A creature entering for the first time on a turn makes a DC 15 Dexterity save or takes 1 piercing damage and has Speed 0 until the start of its next turn.' },
  { id: 'candle', name: 'Candle', nameZh: '蜡烛', category: 'adventuring-gear', weight: null, price: '1 CP', desc: 'Burns 1 hour, shedding bright light in 5 feet and dim light for another 5 feet.' },
  { id: 'crossbow-bolt-case', name: 'Case, Crossbow Bolt', nameZh: '弩矢匣', category: 'container', weight: 1, price: '1 GP', capacity: '20 crossbow bolts' },
  { id: 'map-or-scroll-case', name: 'Case, Map or Scroll', nameZh: '地图或卷轴匣', category: 'container', weight: 1, price: '1 GP', capacity: '10 sheets of paper or 5 sheets of parchment' },
  { id: 'chain', name: 'Chain', nameZh: '链条', category: 'adventuring-gear', weight: 10, price: '5 GP', desc: 'Use a Utilize action and a DC 13 Strength (Athletics) check to bind a grappled, incapacitated, or restrained unwilling creature within 5 feet. Escape: DC 18 Dexterity (Acrobatics); break: DC 20 Strength (Athletics).' },
  { id: 'chest', name: 'Chest', nameZh: '箱子', category: 'container', weight: 25, price: '5 GP', capacity: '12 cubic feet' },
  { id: 'climbers-kit', name: "Climber's Kit", nameZh: '攀爬工具', category: 'adventuring-gear', weight: 12, price: '25 GP', desc: 'Use a Utilize action to anchor yourself. You cannot fall more than 25 feet from the anchor or move more than 25 feet away until you use a Bonus Action to release the anchor.' },
  { id: 'fine-clothes', name: 'Clothes, Fine', nameZh: '高档服装', category: 'clothing', weight: 6, price: '15 GP' },
  { id: 'travelers-clothes', name: "Clothes, Traveler's", nameZh: '旅行服装', category: 'clothing', weight: 4, price: '2 GP' },
  { id: 'component-pouch', name: 'Component Pouch', nameZh: '材料包', category: 'adventuring-gear', weight: 2, price: '25 GP', desc: 'A watertight pouch containing all free material components needed for spells.' },
  { id: 'costume', name: 'Costume', nameZh: '戏服', category: 'clothing', weight: 4, price: '5 GP', desc: 'If wearing an appropriate costume, you have advantage on ability checks to impersonate another person or type of person.' },
  { id: 'crowbar', name: 'Crowbar', nameZh: '撬棍', category: 'adventuring-gear', weight: 5, price: '2 GP', desc: 'Grants advantage on Strength checks where leverage applies.' },
  { id: 'druidic-focus', name: 'Druidic Focus', nameZh: '德鲁伊法器', category: 'focus', weight: null, price: 'Varies', variants: focusVariants.filter(item => item.parentId === 'druidic-focus'), users: ['Druid', 'Ranger'] },
  { id: 'flask', name: 'Flask', nameZh: '扁瓶', category: 'container', weight: 1, price: '2 CP', capacity: '1 pint' },
  { id: 'grappling-hook', name: 'Grappling Hook', nameZh: '爪钩', category: 'adventuring-gear', weight: 4, price: '2 GP', desc: 'Use a Utilize action to throw it at a catch within 50 feet and make a DC 13 Dexterity (Acrobatics) check. On a success, it catches.' },
  { id: 'healers-kit', name: "Healer's Kit", nameZh: '急救包', category: 'adventuring-gear', weight: 3, price: '5 GP', uses: 10, desc: 'Use a Utilize action and expend one use to stabilize an unconscious creature with 0 HP without a Wisdom (Medicine) check.' },
  { id: 'holy-symbol', name: 'Holy Symbol', nameZh: '圣徽', category: 'focus', weight: null, price: 'Varies', variants: focusVariants.filter(item => item.parentId === 'holy-symbol') },
  { id: 'holy-water', name: 'Holy Water', nameZh: '圣水', category: 'consumable', weight: 1, price: '25 GP', desc: 'As part of the Attack action, replace one attack by throwing it at a visible creature within 20 feet. The target makes a Dexterity save, DC = 8 + Dexterity modifier + proficiency bonus; a Fiend or Undead takes 2d8 radiant damage on a failure.' },
  { id: 'hunting-trap', name: 'Hunting Trap', nameZh: '捕猎陷阱', category: 'adventuring-gear', weight: 25, price: '5 GP', desc: 'Use a Utilize action to set it. A creature stepping on the plate makes a DC 13 Dexterity save or takes 1d4 piercing damage and has Speed 0 until the start of its next turn. Escape requires a DC 13 Strength (Athletics) check.' },
  { id: 'ink', name: 'Ink', nameZh: '墨水', category: 'adventuring-gear', weight: null, price: '10 GP', desc: 'A 1-ounce bottle, enough for 500 pages.' },
  { id: 'ink-pen', name: 'Ink Pen', nameZh: '墨水笔', category: 'adventuring-gear', weight: null, price: '2 CP' },
  { id: 'jug', name: 'Jug', nameZh: '壶', category: 'container', weight: 4, price: '2 CP', capacity: '1 gallon' },
  { id: 'ladder', name: 'Ladder', nameZh: '梯子', category: 'adventuring-gear', weight: 25, price: '1 SP', desc: 'A 10-foot ladder. You can climb up or down it.' },
  { id: 'lamp', name: 'Lamp', nameZh: '油灯', category: 'adventuring-gear', weight: 1, price: '5 SP', desc: 'Uses oil. When lit, sheds bright light in 15 feet and dim light for another 30 feet.' },
  { id: 'bullseye-lantern', name: 'Lantern, Bullseye', nameZh: '牛眼提灯', category: 'adventuring-gear', weight: 2, price: '10 GP', desc: 'Uses oil. When lit, sheds bright light in a 60-foot cone and dim light for another 60 feet.' },
  { id: 'hooded-lantern', name: 'Lantern, Hooded', nameZh: '附盖提灯', category: 'adventuring-gear', weight: 2, price: '5 GP', desc: 'Uses oil. When lit, sheds bright light in 30 feet and dim light for another 30 feet. A Bonus Action covers or uncovers it; covered light is 5-foot dim light.' },
  { id: 'lock', name: 'Lock', nameZh: '锁', category: 'adventuring-gear', weight: 1, price: '10 GP', desc: "Without the key, a creature can pick the lock with Thieves' Tools and a DC 15 Dexterity (Sleight of Hand) check." },
  { id: 'magnifying-glass', name: 'Magnifying Glass', nameZh: '放大镜', category: 'adventuring-gear', weight: null, price: '100 GP', desc: 'Grants advantage on ability checks to appraise or inspect detailed items. Starting a fire requires bright sunlight, tinder, and about 5 minutes.' },
  { id: 'manacles', name: 'Manacles', nameZh: '镣铐', category: 'adventuring-gear', weight: 6, price: '2 GP', desc: "Use a Utilize action and a DC 13 Dexterity (Sleight of Hand) check to bind a grappled, incapacitated, or restrained unwilling Medium or smaller creature within 5 feet. Escape: DC 20 Dexterity (Sleight of Hand); break: DC 25 Strength (Athletics); unlock with Thieves' Tools: DC 15 Dexterity (Sleight of Hand)." },
  { id: 'map', name: 'Map', nameZh: '地图', category: 'adventuring-gear', weight: null, price: '1 GP', desc: 'A relevant accurate map grants +5 to Wisdom (Survival) checks to identify location.' },
  { id: 'mirror', name: 'Mirror', nameZh: '镜子', category: 'adventuring-gear', weight: 0.5, price: '5 GP', desc: 'A handheld steel mirror, useful for grooming, seeing around corners, or signaling with reflected light.' },
  { id: 'net', name: 'Net', nameZh: '捕网', category: 'adventuring-gear', weight: 3, price: '1 GP', desc: 'As part of the Attack action, replace one attack by throwing the net at a visible creature within 15 feet. The target makes a Dexterity save, DC = 8 + Dexterity modifier + proficiency bonus, or is Restrained. Huge or larger targets automatically succeed.' },
  { id: 'oil', name: 'Oil', nameZh: '燃油', category: 'consumable', weight: 1, price: '1 SP', desc: 'Can douse a target or space, or fuel lamps and lanterns. One flask fuels a lamp or lantern for 6 hours total.' },
  { id: 'paper', name: 'Paper', nameZh: '纸张', category: 'adventuring-gear', weight: null, price: '2 SP', desc: 'One sheet can hold 250 handwritten words.' },
  { id: 'parchment', name: 'Parchment', nameZh: '羊皮纸', category: 'adventuring-gear', weight: null, price: '1 SP', desc: 'One sheet can hold 250 handwritten words.' },
  { id: 'perfume', name: 'Perfume', nameZh: '香水', category: 'adventuring-gear', weight: null, price: '5 GP', desc: 'For 1 hour after applying perfume, you have advantage on Charisma (Persuasion) checks to influence Indifferent Humanoids within 5 feet.' },
  { id: 'basic-poison', name: 'Poison, Basic', nameZh: '基础毒药', category: 'consumable', weight: null, price: '100 GP', desc: 'As a Bonus Action, apply to one weapon or up to three pieces of ammunition. A creature damaged by the poisoned weapon or ammunition takes an extra 1d4 poison damage. Lasts 1 minute or until extra damage is dealt.' },
  { id: 'pole', name: 'Pole', nameZh: '长杆', category: 'adventuring-gear', weight: 7, price: '5 CP', desc: 'A 10-foot pole. It can touch things 10 feet away and grants advantage on Strength (Athletics) checks for high or long jumps using a pole vault.' },
  { id: 'iron-pot', name: 'Pot, Iron', nameZh: '铁壶', category: 'container', weight: 10, price: '2 GP', capacity: '1 gallon' },
  { id: 'potion-of-healing', name: 'Potion of Healing', nameZh: '治疗药水', category: 'consumable', weight: 0.5, price: '50 GP', desc: 'Magic item. As a Bonus Action, drink it or administer it to a creature within 5 feet. The drinker regains 2d4 + 2 HP.' },
  { id: 'pouch', name: 'Pouch', nameZh: '小包', category: 'container', weight: 1, price: '5 SP', capacity: '6 lb, one-fifth cubic foot' },
  { id: 'quiver', name: 'Quiver', nameZh: '箭袋', category: 'container', weight: 1, price: '1 GP', capacity: '20 arrows' },
  { id: 'portable-ram', name: 'Ram, Portable', nameZh: '便携式攻城锤', category: 'adventuring-gear', weight: 35, price: '4 GP', desc: 'Use it to break down doors. You gain +4 to the Strength check. Another character can help, granting advantage.' },
  { id: 'rations', name: 'Rations', nameZh: '口粮', category: 'consumable', weight: 2, price: '5 SP' },
  { id: 'robe', name: 'Robe', nameZh: '长袍', category: 'clothing', weight: 4, price: '1 GP' },
  { id: 'rope', name: 'Rope', nameZh: '绳索', category: 'adventuring-gear', weight: 5, price: '1 GP', desc: 'Use a Utilize action and a DC 10 Dexterity (Sleight of Hand) check to tie a knot. Breaking it requires a DC 20 Strength (Athletics) check. A restrained, incapacitated, or grappled unwilling creature can be tied; escape requires DC 15 Dexterity (Acrobatics).' },
  { id: 'sack', name: 'Sack', nameZh: '麻袋', category: 'container', weight: 0.5, price: '1 CP', capacity: '30 lb, 1 cubic foot' },
  { id: 'shovel', name: 'Shovel', nameZh: '铲子', category: 'adventuring-gear', weight: 5, price: '2 GP', desc: 'Use it for 1 hour to dig a 5-foot-cube hole in dirt or similar material.' },
  { id: 'signal-whistle', name: 'Signal Whistle', nameZh: '信号笛', category: 'adventuring-gear', weight: null, price: '5 CP', desc: 'Use a Utilize action to blow it; audible up to 600 feet away.' },
  { id: 'spell-scroll-cantrip', name: 'Spell Scroll, Cantrip', nameZh: '戏法卷轴', category: 'consumable', weight: null, price: '30 GP', desc: 'Magic item. If the spell is on your class list, read the scroll to cast it without material components. Save DC 13, attack bonus +5, then the scroll vanishes.' },
  { id: 'spell-scroll-level-1', name: 'Spell Scroll, Level 1', nameZh: '一环卷轴', category: 'consumable', weight: null, price: '50 GP', desc: 'Magic item. If the spell is on your class list, read the scroll to cast it without material components. Save DC 13, attack bonus +5, then the scroll vanishes.' },
  { id: 'iron-spikes', name: 'Spikes, Iron', nameZh: '铁钉', category: 'adventuring-gear', weight: 5, price: '1 GP', quantity: 10, desc: 'Use a Utilize action and a bludgeoning tool, such as a light hammer, to drive a spike into wood, dirt, or similar material.' },
  { id: 'spyglass', name: 'Spyglass', nameZh: '望远镜', category: 'adventuring-gear', weight: 1, price: '1000 GP', desc: 'Objects viewed through it appear twice their normal size.' },
  { id: 'string', name: 'String', nameZh: '细绳', category: 'adventuring-gear', weight: null, price: '1 SP', desc: '10 feet long. You can tie a knot with a Utilize action.' },
  { id: 'tent', name: 'Tent', nameZh: '帐篷', category: 'adventuring-gear', weight: 20, price: '2 GP', capacity: 'Two Small or Medium creatures' },
  { id: 'tinderbox', name: 'Tinderbox', nameZh: '火绒盒', category: 'adventuring-gear', weight: 1, price: '5 SP', desc: 'Use a Bonus Action to light something that has fuel, such as a candle, lamp, or torch. Starting a fire without fuel takes 1 minute.' },
  { id: 'torch', name: 'Torch', nameZh: '火把', category: 'adventuring-gear', weight: 1, price: '1 CP', desc: 'Burns 1 hour, shedding bright light in 20 feet and dim light for another 20 feet. Can be used as a simple melee weapon that deals 1 fire damage on a hit.' },
  { id: 'vial', name: 'Vial', nameZh: '小瓶', category: 'container', weight: null, price: '1 GP', capacity: '4 ounces' },
  { id: 'waterskin', name: 'Waterskin', nameZh: '水袋', category: 'container', weight: 5, price: '2 SP', capacity: '4 pints', weightNote: 'full' },
]

export const allAdventuringGear = [
  ...adventuringGear,
  ...gearPacks,
]

export function getGearById(id) {
  return allAdventuringGear.find(item => item.id === id) ?? null
}

export function getGearByCategory(category) {
  return allAdventuringGear.filter(item => item.category === category)
}

export function getGearVariantById(id) {
  const variantGroups = [
    ...ammunition.map(item => ({ ...item, parentId: 'ammunition' })),
    ...focusVariants,
  ]

  return variantGroups.find(item => item.id === id) ?? null
}
