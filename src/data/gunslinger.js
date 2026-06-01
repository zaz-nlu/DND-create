const gunslingerSpellcastingProgression = [
  { level: 3, cantrips: 2, prepared: 3, slots: { 1: 2 } },
  { level: 4, cantrips: 2, prepared: 4, slots: { 1: 3 } },
  { level: 5, cantrips: 2, prepared: 4, slots: { 1: 3 } },
  { level: 6, cantrips: 2, prepared: 4, slots: { 1: 3 } },
  { level: 7, cantrips: 2, prepared: 5, slots: { 1: 4, 2: 2 } },
  { level: 8, cantrips: 2, prepared: 6, slots: { 1: 4, 2: 2 } },
  { level: 9, cantrips: 2, prepared: 6, slots: { 1: 4, 2: 2 } },
  { level: 10, cantrips: 3, prepared: 7, slots: { 1: 4, 2: 3 } },
  { level: 11, cantrips: 3, prepared: 8, slots: { 1: 4, 2: 3 } },
  { level: 12, cantrips: 3, prepared: 8, slots: { 1: 4, 2: 3 } },
  { level: 13, cantrips: 3, prepared: 9, slots: { 1: 4, 2: 3, 3: 2 } },
  { level: 14, cantrips: 3, prepared: 10, slots: { 1: 4, 2: 3, 3: 2 } },
  { level: 15, cantrips: 3, prepared: 10, slots: { 1: 4, 2: 3, 3: 2 } },
  { level: 16, cantrips: 3, prepared: 11, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 17, cantrips: 3, prepared: 11, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 18, cantrips: 3, prepared: 11, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 19, cantrips: 3, prepared: 12, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } },
  { level: 20, cantrips: 3, prepared: 13, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } },
]

const classProgression = [
  { level: 1, proficiencyBonus: '+2', features: '战斗风格、快速拔枪、武器专精', riskDice: '—', weaponMastery: 2 },
  { level: 2, proficiencyBonus: '+2', features: '致命射击、风险机制', riskDice: '4d8', weaponMastery: 2 },
  { level: 3, proficiencyBonus: '+2', features: '枪手子职', riskDice: '4d8', weaponMastery: 2 },
  { level: 4, proficiencyBonus: '+2', features: '通用专长', riskDice: '4d8', weaponMastery: 3 },
  { level: 5, proficiencyBonus: '+3', features: '额外攻击、内脏射击', riskDice: '4d8', weaponMastery: 3 },
  { level: 6, proficiencyBonus: '+3', features: '子职特性', riskDice: '5d8', weaponMastery: 3 },
  { level: 7, proficiencyBonus: '+3', features: '反射闪避', riskDice: '5d8', weaponMastery: 3 },
  { level: 8, proficiencyBonus: '+3', features: '通用专长', riskDice: '5d8', weaponMastery: 3 },
  { level: 9, proficiencyBonus: '+4', features: '灵巧战技', riskDice: '5d8', weaponMastery: 3 },
  { level: 10, proficiencyBonus: '+4', features: '子职特性', riskDice: '5d10', weaponMastery: 4 },
  { level: 11, proficiencyBonus: '+4', features: '致命射击强化', riskDice: '5d10', weaponMastery: 4 },
  { level: 12, proficiencyBonus: '+4', features: '通用专长', riskDice: '5d10', weaponMastery: 4 },
  { level: 13, proficiencyBonus: '+5', features: '死里逃生', riskDice: '5d10', weaponMastery: 4 },
  { level: 14, proficiencyBonus: '+5', features: '子职特性', riskDice: '6d10', weaponMastery: 4 },
  { level: 15, proficiencyBonus: '+5', features: '致命赌注', riskDice: '6d10', weaponMastery: 4 },
  { level: 16, proficiencyBonus: '+5', features: '通用专长', riskDice: '6d10', weaponMastery: 4 },
  { level: 17, proficiencyBonus: '+6', features: '超量杀伤', riskDice: '6d10', weaponMastery: 4 },
  { level: 18, proficiencyBonus: '+6', features: '致命射击精通', riskDice: '6d12', weaponMastery: 4 },
  { level: 19, proficiencyBonus: '+6', features: '传奇恩惠', riskDice: '6d12', weaponMastery: 4 },
  { level: 20, proficiencyBonus: '+6', features: '爆头', riskDice: '6d12', weaponMastery: 4 },
]

