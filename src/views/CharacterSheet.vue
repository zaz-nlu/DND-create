<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { backgrounds } from '../data/backgrounds.js'
import { classes } from '../data/classes.js'
import { findFightingStyleFeatById } from '../data/fightingStyleFeats.js'
import { findGeneralFeatById } from '../data/generalFeats.js'
import { findOriginFeatById } from '../data/originFeats.js'
import { races } from '../data/races.js'
import { character, createNewCharacter } from '../store/character.js'
import { ABILITY_EN, ABILITY_IDS, abilityMod, modStr } from '../utils/abilities.js'
import { getAbilityTotalRows } from '../utils/abilityTotals.js'
import { calculateCharacterAc, getEquippedArmor, hasArmorTraining, hasShieldTraining } from '../utils/equipment.js'
import { getRequirementsForLevel } from '../utils/progression.js'
import StepNav from './StepNav.vue'
import PdfExporter from '../components/PdfExporter.vue'
import SpellBookModal from './SpellBookModal.vue'

const showSpellBook = ref(false)

const router = useRouter()

const selectedRace = computed(() => races.find(r => r.id === character.race.id) ?? null)
const selectedClass = computed(() => classes.find(c => c.id === character.class.id) ?? null)
const selectedBackground = computed(() => backgrounds.find(b => b.id === character.background.id) ?? null)
const selectedSubclass = computed(() => {
  const sub = character.class.subclassId
  return selectedClass.value?.subclasses?.find(s => s.id === sub) ?? null
})

const level = computed(() => character.level ?? 1)
const profBonus = computed(() => Math.ceil(level.value / 4) + 1)

const abilityRows = computed(() => getAbilityTotalRows(character))
const abilityMap = computed(() => Object.fromEntries(abilityRows.value.map(r => [r.id, r]))  )

const classSaves = computed(() => selectedClass.value?.saves ?? [])

const savingThrows = computed(() =>
  ABILITY_IDS.map(id => {
    const row = abilityMap.value[id]
    const isProficient = classSaves.value.includes(id)
    const bonus = row.mod + (isProficient ? profBonus.value : 0)
    return { id, bonus, text: (bonus >= 0 ? '+' : '') + bonus, isProficient }
  })
)

const SKILL_ABILITY = {
  '运动': '力量',
  '体操': '敏捷', '巧手': '敏捷', '隐匿': '敏捷',
  '奥秘': '智力', '历史': '智力', '调查': '智力', '侦查': '智力', '自然': '智力', '宗教': '智力',
  '驯兽': '感知', '洞悉': '感知', '医学': '感知', '察觉': '感知', '求生': '感知',
  '欺瞒': '魅力', '威吓': '魅力', '表演': '魅力', '游说': '魅力',
}

const ALL_SKILLS = Object.keys(SKILL_ABILITY)

const proficientSkills = computed(() => {
  const bgSkills = selectedBackground.value?.skills ?? []
  const classSkills = character.class.choices?.skills ?? []
  const raceSkill = character.race.choices?.skillProficiency ? [character.race.choices.skillProficiency] : []
  const allProf = [...new Set([...bgSkills, ...classSkills, ...raceSkill])]

  return ALL_SKILLS.map(skill => {
    const ability = SKILL_ABILITY[skill]
    const row = abilityMap.value[ability]
    const source = bgSkills.includes(skill) ? '背景'
      : classSkills.includes(skill) ? '职业'
      : raceSkill.includes(skill) ? '种族'
      : null
    const isProficient = !!source
    const expertLevel = character.skills?.[skill] ?? null
    const multiplier = expertLevel === 'expert' ? 2 : expertLevel === 'proficient' ? 1 : isProficient ? 1 : 0
    const total = row.mod + multiplier * profBonus.value
    return {
      name: skill,
      ability,
      abilityEn: ABILITY_EN[ability],
      isProficient: isProficient || !!expertLevel,
      source,
      total,
      totalText: (total >= 0 ? '+' : '') + total,
    }
  })
})

