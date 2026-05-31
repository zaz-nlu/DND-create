<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { character, setHpMethod, setHpRoll, commitHpMax } from '../store/character.js'
import StepNav from './StepNav.vue'
import AbilityBar from '../components/AbilityBar.vue'
import DiceButton from '../components/DiceButton.vue'
import { classes } from '../data/classes.js'
import { backgrounds } from '../data/backgrounds.js'
import { findOriginFeatByNameEn } from '../data/originFeats.js'
import { parseDie, rollDie, calcHpStandard, calcHpFromRolls } from '../utils/hp.js'
import { getAbilityTotalScores } from '../utils/abilityTotals.js'

const router = useRouter()

const currentClass  = computed(() => classes.find(c => c.id === character.class.id) ?? null)
const hitDie        = computed(() => currentClass.value?.hitDie ?? 'd8')
const dieMax        = computed(() => parseDie(hitDie.value))
const level         = computed(() => character.level)
const conScore      = computed(() => {
  const s = getAbilityTotalScores(character)['体质']
  return (Number.isFinite(s) && s > 0) ? s : 10
})
const conModValue   = computed(() => Math.floor((conScore.value - 10) / 2))
const method        = computed(() => character.hp.method)
const rolls         = computed(() => character.hp.rolls)
// 1级固定满值不需掷，从index 1（2级）起算
const rolledCount   = computed(() => rolls.value.slice(1).filter(r => r > 0).length)
const allRolled     = computed(() => level.value <= 1 || rolledCount.value >= level.value - 1)

// 健壮专长：来源可以是人类额外专长或背景专长
const selectedBackground = computed(() => backgrounds.find(b => b.id === character.background.id) ?? null)
const backgroundOriginFeat = computed(() => {
  const feat = selectedBackground.value?.feat
  return feat ? findOriginFeatByNameEn(feat.nameEn) : null
})
const hasTough = computed(() =>
  character.race.choices?.originFeatId === 'tough' ||
  backgroundOriginFeat.value?.id === 'tough'
)
const toughBonus = computed(() => hasTough.value ? level.value * 2 : 0)

const totalHp = computed(() => {
  if (method.value === 'standard') return calcHpStandard(hitDie.value, level.value, conScore.value, toughBonus.value)
  if (method.value === 'rolled')   return calcHpFromRolls(rolls.value, level.value, conScore.value, toughBonus.value)
  return 0
})

const standardBreakdown = computed(() => {
  if (method.value !== 'standard') return []
  const mod     = conModValue.value
  const die     = dieMax.value
  const perLvl  = Math.floor(die / 2) + 1
  return Array.from({ length: level.value }, (_, i) => ({
    level: i + 1,
    base:  i === 0 ? die : perLvl,
    mod,
    total: (i === 0 ? die : perLvl) + mod,
  }))
})

// ── 骰子动画状态 ──────────────────────────────────────────
const rolling      = ref([])       // 是否正在骰
const displayRolls = ref([])       // 动画数字
const landed       = ref([])       // 落定动画触发标志

function selectMethod(m) {
  setHpMethod(m)
  rolling.value      = []
  displayRolls.value = []
  landed.value       = []
  // 1级固定取满值
  if (m === 'rolled') setHpRoll(0, dieMax.value)
}

function rollLevel(i) {
  if (rolling.value[i]) return

  rolling.value[i]      = true
  landed.value[i]       = false
  displayRolls.value[i] = Math.floor(Math.random() * dieMax.value) + 1

  const max    = dieMax.value
  let   ticks  = 0
  const total  = 16 + Math.floor(Math.random() * 6)  // 16-21 帧
  const delay  = (t) => t < 8 ? 45 : t < 14 ? 70 : 100  // 先快后慢

  function tick() {
    displayRolls.value[i] = Math.floor(Math.random() * max) + 1
    ticks++
    if (ticks < total) {
      setTimeout(tick, delay(ticks))
    } else {
      const result = rollDie(hitDie.value)
      displayRolls.value[i] = result
      setHpRoll(i, result)
      rolling.value[i] = false
      // 触发落定弹跳
      setTimeout(() => { landed.value[i] = true }, 20)
      setTimeout(() => { landed.value[i] = false }, 520)
    }
  }
  setTimeout(tick, 40)
}

