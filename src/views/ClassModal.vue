<script setup>
import { ref, computed, Teleport, Transition, nextTick } from 'vue'
import { character, setClass, setSubclass } from '../store/character.js'
import '../styles/class-modal.css'

const props = defineProps({
  cls: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const openFeatures = ref(new Set())
const openSubclasses = ref(new Set())
const subclassSectionRef = ref(null)
const needsSubclassPrompt = ref(false)

const isSelected = computed(() => character.class.id === props.cls?.id)
const canSelectSubclass = computed(() => character.level >= (props.cls?.subclassLevel ?? 3))
const selectedSubclassId = computed(() => character.class.subclassId)
const hasSubclasses = computed(() => (props.cls?.subclasses?.length ?? 0) > 0)
const needsSubclass = computed(() => isSelected && canSelectSubclass.value && hasSubclasses && !selectedSubclassId.value)

function pickSubclass(scId) {
  if (!canSelectSubclass.value) return
  setSubclass(scId)
  needsSubclassPrompt.value = false
}

const classRgb = computed(() => {
  if (!props.cls) return '58 122 90'
  const hex = props.cls.color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `${r} ${g} ${b}`
})

function toggleFeature(id) {
  if (openFeatures.value.has(id)) {
    openFeatures.value.delete(id)
  } else {
    openFeatures.value.add(id)
  }
}

function toggleSubclass(id) {
  if (openSubclasses.value.has(id)) {
    openSubclasses.value.delete(id)
  } else {
    openSubclasses.value.add(id)
  }
}

async function selectClass() {
  if (!props.cls) return

  // 职业未选中，先选择职业
  if (!isSelected.value) {
    setClass(props.cls.id)

    // 如果需要选择子职业，scroll到该部分
    if (canSelectSubclass.value && hasSubclasses.value) {
      needsSubclassPrompt.value = true
      await nextTick()
      subclassSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // 不需要子职业，直接关闭
      emit('close')
    }
  } else if (needsSubclass.value) {
    // 职业已选中但还需要子职业，scroll到子职业部分
    needsSubclassPrompt.value = true
    await nextTick()
    subclassSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    // 职业已选中，子职业已选中或不需要，关闭
    emit('close')
  }
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="class-modal">
      <div
        v-if="cls"
        class="class-overlay"
        @click="handleOverlayClick"
      >
        <div
          class="class-modal"
          :style="{
            '--class-color': cls.color,
            '--class-rgb': classRgb,
          }"
        >
          <!-- 顶部彩色条 -->
          <div class="class-modal-accent"></div>

          <!-- 可滚动正文 -->
          <div class="class-modal-body">

            <!-- Hero -->
            <div class="class-hero">
              <div class="class-hero-title">{{ cls.name }}</div>
              <div class="class-hero-sub">{{ cls.nameEn }}</div>
              <div class="class-hero-tagline">{{ cls.tagline }}</div>
            </div>

            <!-- 核心数值 -->
            <div class="class-stats-row">
              <div class="class-stat highlight">
                <span class="class-stat-label">生命骰</span>
                <span class="class-stat-value">{{ cls.hitDie }}</span>
              </div>
              <div class="class-stat highlight">
                <span class="class-stat-label">主要属性</span>
                <span class="class-stat-value">{{ cls.primaryAbility }}</span>
              </div>
              <div
                v-for="save in cls.saves"
                :key="save"
                class="class-stat"
              >
                <span class="class-stat-label">豁免</span>
                <span class="class-stat-value">{{ save }}</span>
              </div>
            </div>

            <!-- 背景故事 -->
            <div class="class-section">
              <div class="class-section-title">背景</div>
              <p class="class-lore">{{ cls.fullLore }}</p>
            </div>

            <!-- 核心特质 -->
            <div class="class-section">
              <div class="class-section-title">基础特质</div>
              <div class="class-traits-grid">
                <div class="class-trait-row">
                  <span class="class-trait-key">技能</span>
                  <div class="class-trait-vals">
                    <span
                      v-for="skill in cls.skillChoices.options"
                      :key="skill"
                      class="class-trait-chip"
                    >{{ skill }}</span>
                  </div>
                </div>
                <div class="class-skill-note">从上述技能中选择 {{ cls.skillChoices.count }} 项</div>
                <div class="class-trait-row">
                  <span class="class-trait-key">武器</span>
                  <div class="class-trait-vals">
                    <span
                      v-for="w in cls.weapons"
                      :key="w"
                      class="class-trait-chip"
                    >{{ w }}</span>
                  </div>
                </div>
                <div class="class-trait-row">
                  <span class="class-trait-key">护甲</span>
                  <div class="class-trait-vals">
                    <span
                      v-for="a in cls.armor"
                      :key="a"
                      class="class-trait-chip"
                    >{{ a }}</span>
                  </div>
                </div>
                <div class="class-trait-row">
                  <span class="class-trait-key">工具</span>
                  <div class="class-trait-vals">
                    <span
                      v-for="t in cls.tools"
                      :key="t"
                      class="class-trait-chip"
                    >{{ t }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 1级特性 -->
            <div class="class-section">
              <div class="class-section-title">1级特性</div>
              <div
                v-for="feat in cls.level1Features"
                :key="feat.id"
                class="class-feature"
              >
                <div
                  class="class-feature-header"
                  @click="toggleFeature(feat.id)"
                >
                  <div class="class-feature-name-wrap">
                    <span class="class-feature-name">{{ feat.name }}</span>
                    <span class="class-feature-name-en">{{ feat.nameEn }}</span>
                  </div>
                  <span :class="['class-feature-chevron', { open: openFeatures.has(feat.id) }]">▼</span>
                </div>
                <div :class="['class-feature-body', { open: openFeatures.has(feat.id) }]">
                  <div class="class-feature-desc">{{ feat.desc }}</div>
                </div>
              </div>
            </div>

            <!-- 成长里程碑 -->
            <div class="class-section">
              <div class="class-section-title">成长里程碑</div>
              <div
                v-for="feat in cls.notableFeatures"
                :key="`${feat.level}-${feat.name}`"
                class="class-milestone"
              >
                <div class="class-milestone-level">{{ feat.level }}</div>
                <div class="class-milestone-info">
                  <div class="class-milestone-name">
                    {{ feat.name }}
                    <span class="class-milestone-name-en"> · {{ feat.nameEn }}</span>
                  </div>
                  <div class="class-milestone-desc">{{ feat.desc }}</div>
                </div>
              </div>
            </div>

            <!-- 子职业 -->
            <div ref="subclassSectionRef" class="class-section">
              <div class="class-section-title">子职业</div>

              <div v-if="!canSelectSubclass" class="subclass-locked-notice">
                达到 {{ cls.subclassLevel }} 级后即可选择子职业
              </div>
              <div v-else-if="!isSelected" class="subclass-locked-notice subclass-locked-notice--info">
                👈 先选择职业
              </div>
              <div v-else-if="needsSubclassPrompt" class="subclass-locked-notice subclass-locked-notice--active">
                ✦ 请选择一个子职业来完成设置
              </div>

              <div class="subclass-cards">
                <div
                  v-for="sc in cls.subclasses"
                  :key="sc.id"
                  :class="['subclass-card', {
                    'subclass-card--selected': isSelected && selectedSubclassId === sc.id,
                    'subclass-card--selectable': canSelectSubclass && isSelected,
                  }]"
                >
                  <div
                    class="subclass-card-header"
                    @click="toggleSubclass(sc.id)"
                  >
                    <div
                      class="subclass-accent"
                      :style="{ '--sc-color': sc.color }"
                    ></div>
                    <div class="subclass-title-wrap">
                      <span class="subclass-name">{{ sc.name }}</span>
                      <span class="subclass-name-en">{{ sc.nameEn }}</span>
                      <span class="subclass-tagline">{{ sc.tagline }}</span>
                    </div>
                    <span v-if="isSelected && selectedSubclassId === sc.id" class="subclass-selected-mark">✦</span>
                    <span :class="['subclass-chevron', { open: openSubclasses.has(sc.id) }]">▼</span>
                  </div>
                  <div :class="['subclass-body', { open: openSubclasses.has(sc.id) }]">
                    <div class="subclass-desc">{{ sc.desc }}</div>
                    <div
                      v-for="sfeat in sc.features"
                      :key="`${sc.id}-${sfeat.level}-${sfeat.name}`"
                      class="subclass-feature"
                    >
                      <div class="subclass-feature-title">
                        {{ sfeat.name }}
                        <span class="subclass-feature-level"> · Lv.{{ sfeat.level }}</span>
                      </div>
                      <div class="subclass-feature-desc">{{ sfeat.desc }}</div>
                    </div>
                    <button
                      v-if="canSelectSubclass && isSelected"
                      type="button"
                      :class="['subclass-pick-btn', { 'subclass-pick-btn--active': selectedSubclassId === sc.id }]"
                      @click.stop="pickSubclass(sc.id)"
                    >
                      {{ selectedSubclassId === sc.id ? '✦ 已选择此子职业' : '选择此子职业' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 起始装备 -->
            <div class="class-section">
              <div class="class-section-title">起始装备</div>
              <div class="class-equip">
                <div class="class-equip-option">
                  <div class="class-equip-label">选项 A</div>
                  <div class="class-equip-text">{{ cls.equipment.a }}</div>
                </div>
                <div class="class-equip-option">
                  <div class="class-equip-label">选项 B</div>
                  <div class="class-equip-text">{{ cls.equipment.b }}</div>
                </div>
              </div>
            </div>

          </div><!-- /class-modal-body -->

          <!-- 底部操作栏 -->
          <div class="class-modal-actions">
            <button
              :class="['class-btn-select', { 'already-selected': isSelected && !needsSubclass }]"
              type="button"
              @click="selectClass"
            >
              <template v-if="!isSelected">
                选择此职业
              </template>
              <template v-else-if="needsSubclass">
                👇 选择子职业后完成
              </template>
              <template v-else>
                ✦ 已选择此职业
              </template>
            </button>
            <button
              :disabled="needsSubclass"
              class="class-btn-close"
              type="button"
              @click="emit('close')"
            >
              {{ needsSubclass ? '需选子职业' : '关闭' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
