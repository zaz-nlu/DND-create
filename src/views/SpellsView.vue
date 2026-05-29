<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AbilityBar from '../components/AbilityBar.vue'
import { classes } from '../data/classes.js'
import { magicSchools, spellPreparationRules, spellRuleSections } from '../data/spellRules.js'
import { getSpellListById, getSpellsByList, searchSpells } from '../data/spells.js'
import { character, toggleCantripSpell, togglePreparedSpell } from '../store/character.js'
import StepNav from './StepNav.vue'

const router = useRouter()
const query = ref('')
const activeLevel = ref('all')
const activeStepId = ref(null)
const detailSpell = ref(null)
const showSpellRules = ref(false)

const currentClass = computed(() =>
  classes.find(cls => cls.id === character.class.id) ?? null
)

const currentSubclass = computed(() =>
  currentClass.value?.subclasses?.find(item => item.id === character.class.subclassId) ?? null
)

const spellList = computed(() =>
  (currentSubclass.value?.spellList ?? currentClass.value?.spellList)
    ? getSpellListById(currentSubclass.value?.spellList ?? currentClass.value?.spellList)
    : null
)

const spellcastingAbility = computed(() =>
  currentSubclass.value?.spellcastingAbility ?? currentClass.value?.spellcastingAbility ?? '—'
)

const spellcastingRow = computed(() => {
  const cls = currentClass.value
  const subclass = currentSubclass.value
  if (!cls && !subclass) return null

  const subclassNormal = subclass?.spellcastingProgression?.find(row => row.level === character.level)
  if (subclassNormal) return { ...subclassNormal, type: subclass.spellcastingType ?? 'standard' }

  const subclassPact = subclass?.pactMagicProgression?.find(row => row.level === character.level)
  if (subclassPact) return { ...subclassPact, type: 'pact' }

  const normal = cls?.spellcastingProgression?.find(row => row.level === character.level)
  if (normal) return { ...normal, type: cls.spellcastingType ?? 'standard' }

  const pact = cls?.pactMagicProgression?.find(row => row.level === character.level)
  if (pact) return { ...pact, type: 'pact' }

  return null
})

const slots = computed(() => spellcastingRow.value?.slots ?? {})
const slotLevels = computed(() =>
  Object.keys(slots.value)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
)

const maxSpellLevel = computed(() => {
  if (spellcastingRow.value?.pactSlotLevel) return spellcastingRow.value.pactSlotLevel
  return slotLevels.value.at(-1) ?? 0
})

const cantripLimit = computed(() => spellcastingRow.value?.cantrips ?? 0)
const preparedLimit = computed(() => spellcastingRow.value?.prepared ?? 0)
const hasSpellcasting = computed(() => Boolean(spellcastingRow.value))

const availableSpells = computed(() => {
  if (!spellList.value) return []
  return getSpellsByList(spellList.value.id)
    .filter(spell => spell.level === 0 || spell.level <= maxSpellLevel.value)
})

const availableLevels = computed(() => {
  const levels = [...new Set(availableSpells.value.map(spell => spell.level))]
    .sort((a, b) => a - b)
  return ['all', ...levels]
})

const stepLevels = computed(() => {
  if (activeSpellStep.value === 'prepared') {
    return availableLevels.value.filter(level => level === 'all' || Number(level) > 0)
  }
  return availableLevels.value
})

const spellSteps = computed(() => {
  const items = []
  if (cantripLimit.value > 0) {
    items.push({
      id: 'cantrips',
      label: '选择戏法',
      kicker: 'CANTRIPS',
      isValid: selectedCantrips.value.length === cantripLimit.value,
      summary: `${selectedCantrips.value.length} / ${cantripLimit.value}`,
    })
  }
  if (preparedLimit.value > 0) {
    items.push({
      id: 'prepared',
      label: '准备法术',
      kicker: 'PREPARED SPELLS',
      isValid: selectedPrepared.value.length === preparedLimit.value,
      summary: `${selectedPrepared.value.length} / ${preparedLimit.value}`,
    })
  }
  return items
})

