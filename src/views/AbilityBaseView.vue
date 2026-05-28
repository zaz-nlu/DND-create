<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { character, setAbilityMethod, setAbilityScore } from '../store/character.js'
import {
  ABILITY_EN,
  ABILITY_IDS,
  PB_MAX,
  PB_MIN,
  POINT_COST,
  POINT_TOTAL,
  modStr,
  pointsSpent,
  rollAllSix,
} from '../utils/abilities.js'
import { hasCompleteBaseAbilityScores } from '../utils/abilityTotals.js'
import StepNav from './StepNav.vue'

const router = useRouter()
const selectedMethod = ref(character.abilities.method)
const method = computed(() => selectedMethod.value)

const pbScores = reactive(
  Object.fromEntries(
    ABILITY_IDS.map(id => [
      id,
      character.abilities.method === 'pointbuy' && character.abilities.scores[id]
        ? character.abilities.scores[id]
        : PB_MIN,
    ])
  )
)
const spent = computed(() => pointsSpent(pbScores))
const remaining = computed(() => POINT_TOTAL - spent.value)

const rolls = ref([])
const rollPreview = ref([])
const rollingScores = ref(false)
const rollLanded = ref(false)
const selectedRoll = ref(null)
const assignment = reactive(Object.fromEntries(ABILITY_IDS.map(id => [id, null])))
const usedRolls = computed(() => new Set(Object.values(assignment).filter(value => value !== null)))
const allAssigned = computed(() => ABILITY_IDS.every(id => assignment[id] !== null))
const displayRolls = computed(() => rollingScores.value ? rollPreview.value : rolls.value)
const canContinue = computed(() =>
  Boolean(character.abilities.method) &&
  hasCompleteBaseAbilityScores(character) &&
  selectedMethod.value === character.abilities.method
)
const rollTimers = []

function clearRollTimers() {
  while (rollTimers.length) {
    clearTimeout(rollTimers.pop())
  }
}

function randomD6() {
  return Math.floor(Math.random() * 6) + 1
}

function createPreviewRoll() {
  const dice = Array.from({ length: 4 }, randomD6).sort((a, b) => a - b)
  const kept = dice.slice(1)
  return {
    total: kept.reduce((sum, die) => sum + die, 0),
    dice,
    dropped: dice[0],
    kept,
  }
}

function selectMethod(nextMethod) {
  selectedMethod.value = nextMethod
  selectedRoll.value = null
  rolls.value = []
  rollPreview.value = []
  rollingScores.value = false
  rollLanded.value = false
  clearRollTimers()
  ABILITY_IDS.forEach(id => {
    assignment[id] = null
    pbScores[id] = PB_MIN
  })
}

function increaseScore(id) {
  const current = pbScores[id]
  const next = current + 1
  if (current >= PB_MAX) return
  if (remaining.value < POINT_COST[next] - POINT_COST[current]) return
  pbScores[id] = next
}

function decreaseScore(id) {
  if (pbScores[id] <= PB_MIN) return
  pbScores[id] -= 1
}

function savePointBuy() {
  ABILITY_IDS.forEach(id => setAbilityScore(id, pbScores[id]))
  setAbilityMethod('pointbuy')
}

function rollScores() {
  if (rollingScores.value) return

  clearRollTimers()
  rollingScores.value = true
  rollLanded.value = false
  rolls.value = []
  rollPreview.value = Array.from({ length: 6 }, createPreviewRoll)
  selectedRoll.value = null
  ABILITY_IDS.forEach(id => {
    assignment[id] = null
  })

  let tick = 0
  const maxTicks = 18

  function animateRoll() {
    rollPreview.value = Array.from({ length: 6 }, createPreviewRoll)
    tick += 1

    if (tick < maxTicks) {
      const delay = tick < 8 ? 45 : tick < 14 ? 70 : 105
      rollTimers.push(setTimeout(animateRoll, delay))
      return
    }

    rolls.value = rollAllSix().sort((a, b) => b.total - a.total)
    rollingScores.value = false
    rollLanded.value = true
    rollPreview.value = []
    rollTimers.push(setTimeout(() => {
      rollLanded.value = false
    }, 560))
  }

  rollTimers.push(setTimeout(animateRoll, 40))
}

