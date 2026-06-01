<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { races } from '../data/races.js'
import { character, setRaceChoice } from '../store/character.js'
import { getSpellsByList } from '../data/spells.js'
import { getRaceSpellGrants, isRaceSpellGrantsValid } from '../utils/raceSpells.js'
import StepNav from './StepNav.vue'
import AbilityBar from '../components/AbilityBar.vue'
import RaceScrollModal from './RaceScrollModal.vue'
import '../styles/races.css'

const DND_SKILLS = [
  '运动', '体操', '巧手', '隐匿',
  '奥秘', '历史', '调查', '侦查', '自然', '宗教',
  '驯兽', '洞悉', '医学', '察觉', '求生',
  '欺瞒', '威吓', '表演', '游说',
]

const router = useRouter()
const activeRace = ref(null)

const selectedId = computed(() => character.race.id)
const selectedRace = computed(() => races.find(r => r.id === selectedId.value) ?? null)

// ── 种族技能熟练（支持 choose > 1）─────────────────────────────────────────
const raceSkillSpec = computed(() => selectedRace.value?.skillProficiency ?? null)

const raceSkillOptions = computed(() => {
  const spec = raceSkillSpec.value
  if (!spec) return []
  return spec.options === 'any' ? DND_SKILLS : (spec.options ?? [])
})

const raceSkillChosenArr = computed(() => {
  const arr = character.race.choices?.skillProficiencies
  if (Array.isArray(arr)) return arr
  // 兼容旧单选字符串
  const old = character.race.choices?.skillProficiency
  return old ? [old] : []
})

const raceSkillCount = computed(() => raceSkillSpec.value?.choose ?? 1)

const isRaceSkillValid = computed(() => {
  if (!raceSkillSpec.value) return true
  return raceSkillChosenArr.value.length >= raceSkillCount.value
})

function toggleRaceSkill(skill) {
  const current = [...raceSkillChosenArr.value]
  const idx = current.indexOf(skill)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else if (current.length < raceSkillCount.value) {
    current.push(skill)
  }
  setRaceChoice('skillProficiencies', current)
  // 清理旧格式
  if (character.race.choices?.skillProficiency) {
    setRaceChoice('skillProficiency', null)
  }
}

// ── 额外种族选择（血统/血系等）──────────────────────────────────────────────
const raceExtraChoices = computed(() => selectedRace.value?.raceChoices ?? [])

const isRaceExtraChoicesValid = computed(() => {
  if (raceExtraChoices.value.length === 0) return true
  return raceExtraChoices.value.every(choice => !!character.race.choices?.[choice.id])
})

function selectRaceExtra(choiceId, optionId) {
  setRaceChoice(choiceId, optionId)
  // 切换血系时，清空与该血系关联的法术选择
  setRaceChoice(`raceCantrip_${choiceId}`, [])
}

// ── 种族法术（聚合层）────────────────────────────────────────────────────────
const raceSpellGrants = computed(() => getRaceSpellGrants(character, selectedRace.value))

const isRaceSpellValid = computed(() => isRaceSpellGrantsValid(character, selectedRace.value))

// 自选戏法候选列表（按 fromList 法表）
function cantripCandidates(fromList) {
  return getSpellsByList(fromList).filter(s => s.level === 0)
}

function isCantripChosen(slotId, baseId) {
  return raceSpellGrants.value.cantripChoiceSlots
    .find(s => s.id === slotId)?.chosen?.includes(baseId) ?? false
}

function toggleCantripChoice(slotId, baseId, count) {
  const slot = raceSpellGrants.value.cantripChoiceSlots.find(s => s.id === slotId)
  if (!slot) return
  const current = [...slot.chosen]
  const idx = current.indexOf(baseId)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else if (current.length < count) {
    current.push(baseId)
  }
  setRaceChoice(slotId, current)
}