const proficientSkillsList = computed(() => proficientSkills.value.filter(s => s.isProficient))

const dexMod = computed(() => abilityMap.value['敏捷']?.mod ?? 0)
const initiative = computed(() => dexMod.value)
const initiativeText = computed(() => (initiative.value >= 0 ? '+' : '') + initiative.value)
const equippedArmor = computed(() => getEquippedArmor(character))
const armorTrained = computed(() => hasArmorTraining(selectedClass.value, equippedArmor.value))
const shieldTrained = computed(() => hasShieldTraining(selectedClass.value))
const acBase = computed(() =>
  calculateCharacterAc({
    character,
    selectedClass: selectedClass.value,
    selectedSubclass: selectedSubclass.value,
    abilityMap: abilityMap.value,
  })
)

const generalFeatSlots = computed(() => {
  const cls = selectedClass.value
  if (!cls) return []
  if (cls.progression) {
    return getRequirementsForLevel(cls, level.value)
      .filter(r => r.kind === 'generalFeat' && level.value >= (r.minLevel ?? 4))
  }
  return level.value >= 4 ? [{ id: 'generalFeatId', kind: 'generalFeat', minLevel: 4 }] : []
})

const generalFeatList = computed(() =>
  generalFeatSlots.value
    .map(slot => findGeneralFeatById(character.class.choices?.[slot.id]))
    .filter(Boolean)
)

const fightingStyleSlots = computed(() => {
  if (!selectedClass.value?.progression) return []
  return getRequirementsForLevel(selectedClass.value, level.value)
    .filter(r => r.kind === 'fightingStyleFeat')
})

const fightingStyleList = computed(() =>
  fightingStyleSlots.value
    .map(slot => findFightingStyleFeatById(character.class.choices?.[slot.id]))
    .filter(Boolean)
)

const backgroundOriginFeat = computed(() => selectedBackground.value?.feat ?? null)

const humanOriginFeat = computed(() =>
  character.race.id === 'human' ? findOriginFeatById(character.race.choices?.originFeatId) : null
)

// class features: level1Features (always level 1) + notableFeatures up to current level, sorted
const relevantFeatures = computed(() => {
  const features = []
  if (selectedClass.value?.level1Features) {
    features.push(...selectedClass.value.level1Features.map(f => ({ ...f, level: 1 })))
  }
  if (selectedClass.value?.notableFeatures) {
    features.push(
      ...selectedClass.value.notableFeatures.filter(f => f.level <= level.value)
    )
  }
  return features.sort((a, b) => (a.level ?? 1) - (b.level ?? 1))
})

// subclass features up to current level
const subclassFeatures = computed(() => {
  if (!selectedSubclass.value?.features) return []
  return selectedSubclass.value.features.filter(f => f.level <= level.value)
})

// proficiency tags: class armor/weapons/tools/saves + race languages
const classProficiencies = computed(() => {
  const cls = selectedClass.value
  if (!cls) return null
  return {
    hitDie: cls.hitDie,
    saves: cls.saves ?? [],
    armor: cls.armor ?? [],
    weapons: cls.weapons ?? [],
    tools: cls.tools?.length ? cls.tools : null,
  }
})

const raceMechanics = computed(() => selectedRace.value?.mechanics ?? null)

// 解析种族的额外选择（龙族血统、精灵血系、巨人先祖等）
const resolvedRaceChoices = computed(() => {
  const race = selectedRace.value
  if (!race?.raceChoices) return []
  return race.raceChoices.map(choice => {
    const chosenId = character.race.choices?.[choice.id]
    const chosen = choice.options.find(o => o.id === chosenId) ?? null
    return { ...choice, chosen }
  }).filter(c => c.chosen)
})

function startNewCharacter() {
  createNewCharacter()
  router.push('/')
}
</script>