const activeSpellStep = computed(() => {
  if (activeStepId.value && spellSteps.value.some(step => step.id === activeStepId.value)) {
    return activeStepId.value
  }
  return spellSteps.value.find(step => !step.isValid)?.id ?? spellSteps.value[0]?.id ?? 'all'
})

const visibleSpells = computed(() => {
  if (!spellList.value) return []
  const forcedLevel = activeSpellStep.value === 'cantrips' ? 0 : undefined
  const level = forcedLevel ?? (activeLevel.value === 'all' ? undefined : Number(activeLevel.value))
  const searched = searchSpells(spellList.value.id, query.value, { level })
  return searched
    .filter(spell => {
      if (activeSpellStep.value === 'cantrips') return spell.level === 0
      if (activeSpellStep.value === 'prepared') return spell.level > 0 && spell.level <= maxSpellLevel.value
      return spell.level === 0 || spell.level <= maxSpellLevel.value
    })
    .sort((a, b) => a.level - b.level || spellName(a).localeCompare(spellName(b), 'zh-Hans-CN'))
})

const selectedCantrips = computed(() =>
  character.spells.cantrips.filter(id => availableSpells.value.some(spell => spell.id === id))
)

const selectedPrepared = computed(() =>
  character.spells.prepared.filter(id => availableSpells.value.some(spell => spell.id === id))
)

const alwaysPrepared = computed(() => {
  const cls = currentClass.value
  const subclassId = character.class.subclassId
  const subclass = cls?.subclasses?.find(item => item.id === subclassId)
  const table = subclass?.alwaysPrepared
  if (!table) return []

  return Object.entries(table)
    .filter(([level]) => Number(level) <= character.level)
    .flatMap(([, names]) => Array.isArray(names) ? names : [])
})

const currentPreparationRule = computed(() =>
  spellPreparationRules.find(rule => rule.classId === currentClass.value?.id) ?? null
)

const isReady = computed(() => {
  if (!hasSpellcasting.value) return true
  if (!spellList.value) return true
  const cantripsOk = cantripLimit.value === 0 || selectedCantrips.value.length === cantripLimit.value
  const preparedOk = preparedLimit.value === 0 || selectedPrepared.value.length === preparedLimit.value
  return cantripsOk && preparedOk
})

const footerHint = computed(() => {
  if (!hasSpellcasting.value) return '当前职业没有职业法术选择'
  if (!spellList.value) return '当前职业法表还没录入，可以先继续'
  if (cantripLimit.value > 0 && selectedCantrips.value.length < cantripLimit.value) {
    return `还需选择 ${cantripLimit.value - selectedCantrips.value.length} 个戏法`
  }
  if (preparedLimit.value > 0 && selectedPrepared.value.length < preparedLimit.value) {
    return `还需选择 ${preparedLimit.value - selectedPrepared.value.length} 个法术`
  }
  return '法术选择完成'
})

function spellName(spell) {
  return `${spell.name} ${spell.nameEn}`
}

function levelLabel(level) {
  if (level === 'all') return '全部'
  if (Number(level) === 0) return '戏法'
  return `${level}环`
}

function isSelected(spell) {
  return spell.level === 0
    ? character.spells.cantrips.includes(spell.id)
    : character.spells.prepared.includes(spell.id)
}

function isDisabled(spell) {
  if (isSelected(spell)) return false
  if (spell.level === 0) return selectedCantrips.value.length >= cantripLimit.value
  return selectedPrepared.value.length >= preparedLimit.value
}

function toggleSpell(spell) {
  if (isDisabled(spell)) return
  if (spell.level === 0) {
    toggleCantripSpell(spell.id)
  } else {
    togglePreparedSpell(spell.id)
  }
}

function openSpellDetail(spell) {
  detailSpell.value = spell
}

function closeSpellDetail() {
  detailSpell.value = null
}

function openSpellRules() {
  showSpellRules.value = true
}

function closeSpellRules() {
  showSpellRules.value = false
}

function spellDescription(spell) {
  return spell?.desc ?? spell?.description ?? spell?.summary ?? '暂无详细说明。'
}

