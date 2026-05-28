<script setup>
import { Teleport, Transition } from 'vue'
import '../styles/scroll-modal.css'

const props = defineProps({
  feat:       { type: Object,  default: null },
  kind:       { type: String,  default: 'origin' }, // 'origin' | 'general'
  canPick:    { type: Boolean, default: true },
  isSelected: { type: Boolean, default: false },
  lockReason: { type: String,  default: '' },
})

const emit = defineEmits(['pick', 'close'])

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="scroll-modal">
      <div
        v-if="feat"
        class="scroll-overlay"
        @click="handleOverlayClick"
      >
        <div class="scroll-wrap" role="dialog" :aria-label="`${feat.name} 专长详情`">

          <div class="scroll-rod-wrap top"><div class="scroll-rod"></div></div>

          <div class="scroll-body">
            <div class="scroll-content">

              <div class="scroll-top-ornament">✦ ── ✦ ── ✦</div>

              <h2 class="scroll-race-title">{{ feat.name }}</h2>
              <p class="scroll-race-subtitle">{{ feat.nameEn }}</p>

              <div class="scroll-stats">
                <span class="scroll-stat-chip">{{ feat.category }}</span>
                <span v-if="feat.prerequisiteText" class="scroll-stat-chip">{{ feat.prerequisiteText }}</span>
                <span v-if="feat.repeatable" class="scroll-stat-chip">可重复选取</span>
              </div>

              <p class="scroll-lore">{{ feat.summary }}</p>

              <!-- 起源专长：benefits 列表 -->
              <template v-if="feat.benefits?.length">
                <div class="scroll-section-title">效果</div>
                <div class="feat-modal-benefits">
                  <div
                    v-for="benefit in feat.benefits"
                    :key="benefit.nameEn"
                    class="feat-modal-benefit"
                  >
                    <div class="feat-modal-benefit-title">
                      {{ benefit.name }}
                      <span class="feat-modal-benefit-en">{{ benefit.nameEn }}</span>
                    </div>
                    <p class="feat-modal-benefit-desc">{{ benefit.desc }}</p>
                  </div>
                </div>
              </template>

              <!-- 通用专长：前提条件 -->
              <template v-if="kind === 'general' && feat.prerequisites">
                <div class="scroll-section-title">先决条件</div>
                <p class="scroll-lore">{{ feat.prerequisiteText || '无' }}</p>
                <div v-if="lockReason" class="feat-modal-locked">
                  ✕ {{ lockReason }}
                </div>
              </template>

              <!-- 快速制作表（工匠专长） -->
              <template v-if="feat.table?.length">
                <div class="scroll-section-title">{{ feat.tableTitle }}</div>
                <div class="feat-modal-table">
                  <div
                    v-for="row in feat.table"
                    :key="row.toolEn"
                    class="feat-modal-table-row"
                  >
                    <span>{{ row.tool }}</span>
                    <small>{{ row.toolEn }}</small>
                    <p>{{ row.gear }}</p>
                  </div>
                </div>
              </template>

            </div>
          </div>

          <div class="scroll-rod-wrap bottom"><div class="scroll-rod"></div></div>

          <div class="scroll-actions">
            <button
              type="button"
              :disabled="!canPick && !isSelected"
              :class="['scroll-btn-select', { 'already-selected': isSelected }]"
              @click="emit('pick', feat)"
            >
              {{ isSelected ? '✦ 已选择此专长' : canPick ? '选择此专长' : '条件不满足' }}
            </button>
            <button type="button" class="scroll-btn-close" @click="emit('close')">关闭</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.feat-modal-benefits {
  display: grid;
  gap: 12px;
  margin-bottom: 8px;
}

.feat-modal-benefit {
  border-left: 2px solid rgba(201, 168, 76, 0.5);
  padding-left: 12px;
}

.feat-modal-benefit-title {
  color: var(--text, #e8e0d0);
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.feat-modal-benefit-en {
  color: var(--gold, #c9a84c);
  font-size: 11px;
  font-weight: 400;
  margin-left: 6px;
  letter-spacing: 0.06em;
}

.feat-modal-benefit-desc {
  color: var(--text-muted, #a09880);
  font-size: 13px;
  line-height: 1.65;
  margin: 0;
}

.feat-modal-locked {
  color: #e07070;
  font-size: 13px;
  border: 1px solid rgba(220, 80, 80, 0.3);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
}

.feat-modal-table {
  display: grid;
  gap: 8px;
}

.feat-modal-table-row {
  display: grid;
  grid-template-columns: 90px 130px 1fr;
  gap: 8px;
  align-items: center;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 8px;
  font-size: 12px;
  color: var(--text-muted, #a09880);
}

.feat-modal-table-row span {
  color: var(--text, #e8e0d0);
  font-family: var(--font-title);
}

.feat-modal-table-row small {
  color: var(--text-dim, #666);
}
</style>
