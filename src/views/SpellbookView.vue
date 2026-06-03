<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import coverTexture from '../assets/images/fengmian.png'
import pageTexture from '../assets/images/page.png'
import levelOneImage from '../assets/images/ihuan.png'
import levelTwoImage from '../assets/images/2.png'
import levelThreeImage from '../assets/images/3.png'
import levelFourImage from '../assets/images/4.png'
import levelFiveImage from '../assets/images/5.png'
import levelSixImage from '../assets/images/6.png'
import levelSevenImage from '../assets/images/7.png'
import levelEightImage from '../assets/images/8.png'
import levelNineImage from '../assets/images/9.png'
import { classes } from '../data/classes.js'
import { findSpellByBaseId, findSpellById } from '../data/spells.js'
import { character, setSpellSlotUsed } from '../store/character.js'
import { getAbilityTotalRows } from '../utils/abilityTotals.js'
import { useArcaneFlame } from '../composables/useArcaneFlame.js'
import { useFlipBook } from '../composables/useFlipBook.js'
import { computeFlipPages } from '../composables/spellbookPages.js'

const router = useRouter()
const currentClass = computed(() => classes.find(item => item.id === character.class.id) ?? null)
const isWizard = computed(() => currentClass.value?.id === 'wizard')
const currentSubclass = computed(() =>
  currentClass.value?.subclasses?.find(item => item.id === character.class.subclassId) ?? null
)

const spellcastingRow = computed(() =>
  currentClass.value?.spellcastingProgression?.find(row => row.level === character.level) ?? null
)
const slots = computed(() => spellcastingRow.value?.slots ?? {})
const slotLevels = computed(() =>
  Object.keys(slots.value).map(Number).filter(Number.isFinite).sort((a, b) => a - b)
)

function slotTotal(level) {
  return Number(slots.value[level]) || 0
}

function slotRemaining(level) {
  const used = Number(character.spells.slotsUsed?.[String(level)]) || 0
  return Math.max(0, slotTotal(level) - used)
}

const abilityRows = computed(() => getAbilityTotalRows(character))
const intelligenceMod = computed(() => abilityRows.value.find(row => row.id === '智力')?.mod ?? 0)
const profBonus = computed(() => Math.ceil(character.level / 4) + 1)
const spellSaveDc = computed(() => 8 + profBonus.value + intelligenceMod.value)
const spellAttackBonus = computed(() => profBonus.value + intelligenceMod.value)

const preparedCantrips = computed(() =>
  (character.spells.cantrips ?? []).map(findSpellById).filter(spell => spell?.listId === 'wizard')
)
const preparedSpells = computed(() =>
  (character.spells.prepared ?? []).map(findSpellById).filter(spell => spell?.listId === 'wizard')
)
const preparedByLevel = computed(() => {
  const grouped = Object.fromEntries(Array.from({ length: 10 }, (_, level) => [level, []]))
  for (const spell of preparedSpells.value) grouped[spell.level].push(spell)
  return grouped
})

const availableTabs = computed(() => {
  const levels = []
  if (preparedCantrips.value.length) levels.push(0)
  for (let level = 1; level <= 9; level += 1) {
    if (slotTotal(level) || preparedByLevel.value[level]?.length) levels.push(level)
  }
  return levels.length ? levels : [0]
})

const currentLevel = ref(0)

watch(availableTabs, tabs => {
  if (!tabs.includes(currentLevel.value)) currentLevel.value = tabs[0] ?? 0
}, { immediate: true })

// ── 真实翻页（StPageFlip）─────────────────────────────────────────────
// 翻页容器 DOM
const bookRef = ref(null)

// 进入页面时快照页集，之后冻结：施法/长休/奥术回想只改页内数据，不增删页节点，
// 避免打断 StPageFlip 几何。耗尽的环页仍保留（显示空/已耗尽）。
const flipPages = computeFlipPages({
  hasCantrips: preparedCantrips.value.length > 0,
  slotsByLevel: Object.fromEntries(slotLevels.value.map(lv => [lv, slotTotal(lv)])),
  preparedCountByLevel: Object.fromEntries(
    Array.from({ length: 9 }, (_, i) => i + 1).map(lv => [lv, preparedByLevel.value[lv]?.length || 0])
  ),
})

function pageSpells(level) {
  return level === 0 ? preparedCantrips.value : (preparedByLevel.value[level] ?? [])
}

const { currentPage, ok: flipOk, init: initFlip, destroy: destroyFlip, flipTo } =
  useFlipBook(bookRef, {
    pageSelector: '.flip-page',
    onFlip: index => { currentLevel.value = flipPages[index] ?? 0 },
    onFlipStart: () => { activeSpell.value = null },
  })

const runtime = reactive({
  concentratingOn: null,
  arcaneRecoveryUsed: false,
})

function runtimeStorageKey() {
  return `dndcc:wizard-spellbook:v1:${character.id}`
}