function spellDetailFacts(spell) {
  return [
    { label: '施法时间', value: spell?.castingTime },
    { label: '施法距离', value: spell?.range },
    { label: '法术成分', value: spell?.components },
    { label: '持续时间', value: spell?.duration },
  ].filter(item => item.value)
}

function focusSpellStep(stepId) {
  activeStepId.value = stepId
  query.value = ''
  activeLevel.value = stepId === 'cantrips' ? 0 : 'all'
}

function goNext() {
  if (!isReady.value) return
  router.push('/abilities')
}
</script>

<template>
  <div class="spells-page">
    <StepNav step="7 / 10" label="法术选择" back-to="/feats" />
    <AbilityBar />

    <header class="spells-header">
      <div class="spells-step-badge">步骤 7 / 10 · 法术</div>
      <h1>整理你的法术书</h1>
      <p>
        根据当前职业与等级筛选可选法术。可用中文名、英文名、学派或 C/R/M 标签搜索。
      </p>
      <button class="spells-rule-button" type="button" @click="openSpellRules">
        施法规则
      </button>
    </header>

    <main class="spells-layout">
      <section class="spells-control">
        <div class="spells-class-line">
          <div>
            <span>当前职业</span>
            <strong>{{ currentClass?.name ?? '未选择职业' }}</strong>
          </div>
          <div>
            <span>施法属性</span>
            <strong>{{ spellcastingAbility }}</strong>
          </div>
          <div>
            <span>等级</span>
            <strong>{{ character.level }}</strong>
          </div>
        </div>

        <div v-if="hasSpellcasting" class="spells-quota-grid">
          <div class="spells-quota">
            <span>戏法</span>
            <strong>{{ selectedCantrips.length }} / {{ cantripLimit }}</strong>
          </div>
          <div class="spells-quota">
            <span>准备法术</span>
            <strong>{{ selectedPrepared.length }} / {{ preparedLimit }}</strong>
          </div>
          <div class="spells-quota">
            <span>最高环阶</span>
            <strong>{{ maxSpellLevel || '—' }}</strong>
          </div>
          <div class="spells-quota">
            <span>法术位</span>
            <strong v-if="spellcastingRow?.type === 'pact'">
              {{ spellcastingRow.pactSlots }} 个 {{ spellcastingRow.pactSlotLevel }}环
            </strong>
            <strong v-else>{{ slotLevels.map(level => `${level}环×${slots[level]}`).join(' / ') || '—' }}</strong>
          </div>
        </div>

        <div v-if="alwaysPrepared.length" class="spells-always">
          <span>总是准备</span>
          <div>
            <em v-for="spell in alwaysPrepared" :key="spell">{{ spell }}</em>
          </div>
        </div>

        <div v-if="hasSpellcasting && !spellList" class="spells-empty">
          当前职业有施法成长，但还没有录入对应职业法表。
        </div>
        <div v-else-if="!hasSpellcasting" class="spells-empty">
          当前职业没有职业法术选择，可以直接继续。
        </div>
      </section>

      <section v-if="hasSpellcasting && spellList" class="spells-browser">
        <div v-if="spellSteps.length" class="spell-step-list">
          <button
            v-for="step in spellSteps"
            :key="step.id"
            :class="['spell-step-card', {
              active: activeSpellStep === step.id,
              complete: step.isValid,
            }]"
            type="button"
            @click="focusSpellStep(step.id)"
          >
            <span>{{ step.kicker }}</span>
            <strong>{{ step.label }}</strong>
            <em>{{ step.summary }}</em>
          </button>
        </div>

        <div class="spells-search-row">
          <input
            v-model="query"
            class="spells-search"
            type="search"
            :placeholder="activeSpellStep === 'cantrips'
              ? '搜索戏法：光亮 / light / 塑能'
              : '搜索法术：火球 / fireball / 塑能 / C / R / M'"
          />
        </div>

        <div v-if="activeSpellStep !== 'cantrips'" class="spells-tabs">
          <button
            v-for="level in stepLevels"
            :key="level"
            :class="['spells-tab', { active: activeLevel === level }]"
            type="button"
            @click="activeLevel = level"
          >
            {{ levelLabel(level) }}
          </button>
        </div>

        <div class="spell-results">
          <article
            v-for="spell in visibleSpells"
            :key="spell.id"
            :class="['spell-row', {
              selected: isSelected(spell),
              disabled: isDisabled(spell),
            }]"
          >
            <button class="spell-row-main spell-row-open" type="button" @click="openSpellDetail(spell)">
              <span class="spell-level">{{ levelLabel(spell.level) }}</span>
              <div>
                <strong>{{ spell.name }}</strong>
                <small>{{ spell.nameEn }}</small>
              </div>
            </button>
            <button
              class="spell-meta"
              type="button"
              :disabled="isDisabled(spell)"
              @click="toggleSpell(spell)"
            >
              <span>{{ spell.school }}</span>
              <em v-for="flag in spell.special" :key="flag">{{ flag }}</em>
              <b>{{ isSelected(spell) ? '已选' : isDisabled(spell) ? '已满' : '选择' }}</b>
            </button>
          </article>
          <div v-if="visibleSpells.length === 0" class="spells-empty">
            没有找到匹配的法术。
          </div>
        </div>
      </section>
    </main>

    <div v-if="detailSpell" class="spell-detail-mask" @click.self="closeSpellDetail">
      <section class="spell-detail-panel" role="dialog" aria-modal="true">
        <button class="spell-detail-close" type="button" @click="closeSpellDetail">×</button>
        <div class="spell-detail-kicker">{{ levelLabel(detailSpell.level) }} · {{ detailSpell.school }}</div>
        <h2>{{ detailSpell.name }}</h2>
        <p class="spell-detail-en">{{ detailSpell.nameEn }}</p>
        <div class="spell-detail-tags">
          <span v-if="detailSpell.special?.length === 0">无特殊标签</span>
          <span v-for="flag in detailSpell.special" :key="flag">{{ flag }}</span>
        </div>
        <div v-if="spellDetailFacts(detailSpell).length" class="spell-detail-facts">
          <div v-for="fact in spellDetailFacts(detailSpell)" :key="fact.label">
            <span>{{ fact.label }}</span>
            <strong>{{ fact.value }}</strong>
          </div>
        </div>
        <p class="spell-detail-desc">{{ spellDescription(detailSpell) }}</p>
        <button
          class="spell-detail-pick"
          type="button"
          :disabled="isDisabled(detailSpell)"
          @click="toggleSpell(detailSpell)"
        >
          {{ isSelected(detailSpell) ? '取消选择' : isDisabled(detailSpell) ? '已达上限' : '选择这个法术' }}
        </button>
      </section>
    </div>

    <div v-if="showSpellRules" class="spell-detail-mask" @click.self="closeSpellRules">
      <section class="spell-rules-panel" role="dialog" aria-modal="true">
        <button class="spell-detail-close" type="button" @click="closeSpellRules">×</button>
        <div class="spell-detail-kicker">SPELLCASTING RULES</div>
        <h2>施法规则速查</h2>
        <p class="spell-rules-lead">
          这里保留车卡时最容易查的规则：何时换法术、法术位、仪式、专注、材料、目标与检定。
        </p>

        <div v-if="currentPreparationRule" class="spell-current-rule">
          <span>当前职业换法术</span>
          <strong>{{ currentPreparationRule.className }}</strong>
          <em>{{ currentPreparationRule.timing }} · {{ currentPreparationRule.amount }}</em>
        </div>

        <div class="spell-rules-grid">
          <article
            v-for="section in spellRuleSections"
            :key="section.id"
            class="spell-rule-section"
          >
            <h3>{{ section.title }}</h3>
            <ul>
              <li v-for="point in section.points" :key="point">{{ point }}</li>
            </ul>
          </article>
        </div>

        <div class="spell-rule-table">
          <h3>职业准备法术</h3>
          <div
            v-for="rule in spellPreparationRules"
            :key="rule.classId"
            :class="['spell-rule-row', { active: rule.classId === currentClass?.id }]"
          >
            <span>{{ rule.className }}</span>
            <strong>{{ rule.timing }}</strong>
            <em>{{ rule.amount }}</em>
          </div>
        </div>

        <div class="spell-school-list">
          <h3>魔法学派</h3>
          <div class="spell-school-grid">
            <div v-for="school in magicSchools" :key="school.name" class="spell-school-item">
              <strong>{{ school.name }}</strong>
              <span>{{ school.nameEn }}</span>
              <em>{{ school.effect }}</em>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="spells-footer">
      <span>{{ footerHint }}</span>
      <button type="button" :disabled="!isReady" @click="goNext">继续属性总览</button>
    </footer>
  </div>
