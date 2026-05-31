<script setup>
import { computed } from 'vue'
import { character, setRace } from '../store/character.js'
import '../styles/scroll-modal.css'

const props = defineProps({
  race: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const isSelected = computed(() => character.race.id === props.race?.id)

function selectAndClose() {
  setRace(props.race.id)
  emit('close')
}

function close() {
  emit('close')
}

// 格式化机械数据显示
function mechItems(race) {
  const m = race.mechanics
  const items = [
    { label: '速度', value: `${m.speed} 尺` },
    { label: '体型', value: race.sizeOptions.join(' / ') },
    { label: '黑暗视觉', value: m.darkvision > 0 ? `${m.darkvision} 尺` : '无' },
    { label: '寿命', value: `约 ${race.lifespan} 年` },
  ]
  if (m.damageResistances?.length) {
    items.push({ label: '伤害抗性', value: m.damageResistances.join('、') })
  }
  if (m.cantrips?.length) {
    items.push({ label: '已知戏法', value: m.cantrips.join('、') })
  }
  if (m.hpBonusPerLevel > 0) {
    items.push({ label: 'HP 加值', value: `每级 +${m.hpBonusPerLevel}` })
  }
  if (m.languages?.length) {
    items.push({ label: '语言', value: m.languages.join('、') })
  }
  return items
}
</script>

<template>
  <Teleport to="body">
    <Transition name="scroll-modal">
      <div v-if="race" class="scroll-overlay" @click.self="close">
        <div class="scroll-wrap" role="dialog" :aria-label="`${race.name} 种族详情`">

          <!-- 顶部轴杆 -->
          <div class="scroll-rod-wrap top">
            <div class="scroll-rod"></div>
          </div>

          <!-- 卷轴正文 -->
          <div class="scroll-body">
            <div class="scroll-content">

              <div class="scroll-top-ornament">✦ ── ✦ ── ✦</div>

              <h2 class="scroll-race-title">{{ race.name }}</h2>
              <p class="scroll-race-subtitle">{{ race.nameEn }} · {{ race.type }}</p>

              <!-- 机械属性速览 -->
              <div class="scroll-stats">
                <span
                  v-for="item in mechItems(race)"
                  :key="item.label"
                  class="scroll-stat-chip"
                >{{ item.label }}：{{ item.value }}</span>
              </div>

              <!-- 完整背景故事 -->
              <p class="scroll-lore">{{ race.fullLore }}</p>

              <!-- 分隔标题 -->
              <div class="scroll-section-title">种族特质</div>

              <!-- 特质列表 -->
              <div
                v-for="trait in race.traits"
                :key="trait.id"
                class="scroll-trait"
              >
                <div class="scroll-trait-name">
                  {{ trait.name }}
                  <span class="scroll-trait-name-en"> · {{ trait.nameEn }}</span>
                </div>
                <p class="scroll-trait-desc">{{ trait.desc }}</p>
              </div>

              <div class="scroll-bottom-ornament">── ✦ ──</div>
            </div>
          </div>

          <!-- 底部轴杆 -->
          <div class="scroll-rod-wrap bottom">
            <div class="scroll-rod"></div>
          </div>

          <!-- 操作按钮 -->
          <div class="scroll-actions">
            <button
              :class="['scroll-btn-select', { 'already-selected': isSelected }]"
              type="button"
              @click="selectAndClose"
            >
              {{ isSelected ? '✦ 已选择此种族' : '选择此种族' }}
            </button>
            <button class="scroll-btn-close" type="button" @click="close">关闭</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
