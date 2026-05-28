<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { backgrounds } from '../data/backgrounds.js'
import { classes } from '../data/classes.js'
import { findGeneralFeatById } from '../data/generalFeats.js'
import { findOriginFeatById, findOriginFeatByNameEn } from '../data/originFeats.js'
import { character } from '../store/character.js'
import { getAbilityTotalRows, hasCompleteBaseAbilityScores } from '../utils/abilityTotals.js'
import { getRequirementsForLevel } from '../utils/progression.js'
import StepNav from './StepNav.vue'

const router = useRouter()

const rows = computed(() => getAbilityTotalRows(character))
const hasBaseScores = computed(() => hasCompleteBaseAbilityScores(character))
const selectedBackground = computed(() =>
  backgrounds.find(background => background.id === character.background.id) ?? null
)
const backgroundFeat = computed(() =>
  selectedBackground.value?.feat ? findOriginFeatByNameEn(selectedBackground.value.feat.nameEn) : null
)
const humanFeat = computed(() => findOriginFeatById(character.race.choices?.originFeatId))
const generalFeatList = computed(() => {
  const cls = classes.find(c => c.id === character.class?.id)
  let slotIds
  if (cls?.progression) {
    slotIds = getRequirementsForLevel(cls, character.level)
      .filter(r => r.kind === 'generalFeat' && character.level >= (r.minLevel ?? 4))
      .map(r => r.id)
  } else {
    slotIds = character.level >= 4 ? ['generalFeatId'] : []
  }
  return slotIds.map(id => findGeneralFeatById(character.class.choices?.[id])).filter(Boolean)
})
const methodLabel = computed(() => {
  if (character.abilities.method === 'pointbuy') return '27 点加点'
  if (character.abilities.method === 'rolled') return '随机掷骰'
  return '未选择'
})

function goBackToBase() {
  router.push('/ability-base')
}

function goNext() {
  if (!hasBaseScores.value) return
  router.push('/hp')
}
</script>

<template>
  <div class="ability-summary-page">
    <StepNav step="8 / 10" label="属性总览" back-to="/spells" />

    <header class="ability-summary-header">
      <div class="summary-badge">步骤 8 / 10 · 属性总览</div>
      <h1>最终属性账本</h1>
      <p>这里不再重新加点，只展示基础值与背景、专长等来源叠加后的当前结果。</p>
    </header>

    <main class="ability-summary-layout">
      <section class="ability-panel ability-panel-main">
        <div class="panel-title-row">
          <div>
            <div class="panel-kicker">六维总览</div>
            <h2>{{ methodLabel }}</h2>
          </div>
          <button class="ghost-action" type="button" @click="goBackToBase">调整基础属性</button>
        </div>

        <div class="ability-row-list">
          <article v-for="row in rows" :key="row.id" class="ability-total-row">
            <div class="ability-name">
              <strong>{{ row.id }}</strong>
              <span>调整值 {{ row.modText }}</span>
            </div>

            <div class="ability-formula">
              <span>{{ row.base || '-' }}</span>
              <small>基础</small>
            </div>

            <div class="ability-formula bonus">
              <span>{{ row.background ? `+${row.background}` : '-' }}</span>
              <small>背景</small>
            </div>

            <div class="ability-formula feat-bonus">
              <span>{{ row.feat ? `+${row.feat}` : '-' }}</span>
              <small>专长</small>
            </div>

            <div class="ability-total">
              <strong>{{ row.total || '-' }}</strong>
              <span>最终</span>
            </div>
          </article>
        </div>
      </section>

      <aside class="ability-panel source-panel">
        <div class="panel-kicker">来源记录</div>
        <h2>已计入 / 待计入</h2>
        
        <div class="source-list">
          <div class="source-item">
            <span>背景</span>
            <strong>{{ selectedBackground?.name ?? '未选择' }}</strong>
          </div>
          <div class="source-item">
            <span>背景专长</span>
            <strong>{{ backgroundFeat?.name ?? '未记录' }}</strong>
          </div>
          <div class="source-item">
            <span>人类额外专长</span>
            <strong>{{ humanFeat?.name ?? '无' }}</strong>
          </div>
          <div class="source-item">
            <span>通用专长</span>
            <strong>{{ generalFeatList.length ? generalFeatList.map(f => f.name).join('、') : '无' }}</strong>
          </div>
        </div>

        <p class="source-note">
          当前总值已计入背景属性加值与通用专长属性加成。
        </p>
      </aside>
    </main>

    <footer class="ability-summary-footer">
      <span>{{ hasBaseScores ? '属性总览可用于生命值计算' : '请先生成基础属性' }}</span>
      <button type="button" :disabled="!hasBaseScores" @click="goNext">继续生命值</button>
    </footer>
  </div>
