<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { races } from '../data/races.js'
import { character, setRaceChoice } from '../store/character.js'
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

const selectedRace = computed(() =>
  races.find(r => r.id === selectedId.value) ?? null
)

const raceSkillSpec = computed(() => selectedRace.value?.skillProficiency ?? null)

const raceSkillOptions = computed(() => {
  const spec = raceSkillSpec.value
  if (!spec) return []
  return spec.options === 'any' ? DND_SKILLS : spec.options
})

const raceSkillChosen = computed(() => character.race.choices?.skillProficiency ?? null)

const isRaceSkillValid = computed(() => {
  if (!raceSkillSpec.value) return true
  return !!raceSkillChosen.value
})

function selectRaceSkill(skill) {
  setRaceChoice('skillProficiency', skill)
}

// 额外种族选择（龙裔血统、精灵血系、歌利亚先祖等）
const raceExtraChoices = computed(() => selectedRace.value?.raceChoices ?? [])

const isRaceExtraChoicesValid = computed(() => {
  if (raceExtraChoices.value.length === 0) return true
  return raceExtraChoices.value.every(choice =>
    !!character.race.choices?.[choice.id]
  )
})

function selectRaceExtra(choiceId, optionId) {
  setRaceChoice(choiceId, optionId)
}

function openModal(race) {
  activeRace.value = race
}

function closeModal() {
  activeRace.value = null
}

function goNext() {
  if (!selectedId.value || !isRaceSkillValid.value || !isRaceExtraChoicesValid.value) return
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

    <section v-if="raceSkillSpec" class="race-skill-section">
      <div class="race-skill-header">
        <span class="race-skill-title">种族技能熟练</span>
        <span class="race-skill-sub">
          {{ selectedRace?.name }} 可获得 1 项技能熟练
          <template v-if="raceSkillSpec.options !== 'any'">（从以下选项中选择）</template>
          <template v-else>（任意技能）</template>
        </span>
      </div>
      <div class="race-skill-grid">
        <button
          v-for="skill in raceSkillOptions"
          :key="skill"
          type="button"
          :class="['race-skill-chip', { selected: raceSkillChosen === skill }]"
          @click="selectRaceSkill(skill)"
        >
          {{ skill }}
        </button>
      </div>
    </section>

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
        :disabled="!selectedId || !isRaceSkillValid"
        @click="goNext"
      >
        下一步 →
      </button>
    </footer>

    <RaceScrollModal :race="activeRace" @close="closeModal" />
  </div>
</template>