function confirm() {
  commitHpMax(totalHp.value)
  router.push('/sheet')
}
</script>

<template>
  <div class="hp-page">
    <StepNav step="10 / 10" label="生命值" back-to="/equipment" />
    <AbilityBar />
    <!-- ── 头部 ── -->
    <header class="hp-header">
      <div class="hp-step-badge">步骤 9 / 10 · 生命值</div>
      <h1 class="hp-title">生命之骰</h1>
      <div class="hp-meta">
        <span class="hp-meta-chip">{{ currentClass?.name ?? '—' }}</span>
        <span class="hp-meta-sep">·</span>
        <span class="hp-meta-chip">{{ hitDie }}</span>
        <span class="hp-meta-sep">·</span>
        <span class="hp-meta-chip">{{ level }} 级</span>
        <span class="hp-meta-sep">·</span>
        <span class="hp-meta-chip hp-con">
          体质 {{ conModValue >= 0 ? '+' : '' }}{{ conModValue }}
        </span>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════
         方法选择
    ════════════════════════════════════════════════════ -->
    <div v-if="!method" class="hp-method-select">
      <p class="hp-method-label">选择生命值计算方式</p>

      <button class="hp-method-card" @click="selectMethod('standard')">
        <div class="hp-method-icon-wrap">
          <svg class="hp-method-svg" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="4" width="28" height="28" rx="6" stroke="currentColor" stroke-width="2"/>
            <text x="18" y="24" text-anchor="middle" font-size="16" fill="currentColor" font-family="serif">⚖</text>
          </svg>
        </div>
        <div class="hp-method-body">
          <div class="hp-method-name">固定法 <span class="hp-recommended">推荐</span></div>
          <div class="hp-method-desc">
            1级取满值 <strong>{{ dieMax }}</strong>，之后每级固定取
            <strong>{{ Math.floor(dieMax / 2) + 1 }}</strong>，稳定可预期
          </div>
        </div>
        <div class="hp-method-arrow">›</div>
      </button>

      <button class="hp-method-card hp-method-card--dice" @click="selectMethod('rolled')">
        <div class="hp-method-icon-wrap">
          <!-- 骰子小图标 -->
          <svg class="hp-method-svg" viewBox="0 0 36 36" fill="none">
            <rect x="3" y="3" width="30" height="30" rx="7" stroke="currentColor" stroke-width="2"/>
            <circle cx="11" cy="11" r="2.5" fill="currentColor"/>
            <circle cx="25" cy="11" r="2.5" fill="currentColor"/>
            <circle cx="18" cy="18" r="2.5" fill="currentColor"/>
            <circle cx="11" cy="25" r="2.5" fill="currentColor"/>
            <circle cx="25" cy="25" r="2.5" fill="currentColor"/>
          </svg>
        </div>
        <div class="hp-method-body">
          <div class="hp-method-name">随机骰 <span class="hp-adventurer">冒险家做法</span></div>
          <div class="hp-method-desc">
            每级亲手骰一次 <strong>{{ hitDie }}</strong>，运气好超越固定法，运气差嘛……那就是命
          </div>
        </div>
        <div class="hp-method-arrow">›</div>
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════
         固定法明细
    ════════════════════════════════════════════════════ -->
    <div v-else-if="method === 'standard'" class="hp-content">
      <div class="hp-breakdown">
        <div v-for="row in standardBreakdown" :key="row.level" class="hp-std-row">
          <span class="hp-std-lv">Lv.{{ row.level }}</span>
          <div class="hp-std-formula">
            <span class="hp-std-base">{{ row.base }}</span>
            <span class="hp-std-oper">{{ row.mod >= 0 ? '+' : '' }}{{ row.mod }}</span>
            <span class="hp-std-eq">=</span>
            <span class="hp-std-total">{{ row.total }}</span>
          </div>
          <span class="hp-std-note">{{ row.level === 1 ? `${hitDie} 满值` : `${hitDie}/2+1` }}</span>
        </div>
        <div v-if="hasTough" class="hp-std-row hp-std-row--feat">
          <span class="hp-std-lv">✦</span>
          <div class="hp-std-formula">
            <span class="hp-std-base">健壮</span>
            <span class="hp-std-oper">+{{ toughBonus }}</span>
          </div>
          <span class="hp-std-note">专长加值 ({{ level }}级×2)</span>
        </div>
      </div>

      <div class="hp-total-bar">
        <div class="hp-total-left">
          <div class="hp-total-label">最大生命值</div>
          <div class="hp-total-sub">{{ level }} 级 · 固定法{{ hasTough ? ' · 含健壮' : '' }}</div>
        </div>
        <div class="hp-total-num">{{ totalHp }}</div>
      </div>

      <div class="hp-actions">
        <button class="hp-back-btn" @click="selectMethod(null)">← 重选</button>
        <button class="hp-confirm-btn" @click="confirm">确认并继续 →</button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         随机骰 — 逐级骰子
    ════════════════════════════════════════════════════ -->
    <div v-else-if="method === 'rolled'" class="hp-content">
      <div class="hp-dice-list">
        <div v-for="i in level" :key="i" class="hp-dice-item">

          <!-- 等级标签 -->
          <div class="hp-dice-lv-label">
            <span class="hp-dice-lv-num">{{ i }}</span>
            <span class="hp-dice-lv-text">级</span>
          </div>

          <!-- 1级固定满值，不可掷 -->
          <div v-if="i === 1" class="hp-dice-fixed">
            <span class="hp-dice-fixed-val">{{ dieMax }}</span>
            <span class="hp-dice-fixed-label">{{ hitDie }} 满值</span>
          </div>

          <!-- 1级结果（含体调），始终可见 -->
          <div v-if="i === 1" class="hp-dice-result hp-dice-result--visible">
            <div class="hp-dice-result-row">
              <span class="hp-result-roll">{{ dieMax }}</span>
              <span class="hp-result-oper">{{ conModValue >= 0 ? '+' : '' }}{{ conModValue }}</span>
            </div>
            <div class="hp-result-total">= {{ dieMax + conModValue }}</div>
          </div>

          <!-- 2级以上可掷 -->
          <DiceButton
            v-else
            :die="hitDie"
            :value="
              rolling[i - 1]
                ? displayRolls[i - 1] ?? '?'
                : rolls[i - 1] > 0
                  ? rolls[i - 1]
                  : null
            "
            :hint="rolling[i - 1] ? '掷骰中' : rolls[i - 1] > 0 ? '点击重掷' : '点击掷骰'"
            :rolling="rolling[i - 1]"
            :done="rolls[i - 1] > 0"
            :landed="landed[i - 1]"
            :aria-label="`第 ${i} 级生命骰，点击掷骰`"
            @click="rollLevel(i - 1)"
          />

          <!-- 2级以上结果展示 -->
          <div
            v-if="i > 1"
            class="hp-dice-result"
            :class="{ 'hp-dice-result--visible': rolls[i - 1] > 0 && !rolling[i - 1] }"
          >
            <div class="hp-dice-result-row">
              <span class="hp-result-roll">{{ rolls[i - 1] }}</span>
              <span class="hp-result-oper">{{ conModValue >= 0 ? '+' : '' }}{{ conModValue }}</span>
            </div>
            <div class="hp-result-total">= {{ (rolls[i - 1] || 0) + conModValue }}</div>
          </div>

        </div>
      </div>

      <!-- 进度条 -->
      <div class="hp-progress-wrap">
        <div class="hp-progress-bar">
          <div
            class="hp-progress-fill"
            :style="{ width: `${(rolledCount / level) * 100}%` }"
          />
        </div>
        <span class="hp-progress-text">{{ rolledCount }} / {{ Math.max(level - 1, 0) }} 级已骰（1级固定满值）</span>
      </div>

      <!-- 合计 -->
      <Transition name="hp-total-fade">
        <div v-if="allRolled" class="hp-total-bar hp-total-bar--glow">
          <div class="hp-total-left">
            <div class="hp-total-label">最大生命值</div>
            <div class="hp-total-sub">{{ level }} 级 · 随机骰{{ hasTough ? ' · 含健壮' : '' }}</div>
          </div>
          <div class="hp-total-num">{{ totalHp }}</div>
        </div>
      </Transition>

      <div class="hp-actions">
        <button class="hp-back-btn" @click="selectMethod(null)">← 重选</button>
        <button
          v-if="allRolled"
          class="hp-confirm-btn"
          @click="confirm"
        >确认并继续 →</button>
        <p v-else class="hp-pending-hint">还有 {{ level - rolledCount }} 级未骰</p>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ══════════════════════════════════════════════════════════
   页面基础