function selectRoll(index) {
  if (rollingScores.value) return
  if (usedRolls.value.has(index)) return
  selectedRoll.value = selectedRoll.value === index ? null : index
}

function assignRoll(id) {
  if (rollingScores.value) return
  if (selectedRoll.value === null) return
  assignment[id] = selectedRoll.value
  selectedRoll.value = null
}

function clearAssignment(id) {
  if (rollingScores.value) return
  assignment[id] = null
}

function saveRolled() {
  if (!allAssigned.value) return
  ABILITY_IDS.forEach(id => setAbilityScore(id, rolls.value[assignment[id]].total))
  setAbilityMethod('rolled')
}

function continueFlow() {
  if (!canContinue.value) return
  router.push('/race')
}

onBeforeUnmount(clearRollTimers)
</script>

<template>
  <div class="ability-base-page">
    <StepNav step="2 / 10" label="基础属性" back-to="/setup" />

    <header class="ability-base-header">
      <div class="ability-base-badge">步骤 2 / 10 · 基础属性</div>
      <h1>先定六维，再走构筑</h1>
      <p>这里记录不含背景与专长的基础属性。后面的背景、专长、装备只作为修正来源叠加。</p>
    </header>

    <main class="ability-base-layout">
      <section class="ability-base-panel method-panel">
        <div class="panel-kicker">属性生成方式</div>
        <div class="method-grid">
          <button
            type="button"
            :class="['method-card', { active: method === 'pointbuy' }]"
            @click="selectMethod('pointbuy')"
          >
            <strong>27 点加点</strong>
            <span>稳定、公平，适合多数桌面团。</span>
          </button>
          <button
            type="button"
            :class="['method-card', { active: method === 'rolled' }]"
            @click="selectMethod('rolled')"
          >
            <strong>随机掷骰</strong>
            <span>4d6 去最低，结果更有冒险感。</span>
          </button>
        </div>
      </section>

      <section v-if="method === 'pointbuy'" class="ability-base-panel">
        <div class="panel-title-row">
          <div>
            <div class="panel-kicker">27 点加点</div>
            <h2>分配基础值</h2>
          </div>
          <div class="point-pool" :class="{ empty: remaining === 0 }">{{ remaining }}</div>
        </div>

        <div class="score-list">
          <div v-for="id in ABILITY_IDS" :key="id" class="score-row">
            <div class="score-name">
              <strong>{{ id }}</strong>
              <span>{{ ABILITY_EN[id] }}</span>
            </div>
            <div class="score-controls">
              <button type="button" :disabled="pbScores[id] <= PB_MIN" @click="decreaseScore(id)">-</button>
              <div class="score-value">
                <strong>{{ pbScores[id] }}</strong>
                <span>{{ modStr(pbScores[id]) }}</span>
              </div>
              <button
                type="button"
                :disabled="pbScores[id] >= PB_MAX || remaining < POINT_COST[pbScores[id] + 1] - POINT_COST[pbScores[id]]"
                @click="increaseScore(id)"
              >+</button>
            </div>
            <div class="score-cost">{{ POINT_COST[pbScores[id]] }} pt</div>
          </div>
        </div>

        <button class="save-method" type="button" @click="savePointBuy">保存这组基础属性</button>
      </section>

      <section v-else-if="method === 'rolled'" class="ability-base-panel">
        <div class="panel-title-row">
          <div>
            <div class="panel-kicker">随机掷骰</div>
            <h2>掷出六组并分配</h2>
          </div>
          <button
            :class="['roll-button', { rolling: rollingScores }]"
            type="button"
            :disabled="rollingScores"
            @click="rollScores"
          >
            {{ rollingScores ? '骰子滚动中' : rolls.length ? '重新掷骰' : '开始掷骰' }}
          </button>
        </div>

        <div v-if="displayRolls.length" class="rolled-layout">
          <div class="roll-list">
            <button
              v-for="(roll, index) in displayRolls"
              :key="index"
              type="button"
              :disabled="rollingScores || usedRolls.has(index)"
              :class="[
                'roll-chip',
                {
                  active: selectedRoll === index,
                  used: usedRolls.has(index),
                  rolling: rollingScores,
                  landed: rollLanded,
                },
              ]"
              @click="selectRoll(index)"
            >
              <strong>{{ roll.total }}</strong>
              <span class="roll-dice-row">
                <i
                  v-for="(die, dieIndex) in roll.dice"
                  :key="dieIndex"
                  :class="['roll-die', { dropped: !rollingScores && dieIndex === 0 }]"
                >
                  {{ die }}
                </i>
              </span>
              <small v-if="!rollingScores">保留 {{ roll.kept.join(' + ') }}</small>
            </button>
          </div>

          <div class="assign-list">
            <button
              v-for="id in ABILITY_IDS"
              :key="id"
              type="button"
              :disabled="rollingScores || !rolls.length"
              :class="['assign-row', { filled: assignment[id] !== null }]"
              @click="assignment[id] === null ? assignRoll(id) : clearAssignment(id)"
            >
              <span>{{ id }} · {{ ABILITY_EN[id] }}</span>
              <strong v-if="assignment[id] !== null">{{ rolls[assignment[id]].total }}</strong>
              <em v-else>{{ selectedRoll === null ? '待分配' : '点此放入' }}</em>
            </button>
          </div>
        </div>

        <button
          v-if="rolls.length"
          class="save-method"
          type="button"
          :disabled="!allAssigned"
          @click="saveRolled"
        >
          保存这组基础属性
        </button>
      </section>

      <section v-else class="ability-base-panel empty-panel">
        <div class="panel-kicker">等待选择</div>
        <h2>选择一种属性生成方式</h2>
        <p>建议默认用 27 点加点，后续通用专长的 13+ 先决会更容易自动判断。</p>
      </section>
    </main>

    <footer class="ability-base-footer">
      <span>{{ canContinue ? '基础属性已保存' : '请先保存基础属性' }}</span>
      <button type="button" :disabled="!canContinue" @click="continueFlow">继续选择种族</button>
    </footer>
  </div>
