<script setup>
import { computed } from 'vue'

const props = defineProps({
  die: { type: String, default: 'd20' },
  value: { type: [String, Number], default: null },
  hint: { type: String, default: '' },
  rolling: { type: Boolean, default: false },
  done: { type: Boolean, default: false },
  landed: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  showDieLabel: { type: Boolean, default: true },
  ariaLabel: { type: String, default: '掷骰子' },
})

const emit = defineEmits(['click'])

const supportedDice = new Set(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'])

const normalizedDie = computed(() => {
  const raw = String(props.die || 'd20').trim().toLowerCase()
  const match = raw.match(/^d?(\d+)$/)
  const die = match ? `d${match[1]}` : raw
  return supportedDice.has(die) ? die : 'd20'
})

const displayValue = computed(() =>
  props.value === null || props.value === undefined || props.value === ''
    ? normalizedDie.value
    : props.value
)

const sideCount = computed(() => Number.parseInt(normalizedDie.value.slice(1), 10))

function handleClick(event) {
  emit('click', {
    event,
    die: normalizedDie.value,
    sides: sideCount.value,
  })
}
</script>

<template>
  <button
    :class="[
      'dice-button',
      `dice-button--${normalizedDie}`,
      { 'dice-button--rolling': rolling },
      { 'dice-button--done': done && !rolling },
      { 'dice-button--landed': landed },
    ]"
    :disabled="disabled || rolling"
    :aria-label="ariaLabel"
    :data-die="normalizedDie"
    type="button"
    @click="handleClick"
  >
    <span v-if="showDieLabel" class="dice-button-label">{{ normalizedDie }}</span>
    <div class="dice-button-face">
      <span class="dice-button-num">{{ displayValue }}</span>
    </div>
    <div v-if="hint" class="dice-button-hint">{{ hint }}</div>
    <div v-if="done && !rolling" class="dice-button-check">✓</div>
  </button>
</template>

<style scoped>
.dice-button {
  --dice-accent: var(--gold);
  position: relative;
  flex-shrink: 0;
  width: 86px;
  height: 86px;
  border-radius: 16px;
  cursor: pointer;
  transition:
    transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.12s ease;
  background:
    linear-gradient(145deg, #1E1A38 0%, #13102A 60%, #0C0A17 100%);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.6),
    0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 color-mix(in srgb, var(--dice-accent) 18%, transparent),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5);
  border: 1.5px solid color-mix(in srgb, var(--dice-accent) 34%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.dice-button--d4 { --dice-accent: #D99B5F; }
.dice-button--d6 { --dice-accent: #C9A84C; }
.dice-button--d8 { --dice-accent: #69B894; }
.dice-button--d10 { --dice-accent: #6CA0DC; }
.dice-button--d12 { --dice-accent: #B478D4; }
.dice-button--d20 { --dice-accent: #E5C97A; }
.dice-button--d100 { --dice-accent: #D46F78; }

.dice-button:hover:not(:disabled):not(.dice-button--rolling) {
  transform: translateY(-2px);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.7),
    0 4px 8px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 color-mix(in srgb, var(--dice-accent) 24%, transparent),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5),
    0 0 18px color-mix(in srgb, var(--dice-accent) 14%, transparent);
  border-color: color-mix(in srgb, var(--dice-accent) 56%, transparent);
}

.dice-button:active:not(:disabled) {
  transform: translateY(3px) scale(0.94);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

.dice-button--done {
  border-color: color-mix(in srgb, var(--dice-accent) 64%, transparent);
  background:
    linear-gradient(145deg, #221E3C 0%, #1A1630 60%, #12102A 100%);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.55),
    0 2px 4px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 color-mix(in srgb, var(--dice-accent) 28%, transparent),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5),
    0 0 12px color-mix(in srgb, var(--dice-accent) 14%, transparent);
}

.dice-button--rolling {
  animation: diceShake 0.08s infinite alternate;
  cursor: not-allowed;
  border-color: color-mix(in srgb, var(--dice-accent) 72%, transparent);
}

.dice-button--landed {
  animation: diceLand 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.dice-button-label {
  position: absolute;
  top: 6px;
  left: 8px;
  font-family: var(--font-title);
  font-size: 9px;
  letter-spacing: 0.05em;
  color: color-mix(in srgb, var(--dice-accent) 72%, var(--text-muted));
  line-height: 1;
  text-transform: uppercase;
}

.dice-button-face {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-button-num {
  font-family: var(--font-title);
  font-size: 28px;
  color: var(--gold-light);
  line-height: 1;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.8),
    0 0 8px color-mix(in srgb, var(--dice-accent) 28%, transparent);
  letter-spacing: 0;
}

.dice-button--rolling .dice-button-num {
  color: var(--gold-bright);
  text-shadow: 0 0 12px color-mix(in srgb, var(--dice-accent) 70%, transparent), 0 1px 2px rgba(0, 0, 0, 0.8);
}

.dice-button-hint {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.06em;
  text-align: center;
  line-height: 1;
}

.dice-button-check {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 10px;
  color: var(--dice-accent);
  opacity: 0.85;
}

@keyframes diceShake {
  from { transform: rotate(-5deg) scale(1.04); }
  to { transform: rotate(5deg) scale(1.06); }
}

@keyframes diceLand {
  0% { transform: scale(1.18); box-shadow: 0 0 28px color-mix(in srgb, var(--dice-accent) 45%, transparent), 0 6px 16px rgba(0, 0, 0, 0.6); }
  50% { transform: scale(0.96); }
  75% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .dice-button,
  .dice-button--rolling,
  .dice-button--landed {
    animation: none;
    transition: none;
  }
}
</style>