<template>
  <div class="sheet-page">
    <StepNav step="完成" label="角色卡" back-to="/equipment" />

    <header class="sheet-hero">
      <div class="sheet-hero-badge">角色卡 · 已完成</div>
      <h1 class="sheet-hero-name">{{ character.name || '无名冒险者' }}</h1>
      <div class="sheet-hero-identity">
        <span v-if="selectedRace">{{ selectedRace.name }}</span>
        <span v-if="selectedClass" class="sheet-dot">·</span>
        <span v-if="selectedClass">{{ selectedClass.name }}</span>
        <template v-if="selectedSubclass">
          <span class="sheet-dot">·</span>
          <span>{{ selectedSubclass.name }}</span>
        </template>
        <span v-if="selectedBackground" class="sheet-dot">·</span>
        <span v-if="selectedBackground">{{ selectedBackground.name }}</span>
      </div>
      <div class="sheet-hero-level">
        <span class="sheet-level-num">Lv.{{ level }}</span>
        <span class="sheet-profbonus">熟练加值 +{{ profBonus }}</span>
      </div>
    </header>

    <!-- PDF Export bar -->
    <div class="sheet-export-bar">
      <PdfExporter />
      <button class="sheet-spellbook-btn" type="button" @click="showSpellBook = true">
        📖 法术图鉴
      </button>
    </div>

    <SpellBookModal :show="showSpellBook" @close="showSpellBook = false" />

    <!-- Combat stats bar -->
    <div class="sheet-combat-bar">
      <div class="sheet-stat-pill">
        <span class="sheet-stat-val">{{ character.hp.max || '—' }}</span>
        <span class="sheet-stat-label">最大生命值</span>
      </div>
      <div class="sheet-stat-pill">
        <span class="sheet-stat-val">{{ acBase }}</span>
        <span class="sheet-stat-label">护甲等级</span>
      </div>
      <div class="sheet-stat-pill">
        <span class="sheet-stat-val">{{ initiativeText }}</span>
        <span class="sheet-stat-label">先攻</span>
      </div>
      <div class="sheet-stat-pill">
        <span class="sheet-stat-val">{{ selectedRace?.speed ?? 30 }}</span>
        <span class="sheet-stat-label">移动速度</span>
      </div>
    </div>

    <!-- Ability scores -->
    <section class="sheet-section">
      <h2 class="sheet-section-title">属性值</h2>
      <div class="sheet-ability-grid">
        <div
          v-for="row in abilityRows"
          :key="row.id"
          class="sheet-ability-cell"
        >
          <span class="sheet-ability-en">{{ ABILITY_EN[row.id] }}</span>
          <span class="sheet-ability-score">{{ row.total }}</span>
          <span class="sheet-ability-mod">{{ row.modText }}</span>
          <span class="sheet-ability-zh">{{ row.id }}</span>
        </div>
      </div>
    </section>

    <!-- Saving throws -->
    <section class="sheet-section">
      <h2 class="sheet-section-title">豁免检定</h2>
      <div class="sheet-saves-grid">
        <div
          v-for="st in savingThrows"
          :key="st.id"
          :class="['sheet-save-row', { proficient: st.isProficient }]"
        >
          <span class="sheet-save-dot" :class="{ filled: st.isProficient }"></span>
          <span class="sheet-save-name">{{ st.id }}</span>
          <span class="sheet-save-bonus">{{ st.text }}</span>
        </div>
      </div>
    </section>

    <!-- Skills -->
    <section class="sheet-section">
      <h2 class="sheet-section-title">技能熟练（{{ proficientSkillsList.length }}）</h2>
      <div class="sheet-skills-list">
        <div
          v-for="skill in proficientSkillsList"
          :key="skill.name"
          class="sheet-skill-row"
        >
          <span class="sheet-skill-name">{{ skill.name }}</span>
          <span class="sheet-skill-source">{{ skill.source }}</span>
          <span class="sheet-skill-ability">{{ skill.abilityEn }}</span>
          <span class="sheet-skill-bonus">{{ skill.totalText }}</span>
        </div>
        <div v-if="proficientSkillsList.length === 0" class="sheet-empty">尚未选择任何技能熟练</div>
      </div>
    </section>

    <!-- Proficiencies -->
    <section v-if="classProficiencies" class="sheet-section">
      <h2 class="sheet-section-title">熟练项</h2>
      <div class="sheet-prof-grid">
        <div class="sheet-prof-item">
          <span class="sheet-prof-label">生命骰</span>
          <span class="sheet-prof-val">{{ classProficiencies.hitDie }}</span>
        </div>
        <div v-if="classProficiencies.armor.length" class="sheet-prof-item">
          <span class="sheet-prof-label">护甲</span>
          <span class="sheet-prof-val">{{ classProficiencies.armor.join('、') }}</span>
        </div>
        <div v-else class="sheet-prof-item">
          <span class="sheet-prof-label">护甲</span>
          <span class="sheet-prof-val sheet-prof-none">无</span>
        </div>
        <div class="sheet-prof-item">
          <span class="sheet-prof-label">武器</span>
          <span class="sheet-prof-val">{{ classProficiencies.weapons.join('、') }}</span>
        </div>
        <div v-if="classProficiencies.tools" class="sheet-prof-item">
          <span class="sheet-prof-label">工具</span>
          <span class="sheet-prof-val">{{ classProficiencies.tools.join('、') }}</span>
        </div>
        <div v-if="raceMechanics?.darkvision" class="sheet-prof-item">
          <span class="sheet-prof-label">黑暗视觉</span>
          <span class="sheet-prof-val">{{ raceMechanics.darkvision }} 尺</span>
        </div>
        <div v-if="raceMechanics?.damageResistances?.length" class="sheet-prof-item">
          <span class="sheet-prof-label">伤害抗性</span>
          <span class="sheet-prof-val">{{ raceMechanics.damageResistances.join('、') }}</span>
        </div>
        <div v-if="raceMechanics?.cantrips?.length" class="sheet-prof-item">
          <span class="sheet-prof-label">种族戏法</span>
          <span class="sheet-prof-val">{{ raceMechanics.cantrips.join('、') }}</span>
        </div>
        <div v-if="raceMechanics?.languages?.length" class="sheet-prof-item">
          <span class="sheet-prof-label">语言</span>
          <span class="sheet-prof-val">{{ raceMechanics.languages.join('、') }}</span>
        </div>
      </div>
    </section>

    <!-- Feats -->
    <section v-if="humanOriginFeat || backgroundOriginFeat || generalFeatList.length || fightingStyleList.length" class="sheet-section">
      <h2 class="sheet-section-title">专长</h2>
      <div class="sheet-feat-list">
        <div v-if="backgroundOriginFeat" class="sheet-feat-card">
          <div class="sheet-feat-header">
            <span class="sheet-feat-name">{{ backgroundOriginFeat.name }}</span>
            <span class="sheet-feat-source-tag">背景起源</span>
          </div>
        </div>
        <div v-if="humanOriginFeat" class="sheet-feat-card">
          <div class="sheet-feat-header">
            <span class="sheet-feat-name">{{ humanOriginFeat.name }}</span>
            <span class="sheet-feat-source-tag">人类起源</span>
          </div>
          <p class="sheet-feat-desc">{{ humanOriginFeat.desc }}</p>
        </div>
        <div v-for="feat in fightingStyleList" :key="feat.id" class="sheet-feat-card">
          <div class="sheet-feat-header">
            <span class="sheet-feat-name">{{ feat.name }}</span>
            <span class="sheet-feat-source-tag">战斗风格</span>
          </div>
          <p class="sheet-feat-desc">{{ feat.desc }}</p>
        </div>
        <div v-for="feat in generalFeatList" :key="feat.id" class="sheet-feat-card">
          <div class="sheet-feat-header">
            <span class="sheet-feat-name">{{ feat.name }}</span>
            <span class="sheet-feat-source-tag">通用专长</span>
          </div>
          <p class="sheet-feat-desc">{{ feat.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Race traits -->
    <section v-if="selectedRace?.traits?.length" class="sheet-section">
      <h2 class="sheet-section-title">种族特质 · {{ selectedRace.name }}</h2>
      <div class="sheet-trait-list">
        <div v-for="trait in selectedRace.traits" :key="trait.id" class="sheet-trait-row">
          <span class="sheet-trait-name">{{ trait.name }}</span>
          <p class="sheet-trait-desc">{{ trait.desc }}</p>
        </div>
        <div
          v-for="choice in resolvedRaceChoices"
          :key="choice.id"
          class="sheet-trait-row sheet-trait-row--choice"
        >
          <div class="sheet-trait-choice-header">
            <span class="sheet-trait-name">{{ choice.label }}</span>
            <span class="sheet-trait-choice-badge">{{ choice.chosen.label }}</span>
          </div>
          <p class="sheet-trait-desc">{{ choice.chosen.detail }}</p>
        </div>
      </div>
    </section>

    <!-- Class features -->
    <section v-if="selectedClass" class="sheet-section">
      <h2 class="sheet-section-title">职业特性 · {{ selectedClass.name }} Lv.{{ level }}</h2>
      <div class="sheet-feature-list">
        <div v-for="feat in relevantFeatures" :key="feat.id ?? feat.name" class="sheet-feature-row">
          <div class="sheet-feature-header">
            <span class="sheet-feature-name">{{ feat.name }}</span>
            <span class="sheet-feature-en">{{ feat.nameEn }}</span>
            <span v-if="feat.level > 1" class="sheet-feature-level">{{ feat.level }}级</span>
          </div>
          <p class="sheet-feature-desc">{{ feat.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Subclass features -->
    <section v-if="selectedSubclass && subclassFeatures.length" class="sheet-section">
      <h2 class="sheet-section-title">子职特性 · {{ selectedSubclass.name }}</h2>
      <div class="sheet-feature-list">
        <div
          v-for="feat in subclassFeatures"
          :key="feat.name"
          class="sheet-feature-row"
        >
          <div class="sheet-feature-header">
            <span class="sheet-feature-name">{{ feat.name }}</span>
            <span class="sheet-feature-en">{{ feat.nameEn }}</span>
            <span class="sheet-feature-level">{{ feat.level }}级</span>
          </div>
          <p class="sheet-feature-desc">{{ feat.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Equipment -->
    <section v-if="selectedClass || selectedBackground" class="sheet-section">
      <h2 class="sheet-section-title">起始装备</h2>
      <div class="sheet-equipment-list">
        <div class="sheet-equipment-item">
          <span class="sheet-equipment-source">当前穿戴</span>
          <p>
            护甲：{{ equippedArmor ? `${equippedArmor.nameZh}（${equippedArmor.name}）` : '未穿护甲' }}
            <span v-if="equippedArmor && !armorTrained"> · 未受训</span>
          </p>
          <p class="sheet-equipment-alt">
            盾牌：{{ character.equipment?.shield ? (shieldTrained ? '持用（+2 AC）' : '持用（未受训，不加 AC）') : '未持用' }}
          </p>
        </div>
        <div v-if="selectedClass?.equipment" class="sheet-equipment-item">
          <span class="sheet-equipment-source">{{ selectedClass.name }}</span>
          <p>{{ selectedClass.equipment.a }}</p>
          <p class="sheet-equipment-alt">或：{{ selectedClass.equipment.b }}</p>
        </div>
        <div v-if="selectedBackground?.equipment" class="sheet-equipment-item">
          <span class="sheet-equipment-source">{{ selectedBackground.name }}</span>
          <p>{{ selectedBackground.equipment?.a }}</p>
        </div>
      </div>
    </section>

    <div class="sheet-actions">
      <button class="sheet-export-btn" type="button" @click="router.push('/print')">
        🖨 导出角色卡
      </button>
      <button class="sheet-new-btn" type="button" @click="startNewCharacter">
        + 创建新角色
      </button>
    </div>
  </div>
</template>

<style scoped>
.sheet-page {
  min-height: 100dvh;
  background:
    radial-gradient(ellipse at 20% 8%, rgba(201, 168, 76, 0.08), transparent 42%),
    var(--bg);
  padding-bottom: 60px;
}

/* Hero */
.sheet-hero {
  padding: 44px 20px 20px;
  text-align: center;
}

.sheet-hero-badge {
  display: inline-block;
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.25);
  padding: 4px 14px;
  border-radius: 999px;
  margin-bottom: 12px;
}

.sheet-hero-name {
  font-family: var(--font-deco);
  font-size: clamp(24px, 6vw, 36px);
  color: var(--gold-bright);
  letter-spacing: 0.04em;
  line-height: 1.15;
  margin-bottom: 8px;
}

.sheet-hero-identity {
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.sheet-dot {
  color: var(--border-gold);
  opacity: 0.5;
}

.sheet-hero-level {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.sheet-level-num {
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: 700;
  color: var(--gold-light);
}

.sheet-profbonus {
  font-family: var(--font-title);
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3px 10px;
  border-radius: 999px;
}

/* Combat bar */
.sheet-combat-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 0 14px 16px;
}

.sheet-stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  background: rgba(201, 168, 76, 0.07);
  border: 1px solid rgba(201, 168, 76, 0.18);
  border-radius: 8px;
}

.sheet-stat-val {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 700;
  color: var(--gold-light);
  line-height: 1;
}

.sheet-stat-label {
  font-family: var(--font-title);
  font-size: 8px;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

/* Sections */
.sheet-section {
  margin: 0 12px 14px;
  border: 1px solid var(--border-dark);
  border-radius: 10px;
  background: rgba(19, 16, 42, 0.6);
  overflow: hidden;
}

.sheet-section-title {
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Ability grid */
.sheet-ability-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  background: rgba(255, 255, 255, 0.04);
}

.sheet-ability-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  background: rgba(19, 16, 42, 0.9);
  gap: 2px;
}

.sheet-ability-en {
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--text-dim);
}

.sheet-ability-score {
  font-family: var(--font-title);
  font-size: 22px;
  font-weight: 700;
  color: var(--gold-light);
  line-height: 1;
}

.sheet-ability-mod {
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 600;
  color: var(--gold);
}

.sheet-ability-zh {
  font-family: var(--font-title);
  font-size: 9px;
  color: var(--text-dim);
}

/* Saving throws */
.sheet-saves-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  padding: 8px;
}

.sheet-save-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
}

.sheet-save-row.proficient {
  background: rgba(201, 168, 76, 0.06);
}

.sheet-save-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.sheet-save-dot.filled {
  background: var(--gold);
  border-color: var(--gold);
}

.sheet-save-name {
  font-family: var(--font-title);
  font-size: 11px;
  color: var(--text-muted);
  flex: 1;
}

.sheet-save-row.proficient .sheet-save-name {
  color: var(--text);
}

.sheet-save-bonus {
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 600;
  color: var(--gold-light);
}

/* Skills */
.sheet-skills-list {
  padding: 4px 0 6px;
}

.sheet-skill-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
}

.sheet-skill-row:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.sheet-skill-name {
  font-family: var(--font-title);
  font-size: 12px;
  color: var(--text);
  flex: 1;
}

.sheet-skill-source {
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.2);
  padding: 1px 6px;
  border-radius: 999px;
  white-space: nowrap;
}