function loadRuntime() {
  runtime.concentratingOn = null
  runtime.arcaneRecoveryUsed = false
  if (typeof window === 'undefined') return
  try {
    const saved = JSON.parse(window.localStorage.getItem(runtimeStorageKey()) ?? '{}')
    runtime.concentratingOn = typeof saved.concentratingOn === 'string' ? saved.concentratingOn : null
    runtime.arcaneRecoveryUsed = Boolean(saved.arcaneRecoveryUsed)
  } catch {
    // Invalid runtime state should never prevent the character sheet from opening.
  }
}

function persistRuntime() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(runtimeStorageKey(), JSON.stringify(runtime))
}

watch(() => character.id, loadRuntime)
watch(runtime, persistRuntime, { deep: true })

const concentratingSpell = computed(() =>
  runtime.concentratingOn ? findSpellByBaseId(runtime.concentratingOn) : null
)

const activeSpell = ref(null)
const selectedSlotLevel = ref(1)
const pendingCast = ref(null)
const showRecovery = ref(false)
const recoverySelections = reactive({})
const showRestConfirm = ref(false)
const showRestDone = ref(false)
const ritualToast = ref(null)
const burningSlotLevel = ref(null)
const flameCanvas = ref(null)
const gemRefs = ref([])
const { enabled: flameEnabled, igniteGem, igniteSweep } = useArcaneFlame(flameCanvas)
let burnTimer = null
let restTimer = null
let ritualTimer = null

