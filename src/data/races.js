const raceImages = {
  aasimar: new URL('../assets/images/asimo.png', import.meta.url).href,
  dwarf: new URL('../assets/images/airen.png', import.meta.url).href,
  halfling: new URL('../assets/images/banshenren.png', import.meta.url).href,
  dragonborn: new URL('../assets/images/longyi.png', import.meta.url).href,
  elf: new URL('../assets/images/jingling.png', import.meta.url).href,
  goliath: new URL('../assets/images/geliya.png', import.meta.url).href,
  human: new URL('../assets/images/renlei.png', import.meta.url).href,
  tiefling: new URL('../assets/images/tifulin.png', import.meta.url).href,
  orc: new URL('../assets/images/shouren.png', import.meta.url).href,
  gnome: new URL('../assets/images/zhuru.png', import.meta.url).href,
}

export const races = [
  {
    id: 'aasimar',
    skillProficiency: null,
    name: '阿斯莫',
    nameEn: 'Aasimar',
    lore: '灵魂承载上层位面之火花，却仍有凡性。他们能用那火花的力量引来光明、治愈，或是天怒。',
    fullLore: `阿斯莫（音近 AH-sih-mar）的灵魂承载着上层位面 Upper Planes 之火花，但仍有凡性。他们有些是天使们的血嗣，有些则承接了天界之力，但都能用那火花的力量引来光明，治疗或是天怒。

阿斯莫可能在任何凡命族群中出现。他们的样貌和父母相似，但是寿命却能长达 160 岁，并且携带着代表其天族传承的特征，比如说金属般的雀斑，闪耀的双眼，头顶光圈，或者天使般的肤色（即银色、亮绿色，或者红铜色）。这些特征都是阿斯莫与生俱来的，并且会随着他们天界本质的显露而愈发醒目。`,
    type: '类人',
    size: '中型或小型',
    sizeOptions: ['中型（约 4–7 尺高）', '小型（约 2–4 尺高）'],
    speed: 30,
    lifespan: 160,
    color: '#9B7FD4',
    image: raceImages.aasimar,
    /* 角色卡用到的机械数据 */
    mechanics: {
      speed: 30,
      darkvision: 60,
      hpBonusPerLevel: 0,
      damageResistances: ['光耀 Radiant', '暗蚀 Necrotic'],
      cantrips: ['光亮术 Light（魅力）'],
      languages: ['通用语', '额外一门语言（自选）'],
    },
    traits: [
      {
        id: 'celestial-resistance',
        name: '天界抗性',
        nameEn: 'Celestial Resistance',
        desc: '你对光耀和暗蚀伤害有抗性。',
      },
      {
        id: 'darkvision',
        name: '黑暗视觉',
        nameEn: 'Darkvision',
        desc: '你拥有 60 尺黑暗视觉。',
      },
      {
        id: 'healing-hands',
        name: '治愈之手',
        nameEn: 'Healing Hands',
        desc: '以一个魔法动作，你触碰一个生物，并掷数量等于你熟练加值的 d4 骰。该生物恢复等于掷骰总值的生命值。每次长休后可重新使用。',
      },
      {
        id: 'light-bearer',
        name: '光辉掌者',
        nameEn: 'Light Bearer',
        desc: '你习得光亮术（Light）戏法，施法属性为魅力。',
      },
      {
        id: 'celestial-revelation',
        name: '天启',
        nameEn: 'Celestial Revelation',
        desc: '3 级时，你获得以一个附赠动作变身的能力，持续 1 分钟。变身期间每回合一次，对目标造成伤害时可额外造成等于熟练加值的伤害（光耀或暗蚀）。每次长休后可重新使用。\n\n变身选项：\n\n天堂飞翼 Heavenly Wings\n你的后背暂时伸出两片灵体飞翼。直到变身结束前，你获得等于你速度的飞行速度。\n\n内耀辉光 Inner Radiance\n你的双眼与嘴巴暂时放出灼热的光芒。持续时间内，你散发出 10 尺明亮光照和再往外 10 尺的微光光照。在你每个回合结束时，每个位于你 10 尺内的生物都会受到等于你熟练加值的光耀伤害。\n\n死灵环绕 Necrotic Shroud\n你的双目暂时变得如同黑暗深潭，无法飞行的双翼从你的背上涌出。除你盟友外，任何在你 10 尺内可以看你的生物都必须通过一次魅力豁免检定（DC = 8 + 你的熟练加值 + 你的魅力调整值），否则将会陷入恐慌状态直到你的下一个回合结束。',
      },
    ],
  },

  {
    id: 'dwarf',
    skillProficiency: null,
    name: '矮人',
    nameEn: 'Dwarf',
    lore: '被锻造之神从大地中唤醒，矮人对石头与金属有天然的亲和力，如同群山一样坚韧不拔。',
    fullLore: `远古时代，矮人被锻造之神从大地中唤醒。这位创造了矮人的神祇在不同世界有不同的名字——莫拉丁 Moradin，李奥克斯 Reorx 等等。祂赋予了矮人对石头、金属与地下生活的亲和力，还赋予了他们如同群山一样坚韧不拔的耐性，以及他们长达 350 岁的寿命。

最初的矮人身材矮胖，常蓄胡须，在山崖和地底开凿城市与要塞。矮人中最为古老传说讲述着它们与可怕怪物们的纷争，它们的战场遍布群峦之巅与幽暗地域，力战塔楼般高大的巨人与伏于大地之下的恐怖。无论是何种文化的矮人都深受这些故事的鼓舞，它们因此而喜欢高歌英勇壮举——尤其是以弱胜强的伟大事迹。

在多元宇宙的某些世界中，最初的矮人定居点位于丘陵和山地中，源自这些定居点的矮人氏族通常会分别自称为丘陵矮人和山地矮人。`,
    type: '类人',
    size: '中型',
    sizeOptions: ['中型（约 5–6 尺高）'],
    speed: 30,
    lifespan: 350,
    color: '#8B6914',
    image: raceImages.dwarf,
    mechanics: {
      speed: 30,
      darkvision: 120,
      hpBonusPerLevel: 1,
      damageResistances: ['毒素 Poison'],
      savingThrowAdvantages: ['中毒状态豁免具有优势'],
      cantrips: [],
      languages: ['通用语', '矮人语'],
    },
    traits: [
      {
        id: 'darkvision',
        name: '黑暗视觉',
        nameEn: 'Darkvision',
        desc: '你拥有 120 尺黑暗视觉。',
      },
      {
        id: 'dwarven-resilience',
        name: '矮人体魄',
        nameEn: 'Dwarven Resilience',
        desc: '你对毒素伤害具有抗性。在进行避免或结束中毒状态的豁免检定时具有优势。',
      },
      {
        id: 'dwarven-toughness',
        name: '矮人刚毅',
        nameEn: 'Dwarven Toughness',
        desc: '你的生命值最大值加 1，且此后每次升级时再加 1。',
      },
      {
        id: 'stonecunning',
        name: '石中精妙',
        nameEn: 'Stonecunning',
        desc: '以一个附赠动作，你获得 60 尺震颤感知，持续 10 分钟（需位于或触碰石质平面）。可使用次数等于熟练加值，长休后重获全部使用次数。',
      },
    ],
  },

  {
    id: 'halfling',
    skillProficiency: null,
    name: '半身人',
    nameEn: 'Halfling',
    lore: '受生命、家园与壁炉之神的宠爱，生来便有令人惊叹的好运，以及勇于冒险的精神。',
    fullLore: `半身人，受到生命、家园和壁炉之神的宠爱与引导，被唤往田园牧歌的天堂，在那里，家庭和社区塑造了他们的生活。传说许多半身人有着勇敢冒险的精神，带他们踏上探索之路，让他们能够探索更大的世界，结交新朋友。他们和人类孩童近似的体型——也能帮助他们避免任何不必要的纠缠，在狭小空间进退自如。

任何与半身人相处过的人，尤其是和半身人冒险者相处过的人，都可能目睹过传说中的"半身人好运"。当一个半身人处于致命危险中时，似乎有一种看不见的力量会对他进行干预。许多半身人迷信运气的力量，他们把自己独特的天赋归因于一个或多个仁慈的神，包括悠妲拉 Yondalla、布兰多布李斯 Brandobaris 和楚玛琳 Charmalaine。这些天赋也带来了他们的悠长寿命（大约 450 年）。

那些喜欢住在地下的半身人有时被称为强心半身人或敦实半身人。而游牧半身人，以及那些生活在人类和其他高个子中间的人，有时被称为轻足半身人或高挑半身人。`,
    type: '类人',
    size: '小型',
    sizeOptions: ['小型（约 2–3 尺高）'],
    speed: 30,
    lifespan: 450,
    color: '#5AA060',
    image: raceImages.halfling,
    mechanics: {
      speed: 30,
      darkvision: 0,
      hpBonusPerLevel: 0,
      damageResistances: [],
      savingThrowAdvantages: ['避免/结束恐慌状态的豁免具有优势'],
      cantrips: [],
      languages: ['通用语', '半身人语'],
    },
    traits: [
      {
        id: 'brave',
        name: '勇气',
        nameEn: 'Brave',
        desc: '你在进行避免或结束恐慌（Frightened）状态的豁免时具有优势。',
      },
      {
        id: 'halfling-nimbleness',
        name: '半身人灵巧',
        nameEn: 'Halfling Nimbleness',
        desc: '你可以穿越任何体形比你大的生物所在空间，但不能在其内停下。',
      },
      {
        id: 'lucky',
        name: '幸运',
        nameEn: 'Lucky',
        desc: '当你在 d20 检定上掷出 1 时，你可以重掷一次，但必须使用重掷的结果。',
      },
      {
        id: 'naturally-stealthy',
        name: '天生善匿',
        nameEn: 'Naturally Stealthy',
        desc: '当你仅被比你大 1 级的生物遮蔽时，你也可以进行躲藏动作。',
      },
    ],
  },

  {
    id: 'dragonborn',
    skillProficiency: null,
    name: '龙裔',
    nameEn: 'Dragonborn',
    lore: '龙裔的先祖由金属龙与色彩龙的龙蛋孵化而来，承载着龙神巴哈姆特或提亚玛特的祝福，天生携有龙息与飞翼潜能。',
    fullLore: `龙裔（Dragonborn）的先祖由金属龙和色彩龙的龙蛋孵化而来。有故事传言，这些龙蛋乃是得到了龙神巴哈姆特 Bahamut 或提亚玛特 Tiamat 的祝福，应两位希望让多元宇宙布满自己造物的愿景而生。但也有故事称，最初的龙裔是由巨龙们独立制造，与神无关。无论起源如何，龙裔都已经在物质位面 Material Plane 中扎根落地，繁衍生息。

龙裔看起来就如同双足行走的无翼巨龙——明亮而灼热的眼瞳，头顶细长的骨角，其独有的色泽和其他特征更是彰显着其龙类先祖。龙裔的外貌和吐息武器由其龙族血统决定：黑龙/赤铜龙→强酸，蓝龙/青铜龙→闪电，绿龙→毒素，红龙/黄铜龙/金龙→火焰，白龙/银龙→寒冷。

到达5级时，龙裔将能以附赠动作召唤出灵体飞翼，暂时获得飞行能力，彻底展现其龙族传承的潜力。`,
    type: '类人',
    size: '中型',
    sizeOptions: ['中型（约 5–7 尺高）'],
    speed: 30,
    lifespan: 80,
    color: '#C04040',
    image: raceImages.dragonborn,
    mechanics: {
      speed: 30,
      darkvision: 60,
      hpBonusPerLevel: 0,
      damageResistances: ['依龙族血统决定'],
      breathWeapon: '吐息武器（替换一次攻击，1d10 起，随熟练加值提升）',
      cantrips: [],
      languages: ['通用语', '龙语'],
    },
    traits: [
      {
        id: 'draconic-ancestry',
        name: '龙族血统',
        nameEn: 'Draconic Ancestry',
        desc: '你的血脉可以追溯到某种巨龙祖先。从以下龙种中选择一种，你的吐息武器与伤害抗性特质由此决定，你的外表也受此影响。\n\n黑龙→强酸　蓝龙→闪电　绿龙→毒素　红龙→火焰　白龙→寒冷\n黄铜龙→火焰　青铜龙→闪电　赤铜龙→强酸　金龙→火焰　银龙→寒冷',
      },
      {
        id: 'breath-weapon',
        name: '吐息武器',
        nameEn: 'Breath Weapon',
        desc: '每当你在自己回合内进行攻击动作时，你可以将其中一次攻击替换为释放魔法能量：覆盖 15 尺锥形或 30 尺长 5 尺宽线形（每次选择一种）。范围内的生物须通过敏捷豁免（DC = 8 + 体质调整值 + 熟练加值），失败受到伤害，成功减半。\n\n伤害：1d10（5 级升至 2d10，11 级 3d10，17 级 4d10）。伤害类型依龙族血统而定。\n\n可使用次数等于熟练加值，长休后重获全部次数。',
      },
      {
        id: 'damage-resistance-dragon',
        name: '伤害抗性',
        nameEn: 'Damage Resistance',
        desc: '你对龙族血统对应伤害类型具有抗性。',
      },
      {
        id: 'darkvision-dragon',
        name: '黑暗视觉',
        nameEn: 'Darkvision',
        desc: '你拥有 60 尺黑暗视觉。',
      },
      {
        id: 'draconic-flight',
        name: '龙族飞翼',
        nameEn: 'Draconic Flight',
        desc: '当你到达 5 级时，你获得引导体内龙之魔法的能力。以一个附赠动作，你的后背临时伸出两片灵体飞翼，持续 10 分钟或直到你主动收起（无需动作）或陷入失能。持续时间内，你获得等于你速度的飞行速度。飞翼外观如同龙息武器对应的能量凝聚而成。长休后可重新使用。',
      },
    ],
  },

  {
    id: 'elf',
    skillProficiency: { choose: 1, options: ['洞悉', '察觉', '求生'] },
    name: '精灵',
    nameEn: 'Elf',
    lore: '由大神科瑞隆所创，精灵的灵魂在妖精荒野中孕育，不需睡眠，感知敏锐，双耳尖尖，寿命长达七百余年。',
    fullLore: `由大神科瑞隆所创造的原初精灵们曾能随意改变自身形态，但因一场古老的背叛而被永久剥夺了这种能力。此后，大多数精灵退回到妖精荒野 Feywild，在那个位面的影响下深化了他们的悲伤与好奇心，随后开始探索包括物质位面在内的各个存在位面。

精灵双耳尖尖，少有胡须和体毛，寿命长达 750 岁。他们不需要睡眠，而是进入被称为"出神"（Trance）的冥想状态——每天仅需 4 小时，在此期间他们仍能感知周围环境，并沉浸于自己的记忆与冥思之中。

精灵在一地居住千年后，环境会微妙地改变他们，使其获得特定的魔法。**卓尔 Drow** 是幽暗地域的精灵，暗视极强，掌握黑暗与妖火之法；**高等精灵 High Elf** 深受仙境魔力浸润，具有强烈的法术亲和；**木精灵 Wood Elf** 承载原初森林的魔力，奔行迅疾，悄无声息。`,
    type: '类人',
    size: '中型',
    sizeOptions: ['中型（约 5–6 尺高）'],
    speed: 30,
    lifespan: 750,
    color: '#4A9E8A',
    image: raceImages.elf,
    mechanics: {
      speed: 30,
      darkvision: 60,
      hpBonusPerLevel: 0,
      damageResistances: [],
      savingThrowAdvantages: ['避免/结束魅惑状态的豁免具有优势'],
      cantrips: ['依精灵血系选择'],
      languages: ['通用语', '精灵语'],
    },
    traits: [
      {
        id: 'darkvision-elf',
        name: '黑暗视觉',
        nameEn: 'Darkvision',
        desc: '你拥有 60 尺黑暗视觉。',
      },
      {
        id: 'elven-lineage',
        name: '精灵血系',
        nameEn: 'Elven Lineage',
        desc: '你属于一支精灵血系，因此获得超自然能力。选择以下一种：\n\n卓尔 Drow：黑暗视觉提升至 120 尺，习得舞光术（Dancing Lights）戏法；3 级起长休后可施放妖火（Faerie Fire）一次；5 级起长休后可施放黑暗术（Darkness）一次。\n\n高等精灵 High Elf：习得法师法术列表中一个自选戏法（长休后可替换为另一个）；3 级起长休后可施放侦测魔法（Detect Magic）一次；5 级起长休后可施放迷踪步（Misty Step）一次。\n\n木精灵 Wood Elf：速度提升至 35 尺，习得德鲁伊伎俩（Druidcraft）戏法；3 级起长休后可施放大步奔行（Longstrider）一次；5 级起长休后可施放行动无踪（Pass without Trace）一次。\n\n施法属性为智力、感知或魅力（角色创建时三选一）。也可消耗相应环阶法术位施放。',
      },
      {
        id: 'fey-ancestry',
        name: '精类血统',
        nameEn: 'Fey Ancestry',
        desc: '你在进行避免或结束魅惑（Charmed）状态的豁免时具有优势。',
      },
      {
        id: 'keen-senses',
        name: '敏锐感官',
        nameEn: 'Keen Senses',
        desc: '你在洞悉（Insight）、察觉（Perception）或求生（Survival）技能之一上具有熟练加值（角色创建时选择）。',
      },
      {
        id: 'trance',
        name: '出神',
        nameEn: 'Trance',
        desc: '你不需要睡眠，魔法也不能使你陷入睡眠。你可以用 4 小时完成长休，但期间必须处于出神的冥想状态，在此期间你能保持意识清醒。',
      },
    ],
  },

  {
    id: 'goliath',
    skillProficiency: null,
    name: '歌利亚',
    nameEn: 'Goliath',
    lore: '歌利亚比绝大多数族裔更高，巨人是这一族的远祖，每一个歌利亚都承载着元祖巨人的祝福，能暂时接近巨人先祖的高度。',
    fullLore: `歌利亚（Goliath）比绝大多数族裔更高，巨人是这一族的远祖。每一个歌利亚都承载着元祖巨人的祝福，这些祝福体现在各种超自然恩惠中，包括快速成长并暂时接近巨人先祖高度的能力。

歌利亚的身体特征让人联想到家族血系来源的巨人。例如，一些歌利亚看起来像石巨人，而另一些则像火巨人。无论其宗族来于何种巨人，免受巨人多年内战蹂躏的歌利亚，都在多元宇宙中开辟了自己的道路，并试图超越祖先所达到的高度。

歌利亚的寿命与人类相近，约为 80 年，但他们身材高大健壮，通常在 7 尺以上，皮肤上常有灰白或深色斑纹。5 级时，歌利亚能以附赠动作将自身变为大型体型，进行力量检定具有优势，速度额外增加 10 尺，每次长休后可重用。`,
    type: '类人',
    size: '中型',
    sizeOptions: ['中型（约 7–8 尺高）'],
    speed: 35,
    lifespan: 80,
    color: '#7A8FA6',
    image: raceImages.goliath,
    mechanics: {
      speed: 35,
      darkvision: 0,
      hpBonusPerLevel: 0,
      damageResistances: [],
      cantrips: [],
      languages: ['通用语', '巨人语'],
    },
    traits: [
      {
        id: 'giant-ancestry',
        name: '巨人先祖',
        nameEn: 'Giant Ancestry',
        desc: '你是巨人的后裔。选择以下超自然恩惠之一：\n\n云之远迹 Cloud\'s Jaunt（云巨人）：以一个附赠动作，你可以魔法地传送到 30 尺内你能看到的未占空间。\n\n火之燃烧 Fire\'s Burn（火巨人）：当你以攻击检定击中目标造成伤害时，你可以额外造成 1d10 点火焰伤害。\n\n霜之刺骨 Frost\'s Chill（霜巨人）：当你以攻击检定击中目标造成伤害时，你可以额外造成 1d6 点寒冷伤害，并直到你的下一回合开始，其速度降低 10 尺。\n\n山之翻撞 Hill\'s Tumble（山丘巨人）：当你击中大型或更小体型的生物并造成伤害时，你可以令其陷入倒地状态。\n\n石之坚韧 Stone\'s Endurance（石巨人）：当你受到伤害时，你可以用反应掷 1d12 并加上体质调整值，减少等量的伤害。\n\n风暴之鸣 Storm\'s Thunder（风暴巨人）：当你被 60 尺内的生物造成伤害时，你可以用反应对该生物造成 1d8 点雷鸣伤害。\n\n可使用次数等于熟练加值，长休后重获全部次数。',
      },
      {
        id: 'large-form',
        name: '大型形态',
        nameEn: 'Large Form',
        desc: '从第 5 级开始，你可以用附赠动作将自己体型变为大型（只要所处空间足够），持续 10 分钟或直到你主动结束（无需动作）。在此期间，你进行力量检定具有优势，速度增加 10 尺。长休后可重新使用。',
      },
      {
        id: 'powerful-build',
        name: '身强力壮',
        nameEn: 'Powerful Build',
        desc: '你为摆脱受擒（Grappled）状态所作的检定具有优势。计算你的负重时，视为大一级的体型。',
      },
    ],
  },

  {
    id: 'human',
    skillProficiency: { choose: 1, options: 'any' },
    name: '人类',
    nameEn: 'Human',
    lore: '在整个多元宇宙中，人类因其数量庞大而各具特色，他们会努力在有限的岁月中取得尽可能多的成就。',
    fullLore: `在整个多元宇宙中，人类因其数量庞大而各具特色。他们会努力在有限的岁月中取得尽可能多的成就。在许多世界里，他们的雄心壮志和足智多谋都受赞扬、尊重和敬畏。

人类的外貌就像地球上的人一样多样，他们也同样信奉许多的神祇。学者们对人类的起源争议不休，但据说已知最早的人类聚居地是在印记城 Sigil——那座位于多元宇宙中心的环形城市，通用语诞生的城市。从那里开始，人类带着门之城的世界主义走到了多元宇宙的每个角落。

人类的体型因地区和文化背景差异极大，寿命大约为 80 年。他们没有精灵的长寿、矮人的耐性或龙裔的龙息，但这恰恰造就了他们最大的优势——极强的适应力和学习速度。每次长休后获得英雄激励，随时能爆发出超乎寻常的潜力。`,
    type: '类人',
    size: '中型或小型',
    sizeOptions: ['中型（约 4–7 尺高）', '小型（约 2–4 尺高）'],
    speed: 30,
    lifespan: 80,
    color: '#C9A84C',
    image: raceImages.human,
    mechanics: {
      speed: 30,
      darkvision: 0,
      hpBonusPerLevel: 0,
      damageResistances: [],
      cantrips: [],
      languages: ['通用语', '额外一门语言（自选）'],
    },
    traits: [
      {
        id: 'resourceful',
        name: '适应力',
        nameEn: 'Resourceful',
        desc: '当你完成长休时，你获得英雄激励（Heroic Inspiration）。',
      },
      {
        id: 'skillful',
        name: '技能',
        nameEn: 'Skillful',
        desc: '你获得一项自选的技能作为熟练。',
      },
      {
        id: 'versatile',
        name: '多才多艺',
        nameEn: 'Versatile',
        desc: '你获得一项自选的起源专长（Origin Feat）。推荐选择熟习（Skilled）。',
      },
    ],
  },

  {
    id: 'tiefling',
    skillProficiency: null,
    name: '提夫林',
    nameEn: 'Tiefling',
    lore: '提夫林要么出生在下层位面，要么有来自那里的祖先，邪魔遗赠带来力量，但对道德观念毫无影响。',
    fullLore: `提夫林（音近 TEE-fling）要么出生在下层位面，要么有来自那里的祖先。提夫林会与魔鬼、恶魔或其他邪魔有着血缘关系。而这种与下层位面的联系是提夫林所承继的邪魔遗赠，它带有着力量，但对提夫林的道德观念没有影响。

提夫林需要选择他们想要接受或厌恨的邪魔遗赠，共有三种：

**深渊 Abyssal** — 无底深渊的增熵、喧癫空隧的混乱、卡瑟利的绝望呼唤着这些提夫林。犄角、皮毛、长牙和特殊的气味是他们的身体特征，血管里奔流着恶魔之血。

**幽冥 Chthonic** — 感受卡瑟利的泥淖、焦炎地狱的贪婪与哈迪斯的阴暗。这些提夫林有的肤色苍白如死尸，另一些则如同梦魔与魅魔般美丽。

**炼狱 Infernal** — 绑定于焦炎地狱与九层地狱。魔角、尖刺、尾巴、金色的眼睛和一股淡淡的硫磺或硝烟味，是这些提夫林共有的身体特征，他们中大多数都有一位魔鬼祖先。`,
    type: '类人',
    size: '中型或小型',
    sizeOptions: ['中型（约 6–7 尺高）', '小型（约 3–4 尺高）'],
    speed: 30,
    lifespan: 110,
    color: '#8B3A6E',
    image: raceImages.tiefling,
    mechanics: {
      speed: 30,
      darkvision: 60,
      hpBonusPerLevel: 0,
      damageResistances: ['依邪魔遗赠决定'],
      cantrips: ['奇术 Thaumaturgy', '依邪魔遗赠选择一项'],
      languages: ['通用语', '下层位面语'],
    },
    traits: [
      {
        id: 'darkvision-tiefling',
        name: '黑暗视觉',
        nameEn: 'Darkvision',
        desc: '你拥有 60 尺黑暗视觉。',
      },
      {
        id: 'fiendish-legacy',
        name: '邪魔遗赠',
        nameEn: 'Fiendish Legacy',
        desc: '你承载着一份给予了你超自然能力的邪魔遗赠。从以下三种中选择一种，获得 1 级好处；3 级和 5 级时各习得一道更高级法术，每次长休后可不消耗法术位施放一次，也可消耗相应法术位施放。施法属性为智力、感知或魅力（选择遗赠时三选一）。\n\n深渊 Abyssal：获得毒素伤害抗性，习得毒气喷溅（Poison Spray）戏法；3 级：致病射线（Ray of Sickness）；5 级：人类定身术（Hold Person）。\n\n幽冥 Chthonic：获得暗蚀伤害抗性，习得颤栗之触（Chill Touch）戏法；3 级：虚假生命（False Life）；5 级：衰弱射线（Ray of Enfeeblement）。\n\n炼狱 Infernal：获得火焰伤害抗性，习得火焰箭（Fire Bolt）戏法；3 级：炼狱叱喝（Hellish Rebuke）；5 级：黑暗术（Darkness）。',
      },
      {
        id: 'otherworldly-presence',
        name: '异界存在',
        nameEn: 'Otherworldly Presence',
        desc: '你习得奇术（Thaumaturgy）戏法。当你用此特质施展它时，施法属性与你邪魔遗赠特质所用的属性相同。',
      },
    ],
  },

  {
    id: 'orc',
    skillProficiency: null,
    name: '兽人',
    nameEn: 'Orc',
    lore: '兽人将他们的诞生追溯到独眼之神格乌什——他赐予兽人坚韧的意志、在黑暗中视物的能力，以及绝地逢生的本能。',
    fullLore: `兽人将他们的诞生追溯到了独眼之神格乌什 Gruumsh，他是一位在无边旷野游荡的强大神明。格乌什把某些天赋武装给了他的子民，帮助他们能够漫步于广阔的平原、无垠的洞窟和翻涌的海洋之中，并面对潜伏于其中的怪物。即便他们改信别神，兽人仍带有着独眼神赐予他们的礼物：坚韧不拔、决心稳固以及在黑暗中看清事物的能力。

兽人一般都又高又壮，约 6–7 尺高，有灰色的皮肤，耳朵小而略尖，突出的下犬齿类似于獠牙。某些世界的兽人会告知年轻一辈，他们的祖先曾砥节厉行，捱受了无数苦难。受到这些故事的激励，许多兽人总是想知道格乌什会在何时召唤他们去效仿古老的英雄事迹，以及他们自己又能否配得上其恩典。

兽人的另一项独特能力是绝地逢生——当他们本该倒下时，某种来自格乌什的力量会在最后一刻维系他们的生命，让他们能够反杀敌人、赢得胜利。`,
    type: '类人',
    size: '中型',
    sizeOptions: ['中型（约 6–7 尺高）'],
    speed: 30,
    lifespan: 80,
    color: '#5A7A4A',
    image: raceImages.orc,
    mechanics: {
      speed: 30,
      darkvision: 60,
      hpBonusPerLevel: 0,
      damageResistances: [],
      cantrips: [],
      languages: ['通用语', '兽人语'],
    },
    traits: [
      {
        id: 'adrenaline-rush',
        name: '激昂冲锋',
        nameEn: 'Adrenaline Rush',
        desc: '你能以一个附赠动作执行疾走（Dash）动作。若你这样做，你还会获得等于你熟练加值的临时生命值。\n\n可使用次数等于你的熟练加值，长休后重获全部次数。',
      },
      {
        id: 'darkvision-orc',
        name: '黑暗视觉',
        nameEn: 'Darkvision',
        desc: '你拥有 60 尺黑暗视觉。',
      },
      {
        id: 'relentless-endurance',
        name: '坚韧不屈',
        nameEn: 'Relentless Endurance',
        desc: '当你生命值降至 0 而没有立即死亡时，你可以改为使生命值降至 1。长休后可重新使用。',
      },
    ],
  },

  {
    id: 'gnome',
    skillProficiency: null,
    name: '侏儒',
    nameEn: 'Gnome',
    lore: '侏儒是由发明、幻影与地下生命之神创造的魔法族裔，用机敏弥补体型上的不足，寿命长达四百余年。',
    fullLore: `侏儒（Gnome）是由发明、幻影以及地下生命之神祇所创造出来的奇妙魔法族裔。侏儒的先民们因为其神秘的天性和居住在森林与地道中的习性而很少被外人遇见。他们用机敏弥补了体型上的缺陷，用陷阱迷宫般的隧道迷惑掠夺者。他们还从像加尔·闪金、贝尔凡·野游者和巴瑞瓦·影斗篷这样会伪装拜访他们的神祇处学到了魔法，这些魔法最终创造出了岩石侏儒和森林侏儒两个血系。

侏儒们有着娇小的身材、大眼睛和尖耳朵，寿命约为 425 岁。侏儒们非常喜欢头上有"顶"的感觉，哪怕这个"顶"只不过是帽子也好。

**森林侏儒 Forest Gnome** 擅长幻影魔法与动物交流，能够施放次级幻影并与动物对话，在林间如鱼得水。

**岩石侏儒 Rock Gnome** 具有卓越的工匠技艺，不仅会修复术与魔法伎俩，还能花 10 分钟时间打造微型发条装置——小玩具、打火机或音乐盒。`,
    type: '类人',
    size: '小型',
    sizeOptions: ['小型（约 3–4 尺高）'],
    speed: 30,
    lifespan: 425,
    color: '#6A8F3A',
    image: raceImages.gnome,
    mechanics: {
      speed: 30,
      darkvision: 60,
      hpBonusPerLevel: 0,
      damageResistances: [],
      savingThrowAdvantages: ['智力、敏捷与魅力豁免检定具有优势'],
      cantrips: ['依侏儒血系选择'],
      languages: ['通用语', '侏儒语'],
    },
    traits: [
      {
        id: 'darkvision-gnome',
        name: '黑暗视觉',
        nameEn: 'Darkvision',
        desc: '你拥有 60 尺黑暗视觉。',
      },
      {
        id: 'gnome-cunning',
        name: '侏儒狡黠',
        nameEn: 'Gnome Cunning',
        desc: '你在智力、感知与魅力豁免检定上具有优势。',
      },
      {
        id: 'gnome-lineage',
        name: '侏儒血系',
        nameEn: 'Gnome Lineage',
        desc: '你属于一支侏儒血系，因此获得超自然能力。无论选择哪个血系，施法属性均为智力、感知或魅力（选择血系时三选一）。\n\n森林侏儒 Forest Gnome：你习得次级幻影（Minor Illusion）戏法。你始终准备了动物交谈（Speak with Animals）法术，可不消耗法术位施展，次数等于你的熟练加值，长休后重获全部次数。也可消耗任意法术位施展。\n\n岩石侏儒 Rock Gnome：你习得修复术（Mending）和魔法伎俩（Prestidigitation）戏法。此外，你可花费 10 分钟施展魔法伎俩来创造一个微型发条装置（AC 5，1 HP），如玩具、打火机或音乐盒；创建时从魔法伎俩的效果中选择一种，当你或其他生物以附赠动作触碰并激活它时产生效果。你同时最多拥有三台装置，每台在创建 8 小时后解体消失，也可以动作将其拆除。',
      },
    ],
  },
]