</template>

<style scoped>
.spells-page {
  min-height: 100dvh;
  padding-bottom: calc(86px + env(safe-area-inset-bottom, 0px));
  background: var(--bg);
}

.spells-header {
  padding: 42px 20px 18px;
  text-align: center;
}

.spells-step-badge {
  display: inline-block;
  margin-bottom: 12px;
  padding: 4px 14px;
  border: 1px solid rgba(201, 168, 76, 0.24);
  border-radius: 999px;
  background: rgba(201, 168, 76, 0.08);
  color: var(--gold);
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.2em;
}

.spells-header h1 {
  color: var(--gold-bright);
  font-family: var(--font-deco);
  font-size: clamp(25px, 5vw, 38px);
}

.spells-header p {
  max-width: 720px;
  margin: 8px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.spells-rule-button {
  min-height: 36px;
  margin-top: 14px;
  padding: 0 16px;
  border: 1px solid rgba(201, 168, 76, 0.28);
  border-radius: 999px;
  background: rgba(201, 168, 76, 0.08);
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.spells-layout {
  width: min(920px, calc(100% - 28px));
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.spells-control,
.spells-browser {
  border: 1px solid var(--border-dark);
  border-radius: var(--r);
  background: rgba(19, 16, 42, 0.82);
}

.spells-control {
  padding: 14px;
}

.spells-class-line,
.spells-quota-grid {
  display: grid;
  gap: 8px;
}

.spells-class-line {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.spells-class-line div,
.spells-quota {
  min-height: 58px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--r-sm);
  background: rgba(0, 0, 0, 0.18);
}

.spells-class-line span,
.spells-quota span,
.spells-always > span {
  display: block;
  margin-bottom: 6px;
  color: var(--text-dim);
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.14em;
}

.spells-class-line strong,
.spells-quota strong {
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 14px;
  line-height: 1.3;
}

.spells-quota-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 10px;
}

.spells-always {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-dark);
}

.spells-always div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.spells-always em {
  padding: 4px 9px;
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 999px;
  color: var(--gold-light);
  font-size: 12px;
  font-style: normal;
}

.spells-browser {
  padding: 12px;
  max-height: calc(100dvh - 320px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.spell-step-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.spell-step-card {
  min-height: 76px;
  display: grid;
  align-content: center;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--border-dark);
  border-radius: var(--r);
  background: rgba(0, 0, 0, 0.16);
  text-align: left;
  transition: border-color 0.15s, background 0.15s, opacity 0.15s;
}

.spell-step-card span {
  color: var(--gold);
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.16em;
}

.spell-step-card strong {
  color: var(--text);
  font-family: var(--font-title);
  font-size: 15px;
}

.spell-step-card em {
  color: var(--text-dim);
  font-size: 12px;
  font-style: normal;
}

.spell-step-card.active {
  border-color: rgba(201, 168, 76, 0.52);
  background: rgba(201, 168, 76, 0.11);
}

.spell-step-card.active strong,
.spell-step-card.complete em {
  color: var(--gold-light);
}

.spell-step-card.complete:not(.active) {
  border-color: rgba(201, 168, 76, 0.22);
}

.spells-search {
  width: 100%;
  min-height: 44px;
  border: 1px solid rgba(201, 168, 76, 0.18);
  border-radius: var(--r);
  background: rgba(0, 0, 0, 0.22);
  color: var(--text);
  padding: 0 14px;
  font-size: 14px;
}

.spells-search::placeholder {
  color: var(--text-dim);
}

.spells-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 10px 0 12px;
}

.spells-tab {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid var(--border-dark);
  border-radius: 999px;
  color: var(--text-muted);
  font-family: var(--font-title);
  font-size: 12px;
}

.spells-tab.active {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.12);
  color: var(--gold-light);
}

