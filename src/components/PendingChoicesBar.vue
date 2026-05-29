<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { backgrounds } from '../data/backgrounds.js'
import { classes } from '../data/classes.js'
import { races } from '../data/races.js'
import { character } from '../store/character.js'
import { getAbilityTotalScores } from '../utils/abilityTotals.js'
import { getUnmetChoices } from '../utils/progression.js'

const router = useRouter()
const route = useRoute()

const HIDDEN_ROUTES = new Set(['/', '/print'])

const selectedClass = computed(() => classes.find(c => c.id === character.class.id) ?? null)
const selectedRace = computed(() => races.find(r => r.id === character.race.id) ?? null)
const selectedBackground = computed(() => backgrounds.find(b => b.id === character.background.id) ?? null)
const abilityScores = computed(() => getAbilityTotalScores(character))

const EXCLUDED_KINDS = new Set(['generalFeat', 'fightingStyleFeat'])

const unmetChoices = computed(() => {
  if (!selectedClass.value?.progression) return []
  return getUnmetChoices(
    character,
    selectedClass.value,
    selectedRace.value,
    selectedBackground.value,
    abilityScores.value
  ).filter(c => !c.isMet && !EXCLUDED_KINDS.has(c.kind))
})

const shouldShow = computed(() =>
  !HIDDEN_ROUTES.has(route.path) && unmetChoices.value.length > 0
)

const isOpen = ref(false)

watchEffect(() => {
  document.documentElement.style.setProperty('--pcb-height', shouldShow.value ? '48px' : '0px')
})

function toggle() { isOpen.value = !isOpen.value }

function routeForKind(kind) {
  if (kind === 'generalFeat' || kind === 'fightingStyleFeat') return '/feats'
  return '/class'
}

function navigate(choice) {
  isOpen.value = false
  router.push(routeForKind(choice.kind))
}
</script>

<template>
  <div v-if="shouldShow" class="pcb-wrap">
    <div class="pcb-drawer" v-if="isOpen">
      <div
        v-for="choice in unmetChoices"
        :key="choice.id"
        class="pcb-item"
        role="button"
        tabindex="0"
        @click="navigate(choice)"
        @keydown.enter="navigate(choice)"
      >
        <span class="pcb-item-label">{{ choice.label }}</span>
        <span class="pcb-item-reason">{{ choice.reason }}</span>
        <span class="pcb-item-arrow">→</span>
      </div>
    </div>
    <div class="pcb-bar" role="button" tabindex="0" @click="toggle" @keydown.enter="toggle">
      <span class="pcb-badge">{{ unmetChoices.length }}</span>
      <span class="pcb-summary">
        还需选择：{{ unmetChoices.map(c => c.label).join(' · ') }}
      </span>
      <span class="pcb-chevron" :class="{ up: isOpen }">▲</span>
    </div>
  </div>
</template>

<style scoped>
.pcb-wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  font-family: inherit;
}

.pcb-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 16px;
  background: #1a1209;
  border-top: 2px solid #c9a84c;
  cursor: pointer;
  user-select: none;
}

.pcb-badge {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #c9a84c;
  color: #1a1209;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pcb-summary {
  flex: 1;
  color: #f0e0a0;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcb-chevron {
  color: #c9a84c;
  font-size: 11px;
  transition: transform 0.2s;
  transform: rotate(180deg);
}
.pcb-chevron.up {
  transform: rotate(0deg);
}

.pcb-drawer {
  background: #221a08;
  border-top: 1px solid #4a3a1a;
  max-height: 240px;
  overflow-y: auto;
}

.pcb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #2e2410;
  cursor: pointer;
}
.pcb-item:hover,
.pcb-item:focus {
  background: #2e2410;
  outline: none;
}
.pcb-item:last-child {
  border-bottom: none;
}

.pcb-item-label {
  color: #f0e0a0;
  font-size: 14px;
  font-weight: 600;
  min-width: 80px;
}

.pcb-item-reason {
  flex: 1;
  color: #a0906a;
  font-size: 13px;
}

.pcb-item-arrow {
  color: #c9a84c;
  font-size: 16px;
}
</style>
