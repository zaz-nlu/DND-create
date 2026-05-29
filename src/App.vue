<script setup>
import { RouterView } from 'vue-router'
import PendingChoicesBar from './components/PendingChoicesBar.vue'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <PendingChoicesBar />
</template>