const LEVEL_IMAGES = {
  1: levelOneImage,
  2: levelTwoImage,
  3: levelThreeImage,
  4: levelFourImage,
  5: levelFiveImage,
  6: levelSixImage,
  7: levelSevenImage,
  8: levelEightImage,
  9: levelNineImage,
}
const ROMAN_LEVELS = ['戏', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
const CHINESE_LEVELS = ['戏法', '一环', '二环', '三环', '四环', '五环', '六环', '七环', '八环', '九环']
const SCHOOL_COLORS = {
  塑能: '#9f332e',
  防护: '#356f91',
  预言: '#2f765e',
  惑控: '#755092',
  变化: '#9b6332',
  死灵: '#4e4b57',
  咒法: '#53733c',
  幻术: '#765a90',
}
const SCHOOL_RING_COLORS = {
  塑能: '#ff6a54',
  防护: '#62b9e8',
  预言: '#68d9ad',
  惑控: '#ca91ee',
  变化: '#e6a45d',
  死灵: '#9dd9b1',
  咒法: '#9ccc68',
  幻术: '#b994d6',
}

function signed(value) {
  return value >= 0 ? `+${value}` : String(value)
}

function schoolColor(school) {
  return SCHOOL_COLORS[school] ?? '#6f5d47'
}

function schoolRingColor(school) {
  return SCHOOL_RING_COLORS[school] ?? '#d6b45f'
}

function gemColor(level) {
  if (level <= 2) return 'gold'
  if (level <= 5) return 'blue'
  return 'purple'
}

function shortDescription(spell) {
  return spell.desc?.split('\n\n')[0] ?? '法术详情尚未录入。'
}

function upcastHint(spell) {
  if (!spell || selectedSlotLevel.value <= spell.level) return ''
  const hint = spell.desc?.split('\n\n').find(line => line.startsWith('升环施法'))
  return hint ?? `以 ${selectedSlotLevel.value} 环法术位施展。`
}

const castableSlotLevels = computed(() => {
  if (!activeSpell.value || activeSpell.value.level === 0) return []
  return slotLevels.value.filter(level => level >= activeSpell.value.level && slotRemaining(level) > 0)
})

// 书签点击：翻到该环阶页。翻页成功则由 StPageFlip 驱动 currentLevel；
// 降级（翻页未初始化）时直接切 currentLevel（滚动列表）。
function goToLevel(level) {
  if (level === currentLevel.value) return
  activeSpell.value = null
  const index = flipPages.indexOf(level)
  if (index < 0) return
  if (flipOk.value) {
    flipTo(index, { animated: true }) // onFlip 会同步 currentLevel
  } else {
    currentLevel.value = level
  }
}

function openSpell(spell) {
  if (activeSpell.value?.id === spell.id) {
    activeSpell.value = null
    return
  }
  activeSpell.value = spell
  selectedSlotLevel.value = spell.level === 0
    ? 0
    : slotLevels.value.find(level => level >= spell.level && slotRemaining(level) > 0) ?? spell.level
}

function prepareCast(spell, mode = 'slot') {
  const request = {
    spell,
    mode,
    slotLevel: mode === 'slot' ? selectedSlotLevel.value : 0,
  }
  if (spell.concentration && runtime.concentratingOn && runtime.concentratingOn !== spell.baseId) {
    pendingCast.value = request
    activeSpell.value = null
    return
  }
  executeCast(request)
}

function executeCast(request) {
  const { spell, mode, slotLevel } = request
  if (mode === 'slot') {
    if (slotRemaining(slotLevel) <= 0) return
    const used = Number(character.spells.slotsUsed?.[String(slotLevel)]) || 0
    // 记录“即将被烧掉那颗宝石”的索引（消耗前的剩余数 = 该颗的 1-based 序号）。
    const burnedGemIndex = slotRemaining(slotLevel)
    setSpellSlotUsed(slotLevel, used + 1)
    burningSlotLevel.value = slotLevel
    if (burnTimer) clearTimeout(burnTimer)
    burnTimer = setTimeout(() => {
      burningSlotLevel.value = null
    }, 720)
    // canvas 可用时点燃魔法火焰；否则保留 CSS gem-burn 降级。
    if (flameEnabled.value) triggerSlotFlame(slotLevel, burnedGemIndex)
  }
  // 仪式施法（2024）：不消耗法术位，但施法时间额外 +10 分钟。
  // 仅给出明确反馈，不做倒计时（由桌面叙事掌握时间）。
  if (mode === 'ritual') {
    ritualToast.value = spell.name
    if (ritualTimer) clearTimeout(ritualTimer)
    ritualTimer = setTimeout(() => {
      ritualToast.value = null
    }, 2600)
  }
  if (spell.concentration) runtime.concentratingOn = spell.baseId
  activeSpell.value = null
  pendingCast.value = null
}

// 点燃法术位火焰：先在被烧宝石上烧一团小火，若该环已耗尽则触发底部蔓延。
// burnedGemIndex 为 1-based（消耗前的剩余数）。
function triggerSlotFlame(slotLevel, burnedGemIndex) {
  // 宝石只在“当前展示环”才渲染，能拿到坐标就精准点燃；拿不到则给个兜底位置。
  const gemEl = gemRefs.value[burnedGemIndex - 1]
  if (gemEl) {
    const rect = gemEl.getBoundingClientRect()
    igniteGem(rect.left + rect.width / 2, rect.top + rect.height / 2)
  } else if (flameCanvas.value) {
    const rect = flameCanvas.value.getBoundingClientRect()
    igniteGem(rect.left + rect.width * 0.2, rect.bottom - 60)
  }
  // 该环法术位全部耗尽 → 底部火焰向上蔓延。
  if (slotRemaining(slotLevel) === 0) igniteSweep()
}

function endConcentration() {
  runtime.concentratingOn = null
}

const recoveryLimit = computed(() => Math.ceil(character.level / 2))
const recoverySelectedTotal = computed(() =>
  Object.entries(recoverySelections).reduce((sum, [level, count]) => sum + Number(level) * Number(count), 0)
)
const recoveryRemaining = computed(() => recoveryLimit.value - recoverySelectedTotal.value)

function openRecovery() {
  if (runtime.arcaneRecoveryUsed) return
  for (const key of Object.keys(recoverySelections)) delete recoverySelections[key]
  for (const level of slotLevels.value) {
    const used = Number(character.spells.slotsUsed?.[String(level)]) || 0
    if (level < 6 && used > 0) recoverySelections[String(level)] = 0
  }
  showRecovery.value = true
}

function adjustRecovery(level, delta) {
  const key = String(level)
  const current = recoverySelections[key] ?? 0
  const max = Number(character.spells.slotsUsed?.[key]) || 0
  const next = Math.min(max, Math.max(0, current + delta))
  if (recoverySelectedTotal.value - current * level + next * level > recoveryLimit.value) return
  recoverySelections[key] = next
}

function confirmRecovery() {
  for (const [level, count] of Object.entries(recoverySelections)) {
    if (!count) continue
    const used = Number(character.spells.slotsUsed?.[level]) || 0
    setSpellSlotUsed(level, Math.max(0, used - count))
  }
  runtime.arcaneRecoveryUsed = true
  showRecovery.value = false
}

function confirmLongRest() {
  for (const level of slotLevels.value) setSpellSlotUsed(level, 0)
  runtime.concentratingOn = null
  runtime.arcaneRecoveryUsed = false
  showRestConfirm.value = false
  showRestDone.value = true
  if (restTimer) clearTimeout(restTimer)
  restTimer = setTimeout(() => {
    showRestDone.value = false
  }, 2100)
}

onMounted(() => {
  loadRuntime()
  initFlip()
})

onUnmounted(() => {
  destroyFlip()
  if (burnTimer) clearTimeout(burnTimer)
  if (restTimer) clearTimeout(restTimer)
  if (ritualTimer) clearTimeout(ritualTimer)
})
</script>

<template>
  <main
    class="spellbook-screen"
    :style="{ '--cover-texture': `url(${coverTexture})`, '--page-texture': `url(${pageTexture})` }"
  >
    <section v-if="!isWizard" class="spellbook-gate">
      <div class="gate-mark">W</div>
      <h1>法师实战法术书</h1>
      <p>当前版本仅为法师开放。</p>
      <button type="button" @click="router.push('/sheet')">返回角色卡</button>
    </section>

    <section v-else class="book-shell">
      <div class="book-spine"></div>
      <canvas ref="flameCanvas" class="flame-overlay" aria-hidden="true"></canvas>

      <header class="book-header">
        <button class="back-button" type="button" title="返回角色卡" @click="router.push('/sheet')">←</button>
        <p class="book-kicker">ARCANE GRIMOIRE</p>
        <h1>法师实战法术书</h1>
        <div class="caster-strip">
          <div>
            <strong>{{ character.name || '无名法师' }}</strong>
            <span>{{ currentSubclass?.name ?? currentClass?.name }} · {{ character.level }}级</span>
          </div>
          <div class="caster-numbers">
            <span>DC <b>{{ spellSaveDc }}</b></span>
            <span>攻击 <b>{{ signed(spellAttackBonus) }}</b></span>
          </div>
        </div>
      </header>

      <nav class="bookmark-nav" aria-label="法术环阶">
        <button
          v-for="level in flipPages"
          :key="level"
          type="button"
          :class="['bookmark', {
            active: currentLevel === level,
            exhausted: level > 0 && slotTotal(level) > 0 && slotRemaining(level) === 0,
            burning: burningSlotLevel === level,
          }]"
          @click="goToLevel(level)"
        >
          <span v-if="level === 0" class="cantrip-rune">戏</span>
          <img v-else :src="LEVEL_IMAGES[level]" :alt="`${level}环`">
          <small>{{ ROMAN_LEVELS[level] }}</small>
          <em v-if="level > 0">{{ slotRemaining(level) }}</em>
        </button>
      </nav>

      <div v-if="concentratingSpell" class="concentration-strip">
        <span class="concentration-rune">◇</span>
        <strong>专注：{{ concentratingSpell.name }}</strong>
        <button type="button" @click="endConcentration">结束</button>
      </div>

      <section class="page-viewport">
        <div ref="bookRef" :class="['flip-book', { 'flip-fallback': !flipOk }]">
          <section
            v-for="level in flipPages"
            :key="level"
            class="flip-page"
            data-density="soft"
          >
            <div class="parchment-page">
              <div class="spell-scroll">
                <div class="section-title">
                  <span></span>
                  <strong>{{ CHINESE_LEVELS[level] }}{{ level ? '法术' : '' }}</strong>
                  <span></span>
                </div>

                <div v-if="!pageSpells(level).length" class="empty-state">
                  <b>∴</b>
                  <p>{{ level === 0 ? '尚未选择法师戏法' : '此环暂无已准备法术' }}</p>
                </div>

                <article
                  v-for="spell in pageSpells(level)"
                  :key="spell.id"
                  :class="['spell-entry', { open: activeSpell?.id === spell.id }]"
                  :style="{ '--school': schoolColor(spell.school) }"
                  @click="openSpell(spell)"
                >
                  <div class="spell-entry-content">
                    <div class="spell-name-row">
                      <h2>{{ spell.name }}</h2>
                      <i>{{ spell.nameEn }}</i>
                    </div>
                    <div class="spell-tags">
                      <span>{{ spell.school }}</span>
                      <span v-if="spell.castingTime">{{ spell.castingTime }}</span>
                      <span v-if="spell.range">{{ spell.range }}</span>
                      <span v-if="spell.concentration" class="tag-concentration">专注</span>
                      <span v-if="spell.ritual" class="tag-ritual">仪式</span>
                    </div>
                    <p>{{ shortDescription(spell) }}</p>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>
      </section>

      <footer class="slot-footer">
        <div class="slot-heading">
          <strong>{{ currentLevel === 0 ? '戏法' : `${CHINESE_LEVELS[currentLevel]}法术位` }}</strong>
          <span>{{ currentLevel === 0 ? '∞' : `${slotRemaining(currentLevel)} / ${slotTotal(currentLevel)}` }}</span>
        </div>
        <div class="gems">
          <span v-if="currentLevel === 0" class="cantrip-note">无限使用</span>
          <i
            v-for="index in slotTotal(currentLevel)"
            v-else
            :key="index"
            :ref="el => { if (el) gemRefs[index - 1] = el }"
            :class="['gem', index <= slotRemaining(currentLevel) ? gemColor(currentLevel) : 'empty', {
              burning: !flameEnabled && burningSlotLevel === currentLevel && index === slotRemaining(currentLevel) + 1,
            }]"
          ></i>
        </div>
        <div class="footer-actions">
          <button type="button" :disabled="runtime.arcaneRecoveryUsed" title="奥术回想" @click="openRecovery">
            <b>✦</b><span>回想</span>
          </button>
          <button type="button" title="长休" @click="showRestConfirm = true">
            <b>☾</b><span>长休</span>
          </button>
        </div>
      </footer>
    </section>

    <Teleport to="body">
      <div v-if="activeSpell" class="modal-backdrop cast-backdrop" @click.self="activeSpell = null">
        <section class="cast-modal" :style="{ '--ring': schoolRingColor(activeSpell.school) }">
          <button class="close-panel" type="button" title="关闭" @click="activeSpell = null">×</button>

          <svg class="magic-ring" viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <g class="ring-outer">
              <circle cx="40" cy="40" r="34" :stroke="schoolRingColor(activeSpell.school)" stroke-width="1.5" stroke-dasharray="8 4"/>
              <circle cx="40" cy="40" r="29" :stroke="schoolRingColor(activeSpell.school)" stroke-width="0.6"/>
            </g>
            <g class="ring-inner">
              <circle cx="40" cy="40" r="20" :stroke="schoolRingColor(activeSpell.school)" stroke-width="1" stroke-dasharray="5 3"/>
            </g>
            <circle cx="40" cy="40" r="9" :fill="schoolRingColor(activeSpell.school)" class="ring-core"/>
            <circle cx="40" cy="40" r="5" :fill="schoolRingColor(activeSpell.school)"/>
          </svg>

          <h2 class="cast-title">{{ activeSpell.name }}</h2>
          <p class="cast-en">{{ activeSpell.nameEn }}</p>

          <div class="cast-controls">
            <template v-if="activeSpell.level === 0">
              <small>戏法不消耗法术位</small>
              <button class="primary-cast" type="button" @click="prepareCast(activeSpell, 'cantrip')">施法</button>
            </template>
            <template v-else>
              <div class="slot-options">
                <button
                  v-for="level in castableSlotLevels"
                  :key="level"
                  type="button"
                  :class="{ selected: selectedSlotLevel === level }"
                  @click="selectedSlotLevel = level"
                >
                  {{ level }}环 <small>{{ slotRemaining(level) }}</small>
                </button>
              </div>
              <small v-if="upcastHint(activeSpell)" class="upcast-hint">{{ upcastHint(activeSpell) }}</small>
              <small v-if="!castableSlotLevels.length && !activeSpell.ritual" class="no-slots">没有可用法术位</small>
              <small v-else-if="!castableSlotLevels.length && activeSpell.ritual" class="ritual-only">无可用法术位，可改用仪式施法</small>
              <small v-if="activeSpell.ritual" class="ritual-hint">仪式：不消耗法术位，施法 +10 分钟</small>
              <div class="cast-actions">
                <button v-if="activeSpell.ritual" type="button" class="ritual-cast" @click="prepareCast(activeSpell, 'ritual')">仪式施展</button>
                <button
                  v-if="castableSlotLevels.length"
                  class="primary-cast"
                  type="button"
                  @click="prepareCast(activeSpell)"
                >施法</button>
              </div>
            </template>
          </div>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pendingCast" class="modal-backdrop" @click.self="pendingCast = null">
        <section class="spellbook-modal">
          <h2>替换专注法术？</h2>
          <p>
            你正在专注于 <strong>{{ concentratingSpell?.name }}</strong>。
            施展 <strong>{{ pendingCast.spell.name }}</strong> 会结束当前专注。
          </p>
          <div class="modal-actions">
            <button type="button" @click="pendingCast = null">取消</button>
            <button type="button" class="confirm" @click="executeCast(pendingCast)">确认施法</button>
          </div>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showRecovery" class="modal-backdrop" @click.self="showRecovery = false">
        <section class="spellbook-modal recovery-modal">
          <h2>奥术回想</h2>
          <p>可恢复总环阶：<strong>{{ recoveryRemaining }}</strong> / {{ recoveryLimit }}</p>
          <div v-if="Object.keys(recoverySelections).length" class="recovery-list">
            <div v-for="(count, level) in recoverySelections" :key="level" class="recovery-row">
              <span>{{ level }}环</span>
              <small>已耗 {{ character.spells.slotsUsed?.[level] ?? 0 }}</small>
              <div>
                <button type="button" :disabled="count <= 0" @click="adjustRecovery(Number(level), -1)">−</button>
                <b>{{ count }}</b>
                <button
                  type="button"
                  :disabled="recoveryRemaining < Number(level) || count >= (character.spells.slotsUsed?.[level] ?? 0)"
                  @click="adjustRecovery(Number(level), 1)"
                >+</button>
              </div>
            </div>
          </div>
          <p v-else class="modal-muted">目前没有可恢复的一至五环法术位。</p>
          <div class="modal-actions">
            <button type="button" @click="showRecovery = false">取消</button>
            <button type="button" class="confirm" :disabled="recoverySelectedTotal <= 0" @click="confirmRecovery">恢复</button>
          </div>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showRestConfirm" class="modal-backdrop" @click.self="showRestConfirm = false">
        <section class="spellbook-modal">
          <h2>进行长休？</h2>
          <p>法术位会全部恢复，专注会结束，奥术回想可以再次使用。</p>
          <div class="modal-actions">
            <button type="button" @click="showRestConfirm = false">取消</button>
            <button type="button" class="confirm" @click="confirmLongRest">确认长休</button>
          </div>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showRestDone" class="rest-done">
        <strong>长休结束</strong>
        <span>法术位已恢复</span>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="ritualToast" class="ritual-done">
        <strong>以仪式施展 · {{ ritualToast }}</strong>
        <span>不消耗法术位 · 施法时间 +10 分钟</span>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.spellbook-screen {
  --leather: #160f0c;
  --ink: #211710;
  --ink-soft: #62492f;
  --parchment: #d1b982;
  --brass: #c9a74c;
  --brass-bright: #f0d781;
  --teal: #79b6ad;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--ink);
  background:
    radial-gradient(circle at center, rgba(48, 38, 35, 0.9), rgba(9, 8, 12, 0.98)),
    #09080c;
}

