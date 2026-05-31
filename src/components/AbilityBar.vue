<script setup>
import { computed, ref } from 'vue'
import { character } from '../store/character.js'
import { ABILITY_EN, ABILITY_IDS } from '../utils/abilities.js'
import { getAbilityTotalRows } from '../utils/abilityTotals.js'

const open = ref(false)

const rows = computed(() => getAbilityTotalRows(character))

// 是否任何属性已分配（有基础值）
const hasAnyScore = computed(() => rows.value.some(r => r.base > 0))
</script>

<template>
  <div :class="['ability-bar', { open }]">
    <!-- 收起状态：单行展示 6 个属性 -->
    <button
      class="ability-bar-collapsed"
      type="button"
      :aria-expanded="open"
      aria-label="展开/收起属性值预览"
      @click="open = !open"
    >
      <div class="ability-bar-chips">
        <div
          v-for="row in rows"
          :key="row.id"
          :class="['ability-chip', { set: row.base > 0 }]"
        >
          <span class="chip-en">{{ ABILITY_EN[row.id] }}</span>
          <span class="chip-val">{{ row.base > 0 ? row.total : '—' }}</span>
        </div>
      </div>
      <span class="ability-bar-toggle" :class="{ rotated: open }">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
          <path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>

    <!-- 展开状态：3×2 详情格 -->
    <Transition name="bar-expand">
      <div v-if="open" class="ability-bar-detail">
        <div class="ability-detail-grid">
          <div
            v-for="row in rows"
            :key="row.id"
            class="ability-detail-cell"
          >
            <span class="detail-en">{{ ABILITY_EN[row.id] }}</span>
            <span :class="['detail-score', { unset: row.base === 0 }]">
              {{ row.base > 0 ? row.total : '—' }}
            </span>
            <span class="detail-mod">{{ row.base > 0 ? row.modText : '' }}</span>
            <span class="detail-zh">{{ row.id }}</span>
            <!-- 加值来源提示 -->
            <span v-if="row.background || row.feat" class="detail-bonus">
              {{ row.base }}<template v-if="row.background">+{{ row.background }}背景</template><template v-if="row.feat">+{{ row.feat }}专长</template>
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ability-bar {
  position: sticky;
  top: 52px;
  z-index: 38;
  background: rgba(10, 8, 22, 0.95);
  border-bottom: 1px solid rgba(201, 168, 76, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* 收起行 */
.ability-bar-collapsed {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 12px 0 14px;
  height: 40px;
  gap: 8px;
  cursor: pointer;
}

.ability-bar-chips {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow: hidden;
}

.ability-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 1px;
}

.chip-en {
  font-family: var(--font-title);
  font-size: 7px;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  line-height: 1;
}

.chip-val {
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-dim);
  line-height: 1;
  transition: color 0.2s;
}

.ability-chip.set .chip-val {
  color: var(--gold-light);
}

.ability-bar-toggle {
  color: var(--text-dim);
  flex-shrink: 0;
  transition: transform 0.25s ease;
  display: flex;
  align-items: center;
}

.ability-bar-toggle.rotated {
  transform: rotate(180deg);
}

/* 展开区 */
.ability-bar-detail {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.ability-detail-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  background: rgba(255, 255, 255, 0.04);
  margin: 8px 12px;
  border-radius: 8px;
  overflow: hidden;
}

.ability-detail-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px 10px;
  background: rgba(14, 12, 32, 0.95);
  gap: 1px;
}

.detail-en {
  font-family: var(--font-title);
  font-size: 8px;
  letter-spacing: 0.1em;
  color: var(--gold);
  opacity: 0.7;
  line-height: 1;
}

.detail-score {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 700;
  color: var(--gold-bright);
  line-height: 1.1;
}

.detail-score.unset {
  font-size: 16px;
  color: var(--text-dim);
}

.detail-mod {
  font-family: var(--font-title);
  font-size: 11px;
  font-weight: 600;
  color: var(--gold);
  line-height: 1;
  min-height: 14px;
}

.detail-zh {
  font-family: var(--font-title);
  font-size: 9px;
  color: var(--text-dim);
  line-height: 1;
}

.detail-bonus {
  font-family: var(--font-body);
  font-size: 8px;
  color: var(--text-dim);
  margin-top: 2px;
  line-height: 1.2;
  text-align: center;
  opacity: 0.7;
}

/* 展开动画 */
.bar-expand-enter-active,
.bar-expand-leave-active {
  transition: max-height 0.28s ease, opacity 0.2s ease;
  max-height: 200px;
  overflow: hidden;
}

.bar-expand-enter-from,
.bar-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 宽屏：3×2 换成更紧凑的行 */
@media (min-width: 540px) {
  .ability-bar-collapsed {
    max-width: 600px;
    margin: 0 auto;
  }

  .ability-detail-grid {
    max-width: 560px;
    margin: 8px auto;
  }
}
</style>
