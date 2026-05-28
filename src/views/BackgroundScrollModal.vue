<script setup>
import { computed } from 'vue'
import { character, setBackground } from '../store/character.js'
import '../styles/scroll-modal.css'

const props = defineProps({
  bg: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const isSelected = computed(() => character.background.id === props.bg?.id)

function selectAndClose() {
  setBackground(props.bg.id)
  emit('close')
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="scroll-modal">
      <div v-if="bg" class="scroll-overlay" @click.self="close">
        <div class="scroll-wrap" role="dialog" :aria-label="`${bg.name} 背景详情`">

          <div class="scroll-rod-wrap top">
            <div class="scroll-rod"></div>
          </div>

          <div class="scroll-body">
            <div class="scroll-content">

              <div class="scroll-top-ornament">✦ ── ✦ ── ✦</div>

              <h2 class="scroll-race-title">{{ bg.name }}</h2>
              <p class="scroll-race-subtitle">{{ bg.nameEn }}</p>

              <!-- 属性加值 -->
              <div class="scroll-stats">
                <span class="scroll-stat-chip">专长：{{ bg.feat.name }}</span>
                <span
                  v-for="score in bg.abilityScores"
                  :key="score"
                  class="scroll-stat-chip"
                >{{ score }} ↑</span>
              </div>

              <!-- 背景故事 -->
              <p class="scroll-lore">{{ bg.fullLore }}</p>

              <!-- 技能与工具 -->
              <div class="scroll-section-title">熟练项目</div>
              <div class="scroll-mechanics">
                <div class="scroll-mech-item">
                  <div class="scroll-mech-label">技能熟练</div>
                  <div class="scroll-mech-value">{{ bg.skills.join('、') }}</div>
                </div>
                <div class="scroll-mech-item">
                  <div class="scroll-mech-label">工具熟练</div>
                  <div class="scroll-mech-value">{{ bg.tools.join('、') }}</div>
                </div>
              </div>

              <!-- 装备 -->
              <div class="scroll-section-title">起始装备</div>
              <div class="scroll-trait">
                <div class="scroll-trait-name">方案 A</div>
                <p class="scroll-trait-desc">{{ bg.equipment.a }}</p>
              </div>
              <div class="scroll-trait">
                <div class="scroll-trait-name">方案 B</div>
                <p class="scroll-trait-desc">{{ bg.equipment.b }}</p>
              </div>

              <div class="scroll-bottom-ornament">── ✦ ──</div>
            </div>
          </div>

          <div class="scroll-rod-wrap bottom">
            <div class="scroll-rod"></div>
          </div>

          <div class="scroll-actions">
            <button
              :class="['scroll-btn-select', { 'already-selected': isSelected }]"
              type="button"
              @click="selectAndClose"
            >
              {{ isSelected ? '✦ 已选择此背景' : '选择此背景' }}
            </button>
            <button class="scroll-btn-close" type="button" @click="close">关闭</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