.sheet-skill-ability {
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  width: 26px;
  text-align: right;
}

.sheet-skill-bonus {
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 600;
  color: var(--gold-light);
  width: 28px;
  text-align: right;
}

/* Feats */
.sheet-feat-list {
  padding: 6px 0;
}

.sheet-feat-card {
  padding: 10px 14px;
}

.sheet-feat-card:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.sheet-feat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sheet-feat-name {
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 600;
  color: var(--gold-light);
}

.sheet-feat-source-tag {
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--text-dim);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1px 7px;
  border-radius: 999px;
}

.sheet-feat-desc {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.55;
}

/* Traits */
.sheet-trait-list {
  padding: 4px 0 6px;
}

.sheet-trait-row {
  padding: 10px 14px;
}

.sheet-trait-row:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.sheet-trait-name {
  display: block;
  font-family: var(--font-title);
  font-size: 12px;
  font-weight: 600;
  color: var(--gold-light);
  margin-bottom: 4px;
}

.sheet-trait-desc {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.55;
}

.sheet-trait-row--choice {
  background: rgba(201, 168, 76, 0.04);
  border-left: 2px solid rgba(201, 168, 76, 0.3);
}

.sheet-trait-choice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sheet-trait-choice-badge {
  font-family: var(--font-title);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(201, 168, 76, 0.15);
  border: 1px solid rgba(201, 168, 76, 0.35);
  color: var(--gold-light);
}