.spell-results {
  display: grid;
  gap: 8px;
  contain: layout style paint;
}

.spell-row {
  width: 100%;
  min-height: 68px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--r);
  background: rgba(0, 0, 0, 0.16);
  transition: border-color 0.15s, background 0.15s, opacity 0.15s;
}

.spell-row.selected {
  border-color: rgba(201, 168, 76, 0.55);
  background: rgba(201, 168, 76, 0.1);
}

.spell-row.disabled {
  opacity: 0.45;
}

.spell-row-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.spell-row-open {
  flex: 1;
  text-align: left;
}

.spell-level {
  width: 42px;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(201, 168, 76, 0.22);
  border-radius: var(--r-sm);
  color: var(--gold);
  font-family: var(--font-title);
  font-size: 11px;
  flex-shrink: 0;
}

.spell-row strong,
.spell-row small {
  display: block;
}

.spell-row strong {
  color: var(--text);
  font-family: var(--font-title);
  font-size: 14px;
}

.spell-row small {
  margin-top: 2px;
  color: var(--text-dim);
  font-size: 11px;
}

.spell-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 5px;
  flex-shrink: 0;
  max-width: 46%;
}

.spell-meta:disabled {
  cursor: not-allowed;
}

.spell-meta span,
.spell-meta em,
.spell-meta b {
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
}