══════════════════════════════════════════════════════════ */
.hp-page {
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}

/* ── 头部 ── */
.hp-header {
  padding: 48px 20px 20px;
  text-align: center;
}

.hp-step-badge {
  display: inline-block;
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gold);
  background: rgba(201, 168, 76, 0.08);
  border: 1px solid rgba(201, 168, 76, 0.22);
  padding: 4px 14px;
  border-radius: 999px;
  margin-bottom: 12px;
}

.hp-title {
  font-family: var(--font-deco, var(--font-title));
  font-size: 30px;
  color: var(--text);
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.hp-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
}

.hp-meta-chip {
  background: rgba(201, 168, 76, 0.08);
  border: 1px solid rgba(201, 168, 76, 0.18);
  border-radius: 999px;
  padding: 3px 10px;
  color: var(--text-muted);
  font-family: var(--font-title);
  letter-spacing: 0.06em;
}

.hp-con { color: var(--gold); border-color: rgba(201, 168, 76, 0.35); }
.hp-meta-sep { color: var(--text-dim); font-size: 14px; }

/* ══════════════════════════════════════════════════════════
   方法选择卡片
══════════════════════════════════════════════════════════ */
.hp-method-select {
  padding: 8px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hp-method-label {
  text-align: center;
  font-family: var(--font-title);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin: 0 0 4px;
}

.hp-method-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-dark);
  border-radius: var(--r-lg);
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.12s;
  width: 100%;
}