/* Class features */
.sheet-feature-list {
  padding: 4px 0 6px;
}

.sheet-feature-row {
  padding: 10px 14px;
}

.sheet-feature-row:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.sheet-feature-header {
  display: flex;
  align-items: baseline;
  gap: 7px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.sheet-feature-name {
  font-family: var(--font-title);
  font-size: 12px;
  font-weight: 600;
  color: var(--gold-light);
}

.sheet-feature-en {
  font-family: var(--font-title);
  font-size: 10px;
  color: var(--text-dim);
}

.sheet-feature-level {
  font-family: var(--font-title);
  font-size: 9px;
  color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.2);
  padding: 1px 6px;
  border-radius: 999px;
}

.sheet-feature-desc {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.55;
  white-space: pre-line;
}

/* Equipment */
.sheet-equipment-list {
  padding: 6px 0;
}

.sheet-equipment-item {
  padding: 10px 14px;
}

.sheet-equipment-item:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.sheet-equipment-source {
  display: block;
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--gold);
  margin-bottom: 4px;
}

.sheet-equipment-item p {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.55;
}

.sheet-equipment-alt {
  margin-top: 4px;
  opacity: 0.65;
}

/* Empty state */
.sheet-empty {
  padding: 14px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-dim);
  font-style: italic;
  text-align: center;
}