.spell-meta span {
  color: var(--text-muted);
}

.spell-meta em {
  min-width: 24px;
  justify-content: center;
  border: 1px solid rgba(201, 168, 76, 0.22);
  color: var(--gold-light);
}

.spell-meta b {
  padding: 0 8px;
  color: var(--gold);
  border: 1px solid rgba(201, 168, 76, 0.18);
}

.spells-empty {
  padding: 16px;
  color: var(--text-dim);
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.spell-detail-mask {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(5, 4, 12, 0.72);
  backdrop-filter: blur(10px);
}

.spell-detail-panel {
  position: relative;
  width: min(520px, 100%);
  border: 1px solid rgba(201, 168, 76, 0.34);
  border-radius: var(--r);
  background: rgba(19, 16, 42, 0.98);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  padding: 22px;
}

.spell-rules-panel {
  position: relative;
  width: min(880px, 100%);
  max-height: min(84dvh, 780px);
  overflow: auto;
  border: 1px solid rgba(201, 168, 76, 0.34);
  border-radius: var(--r);
  background: rgba(19, 16, 42, 0.98);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  padding: 22px;
}

.spell-detail-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(201, 168, 76, 0.22);
  border-radius: 50%;
  color: var(--gold);
  font-size: 20px;
  line-height: 1;
}

.spell-detail-kicker {
  color: var(--gold);
  font-family: var(--font-title);
  font-size: 10px;
  letter-spacing: 0.16em;
}

.spell-detail-panel h2 {
  margin-top: 8px;
  color: var(--gold-bright);
  font-family: var(--font-deco);
  font-size: 28px;
}

.spell-rules-panel h2 {
  margin-top: 8px;
  color: var(--gold-bright);
  font-family: var(--font-deco);
  font-size: 28px;
}

.spell-rules-lead {
  max-width: 680px;
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.spell-current-rule {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  margin-top: 18px;
  padding: 12px;
  border: 1px solid rgba(201, 168, 76, 0.22);
  border-radius: var(--r);
  background: rgba(201, 168, 76, 0.08);
}

.spell-current-rule span,
.spell-current-rule em {
  color: var(--text-muted);
  font-size: 12px;
  font-style: normal;
}

.spell-current-rule strong {
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 14px;
}

.spell-rules-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.spell-rule-section,
.spell-rule-table,
.spell-school-list {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--r);
  background: rgba(0, 0, 0, 0.14);
}

.spell-rule-section {
  padding: 14px;
}

