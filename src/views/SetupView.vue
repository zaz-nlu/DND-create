<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  character,
  setCharacterLevel,
  setCharacterName,
} from '../store/character.js'
import StepNav from './StepNav.vue'
import '../styles/setup.css'

const router = useRouter()

const levelBands = [
  {
    label: '入门',
    range: [1, 2, 3, 4],
    desc: '初入冒险，3级通常已拥有职业核心。',
  },
  {
    label: '英雄',
    range: [5, 6, 7, 8, 9, 10],
    desc: '战斗节奏成型，团队开始面对区域级威胁。',
  },
  {
    label: '传奇',
    range: [11, 12, 13, 14, 15, 16],
    desc: '角色能力显著超凡，故事影响力扩大。',
  },
  {
    label: '史诗',
    range: [17, 18, 19, 20],
    desc: '接近传说顶点，适合高魔与终局冒险。',
  },
]

const characterName = computed({
  get: () => character.name,
  set: value => setCharacterName(value),
})

const characterLevel = computed({
  get: () => character.level,
  set: value => setCharacterLevel(value),
})

const draftTitle = computed(() => character.name.trim() || '未命名角色')

const currentBand = computed(() =>
  levelBands.find(band => band.range.includes(character.level)) ?? levelBands[0]
)

function goNext() {
  router.push('/ability-base')
}
</script>

<template>
  <div class="setup-page">
    <StepNav step="1 / 10" label="创建草稿" back-to="/" />

    <header class="setup-header">
      <div class="setup-step-badge">步骤 1 / 10 · 创建草稿</div>
      <h1 class="setup-title">角色契约</h1>
      <p class="setup-sub">在羊皮卷上写下名字，决定这段冒险从哪个等级开始。下一步先确定基础属性，再进入种族、职业与背景。</p>
    </header>

    <main class="setup-workspace">
      <section class="setup-main">
        <div class="setup-name-panel">
          <div class="setup-panel-mark">I</div>
          <div class="setup-field">
            <label class="setup-label" for="character-name">角色名</label>
            <input
              id="character-name"
              v-model="characterName"
              class="setup-input"
              type="text"
              maxlength="36"
              placeholder="未命名角色"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="setup-level-panel">
          <div class="setup-level-head">
            <div>
              <div class="setup-panel-mark">II</div>
              <label class="setup-label" for="character-level">起始等级</label>
              <p class="setup-level-copy">{{ currentBand.desc }}</p>
            </div>

            <div class="setup-level-display">
              <span class="setup-level-kicker">{{ currentBand.label }}</span>
              <strong>Lv.{{ character.level }}</strong>
              <input
                id="character-level"
                v-model.number="characterLevel"
                class="setup-level-input"
                type="number"
                min="1"
                max="20"
                aria-label="起始等级"
              />
            </div>
          </div>

          <div class="level-band-list">
            <div
              v-for="band in levelBands"
              :key="band.label"
              class="level-band"
            >
              <div class="level-band-label">{{ band.label }}</div>
              <div class="level-buttons">
                <button
                  v-for="level in band.range"
                  :key="level"
                  :class="['level-button', { active: character.level === level }]"
                  type="button"
                  @click="setCharacterLevel(level)"
                >
                  {{ level }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside class="setup-summary" aria-label="角色草稿摘要">
        <div class="summary-kicker">冒险起点</div>
        <div class="summary-name">{{ draftTitle }}</div>
        <div class="summary-level-sigil">Lv.{{ character.level }}</div>
        <div class="summary-row">
          <span>阶段</span>
          <strong>{{ currentBand.label }}</strong>
        </div>
        <div class="summary-row">
          <span>规则</span>
          <strong>DND 2024</strong>
        </div>
        <div class="summary-row">
          <span>下一步</span>
          <strong>基础属性</strong>
        </div>
        <div class="summary-status">
          <span class="summary-dot"></span>
          本地自动保存已启用
        </div>
      </aside>
    </main>

    <footer class="setup-footer">
      <button class="setup-next" type="button" @click="goNext">继续基础属性 →</button>
    </footer>
  </div>
</template>
