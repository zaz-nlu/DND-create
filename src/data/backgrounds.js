import { reactive } from 'vue'

const hardcodedBackgrounds = [
  {
    id: 'acolyte',
    name: '侍僧',
    nameEn: 'Acolyte',
    lore: '在寺庙中全心侍奉，执掌祭仪崇敬神祇，在祭司的教导下掌握了引导神力的方法。',
    fullLore: `你在一座寺庙中全心全意的侍奉，或是挂单在城镇中，或是幽居在圣所。你在那里执掌祭仪崇敬一位神祇或是众神。多亏了你的祭司教导和你的虔诚，你也掌握了如何引导一点点神力来为你的崇敬祈祷和在那里祷告的人们提供司教服务。`,
    color: '#C4A45A',
    abilityScores: ['智力', '感知', '魅力'],
    feat: { name: '魔法学徒（牧师）', nameEn: 'Magic Initiate (Cleric)' },
    skills: ['洞悉', '宗教'],
    tools: ['书法工具'],
    equipment: {
      a: '书写用具、书籍（祈祷文）、圣徽、羊皮纸（10 张）、长袍、8 GP',
      b: '50 GP',
    },
  },

  {
    id: 'artisan',
    name: '工匠',
    nameEn: 'Artisan',
    lore: '从小在工坊里拖地擦洗，长大后学会制作手工艺品，锤炼出灵巧的双手与察言观色的眼力。',
    fullLore: `在你强壮到可以提起水桶，就开始在工匠工坊里以拖地和擦洗度日，每天挣那么几个铜板。当你长到成为学徒的年龄时，你就学会了自己制作基本的手工艺品，还有面对刁钻客户时该说什么好话。你的买卖也让你对消息琐事有敏锐的洞察力。`,
    color: '#8B6B42',
    abilityScores: ['力量', '敏捷', '智力'],
    feat: { name: '匠师', nameEn: 'Crafter' },
    skills: ['调查', '游说'],
    tools: ['工匠工具（自选一种）'],
    equipment: {
      a: '工匠工具（同上所选）、2 小包、旅行者服装、32 GP',
      b: '50 GP',
    },
  },

  {
    id: 'charlatan',
    name: '骗子',
    nameEn: 'Charlatan',
    lore: '穿梭于各地酒馆，用善意的谎言和伪造文件周转于人情世故，练就了无与伦比的口才与欺瞒之术。',
    fullLore: `在长大到可以买上一杯麦酒，你就很快在你出生地方圆十里内的每家酒馆里拥有了一席最中意的位置。当你在各种酒馆和酒吧间穿梭，你便学会了如何去利用那些需要一两句善意谎言安抚的苦命人——也许是一个大力丸骗局或是一封伪造的血缘证明。`,
    color: '#7A4E8C',
    abilityScores: ['敏捷', '体质', '魅力'],
    feat: { name: '熟习', nameEn: 'Skilled' },
    skills: ['欺瞒', '巧手'],
    tools: ['文书伪造工具'],
    equipment: {
      a: '文书伪造工具、表演服装、高档服装、15 GP',
      b: '50 GP',
    },
  },

  {
    id: 'criminal',
    name: '罪犯',
    nameEn: 'Criminal',
    lore: '在阴暗小巷割钱袋、盗窃商铺，或独行或入伙，在法外之地磨砺出一身灵活与警觉。',
    fullLore: `你在阴暗的小巷里靠着割钱袋和盗窃商铺勉强维持生计。也许你曾是一伙处境相同人们中的一员——成为互相扶持的法外之徒。又或者，你也许是一个孤勇者，独自照顾自己与当地的盗贼公会以及更可怕的违法者们作着斗争。`,
    color: '#8C3A3A',
    abilityScores: ['敏捷', '体质', '智力'],
    feat: { name: '警觉', nameEn: 'Alert' },
    skills: ['巧手', '隐匿'],
    tools: ['盗贼工具'],
    equipment: {
      a: '2 匕首、盗贼工具、撬棍、2 小包、旅行者服装、16 GP',
      b: '50 GP',
    },
  },

  {
    id: 'entertainer',
    name: '艺人',
    nameEn: 'Entertainer',
    lore: '年轻时随巡回演出奔走，学会走钢丝、弹鲁特琴或吟诗，在喝彩声中茁壮成长，渴望登台。',
    fullLore: `你年轻时大部分时间都在参加巡回演出和嘉年华会，为音乐家和杂技演员们做零工以换取学习的机会。你可能已经学会了如何走钢丝，如何弹奏风格独特的鲁特琴，或是用怎样无可挑剔的发音方式吟诵诗歌。而现如今，你在喝彩声中茁壮成长，渴望登上舞台。`,
    color: '#A0406E',
    abilityScores: ['力量', '敏捷', '魅力'],
    feat: { name: '音乐家', nameEn: 'Musician' },
    skills: ['体操', '表演'],
    tools: ['乐器（自选一种）'],
    equipment: {
      a: '乐器（同上所选）、2 表演服装、镜子、香水、旅行者服装、11 GP',
      b: '50 GP',
    },
  },

  {
    id: 'farmer',
    name: '农民',
    nameEn: 'Farmer',
    lore: '生在农家长在农家，年复一年照料动物和耕种土地，练就了满腔耐心与一副棒健的体魄。',
    fullLore: `你从小就生在农家地，长在农家地。多年照料动物和耕种土地带来的回报使你懂得耐心以及一个倍儿棒的健康身体。你对大自然的雨露满怀感激，同时也对大自然的雷霆敬重恭畏。`,
    color: '#5A8A42',
    abilityScores: ['力量', '体质', '感知'],
    feat: { name: '健壮', nameEn: 'Tough' },
    skills: ['驯兽', '自然'],
    tools: ['木匠工具'],
    equipment: {
      a: '镰刀、木匠工具、治疗包、铁锅、铲子、旅行者的衣服、30 GP',
      b: '50 GP',
    },
  },

  {
    id: 'guard',
    name: '警卫',
    nameEn: 'Guard',
    lore: '在塔楼驻岗站班，一眼盯着城外的掠夺者，一眼查探城内的小偷，练就了两用的警觉与运动能力。',
    fullLore: `你脚趾的疼痛让你无法忘怀在塔楼驻岗上站班的无数时光。你的训练教你一只眼睛紧盯着墙外，小心提防那附近森林而来的掠夺者，另一只眼睛则要盯着墙内，细细查探小偷小摸和惹是生非的人。`,
    color: '#5A7090',
    abilityScores: ['力量', '智力', '感知'],
    feat: { name: '警觉', nameEn: 'Alert' },
    skills: ['运动', '察觉'],
    tools: ['赌具（自选一种）'],
    equipment: {
      a: '矛、轻弩、20 弩矢、赌具（同上所选）、附盖提灯、镣铐、箭袋、旅行者服装、12 GP',
      b: '50 GP',
    },
  },

  {
    id: 'guide',
    name: '向导',
    nameEn: 'Guide',
    lore: '在野外长大，荒野就是家，探索怪物出没的森林和废弃神殿，在自然祭司处学会了荒野魔法。',
    fullLore: `你在野外长大，远离定居区。你的家就在你决定打开铺盖的任何地方。荒野中自有奇妙之处——那些奇特的怪物，原始的森林和溪流；杂草丛生的大殿废墟曾被巨人踏过，在探索它们的过程中你学会了保护自己。而时不时的，你会遇到亲爱的自然祭司，它们会指导你掌握怎样运用荒野的魔法。`,
    color: '#3D7A5A',
    abilityScores: ['敏捷', '体质', '感知'],
    feat: { name: '魔法学徒（德鲁伊）', nameEn: 'Magic Initiate (Druid)' },
    skills: ['隐匿', '求生'],
    tools: ['制图工具'],
    equipment: {
      a: '短弓、20 箭、制图工具、铺盖、箭袋、帐篷、旅行者服装、3 GP',
      b: '50 GP',
    },
  },

  {
    id: 'hermit',
    name: '隐士',
    nameEn: 'Hermit',
    lore: '隐居于世外小屋或隐修院，与世隔绝，以森林生灵为伴，在孤独中深思天道的未解之谜。',
    fullLore: `你早年住在远离居住地外，与世隔绝的小屋或是隐修院中。在那些日子里，你唯一的伙伴是森林中的生灵，以及那些偶尔带来给养和外界消息的访客。孤独让你花了很多时间琢磨天道的未解之谜。`,
    color: '#6A7A5A',
    abilityScores: ['体质', '感知', '魅力'],
    feat: { name: '医疗师', nameEn: 'Healer' },
    skills: ['医学', '宗教'],
    tools: ['草药工具'],
    equipment: {
      a: '长棍、草药工具、铺盖、书籍（哲学）、油灯、灯油（3 扁瓶）、旅行者服装、16 GP',
      b: '50 GP',
    },
  },

  {
    id: 'merchant',
    name: '商人',
    nameEn: 'Merchant',
    lore: '跟随商队师傅学习买卖之道，走遍四方，靠着交易原材料与手工制品在各地之间辗转谋生。',
    fullLore: `你曾作为一名学徒学习着商业的基础知识，你的师傅是一名商贩、商队的领队或是某位商铺的店主。你旅行八方，靠着买入和卖出工匠们所需的原材料和这些工匠的制品赚钱谋生。你可能需要把这些货物从一个地方运输到另一个地方（运用船、四轮货车或行商队），又或是从旅行商人那里订货，然后在自己店里销售。`,
    color: '#9A7830',
    abilityScores: ['体质', '智力', '魅力'],
    feat: { name: '幸运', nameEn: 'Lucky' },
    skills: ['驯兽', '游说'],
    tools: ['领航工具'],
    equipment: {
      a: '领航工具、2 小包、旅行者服装、22 GP',
      b: '50 GP',
    },
  },

  {
    id: 'noble',
    name: '贵族',
    nameEn: 'Noble',
    lore: '在城堡中伴随权力与荣耀长大，接受一流教育，耳濡目染宫廷往来，培养出领袖的才能与气度。',
    fullLore: `权力、财富还有荣耀伴随你在城堡中长大，你那贵不可言的小家族确保你受到了一流的教育，其中有些教导令你感激，而有些则让人只觉愤慨。在城堡中的时光，尤其是在长久以来耳濡目染于宫廷中的家族往来，也培养了你许多胜任领导人的才能。`,
    color: '#5A3A8C',
    abilityScores: ['力量', '智力', '魅力'],
    feat: { name: '熟习', nameEn: 'Skilled' },
    skills: ['历史', '游说'],
    tools: ['赌具（自选一种）'],
    equipment: {
      a: '赌具（同上所选）、高档服装、香水、29 GP',
      b: '50 GP',
    },
  },

  {
    id: 'sage',
    name: '智者',
    nameEn: 'Sage',
    lore: '在宅邸和修行院间奔波，以杂役换取图书馆的阅览权，研读历史与魔法，大脑渴望着更多知识。',
    fullLore: `你长大的岁月便在宅邸和修行院之间的奔波中过去，做着各式各样的零活和服务，作为访问他们图书馆藏的交换，你花了那么多漫长的夜晚学习书籍和卷册。阅览多元宇宙的见闻，甚至是魔法的本质，而且你的脑袋正渴望着了解更多。`,
    color: '#3A5A9C',
    abilityScores: ['体质', '智力', '感知'],
    feat: { name: '魔法学徒（法师）', nameEn: 'Magic Initiate (Wizard)' },
    skills: ['奥秘', '历史'],
    tools: ['书法工具'],
    equipment: {
      a: '长棍、书法工具、书籍（历史）、羊皮纸（8 张）、长袍、8 GP',
      b: '50 GP',
    },
  },

  {
    id: 'sailor',
    name: '水手',
    nameEn: 'Sailor',
    lore: '像真正的海员一样生活，背朝海风，脚踩摇晃甲板，直面猛烈风暴，与海洋下的生灵交谈。',
    fullLore: `你就像海员一样生活，风吹拂在背上，脚下是摇晃的甲板。当你在停泊港落脚的回忆里总是酒吧里的高脚凳。你直面猛烈的风暴，与那些在波涛下生活的人们聊着过去。`,
    color: '#2A6A8C',
    abilityScores: ['力量', '敏捷', '感知'],
    feat: { name: '斗殴高手', nameEn: 'Tavern Brawler' },
    skills: ['体操', '察觉'],
    tools: ['领航工具'],
    equipment: {
      a: '匕首、领航工具、绳索、旅行者服装、20 GP',
      b: '50 GP',
    },
  },

  {
    id: 'scribe',
    name: '文员',
    nameEn: 'Scribe',
    lore: '在缮写室和修道院度过成长岁月，学会书写有逻辑的文字，抄录政府文件，对细节保持高度关注。',
    fullLore: `你成长的时期都在缮写室度过，那是一座致力于保存知识的修道院，或是某个政府机关。你在那里学会了如何书写思维敏锐有逻辑的文字和怎样制作得体的书面文本，有时你会抄录政府文件或是誊抄文献巨著。你可能有一些诗歌写作的技艺、叙事的技巧或是学术上的研究。最重要的是，你对琐碎处的关注很细致，这能帮助你避免在誊录和撰写文稿时出现错误。`,
    color: '#5A5A7A',
    abilityScores: ['敏捷', '智力', '感知'],
    feat: { name: '熟习', nameEn: 'Skilled' },
    skills: ['侦查', '察觉'],
    tools: ['书法工具'],
    equipment: {
      a: '书法工具、高档服装、油灯、灯油（3 瓶）、羊皮纸（12 张）、23 GP',
      b: '50 GP',
    },
  },

  {
    id: 'soldier',
    name: '士兵',
    nameEn: 'Soldier',
    lore: '从成年起便接受战阵训练，鲜少有拿起武器前的记忆，战斗已融入血液，誓死保卫王国。',
    fullLore: `你从成年开始便接受战阵训练，鲜少有拿起武器之前的生活回忆，战斗已融入你的血液。有时候你会发现自己正在反复操练着最初学会的基本战斗训练。而最终，你会将这些训练运用到战场上，在战场中通过战斗保护你的王国。`,
    color: '#8C4040',
    abilityScores: ['力量', '敏捷', '体质'],
    feat: { name: '凶蛮打手', nameEn: 'Savage Attacker' },
    skills: ['运动', '威吓'],
    tools: ['赌具（自选一种）'],
    equipment: {
      a: '矛、短弓、20 支箭、赌具（同上所选）、医疗包、箭筒、旅行者服装、14 GP',
      b: '50 GP',
    },
  },

  {
    id: 'wayfarer',
    name: '游民',
    nameEn: 'Wayfarer',
    lore: '在街头长大，身边是同命运的孤儿，露宿街头打零工换食物，从未失去自尊与希望。',
    fullLore: `你在街头长大，身边都是同样命运多舛的孤儿，有些是朋友有些是对头。你露宿街头，只靠着打零工来换取食物。有的时候，当饥饿难耐，你却只能去乞讨。尽管如此，你从未逝去你的自尊，也从未放弃希望。命运还没有就此关上大门。`,
    color: '#7A6A4A',
    abilityScores: ['敏捷', '感知', '魅力'],
    feat: { name: '幸运', nameEn: 'Lucky' },
    skills: ['洞悉', '隐匿'],
    tools: ['盗贼工具'],
    equipment: {
      a: '2 匕首、盗贼工具、赌具（任意）、铺盖、2 小包、旅行者服装、16 GP',
      b: '50 GP',
    },
  },
]

export { hardcodedBackgrounds }
export const backgrounds = reactive([...hardcodedBackgrounds])

export function applyBackgroundOverrides(overrides) {
  for (const override of overrides) {
    const idx = backgrounds.findIndex(b => b.id === override.id)
    if (idx >= 0) {
      backgrounds[idx] = { ...backgrounds[idx], ...override }
    } else {
      backgrounds.push(override)
    }
  }
}