.spellbook-gate {
  width: min(340px, calc(100vw - 32px));
  text-align: center;
  color: #eee2c6;
}
.gate-mark {
  width: 58px;
  height: 58px;
  margin: 0 auto 16px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(201, 167, 76, 0.55);
  color: var(--brass-bright);
  font: 700 26px var(--font-title);
}
.spellbook-gate h1 { font-size: 20px; }
.spellbook-gate p { margin: 8px 0 18px; color: #af9e86; }
.spellbook-gate button,
.spellbook-modal button {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(201, 167, 76, 0.4);
  border-radius: 3px;
  color: #ead694;
  background: rgba(201, 167, 76, 0.08);
}

.book-shell {
  position: relative;
  width: min(430px, 100vw);
  height: min(840px, 100dvh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--cover-texture) center / cover;
  box-shadow: 10px 12px 0 #050405, 0 26px 70px rgba(0, 0, 0, 0.72);
}
.book-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.62));
}
.book-spine {
  position: absolute;
  inset: 10px auto 10px 0;
  z-index: 6;
  width: 4px;
  background: linear-gradient(transparent, #6f572a, var(--brass), #6f572a, transparent);
}
.flame-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.book-header {
  position: relative;
  z-index: 5;
  padding: 13px 16px 10px;
  border-bottom: 1px solid rgba(201, 167, 76, 0.18);
  color: #d5c49a;
  background: rgba(3, 3, 4, 0.22);
}
.back-button {
  position: absolute;
  top: 12px;
  left: 14px;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(201, 167, 76, 0.28);
  border-radius: 3px;
  color: var(--brass-bright);
}
.book-kicker,
.book-header h1 {
  margin: 0;
  text-align: center;
  letter-spacing: 0;
}
.book-kicker {
  color: var(--brass-bright);
  font: 700 13px var(--font-deco);
}
.book-header h1 {
  margin-top: 1px;
  color: #af9360;
  font: 600 11px var(--font-title);
}
.caster-strip {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 9px;
  padding: 6px 8px;
  border: 1px solid rgba(201, 167, 76, 0.15);
  background: rgba(0, 0, 0, 0.22);
}
.caster-strip strong,
.caster-strip span { display: block; }
.caster-strip strong { color: #ebddb7; font: 600 12px var(--font-title); }
.caster-strip span { color: #a58d68; font-size: 11px; }
.caster-numbers {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: right;
}
.caster-numbers b { color: var(--brass-bright); font-size: 15px; }

.bookmark-nav {
  position: relative;
  z-index: 5;
  display: flex;
  min-height: 62px;
  padding: 3px 6px 0;
  overflow-x: auto;
  border-bottom: 1px solid rgba(201, 167, 76, 0.16);
  scrollbar-width: none;
}
.bookmark-nav::-webkit-scrollbar { display: none; }
.bookmark {
  position: relative;
  flex: 1 0 41px;
  min-width: 41px;
  padding: 3px 2px;
  border-bottom: 2px solid transparent;
  color: #927b54;
  opacity: 0.72;
}
.bookmark.active {
  border-bottom-color: var(--brass);
  color: var(--brass-bright);
  opacity: 1;
  background: rgba(201, 167, 76, 0.08);
}
.bookmark.exhausted { color: #a55f61; }
.bookmark.burning { animation: bookmark-burn 0.72s ease; }
@keyframes bookmark-burn {
  35% { filter: brightness(2.4) saturate(1.8); transform: translateY(-2px); }
}
.bookmark img {
  display: block;
  width: 28px;
  height: 28px;
  margin: auto;
  object-fit: contain;
}
.bookmark small {
  display: block;
  font: 600 9px var(--font-title);
}
.bookmark em {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 14px;
  height: 14px;
  border-radius: 50%;
  color: #f3d987;
  background: rgba(16, 11, 8, 0.72);
  font: normal 9px/14px var(--font-title);
}
.cantrip-rune {
  display: grid;
  width: 28px;
  height: 28px;
  margin: auto;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  font: 700 13px var(--font-title);
}

.concentration-strip {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 4px 12px;
  color: #d8b8db;
  border-bottom: 1px solid rgba(154, 105, 166, 0.35);
  background: rgba(70, 38, 78, 0.42);
}
.concentration-rune { color: #c996cf; }
.concentration-strip strong { flex: 1; font-size: 11px; }
.concentration-strip button {
  padding: 2px 8px;
  border: 1px solid rgba(201, 150, 211, 0.38);
  border-radius: 3px;
  color: #e0b9e5;
}

.page-viewport {
  position: relative;
  z-index: 3;
  flex: 1;
  min-height: 0;
}
/* StPageFlip 翻页容器：填满 viewport，由库接管页几何 */
.flip-book {
  position: absolute;
  inset: 0;
}
.flip-page {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--page-texture) center / cover;
}
/* 初始化失败降级：普通竖向滚动，不依赖 StPageFlip */
.flip-fallback {
  overflow-y: auto;
}
.flip-fallback .flip-page {
  height: auto;
  min-height: 60%;
  border-bottom: 1px solid rgba(88, 61, 32, 0.26);
}
.parchment-page {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--page-texture) center / cover;
}
.parchment-page::after {
  content: '';
  position: absolute;
  inset: 8px;
  pointer-events: none;
  border: 1px solid rgba(88, 61, 32, 0.26);
}
.spell-scroll {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow-y: auto;
  padding: 18px 18px 28px;
  scrollbar-width: thin;
  scrollbar-color: rgba(66, 48, 28, 0.42) transparent;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--ink-soft);
  font: 600 11px var(--font-title);
}
.section-title span { flex: 1; height: 1px; background: rgba(98, 73, 47, 0.42); }
.empty-state {
  display: grid;
  min-height: 180px;
  place-items: center;
  align-content: center;
  gap: 5px;
  color: var(--ink-soft);
}
.empty-state b { font-size: 28px; }
.empty-state p { font-size: 13px; }

.spell-entry {
  position: relative;
  min-height: 118px;
  margin-bottom: 9px;
  overflow: hidden;
  border: 1px solid rgba(80, 56, 30, 0.34);
  border-radius: 3px;
  background: rgba(79, 52, 22, 0.08);
  cursor: pointer;
}
.spell-entry::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--school);
}
.spell-entry-content { padding: 10px 11px 10px 15px; }
.spell-name-row {
  display: flex;
  align-items: baseline;
  gap: 7px;
  flex-wrap: wrap;
}
.spell-name-row h2 {
  color: #26170d;
  font: 700 15px var(--font-title);
}
.spell-name-row i { color: #705034; font-size: 11px; }
.spell-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 5px 0 6px;
}
.spell-tags span {
  padding: 1px 5px;
  border: 1px solid rgba(90, 65, 38, 0.32);
  border-radius: 2px;
  color: #4e3924;
  background: rgba(82, 56, 27, 0.08);
  font-size: 10px;
}
.spell-tags .tag-concentration { color: #8a3e4a; border-color: rgba(138, 62, 74, 0.42); }
.spell-tags .tag-ritual { color: #3f6a5e; border-color: rgba(63, 106, 94, 0.42); }
.spell-entry-content p {
  display: -webkit-box;
  overflow: hidden;
  color: #3c2a1c;
  font-size: 12px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

/* 施法 Teleport 居中弹窗（脱离翻页 DOM，不被翻页几何裁剪） */
.cast-backdrop { z-index: 110; }
.cast-modal {
  position: relative;
  width: min(320px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 20px 20px;
  border: 1px solid rgba(201, 167, 76, 0.4);
  border-radius: 6px;
  color: #d7c7a2;
  background: #14110d;
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.6);
  animation: cast-reveal 0.2s ease;
}
@keyframes cast-reveal {
  from { opacity: 0; transform: translateY(8px); }
}
.cast-title { color: #efd67f; font: 700 18px var(--font-title); }
.cast-en { margin-top: -4px; color: #93805d; font-size: 11px; }
.magic-ring { flex: none; width: 88px; height: 88px; }
.ring-outer,
.ring-inner { transform-origin: center; opacity: 0.88; }
.ring-outer { animation: ring-spin 3.2s linear infinite; }
.ring-inner { animation: ring-spin 2.1s linear infinite reverse; }
.ring-core { animation: core-pulse 1.3s ease-in-out infinite; }
@keyframes ring-spin { to { transform: rotate(360deg); } }
@keyframes core-pulse { 50% { opacity: 0.45; transform: scale(1.25); transform-origin: center; } }
.cast-controls {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  color: #bda875;
}
.cast-controls > small { text-align: center; font-size: 11px; }
.slot-options {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}
.slot-options button {
  min-width: 44px;
  min-height: 30px;
  padding: 2px 5px;
  border: 1px solid rgba(201, 167, 76, 0.28);
  border-radius: 2px;
  color: #c7ad6d;
}
.slot-options button.selected { border-color: #e7ca72; background: rgba(201, 167, 76, 0.16); }
.slot-options small { color: #7fbab1; }
.upcast-hint,
.no-slots {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.no-slots { color: #c97979; }
.ritual-only { color: #9dd2bd; }
.ritual-hint { color: #7fb0a4; font-size: 10px; }
.cast-actions { display: flex; gap: 6px; justify-content: center; }
.cast-actions button,
.primary-cast {
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid rgba(201, 167, 76, 0.58);
  border-radius: 3px;
  color: #f2d77f;
  background: rgba(201, 167, 76, 0.08);
  font: 600 12px var(--font-title);
}
.cast-actions .ritual-cast {
  color: #9dd2bd;
  border-color: rgba(121, 182, 173, 0.44);
}
.close-panel {
  position: absolute;
  top: 4px;
  right: 6px;
  color: #bda875;
  font-size: 18px;
}

.slot-footer {
  position: relative;
  z-index: 5;
  min-height: 90px;
  padding: 9px 108px 12px 13px;
  border-top: 1px solid rgba(201, 167, 76, 0.18);
  color: #b99c5b;
  background: rgba(5, 5, 8, 0.42);
}
.slot-heading {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font: 600 11px var(--font-title);
}
.slot-heading span { color: var(--brass-bright); }
.gems {
  display: flex;
  min-height: 30px;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.cantrip-note { color: #ab9464; font-size: 12px; }
.gem {
  width: 26px;
  height: 26px;
  border-radius: 50%;
}
.gem.gold {
  border: 1px solid #e2c269;
  background: radial-gradient(circle at 35% 28%, #fff4bd, #cf9f32 45%, #594118);
  box-shadow: 0 0 9px rgba(209, 166, 70, 0.62);
}
.gem.blue {
  border: 1px solid #8bc3dd;
  background: radial-gradient(circle at 35% 28%, #e0f5ff, #528aa8 45%, #183b58);
  box-shadow: 0 0 9px rgba(91, 159, 187, 0.58);
}
.gem.purple {
  border: 1px solid #c89edb;
  background: radial-gradient(circle at 35% 28%, #f7e7ff, #9461aa 45%, #42294e);
  box-shadow: 0 0 9px rgba(159, 101, 178, 0.58);
}
.gem.empty {
  border: 2px solid rgba(186, 157, 94, 0.25);
  background: transparent;
}
.gem.burning { animation: gem-burn 0.72s ease forwards; }
@keyframes gem-burn {
  30% { opacity: 1; transform: scale(1.38); filter: brightness(2.7); }
  100% { opacity: 0; transform: translateY(-12px) scale(0.18); }
}
.footer-actions {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  gap: 7px;
}
.footer-actions button {
  display: grid;
  width: 42px;
  min-height: 48px;
  place-items: center;
  align-content: center;
  border: 1px solid rgba(201, 167, 76, 0.24);
  border-radius: 3px;
  color: #bda36b;
  background: rgba(0, 0, 0, 0.15);
}
.footer-actions button:disabled { opacity: 0.36; cursor: not-allowed; }
.footer-actions b { font-size: 15px; line-height: 1; }
.footer-actions span { font-size: 10px; }

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(6, 5, 8, 0.86);
}
.spellbook-modal {
  width: min(360px, 100%);
  padding: 20px;
  border: 1px solid rgba(201, 167, 76, 0.38);
  border-radius: 5px;
  color: #d7c7a2;
  background: #17130f;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5);
}
.spellbook-modal h2 { color: #efd67f; font-size: 17px; }
.spellbook-modal p { margin-top: 9px; color: #b9aa8e; font-size: 13px; line-height: 1.6; }
.spellbook-modal strong { color: #e5ca86; }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 16px;
}
.spellbook-modal .confirm { color: #f4da84; background: rgba(201, 167, 76, 0.16); }
.spellbook-modal button:disabled { opacity: 0.38; cursor: not-allowed; }
.recovery-list {
  display: grid;
  gap: 7px;
  margin-top: 12px;
}
.recovery-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid rgba(201, 167, 76, 0.18);
}
.recovery-row span { width: 38px; color: #dfc879; }
.recovery-row small { flex: 1; color: #928367; }
.recovery-row div { display: flex; align-items: center; gap: 7px; }
.recovery-row button {
  width: 26px;
  min-height: 26px;
  padding: 0;
}
.modal-muted { color: #8d806a; }
.rest-done {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 4px;
  color: #f4d982;
  background: rgba(5, 5, 9, 0.92);
  animation: rest-fade 2.1s ease both;
}
.rest-done strong { font: 700 22px var(--font-deco); }
.rest-done span { color: #ab9562; font-size: 13px; }
@keyframes rest-fade {
  0%, 100% { opacity: 0; }
  18%, 76% { opacity: 1; }
}

.ritual-done {
  position: fixed;
  left: 50%;
  bottom: calc(28px + env(safe-area-inset-bottom, 0px));
  z-index: 120;
  display: grid;
  gap: 3px;
  justify-items: center;
  padding: 12px 22px;
  border: 1px solid rgba(121, 182, 173, 0.5);
  border-radius: 6px;
  color: #d6efe6;
  background: rgba(20, 36, 33, 0.95);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
  transform: translateX(-50%);
  animation: ritual-fade 2.6s ease both;
}
.ritual-done strong { color: #9fdcc8; font: 600 13px var(--font-title); }
.ritual-done span { color: #87b4a8; font-size: 11px; }
@keyframes ritual-fade {
  0%, 100% { opacity: 0; transform: translate(-50%, 8px); }
  12%, 82% { opacity: 1; transform: translate(-50%, 0); }
}

@media (max-width: 380px) {
  .book-shell { width: 100vw; height: 100dvh; }
  .book-header { padding-inline: 12px; }
  .caster-strip { padding-inline: 6px; }
  .caster-numbers { gap: 8px; }
  .spell-scroll { padding-inline: 13px; }
  .spell-entry { min-height: 114px; }
  .magic-ring { width: 72px; height: 72px; }
  .slot-footer { padding-left: 10px; }
}
</style>