/* Proficiencies grid */
.sheet-prof-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: rgba(255, 255, 255, 0.04);
  padding: 1px;
}

.sheet-prof-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 14px;
  background: rgba(19, 16, 42, 0.9);
}

.sheet-prof-label {
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.sheet-prof-val {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text);
  line-height: 1.4;
}

.sheet-prof-none {
  color: var(--text-dim);
  font-style: italic;
}

/* Actions */
.sheet-actions {
  padding: 16px 14px 40px;
  display: flex;
  justify-content: center;
}

.sheet-export-btn {
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
  color: #1a1000;
  background: var(--gold-light, #c9a84c);
  border: 1px solid var(--gold-light, #c9a84c);
  padding: 0 28px;
  border-radius: var(--r);
  min-height: 44px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.sheet-export-btn:hover { opacity: 0.85; }

.sheet-spellbook-btn {
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #e0d8ff;
  background: rgba(100, 70, 180, 0.25);
  border: 1px solid rgba(160, 130, 230, 0.4);
  padding: 0 20px;
  border-radius: var(--r);
  min-height: 44px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.sheet-spellbook-btn:hover {
  background: rgba(120, 90, 200, 0.4);
  border-color: rgba(180, 150, 255, 0.6);
}

.sheet-new-btn {
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--gold-light);
  background: transparent;
  border: 1px solid rgba(201, 168, 76, 0.35);
  padding: 0 28px;
  border-radius: var(--r);
  min-height: 44px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.sheet-new-btn:hover {
  background: rgba(201, 168, 76, 0.08);
  border-color: rgba(201, 168, 76, 0.55);
}

.sheet-new-btn:active {
  transform: scale(0.97);
}

.sheet-export-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  margin: 0 0 8px;
  background: rgba(102, 126, 234, 0.05);
  border-top: 1px solid rgba(102, 126, 234, 0.1);
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  flex-wrap: wrap;
}

@media (min-width: 600px) {
  .sheet-section {
    margin: 0 20px 16px;
  }

  .sheet-saves-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .sheet-section {
    max-width: 840px;
    margin: 0 auto 16px;
  }

  .sheet-combat-bar {
    max-width: 840px;
    margin: 0 auto;
  }
}
</style>
