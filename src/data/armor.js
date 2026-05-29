export const armorCategories = [
  {
    id: 'light',
    name: 'Light Armor',
    donTime: '1 minute',
    doffTime: '1 minute',
  },
  {
    id: 'medium',
    name: 'Medium Armor',
    donTime: '5 minutes',
    doffTime: '1 minute',
  },
  {
    id: 'heavy',
    name: 'Heavy Armor',
    donTime: '10 minutes',
    doffTime: '5 minutes',
  },
  {
    id: 'shield',
    name: 'Shield',
    donTime: 'Utilize action',
    doffTime: 'Utilize action',
  },
]

export const armorRules = [
  {
    id: 'training',
    title: 'Armor Training',
    desc: 'Anyone can wear armor or wield a shield, but only trained characters use them effectively.',
  },
  {
    id: 'untrained-armor',
    title: 'Untrained Armor',
    desc: 'If you wear light, medium, or heavy armor without training, Strength or Dexterity D20 Tests have disadvantage and you cannot cast spells.',
  },
  {
    id: 'shield-training',
    title: 'Shield Training',
    desc: 'You must have shield training to gain a shield AC bonus.',
  },
  {
    id: 'one-at-a-time',
    title: 'One at a Time',
    desc: 'A creature can wear only one suit of armor and wield only one shield at a time.',
  },
  {
    id: 'equipment-sizes',
    title: 'Equipment Sizes',
    desc: 'If the optional equipment-size rule is used, worn equipment may need refitting at 1d4 x 10 percent of market price.',
  },
]

export const armors = [
  {
    id: 'padded',
    name: 'Padded Armor',
    nameZh: '布甲',
    category: 'light',
    ac: { base: 11, dex: true },
    stealthDisadvantage: true,
    strengthRequired: null,
    weight: 8,
    price: '5 GP',
  },
  {
    id: 'leather',
    name: 'Leather Armor',
    nameZh: '皮甲',
    category: 'light',
    ac: { base: 11, dex: true },
    stealthDisadvantage: false,
    strengthRequired: null,
    weight: 10,
    price: '10 GP',
  },
  {
    id: 'studded-leather',
    name: 'Studded Leather Armor',
    nameZh: '镶钉皮甲',
    category: 'light',
    ac: { base: 12, dex: true },
    stealthDisadvantage: false,
    strengthRequired: null,
    weight: 13,
    price: '45 GP',
  },
  {
    id: 'hide',
    name: 'Hide Armor',
    nameZh: '兽皮甲',
    category: 'medium',
    ac: { base: 12, dex: true, dexMax: 2 },
    stealthDisadvantage: false,
    strengthRequired: null,
    weight: 12,
    price: '10 GP',
  },
  {
    id: 'chain-shirt',
    name: 'Chain Shirt',
    nameZh: '链甲衫',
    category: 'medium',
    ac: { base: 13, dex: true, dexMax: 2 },
    stealthDisadvantage: false,
    strengthRequired: null,
    weight: 20,
    price: '50 GP',
  },
  {
    id: 'scale-mail',
    name: 'Scale Mail',
    nameZh: '鳞甲',
    category: 'medium',
    ac: { base: 14, dex: true, dexMax: 2 },
    stealthDisadvantage: true,
    strengthRequired: null,
    weight: 45,
    price: '50 GP',
  },
  {
    id: 'breastplate',
    name: 'Breastplate',
    nameZh: '胸甲',
    category: 'medium',
    ac: { base: 14, dex: true, dexMax: 2 },
    stealthDisadvantage: false,
    strengthRequired: null,
    weight: 20,
    price: '400 GP',
  },
  {
    id: 'half-plate',
    name: 'Half Plate Armor',
    nameZh: '半身板甲',
    category: 'medium',
    ac: { base: 15, dex: true, dexMax: 2 },
    stealthDisadvantage: true,
    strengthRequired: null,
    weight: 40,
    price: '750 GP',
  },
  {
    id: 'ring-mail',
    name: 'Ring Mail',
    nameZh: '环甲',
    category: 'heavy',
    ac: { base: 14, dex: false },
    stealthDisadvantage: true,
    strengthRequired: null,
    weight: 40,
    price: '30 GP',
  },
  {
    id: 'chain-mail',
    name: 'Chain Mail',
    nameZh: '链甲',
    category: 'heavy',
    ac: { base: 16, dex: false },
    stealthDisadvantage: true,
    strengthRequired: 13,
    weight: 55,
    price: '75 GP',
  },
  {
    id: 'splint',
    name: 'Splint Armor',
    nameZh: '板条甲',
    category: 'heavy',
    ac: { base: 17, dex: false },
    stealthDisadvantage: true,
    strengthRequired: 15,
    weight: 60,
    price: '200 GP',
  },
  {
    id: 'plate',
    name: 'Plate Armor',
    nameZh: '板甲',
    category: 'heavy',
    ac: { base: 18, dex: false },
    stealthDisadvantage: true,
    strengthRequired: 15,
    weight: 65,
    price: '1500 GP',
  },
]

export const shield = {
  id: 'shield',
  name: 'Shield',
  nameZh: '盾牌',
  category: 'shield',
  acBonus: 2,
  stealthDisadvantage: false,
  strengthRequired: null,
  weight: 6,
  price: '10 GP',
}

export function getArmorById(id) {
  return armors.find(armor => armor.id === id) ?? null
}

export function getArmorCategoryById(id) {
  return armorCategories.find(category => category.id === id) ?? null
}

export function getArmorsByCategory(category) {
  return armors.filter(armor => armor.category === category)
}

export function calculateArmorAc(armor, dexMod = 0, hasShield = false) {
  if (!armor) return 10 + dexMod + (hasShield ? shield.acBonus : 0)

  const dexBonus = armor.ac.dex
    ? Math.min(dexMod, armor.ac.dexMax ?? dexMod)
    : 0

  return armor.ac.base + dexBonus + (hasShield ? shield.acBonus : 0)
}
