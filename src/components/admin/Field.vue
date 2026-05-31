<template>
  <div :class="['field-item', { full: full }]">
    <label class="field-label">{{ label }}</label>
    <div class="field-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({ label: String, full: Boolean })
</script>

<style scoped>
.field-item { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 0.78rem; color: #9080b0; font-weight: 500; }
.field-body { display: flex; flex-direction: column; }
</style>