.hp-method-card:hover {
  border-color: var(--border-gold);
  background: var(--bg-card-sel);
  transform: translateY(-1px);
}

.hp-method-card:active {
  transform: scale(0.98) translateY(0);
}

.hp-method-card--dice:hover {
  border-color: rgba(201, 168, 76, 0.5);
}

.hp-method-icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 168, 76, 0.06);
  border: 1px solid rgba(201, 168, 76, 0.18);
  border-radius: var(--r);
  color: var(--gold);
}

.hp-method-svg { width: 28px; height: 28px; }

.hp-method-body { flex: 1; }

.hp-method-name {
  font-family: var(--font-title);
  font-size: 15px;
  color: var(--text);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hp-recommended {
  font-family: var(--font-body);
  font-size: 10px;
  background: rgba(201, 168, 76, 0.15);
  border: 1px solid rgba(201, 168, 76, 0.3);
  color: var(--gold);
  padding: 1px 7px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}

.hp-adventurer {
  font-family: var(--font-body);
  font-size: 10px;
  background: rgba(180, 100, 60, 0.15);
  border: 1px solid rgba(180, 100, 60, 0.3);
  color: #C87040;
  padding: 1px 7px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}

.hp-method-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.hp-method-desc strong { color: var(--gold-light); }

.hp-method-arrow {
  font-size: 22px;
  color: var(--text-dim);
  flex-shrink: 0;
  transition: color 0.2s, transform 0.2s;
}

.hp-method-card:hover .hp-method-arrow {
  color: var(--gold);
  transform: translateX(3px);
}

/* ══════════════════════════════════════════════════════════
   内容区通用
══════════════════════════════════════════════════════════ */
.hp-content {
  padding: 8px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ══════════════════════════════════════════════════════════
   固定法明细
══════════════════════════════════════════════════════════ */
.hp-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hp-std-row {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-dark);
  border-radius: var(--r);
  padding: 10px 14px;
}

.hp-std-lv {
  font-family: var(--font-title);
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 0.06em;
}

.hp-std-formula {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.hp-std-base  { color: var(--text); font-family: var(--font-title); font-size: 16px; }
.hp-std-oper  { color: var(--text-muted); font-size: 13px; }
.hp-std-eq    { color: var(--text-dim); }
.hp-std-total { color: var(--gold); font-family: var(--font-title); font-size: 18px; }

.hp-std-note {
  font-size: 11px;
  color: var(--text-dim);
  white-space: nowrap;
}

.hp-std-row--feat {
  border-top: 1px solid rgba(201, 168, 76, 0.2);
  margin-top: 4px;
  padding-top: 8px;
}

.hp-std-row--feat .hp-std-lv {
  color: var(--gold);
  font-size: 14px;
}

.hp-std-row--feat .hp-std-base {
  color: var(--gold-light);
}

.hp-std-row--feat .hp-std-oper {
  color: var(--gold);
  font-size: 15px;
  font-family: var(--font-title);
}

/* ══════════════════════════════════════════════════════════
   骰子列表
══════════════════════════════════════════════════════════ */
.hp-dice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hp-dice-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* 1级固定满值展示 */
.hp-dice-fixed {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(201, 168, 76, 0.4);
  border-radius: 12px;
  background: rgba(201, 168, 76, 0.08);
  gap: 4px;
}

.hp-dice-fixed-val {
  font-family: var(--font-deco);
  font-size: 32px;
  color: var(--gold-bright);
  line-height: 1;
}

.hp-dice-fixed-label {
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--gold);
}

/* 等级标签 */
.hp-dice-lv-label {
  flex: 0 0 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.hp-dice-lv-num {
  font-family: var(--font-title);
  font-size: 18px;
  color: var(--text-muted);
  line-height: 1;
}

.hp-dice-lv-text {
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 0.06em;
  margin-top: 2px;
}

/* ── 结果展示 ── */
.hp-dice-result {
  flex: 1;
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.hp-dice-result--visible {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.hp-dice-result-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.hp-result-roll {
  font-family: var(--font-title);
  font-size: 22px;
  color: var(--text);
  line-height: 1;
}

.hp-result-oper {
  font-size: 14px;
  color: var(--text-muted);
}

.hp-result-total {
  font-family: var(--font-title);
  font-size: 16px;
  color: var(--gold);
  margin-top: 2px;
}

/* ══════════════════════════════════════════════════════════
   进度条
══════════════════════════════════════════════════════════ */
.hp-progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hp-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 999px;
  overflow: hidden;
}

.hp-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-dim) 0%, var(--gold) 100%);
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hp-progress-text {
  font-family: var(--font-title);
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 0.08em;
  white-space: nowrap;
}

/* ══════════════════════════════════════════════════════════
   合计栏
══════════════════════════════════════════════════════════ */
.hp-total-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1E1A38 0%, #191530 100%);
  border: 1px solid rgba(201, 168, 76, 0.35);
  border-radius: var(--r-lg);
  padding: 16px 20px;
}