</template>

<style scoped>
.ability-summary-page {
  min-height: 100dvh;
  padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(ellipse at 20% 14%, rgba(90, 130, 120, 0.12), transparent 46%),
    radial-gradient(ellipse at 80% 20%, rgba(160, 80, 90, 0.1), transparent 44%),
    var(--bg);
}

.ability-summary-header {
  padding: 42px 20px 20px;
  text-align: center;
}

.summary-badge,
.panel-kicker {
  font-family: var(--font-title);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
}

.summary-badge {
  display: inline-block;
  font-size: 10px;
  border: 1px solid var(--border-gold);
  border-radius: 999px;
  padding: 4px 14px;
  background: rgba(201, 168, 76, 0.08);
  margin-bottom: 12px;
}

.ability-summary-header h1 {
  font-family: var(--font-deco);
  color: var(--gold-bright);
  font-size: clamp(26px, 5vw, 40px);
}

.ability-summary-header p {
  max-width: 640px;
  margin: 8px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.ability-summary-layout {
  width: min(1080px, calc(100% - 32px));
  margin: 24px auto 0;
  display: grid;
  gap: 14px;
}

.ability-panel {
  border: 1px solid var(--border-dark);
  background: rgba(19, 16, 42, 0.78);
  padding: 18px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
}

.ability-panel-main {
  border-color: rgba(201, 168, 76, 0.34);
}

.panel-kicker {
  font-size: 10px;
  margin-bottom: 8px;
}

.panel-title-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title-row h2,
.source-panel h2 {
  color: var(--gold-light);
  font-size: 22px;
}

.ghost-action {
  border: 1px solid rgba(201, 168, 76, 0.28);
  border-radius: var(--r);
  color: var(--gold);
  background: rgba(201, 168, 76, 0.06);
  font-family: var(--font-title);
  padding: 10px 14px;
}

.ability-row-list {
  display: grid;
  gap: 10px;
}

.ability-total-row {
  display: grid;
  grid-template-columns: 1fr 64px 64px 64px 82px;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--border-dark);
  border-radius: var(--r);
  background: rgba(8, 6, 18, 0.42);
  padding: 12px;
}

.ability-name,
.ability-formula,
.ability-total {
  display: grid;
  gap: 2px;
}

.ability-name strong,
.ability-total strong {
  color: var(--gold-light);
  font-family: var(--font-title);
}

.ability-name span,
.ability-formula small,
.ability-total span,
.source-item span,
.source-note,
.ability-summary-footer span {
  color: var(--text-muted);
  font-size: 12px;
}

.ability-formula {
  text-align: center;
}

.ability-formula span {
  color: var(--text);
  font-family: var(--font-title);
  font-size: 18px;
}

.ability-formula.bonus span {
  color: var(--gold);
}

.ability-formula.feat-bonus span {
  color: #8ec8a0;
}

.ability-total {
  text-align: right;
}

.ability-total strong {
  font-size: 28px;
  line-height: 1;
}

.source-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.source-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  border-top: 1px solid var(--border-dark);
  padding-top: 10px;
}

.source-item strong {
  color: var(--text);
  font-family: var(--font-title);
  font-weight: 500;
}

.source-note {
  line-height: 1.7;
  margin-top: 16px;
}

.ability-summary-footer {
  position: fixed;
  inset: auto 0 0;
  padding: 16px 20px env(safe-area-inset-bottom, 0px);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
  border-top: 1px solid var(--border-dark);
  background: rgba(12, 10, 23, 0.96);
  backdrop-filter: blur(12px);
}

.ability-summary-footer button {
  min-height: 44px;
  padding: 10px 26px;
  border-radius: var(--r);
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  color: #120D08;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.1em;
}

.ability-summary-footer button:disabled {
  opacity: 0.35;
  pointer-events: none;
}

@media (max-width: 720px) {
  .panel-title-row,
  .ability-summary-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .ability-total-row {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }

  .ability-name {
    grid-column: 1 / -1;
  }

  .ability-total {
    text-align: center;
  }

  .ability-summary-footer button {
    width: 100%;
  }
}

@media (min-width: 860px) {
  .ability-summary-layout {
    grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  }
}
</style>