const riskManeuvers = `你可以消耗风险骰发动以下战技：
咬紧牙关：以附赠动作消耗1颗风险骰，获得等于骰值加枪手等级的临时生命值。
盲射：以附赠动作消耗1颗风险骰，获得30尺盲视，持续至当前回合结束。
翻滚装填：以附赠动作消耗1颗风险骰，移动至多15尺并装填手持的任意远程武器。该移动不引发借机攻击且无视困难地形。
擦伤射击：远程攻击检定未命中时消耗1颗风险骰，无需动作，造成等于骰值加敏捷调整值的伤害（至少1点），伤害类型同武器。每回合限用1次。
特立独行：智力、感知或魅力属性检定或豁免失败时消耗1颗风险骰，将骰值加入检定结果。每回合限用1次。
千钧一发：可见生物攻击命中你时，以反应动作消耗1颗风险骰，将骰值加入本次攻击对应的AC，可能使攻击变为未命中。`

export const gunslingerClass = {
  id: 'gunslinger',
  name: '枪手',
  nameEn: 'Gunslinger',
  tagline: '让每一颗子弹都成为经过计算的豪赌',
  color: '#8A4F3D',
  image: '',
  subclassLevel: 3,
  lore: '枪手以敏捷、判断力与冷静驾驭火器。他们将枪火化作战技，在最危险的瞬间用风险骰换取决定胜负的一击。',
  fullLore: `枪手并非只会扣动扳机。真正的枪手熟悉火器的节奏、战场的死角与代价的重量。

主要属性：敏捷
生命骰：每枪手等级1d8
豁免熟练：敏捷、魅力

1级起始角色获得枪手核心特质中的全部能力。兼职角色获得每枪手等级1d8生命骰、军用远程武器熟练项，以及枪手1级职业特性。`,
  primaryAbility: '敏捷',
  hitDie: 'd8',
  saves: ['敏捷', '魅力'],
  weapons: ['简易武器', '军用远程武器'],
  armor: ['轻甲'],
  tools: [],
  skillChoices: {
    count: 2,
    options: ['特技', '驯兽', '运动', '欺瞒', '洞悉', '威吓', '察觉', '游说', '巧手', '隐匿'],
  },
  equipment: {
    a: '皮甲、2把匕首、左轮手枪、50发子弹、探索套组、11 GP',
    b: '175 GP',
  },
  classProgression,
  level1Features: [
    {
      name: '战斗风格',
      nameEn: 'Fighting Style',
      desc: '获得一个自选的战斗风格专长。若选择需要近战武器单手或双手持握的战斗风格专长，可将其效果应用于远程武器。每次提升枪手等级时，可以更换已选专长。',
    },
    {
      name: '快速拔枪',
      nameEn: 'Quick Draw',
      desc: '你的先攻检定具有优势。你可以同时拔取或收起两把不具有双手词条的武器，而非通常的一把。',
    },
    {
      name: '武器专精',
      nameEn: 'Weapon Mastery',
      desc: '你掌握2种自选简易或军用远程武器的精通属性。完成长休后，可以通过武器训练更换其中1种已选武器类型。可掌握的武器类型数量随枪手等级提高。',
    },
  ],
  notableFeatures: [
    {
      level: 2,
      name: '致命射击',
      nameEn: 'Critical Shot',
      desc: '使用远程武器攻击时，d20骰值为19至20即触发重击。11级时扩展至18至20，18级时扩展至17至20。',
    },
    {
      level: 2,
      name: '风险机制',
      nameEn: 'Risk',
      desc: `你拥有4颗d8风险骰，使用后消耗，并在完成短休或长休后恢复。骰面与数量随枪手等级变化。战技豁免DC等于8＋敏捷调整值＋熟练加值。\n${riskManeuvers}`,
    },
    {
      level: 5,
      name: '额外攻击',
      nameEn: 'Extra Attack',
      desc: '执行攻击动作时，你可以发动两次攻击，而非一次。',
    },
    {
      level: 5,
      name: '内脏射击',
      nameEn: 'Gut Shot',
      desc: '使用远程武器对大型或更小体型生物造成重击时，弹丸嵌入目标体内。在接下来的1分钟内或直到目标消耗一次攻击动作拔出弹丸，目标速度减半且攻击检定具有劣势。',
    },
    {
      level: 7,
      name: '反射闪避',
      nameEn: 'Evasion',
      desc: '当你成为需要进行敏捷豁免且成功时仅承受一半伤害的效应目标时，若豁免成功则不受伤害，豁免失败则仅承受一半伤害。失能状态下无法获益。',
    },
    {
      level: 9,
      name: '灵巧战技',
      nameEn: 'Deft Maneuvers',
      desc: '你获得一个特殊附赠动作。每回合限用一次，且只能用于发动战技。',
    },
    {
      level: 11,
      name: '致命射击强化',
      nameEn: 'Improved Critical Shot',
      desc: '你使用远程武器攻击时，d20骰值为18至20即触发重击。',
    },
    {
      level: 13,
      name: '死里逃生',
      nameEn: 'Cheat Death',
      desc: '当生命值降至0但未被直接杀死时，可以改为降至1点，并恢复等于枪手等级的生命值。完成短休或长休前不可再次使用。',
    },
    {
      level: 15,
      name: '致命赌注',
      nameEn: 'Deadly Wager',
      desc: '每当你掷先攻或造成重击时，恢复一颗已消耗的风险骰。',
    },
    {
      level: 17,
      name: '超量杀伤',
      nameEn: 'Overkill',
      desc: '使用远程武器造成伤害时，若伤害骰未添加属性调整值，则可以添加属性调整值；若已添加，则目标额外承受1d8点该武器类型的伤害。具有火器属性的武器伤害骰如无特殊情况不添加属性调整值。',
    },
    {
      level: 18,
      name: '致命射击精通',
      nameEn: 'Critical Shot Mastery',
      desc: '你使用远程武器攻击时，d20骰值为17至20即触发重击。',
    },
    {
      level: 19,
      name: '传奇恩惠',
      nameEn: 'Epic Boon',
      desc: '获得一个自选的传奇恩惠专长或符合先决条件的其他专长，推荐不可阻攻之恩惠。',
    },
    {
      level: 20,
      name: '爆头',
      nameEn: 'Headshot',
      desc: '使用远程武器造成重击时，可以发动爆头：若目标生命值低于100则立即死亡；否则额外承受10d10点该武器类型伤害。完成短休或长休后恢复使用次数，也可以消耗3颗风险骰立即恢复使用次数，无需动作。',
    },
  ],
  subclasses: [
    {
      id: 'sharpshooter',
      name: '神枪手',
      nameEn: 'Sharpshooter',
      tagline: '百步穿杨，弹无虚发',
      color: '#4C6474',
      desc: '神枪手追求极致精准。每场战斗都应始于一声轰鸣，终于一片死寂。',
      features: [
        { level: 3, name: '鹰眼', nameEn: 'Eagle Eye', desc: '战技。每回合一次，远程攻击检定未命中时，可以消耗1颗风险骰并将骰值加入检定结果，可能使攻击命中。' },
        { level: 3, name: '神射手架势', nameEn: 'Marksman Stance', desc: '处于倒地状态时，你的远程攻击检定不受劣势影响。你只需花费5尺移动即可结束自己的倒地状态。' },
        { level: 6, name: '隐匿阵地', nameEn: 'Concealed Position', desc: '处于倒地状态时，即使未处于重度遮蔽或四分之三、全身掩护后，也可以执行躲藏动作；离开倒地状态则隐形终止。躲藏状态下攻击未命中时，不会暴露位置。' },
        { level: 10, name: '重新定位', nameEn: 'Reposition', desc: '生物对你的攻击未命中时，可以使用反应结束自己的倒地状态，并移动至多一半速度的距离。' },
        { level: 14, name: '凝神射击', nameEn: 'Focused Shot', desc: '执行攻击动作时，可以只发动一次远程攻击。该次攻击检定具有优势，命中即视为重击。' },
      ],
    },
    {
      id: 'gambler',
      name: '豪赌客',
      nameEn: 'Gambler',
      tagline: '运气无常，除非你敢于加注',
      color: '#7B4B68',
      desc: '豪赌客将牌术、骰技与枪法熔于一炉。他们榨干运气后仍会加注。',
      features: [
        { level: 3, name: '扑克脸', nameEn: 'Poker Face', desc: '获得所有赌具的熟练项，并从欺瞒、洞悉、察觉中选择一项获得熟练。' },
        { level: 3, name: '赌徒诈术', nameEn: 'Gambler Trick', desc: '战技。以附赠动作消耗1颗风险骰。将一次远程武器伤害骰改为暗骰，并声明任意伤害总值。DM可以质疑：若你撒谎，实际伤害减半；若你说真话，实际伤害翻倍；若不质疑，则按声明值结算。' },
        { level: 6, name: '风险交易', nameEn: 'Risky Business', desc: '每回合一次，当你对敌人的攻击检定没有劣势时，可以主动令本次攻击检定具有劣势，同时恢复1颗风险骰。' },
        { level: 10, name: '风险掌控', nameEn: 'Risk Taker', desc: '发动特立独行或千钧一发战技时不再消耗风险骰，但改为投掷d6用作检定。' },
        { level: 14, name: '孤注一掷', nameEn: 'Double or Nothing', desc: '远程武器造成重击时，可以投d20赌博。若结果大于等于11，伤害骰投四次；若结果小于等于10，该次重击降为普通命中。' },
      ],
    },
    {
      id: 'secret-agent',
      name: '秘密特工',
      nameEn: 'Secret Agent',
      tagline: '知识即力量，枪火只是句点',
      color: '#56655C',
      desc: '秘密特工接受隐秘行动训练，以工具、伪装、话术和枪技击溃敌人。',
      features: [
        { level: 3, name: '特工训练', nameEn: 'Agent Training', desc: '习得自定义戏法无声射击，施法关键属性从智力、感知、魅力中选择一项。获得易容工具与盗贼工具并熟练使用；从欺瞒、调查、游说、巧手、隐匿中选择两项技能熟练。' },
        { level: 3, name: '临别一击', nameEn: 'Parting Shot', desc: '战技。在你的回合执行疾走、撤离或闪避动作时，以附赠动作消耗1颗风险骰，发动一次远程武器攻击。命中时将风险骰加入伤害骰。' },
        { level: 6, name: '野战技巧', nameEn: 'Fieldcraft', desc: '可以用易容工具制作一套伪装服饰，并以附赠动作穿戴。进行魅力（欺瞒）或魅力（游说）检定时，d20骰值小于等于9时视为10。' },
        { level: 10, name: '脱身计策', nameEn: 'Escape Plan', desc: '受到伤害时，可以用反应获得隐形状态，持续至下回合开始，并立即移动至多10尺。短休或长休后恢复使用次数，也可消耗1颗风险骰立即恢复，无需动作。' },
        { level: 14, name: '击杀许可', nameEn: 'License to Kill', desc: '远程武器造成伤害时，可以消耗1至2颗风险骰并加入伤害骰。若骰出风险骰最大值，可以免费重投并累加伤害，且可连锁触发。可加入的风险骰总数上限等于熟练加值。' },
      ],
    },
    {
      id: 'spellshot',
      name: '咒弹枪手',
      nameEn: 'Spellshot',
      tagline: '以奥术为火药，以咒语为子弹',
      color: '#5B5A9A',
      desc: '咒弹枪手将奥术能量装入枪膛，以射击引导法术。',
      spellList: 'wizard',
      spellcastingAbility: '智力',
      spellcastingType: 'standard',
      spellcastingProgression: gunslingerSpellcastingProgression,
      features: [
        { level: 3, name: '施法能力', nameEn: 'Spellcasting', desc: '从法师法术列表选择2个戏法，并准备3个1环法师法术。你使用智力施法。每次提升枪手等级时，可以替换1个已知戏法和1个准备法术。10级时额外习得1个法师戏法。可以使用奥术法器或远程武器作为法师法术的法器。法术位和准备法术数量随枪手等级提升。' },
        { level: 3, name: '砰然毙命', nameEn: 'Bang, You’re Dead!', desc: '习得自定义戏法指枪。以指枪命中目标时，可以用附赠动作消耗1颗风险骰，并将其加入伤害骰。' },
        { level: 6, name: '法术射击', nameEn: 'Spellshot', desc: '当你在回合内执行攻击动作时，可以用施放一个施法时间为动作的法师戏法替换其中一次攻击。' },
        { level: 10, name: '抗魔专精', nameEn: 'Antimagic Expert', desc: '破魔击：远程攻击检定时，短暂压制目标所有防护魔法，目标也无法用反应施法应对此次攻击。抑魔射击：目标受到你内脏射击影响期间无法施法或执行魔法动作，且维持专注的体质豁免具有劣势。魔法耐性：法术或魔法效应豁免失败时，可以用反应投1d6加入豁免结果。' },
        { level: 14, name: '魔弹', nameEn: 'Magic Bullet', desc: '战技。以附赠动作消耗1颗风险骰。当进行法术攻击检定时，可以改为发动一次远程武器攻击，将风险骰加入此次攻击检定；命中时造成武器正常伤害与原法术攻击效果。' },
      ],
    },
    {
      id: 'trickster',
      name: '骗术师',
      nameEn: 'Trickster',
      tagline: '真正的精准，也可以拐几个弯',
      color: '#8B6C3E',
      desc: '骗术师以跳弹和障眼手段改写弹道，让看似落空的射击再次构成威胁。',
      features: [
        { level: 3, name: '创意弹道', nameEn: 'Creative Trajectory', desc: '你的远程武器攻击无视半身掩护与四分之三掩护。' },
        { level: 3, name: '跳弹', nameEn: 'Ricochet', desc: '战技。远程武器攻击未命中时，以附赠动作消耗1颗风险骰，重投该攻击检定并将风险骰加入新结果。必须采用新骰值。' },
        { level: 6, name: '炫技枪术', nameEn: 'Fancy Gunplay', desc: '每回合一次，使用远程武器进行魅力（表演）或敏捷（巧手）检定时，可以投一颗风险骰加入结果且不消耗该骰。你的回合内，为具有装填属性的武器装弹时，无需消耗动作或附赠动作。' },
        { level: 10, name: '灵巧格挡', nameEn: 'Deft Deflection', desc: '战技。当30尺内盟友被攻击命中时，若你正持握远程武器，可以用反应消耗1颗风险骰，使该盟友获得千钧一发战技的效果。' },
        { level: 14, name: '弹跳射击', nameEn: 'Pinball Shot', desc: '每回合一次，远程武器攻击命中生物时，可以对首个目标30尺内另一目标发动攻击检定。命中后可继续连锁，至多累计5次攻击，且同一生物仅能被攻击一次。短休或长休后恢复使用次数，也可消耗2颗风险骰立即恢复，无需动作。' },
      ],
    },
    {
      id: 'white-hat',
      name: '白盔执法官',
      nameEn: 'White Hat',
      tagline: '护佑盟友，恪守律法',
      color: '#6A7180',
      desc: '白盔执法官精通致命武器，却以护友周全和兵不血刃为愿。',
      features: [
        { level: 3, name: '律法护言', nameEn: 'Covering Word', desc: '战技。以附赠动作消耗1颗风险骰，指定60尺内可见盟友，使其获得等于风险骰骰值的临时生命值。直至你的下回合开始，若该盟友被攻击命中，你可以用反应对攻击者发动一次远程武器攻击。' },
        { level: 3, name: '铁眸灵光', nameEn: 'Steely-Eyed Aura', desc: '你散发10尺光环。你和范围内盟友为避免或结束恐慌状态而进行的豁免具有优势。你处于失能状态时灵光失效。' },
        { level: 6, name: '冲天威喝', nameEn: 'Reach for the Skies', desc: '对生物造成重击时，可以放弃嵌入弹丸，改为勒令目标投降。目标必须通过对抗你战技豁免DC的感知豁免，否则陷入恐慌和失能状态，持续1分钟。目标受伤、你失能或死亡时效应提前结束；目标每回合结束时可重复豁免。' },
        { level: 10, name: '律法天网', nameEn: 'Long Arm of the Law', desc: '每回合一次，使用远程武器命中大型或更小体型生物时，可以拘束目标。目标下回合无法移动，除非先执行撤离动作。这并非束缚状态。' },
        { level: 14, name: '金星英雄', nameEn: 'Gold Star Hero', desc: '铁眸灵光范围扩大至30尺。发动律法护言时，盟友同时获得钝击、穿刺和挥砍伤害抗性，持续至你的下回合开始。冲天威喝豁免失败时，目标陷入震慑状态，取代失能状态。' },
      ],
    },
  ],
  progression: [
    {
      level: 1,
      choices: [
        { id: 'skills', kind: 'skillProficiency', source: 'classSkillChoices' },
        { id: 'fighting-style', kind: 'fightingStyleFeat', label: '战斗风格' },
      ],
    },
    { level: 3, choices: [{ id: 'subclass', kind: 'subclass' }] },
    { level: 4, choices: [{ id: 'feat-4', kind: 'generalFeat', minLevel: 4 }] },
    { level: 8, choices: [{ id: 'feat-8', kind: 'generalFeat', minLevel: 8 }] },
    { level: 12, choices: [{ id: 'feat-12', kind: 'generalFeat', minLevel: 12 }] },
    { level: 16, choices: [{ id: 'feat-16', kind: 'generalFeat', minLevel: 16 }] },
    { level: 19, choices: [{ id: 'feat-19', kind: 'generalFeat', minLevel: 19 }] },
  ],
}
