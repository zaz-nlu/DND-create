<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { backgrounds } from '../data/backgrounds.js'
import { character, setBackground } from '../store/character.js'
import BackgroundScrollModal from './BackgroundScrollModal.vue'
import StepNav from './StepNav.vue'
import AbilityBar from '../components/AbilityBar.vue'
import '../styles/backgrounds.css'

const router = useRouter()
const activeBg = ref(null)

const selectedId = computed({
  get: () => character.background.id,
  set: (id) => setBackground(id),
})

const selectedBg = computed(() =>
  backgrounds.find(b => b.id === selectedId.value) ?? null
)

function openScroll(bg) {
  activeBg.value = bg
}

function closeScroll() {
  activeBg.value = null
}

function goNext() {
  if (!selectedId.value) return
  router.push('/feats')
}
</script>

<template>
  <div class="bg-page">
    <StepNav step="5 / 10" label="选择背景" back-to="/class" />
    <AbilityBar />
    <header class="bg-header">
      <div class="bg-step-badge">步骤 5 / 10 · 选择背景</div>
      <h1 class="bg-page-title">你来自何处？</h1>
      <p class="bg-page-sub">背景塑造你的出身与技能，决定你踏上冒险之前的故事</p>
    </header>

    <div class="bg-grid">
      <div
        v-for="bg in backgrounds"
        :key="bg.id"
        :class="['bg-card', { selected: selectedId === bg.id }]"
        :style="{ '--card-accent': bg.color }"
        role="button"
        :aria-label="`查看 ${bg.name} 详情`"
        @click="openScroll(bg)"
      >
        <div class="bg-card-body">
          <!-- 标题行 + 专长徽章 -->
          <div class="bg-card-top">
            <h2 class="bg-name">
              {{ bg.name }}
              <span class="bg-name-en">{{ bg.nameEn }}</span>
            </h2>
            <div class="bg-feat-badge">
              <span class="bg-feat-label">专长</span>
              <span class="bg-feat-name">{{ bg.feat.name }}</span>
            </div>
          </div>

          <p class="bg-lore">{{ bg.lore }}</p>

          <div class="bg-scores">
            <span
              v-for="score in bg.abilityScores"
              :key="score"
              class="bg-score-chip"
            >{{ score }}</span>
          </div>
          <div class="bg-skills">
            <span
              v-for="skill in bg.skills"
              :key="skill"
              class="bg-skill-tag"
            >{{ skill }}</span>
          </div>
        </div>

        <div class="bg-view-hint">
          <span>查看详情 · 装备 &amp; 技能</span>
          <span class="bg-view-icon">📜</span>
        </div>
      </div>
    </div>

    <footer class="bg-footer">
      <div class="bg-selected-info">
        <template v-if="selectedBg">
          <span class="bg-selected-label">已选背景</span>
          <span class="bg-selected-name">✦ {{ selectedBg.name }}</span>
        </template>
        <span v-else class="bg-selected-placeholder">尚未选择背景</span>
      </div>
      <button
        class="bg-next-btn"
        type="button"
        :disabled="!selectedId"
        @click="goNext"
      >
        下一步 →
      </button>
    </footer>

    <BackgroundScrollModal :bg="activeBg" @close="closeScroll" />

  </div>
</template>