.hp-total-bar--glow {
  box-shadow: 0 0 24px rgba(201, 168, 76, 0.12), 0 4px 12px rgba(0,0,0,0.4);
}

.hp-total-label {
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.1em;
  color: var(--text);
  margin-bottom: 2px;
}

.hp-total-sub {
  font-size: 11px;
  color: var(--text-dim);
}

.hp-total-num {
  font-family: var(--font-title);
  font-size: 48px;
  line-height: 1;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(201, 168, 76, 0.4);
}

/* 合计出现动画 */
.hp-total-fade-enter-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hp-total-fade-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(8px);
}

/* ══════════════════════════════════════════════════════════
   底部按钮
══════════════════════════════════════════════════════════ */
.hp-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
}

.hp-back-btn {
  flex: 0 0 auto;
  padding: 11px 16px;
  border-radius: var(--r);
  border: 1px solid rgba(201, 168, 76, 0.2);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.hp-back-btn:hover {
  border-color: rgba(201, 168, 76, 0.45);
  color: var(--text);
}

.hp-confirm-btn {
  flex: 1;
  padding: 14px;
  border-radius: var(--r);
  border: 1px solid var(--gold);
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.18) 0%, rgba(201, 168, 76, 0.08) 100%);
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
}

.hp-confirm-btn:hover {
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.28) 0%, rgba(201, 168, 76, 0.14) 100%);
  box-shadow: 0 0 16px rgba(201, 168, 76, 0.2);
}

.hp-confirm-btn:active {
  transform: scale(0.97);
}

.hp-pending-hint {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: var(--text-dim);
  font-family: var(--font-title);
  letter-spacing: 0.06em;
  margin: 0;
}

</style>