</template>

<style scoped>
.ability-base-page {
  min-height: 100dvh;
  padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(ellipse at 18% 14%, rgba(128, 98, 42, 0.14), transparent 46%),
    radial-gradient(ellipse at 86% 18%, rgba(86, 120, 132, 0.12), transparent 44%),
    var(--bg);
}

.ability-base-header {
  padding: 42px 20px 20px;
  text-align: center;
}

.ability-base-badge,
.panel-kicker {
  font-family: var(--font-title);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
}

.ability-base-badge {
  display: inline-block;
  font-size: 10px;
  border: 1px solid var(--border-gold);
  border-radius: 999px;
  padding: 4px 14px;
  background: rgba(201, 168, 76, 0.08);
  margin-bottom: 12px;
}

.ability-base-header h1 {
  font-family: var(--font-deco);
  color: var(--gold-bright);
  font-size: clamp(26px, 5vw, 40px);
}

.ability-base-header p {
  max-width: 640px;
  margin: 8px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.ability-base-layout {
  width: min(980px, calc(100% - 32px));
  margin: 24px auto 0;
  display: grid;
  gap: 14px;
}

.ability-base-panel {
  border: 1px solid var(--border-dark);
  background: rgba(19, 16, 42, 0.78);
  padding: 18px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
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
  margin-bottom: 14px;
}

.panel-title-row h2,
.empty-panel h2 {
  color: var(--gold-light);
  font-size: 22px;
}

.method-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.method-card {
  min-height: 92px;
  border: 1px solid var(--border-dark);
  border-radius: var(--r);
  background: rgba(255, 255, 255, 0.025);
  text-align: left;
  padding: 14px;
}

.method-card strong,
.score-value strong,
.roll-chip strong,
.assign-row strong {
  color: var(--gold-light);
  font-family: var(--font-title);
}

.score-name strong {
  color: var(--text, #e8e0d0);
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 600;
}

.method-card span,
.score-value span,
.roll-chip span,
.assign-row em,
.empty-panel p,
.ability-base-footer span {
  color: var(--text-muted);
  font-size: 12px;
}

.score-name span {
  color: var(--gold, #c9a84c);
  font-family: var(--font-title);
  font-size: 11px;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.method-card.active {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
}

.point-pool {
  min-width: 58px;
  min-height: 58px;
  border: 1px solid rgba(201, 168, 76, 0.34);
  display: grid;
  place-items: center;
  color: var(--gold);
  font-family: var(--font-title);
  font-size: 30px;
}

.point-pool.empty {
  color: var(--text-dim);
}

.score-list {
  display: grid;
  gap: 10px;
}

.score-row {
  display: grid;
  grid-template-columns: 1fr auto 54px;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--border-dark);
  border-radius: var(--r);
  background: rgba(8, 6, 18, 0.42);
  padding: 10px 12px;
}

.score-name,
.score-value {
  display: grid;
  gap: 2px;
}

.score-value strong {
  font-size: 22px;
  line-height: 1;
}

.score-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-controls button {
  width: 34px;
  height: 34px;
  border-radius: var(--r-sm);
  border: 1px solid rgba(201, 168, 76, 0.24);
  color: var(--gold);
  background: rgba(201, 168, 76, 0.06);
}

.score-controls button:disabled,
.save-method:disabled,
.roll-chip:disabled,
.ability-base-footer button:disabled {
  opacity: 0.35;
}

.score-cost {
  color: var(--text-dim);
  font-size: 12px;
  text-align: right;
}

.roll-button,
.save-method,
.ability-base-footer button {
  border-radius: var(--r);
  border: 1px solid var(--gold);
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.18), rgba(201, 168, 76, 0.08));
  color: var(--gold-light);
  font-family: var(--font-title);
  padding: 12px 16px;
}

.roll-button.rolling {
  animation: rollButtonPulse 0.42s ease-in-out infinite alternate;
}

.rolled-layout {
  display: grid;
  grid-template-columns: 0.75fr 1fr;
  gap: 12px;
}

.roll-list,
.assign-list {
  display: grid;
  gap: 8px;
}

.roll-chip,
.assign-row {
  border: 1px solid var(--border-dark);
  border-radius: var(--r);
  background: rgba(8, 6, 18, 0.42);
  padding: 10px 12px;
  text-align: left;
}

.roll-chip {
  display: grid;
  gap: 7px;
  min-height: 94px;
  transition:
    transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;
}

.roll-chip.active,
.assign-row.filled {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
}

.roll-chip.used {
  opacity: 0.35;
}

.roll-chip.rolling {
  border-color: rgba(201, 168, 76, 0.46);
  animation: rollChipShake 0.085s infinite alternate;
}

.roll-chip.landed {
  animation: rollChipLand 0.52s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.roll-chip strong {
  font-size: 26px;
  line-height: 1;
}

.roll-dice-row {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.roll-die {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(201, 168, 76, 0.22);
  border-radius: 6px;
  display: grid;
  place-items: center;
  color: var(--text);
  background: rgba(255, 255, 255, 0.04);
  font-size: 12px;
  font-style: normal;
  font-family: var(--font-title);
}

.roll-chip.rolling .roll-die {
  color: var(--gold-bright);
  box-shadow: 0 0 10px rgba(201, 168, 76, 0.16);
}

.roll-die.dropped {
  color: var(--text-dim);
  opacity: 0.46;
  text-decoration: line-through;
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.roll-chip small {
  color: var(--text-dim);
  font-size: 11px;
}

.assign-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.assign-row span {
  color: var(--text, #e8e0d0);
  font-family: var(--font-title);
  font-size: 15px;
  font-weight: 500;
}

.save-method {
  width: 100%;
  margin-top: 14px;
}

.ability-base-footer {
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

.ability-base-footer button {
  min-height: 44px;
  min-width: 150px;
}

@keyframes rollButtonPulse {
  from { box-shadow: 0 0 0 rgba(201, 168, 76, 0); }
  to { box-shadow: 0 0 18px rgba(201, 168, 76, 0.2); }
}

@keyframes rollChipShake {
  from { transform: rotate(-1.5deg) translateY(-1px); }
  to { transform: rotate(1.5deg) translateY(1px); }
}

@keyframes rollChipLand {
  0% {
    transform: scale(1.08);
    box-shadow: 0 0 28px rgba(201, 168, 76, 0.22);
  }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

@media (max-width: 680px) {
  .method-grid,
  .rolled-layout {
    grid-template-columns: 1fr;
  }

  .score-row {
    grid-template-columns: 1fr;
  }

  .score-cost {
    text-align: left;
  }

  .ability-base-footer {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .ability-base-footer button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roll-button.rolling,
  .roll-chip.rolling,
  .roll-chip.landed {
    animation: none;
  }
}
</style>
