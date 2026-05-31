<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  step:  { type: String, default: '' },
  label: { type: String, default: '' },
  backTo: { type: String, default: '' },
})

const router = useRouter()

function goBack() {
  if (props.backTo) router.push(props.backTo)
  else router.back()
}
</script>

<template>
  <nav class="step-nav">
    <button class="step-nav-back" @click="goBack" aria-label="返回上一步">
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M12 5L7 10L12 15" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>返回</span>
    </button>

    <div class="step-nav-center" v-if="step || label">
      <span v-if="step" class="step-nav-step">{{ step }}</span>
      <span v-if="label" class="step-nav-label">{{ label }}</span>
    </div>

    <div class="step-nav-right" />
  </nav>
</template>

<style scoped>
.step-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  background: rgba(12, 10, 23, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(201, 168, 76, 0.1);
}

.step-nav-back {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.06em;
  cursor: pointer;
  padding: 8px 4px;
  border-radius: var(--r);
  transition: color 0.15s;
  min-width: 60px;
}

.step-nav-back:hover { color: var(--gold); }

.step-nav-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.step-nav-step {
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--gold);
  opacity: 0.7;
}

.step-nav-label {
  font-family: var(--font-title);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.step-nav-right { min-width: 60px; }
</style>