// ── 施法属性────────────────────────────────────────────────────────────────
const spellcastingAbilityOptions = computed(() => raceSpellGrants.value.spellcastingAbilityOptions)
const spellcastingAbility = computed(() => raceSpellGrants.value.spellcastingAbility)

function selectSpellcastingAbility(ability) {
  setRaceChoice('raceSpellcastingAbility', ability)
}

// ── 导航────────────────────────────────────────────────────────────────────
function openModal(race) { activeRace.value = race }
function closeModal() { activeRace.value = null }

const isAllValid = computed(() =>
  !!selectedId.value &&
  isRaceSkillValid.value &&
  isRaceExtraChoicesValid.value &&
  isRaceSpellValid.value
)

function goNext() {
  if (!isAllValid.value) return
  router.push('/class')
}
</script>

<template>
  <div class="race-page">
    <StepNav step="3 / 10" label="选择种族" back-to="/ability-base" />
    <AbilityBar />
    <header class="race-header">
      <div class="race-step-badge">步骤 3 / 10 · 选择种族</div>
      <h1 class="race-page-title">你是什么？</h1>
      <p class="race-page-sub">种族决定你的天赋与传承，塑造你最初的样貌</p>
    </header>

    <div class="race-grid">
      <div
        v-for="race in races"
        :key="race.id"
        :class="['race-card', { selected: selectedId === race.id }]"
        :style="{ '--card-accent': race.color }"
        role="button"
        :aria-label="`查看 ${race.name} 种族详情`"
        :aria-pressed="selectedId === race.id"
        @click="openModal(race)"
      >
        <div class="race-card-img">
          <img v-if="race.image" :src="race.image" :alt="race.name" loading="lazy" />
        </div>

        <div class="race-card-bar"></div>

        <div v-if="selectedId === race.id" class="race-card-check">✓</div>

        <div class="race-card-body">
          <div class="race-card-top">
            <div>
              <h2 class="race-name">
                {{ race.name }}
                <span class="race-name-en">{{ race.nameEn }}</span>
              </h2>
            </div>
            <span class="race-lifespan">寿命 {{ race.lifespan }} 年</span>
          </div>

          <p class="race-lore">{{ race.lore }}</p>

          <div class="race-tags">
            <span class="race-tag">{{ race.type }}</span>
            <span class="race-tag">{{ race.size }}</span>
            <span class="race-tag">速度 {{ race.speed }} 尺</span>
          </div>
        </div>

        <button
          class="race-expand-btn"
          type="button"
          @click.stop="openModal(race)"
        >
          <span>种族特质（{{ race.traits.length }}）</span>
          <span class="race-expand-icon">›</span>
        </button>
      </div>
    </div>

    <!-- 种族技能熟练（支持 choose > 1）-->
    <section v-if="raceSkillSpec" class="race-skill-section">
      <div class="race-skill-header">
        <span class="race-skill-title">种族技能熟练</span>
        <span class="race-skill-sub">
          {{ selectedRace?.name }} 可获得
          {{ raceSkillCount }} 项技能熟练（{{ raceSkillChosenArr.length }}/{{ raceSkillCount }}）
          <template v-if="raceSkillSpec.options !== 'any'">，从以下选项中选择</template>
        </span>
      </div>
      <div class="race-skill-grid">
        <button
          v-for="skill in raceSkillOptions"
          :key="skill"
          type="button"
          :class="['race-skill-chip', {
            selected: raceSkillChosenArr.includes(skill),
            disabled: !raceSkillChosenArr.includes(skill) && raceSkillChosenArr.length >= raceSkillCount,
          }]"
          :disabled="!raceSkillChosenArr.includes(skill) && raceSkillChosenArr.length >= raceSkillCount"
          @click="toggleRaceSkill(skill)"
        >
          {{ skill }}
        </button>
      </div>
    </section>

    <!-- 额外种族选择（血统/血系等）-->
    <section
      v-for="choice in raceExtraChoices"
      :key="choice.id"
      class="race-skill-section"
    >
      <div class="race-skill-header">
        <span class="race-skill-title">{{ choice.label }}</span>
        <span class="race-skill-sub">{{ choice.desc }}</span>
      </div>
      <div class="race-extra-grid">
        <button
          v-for="opt in choice.options"
          :key="opt.id"
          type="button"
          :class="['race-extra-option', { selected: character.race.choices?.[choice.id] === opt.id }]"
          @click="selectRaceExtra(choice.id, opt.id)"
        >
          <span class="race-extra-label">{{ opt.label }}</span>
          <span class="race-extra-detail">{{ opt.detail }}</span>
        </button>
      </div>
    </section>

    <!-- 施法属性三选一（精灵、提夫林、侏儒等）-->
    <section v-if="spellcastingAbilityOptions.length > 1" class="race-skill-section">
      <div class="race-skill-header">
        <span class="race-skill-title">种族施法属性</span>
        <span class="race-skill-sub">选择你的种族法术使用哪个属性作为施法属性</span>
      </div>
      <div class="race-skill-grid">
        <button
          v-for="ability in spellcastingAbilityOptions"
          :key="ability"
          type="button"
          :class="['race-skill-chip', { selected: spellcastingAbility === ability }]"
          @click="selectSpellcastingAbility(ability)"
        >
          {{ ability }}
        </button>
      </div>
    </section>

    <!-- 自选戏法（高等精灵等）-->
    <section
      v-for="slot in raceSpellGrants.cantripChoiceSlots"
      :key="slot.id"
      class="race-skill-section"
    >
      <div class="race-skill-header">
        <span class="race-skill-title">{{ slot.label }}</span>
        <span class="race-skill-sub">
          从 {{ slot.fromList === 'wizard' ? '法师' : slot.fromList }} 法术列表中选择
          {{ slot.count }} 个戏法（{{ slot.chosen.length }}/{{ slot.count }}）
        </span>
      </div>
      <div class="race-cantrip-grid">
        <button
          v-for="spell in cantripCandidates(slot.fromList)"
          :key="spell.baseId"
          type="button"
          :class="['race-cantrip-chip', {
            selected: isCantripChosen(slot.id, spell.baseId),
            disabled: !isCantripChosen(slot.id, spell.baseId) && slot.chosen.length >= slot.count,
          }]"
          :disabled="!isCantripChosen(slot.id, spell.baseId) && slot.chosen.length >= slot.count"
          @click="toggleCantripChoice(slot.id, spell.baseId, slot.count)"
        >
          <span class="race-cantrip-name">{{ spell.name }}</span>
          <span class="race-cantrip-en">{{ spell.nameEn }}</span>
        </button>
      </div>
    </section>

    <footer class="race-footer">
      <div class="race-selected-info">
        <template v-if="selectedRace">
          <span class="race-selected-label">已选种族</span>
          <span class="race-selected-name">✓ {{ selectedRace.name }}</span>
        </template>
        <span v-else class="race-selected-placeholder">尚未选择种族</span>
      </div>
      <button
        class="race-next-btn"
        type="button"
        :disabled="!isAllValid"
        @click="goNext"
      >
        下一步 →
      </button>
    </footer>

    <RaceScrollModal :race="activeRace" @close="closeModal" />
  </div>
</template>

<style>
/* 自选戏法列表 */
.race-cantrip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.race-cantrip-chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 12px;
  border: 1px solid var(--border-dark);
  border-radius: var(--r-sm);
  background: rgba(0, 0, 0, 0.18);
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  cursor: pointer;
}

.race-cantrip-chip.selected {
  border-color: rgba(201, 168, 76, 0.55);
  background: rgba(201, 168, 76, 0.12);
}

.race-cantrip-chip.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.race-cantrip-name {
  color: var(--text);
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 600;
}

.race-cantrip-en {
  color: var(--text-dim);
  font-size: 11px;
  margin-top: 2px;
}

/* 技能 chip 禁用态 */
.race-skill-chip.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
