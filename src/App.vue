<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { fetchRaceOverrides, fetchBackgroundOverrides, fetchClassOverrides } from './api/gameData.js'
import { applyRaceOverrides } from './data/races.js'
import { applyBackgroundOverrides } from './data/backgrounds.js'
import { applyClassOverrides } from './data/classes.js'

onMounted(async () => {
  const [raceOverrides, bgOverrides, classOverrides] = await Promise.all([
    fetchRaceOverrides(),
    fetchBackgroundOverrides(),
    fetchClassOverrides(),
  ])
  if (raceOverrides.length)   applyRaceOverrides(raceOverrides)
  if (bgOverrides.length)     applyBackgroundOverrides(bgOverrides)
  if (classOverrides.length)  applyClassOverrides(classOverrides)
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>