.spell-rule-section h3,
.spell-rule-table h3,
.spell-school-list h3 {
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 14px;
}

.spell-rule-section ul {
  display: grid;
  gap: 8px;
  margin: 10px 0 0;
  padding-left: 18px;
}

.spell-rule-section li {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.65;
}

.spell-rule-table,
.spell-school-list {
  margin-top: 12px;
  padding: 14px;
}

.spell-rule-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 0.7fr;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.spell-rule-row:last-child {
  border-bottom: 0;
}

.spell-rule-row span,
.spell-rule-row strong,
.spell-rule-row em {
  color: var(--text-muted);
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
}

.spell-rule-row.active span,
.spell-rule-row.active strong,
.spell-rule-row.active em {
  color: var(--gold-light);
}

.spell-school-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.spell-school-item {
  min-height: 70px;
  padding: 10px;
  border: 1px solid rgba(201, 168, 76, 0.14);
  border-radius: var(--r-sm);
  background: rgba(255, 255, 255, 0.03);
}

.spell-school-item strong,
.spell-school-item span,
.spell-school-item em {
  display: block;
}

.spell-school-item strong {
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 13px;
}

.spell-school-item span {
  margin-top: 2px;
  color: var(--text-dim);
  font-size: 11px;
}

.spell-school-item em {
  margin-top: 7px;
  color: var(--text-muted);
  font-size: 12px;
  font-style: normal;
  line-height: 1.5;
}

.spell-detail-en {
  margin-top: 3px;
  color: var(--text-dim);
  font-size: 13px;
}

.spell-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}

.spell-detail-tags span {
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 999px;
  color: var(--gold-light);
  font-size: 12px;
}

.spell-detail-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.spell-detail-facts div {
  min-height: 54px;
  padding: 9px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--r-sm);
  background: rgba(0, 0, 0, 0.14);
}

.spell-detail-facts span,
.spell-detail-facts strong {
  display: block;
}

.spell-detail-facts span {
  color: var(--text-dim);
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.14em;
}

.spell-detail-facts strong {
  margin-top: 5px;
  color: var(--text);
  font-size: 13px;
  line-height: 1.35;
}

.spell-detail-desc {
  margin-top: 18px;
  white-space: pre-line;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.75;
}

.spell-detail-pick {
  width: 100%;
  min-height: 44px;
  margin-top: 20px;
  border-radius: var(--r);
  border: 1px solid rgba(201, 168, 76, 0.36);
  background: rgba(201, 168, 76, 0.1);
  color: var(--gold-light);
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.spell-detail-pick:disabled {
  opacity: 0.45;
}

.spells-footer {
  position: fixed;
  inset: auto 0 var(--pcb-height, 0px);
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 18px calc(14px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--border-dark);
  background: rgba(12, 10, 23, 0.96);
  backdrop-filter: blur(12px);
}

.spells-footer span {
  color: var(--text-dim);
  font-size: 12px;
}

.spells-footer button {
  min-height: 44px;
  padding: 0 22px;
  border-radius: var(--r);
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  color: #120D08;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.spells-footer button:disabled {
  opacity: 0.35;
  pointer-events: none;
}

@media (max-width: 680px) {
  .spells-class-line,
  .spells-quota-grid,
  .spell-step-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .spell-rules-grid,
  .spell-school-grid {
    grid-template-columns: 1fr;
  }

  .spell-rules-panel {
    max-height: 88dvh;
    padding: 18px;
  }

  .spell-current-rule,
  .spell-rule-row {
    grid-template-columns: 1fr;
  }

  .spell-detail-facts {
    grid-template-columns: 1fr;
  }

  .spell-row,
  .spells-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .spell-meta {
    justify-content: flex-start;
    max-width: none;
  }

  .spell-row-open {
    width: 100%;
  }

  .spells-footer button {
    width: 100%;
  }

  .spells-browser {
    max-height: calc(100dvh - 360px - env(safe-area-inset-bottom, 0px));
    padding: 10px;
  }

  .spell-results {
    gap: 6px;
  }

  .spell-row {
    min-height: 64px;
    padding: 8px;
  }
}
</style>
