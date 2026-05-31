<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { builtinClasses, classes, upsertRuntimeClass } from '../data/classes.js'
import {
  summarizeClassDefinition,
  upsertImportedClass,
  validateImportedClass,
} from '../data/importedRules.js'
import { character, setClass } from '../store/character.js'
import ClassModal from './ClassModal.vue'
import StepNav from './StepNav.vue'
import AbilityBar from '../components/AbilityBar.vue'
import '../styles/classes.css'

const router = useRouter()
const activeClass = ref(null)
const fileInput = ref(null)
const importDialogOpen = ref(false)
const importDraft = ref(null)
const importSummary = ref(null)
const importErrors = ref([])
const importWarnings = ref([])
const importFileName = ref('')

const selectedId = computed({
  get: () => character.class.id,
  set: (id) => setClass(id),
})

const selectedClass = computed(() =>
  classes.find(c => c.id === selectedId.value) ?? null
)

function openModal(cls) {
  activeClass.value = cls
}

function closeModal() {
  activeClass.value = null
}

function openImportPicker() {
  importErrors.value = []
  importWarnings.value = []
  fileInput.value?.click()
}

function resetImportDialog() {
  importDialogOpen.value = false
  importDraft.value = null
  importSummary.value = null
  importErrors.value = []
  importWarnings.value = []
  importFileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function handleImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return

  importFileName.value = file.name

  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const result = validateImportedClass(parsed)

    importWarnings.value = [...result.warnings]

    if (!result.ok) {
      importErrors.value = result.errors
      importDraft.value = null
      importSummary.value = null
      importDialogOpen.value = true
      return
    }

    const builtinConflict = builtinClasses.some(cls => cls.id === result.value.id)
    if (builtinConflict) {
      importErrors.value = [`职业 id "${result.value.id}" 已被内置职业使用。请换一个 id 后再导入。`]
      importDraft.value = null
      importSummary.value = null
      importDialogOpen.value = true
      return
    }

    importErrors.value = []
    importDraft.value = result.value
    importSummary.value = summarizeClassDefinition(result.value)
    importDialogOpen.value = true
  } catch (error) {
    importErrors.value = [`JSON 解析失败：${error.message}`]
    importWarnings.value = []
    importDraft.value = null
    importSummary.value = null
    importDialogOpen.value = true
  }
}

function confirmImportClass() {
  if (!importDraft.value) return

  const saved = upsertImportedClass(importDraft.value)
  const current = saved.find(item => item.id === importDraft.value.id)
  if (current) upsertRuntimeClass(current)

  resetImportDialog()
}

function goNext() {
  if (!selectedId.value) return
  router.push('/background')
}
</script>

<template>
  <div class="class-page">
    <StepNav step="4 / 10" label="选择职业" back-to="/race" />
    <AbilityBar />
    <header class="class-header">
      <div class="class-step-badge">步骤 4 / 10 · 选择职业</div>
      <h1 class="class-page-title">你的命运之路</h1>
      <p class="class-page-sub">职业定义你的战斗风格与能力，当前草稿等级为 {{ character.level }} 级</p>
    </header>

    <div class="class-import-bar">
      <button class="class-import-btn" type="button" @click="openImportPicker">
        导入规则 JSON
      </button>
      <span class="class-import-count">内置 {{ builtinClasses.length }} · 导入 {{ classes.length - builtinClasses.length }}</span>
      <input
        ref="fileInput"
        class="class-import-input"
        type="file"
        accept=".json,application/json"
        @change="handleImportFile"
      />
    </div>

    <div class="class-grid">
      <div
        v-for="cls in classes"
        :key="cls.id"
        :class="['class-card', { selected: selectedId === cls.id }]"
        :style="{ '--card-accent': cls.color }"
        role="button"
        :aria-label="`查看 ${cls.name} 详情`"
        @click="openModal(cls)"
      >
        <!-- 角色图片 -->
        <div class="class-card-img">
          <img v-if="cls.image" :src="cls.image" :alt="cls.name" loading="lazy" />
        </div>

        <!-- 左侧彩色竖条 -->
        <div class="class-card-bar"></div>

        <!-- 选中勾 -->
        <div v-if="selectedId === cls.id" class="class-card-check">✓</div>

        <!-- 文字内容 -->
        <div class="class-card-body">
          <div>
          <div class="class-card-name">{{ cls.name }}</div>
          <span class="class-card-name-en">{{ cls.nameEn }}</span>
          <span v-if="cls.source === 'imported'" class="class-card-source">导入</span>
        </div>
          <div class="class-card-tagline">{{ cls.tagline }}</div>
          <div class="class-card-chips">
            <span class="class-chip class-chip-highlight">{{ cls.hitDie }}</span>
            <span class="class-chip class-chip-highlight">{{ cls.primaryAbility }}</span>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="class-view-hint">
          <span>特性 · 子职业</span>
          <span class="class-view-icon">⚔</span>
        </div>
      </div>
    </div>

    <!-- 更多职业提示 -->
    <div class="class-more-hint">
      <div class="class-more-divider">
        <span class="class-more-ornament">✦</span>
      </div>
      <p class="class-more-text">更多职业即将到来</p>
      <p class="class-more-sub">战士、法师、游荡者、圣武士……命运之书仍在书写</p>
    </div>

    <footer class="class-footer">
      <div class="class-selected-info">
        <template v-if="selectedClass">
          <span class="class-selected-label">已选职业</span>
          <span class="class-selected-name">✦ {{ selectedClass.name }}</span>
        </template>
        <span v-else class="class-selected-placeholder">尚未选择职业</span>
      </div>
      <button
        class="class-next-btn"
        type="button"
        :disabled="!selectedId"
        @click="goNext"
      >
        下一步 →
      </button>
    </footer>

    <ClassModal :cls="activeClass" @close="closeModal" />

    <div v-if="importDialogOpen" class="rule-import-overlay" @click.self="resetImportDialog">
      <div class="rule-import-modal">
        <div class="rule-import-head">
          <div>
            <div class="rule-import-kicker">规则导入</div>
            <div class="rule-import-title">{{ importFileName || 'JSON 文件' }}</div>
          </div>
          <button class="rule-import-close" type="button" @click="resetImportDialog">×</button>
        </div>

        <div v-if="importErrors.length" class="rule-import-status rule-import-status--error">
          <div v-for="error in importErrors" :key="error">{{ error }}</div>
        </div>

        <div v-if="importWarnings.length" class="rule-import-status rule-import-status--warn">
          <div v-for="warning in importWarnings" :key="warning">{{ warning }}</div>
        </div>

        <div v-if="importSummary" class="rule-import-preview">
          <div class="rule-import-name">
            <span>{{ importSummary.name }}</span>
            <small>{{ importSummary.nameEn }}</small>
          </div>
          <div class="rule-import-stats">
            <div>
              <span>ID</span>
              <strong>{{ importSummary.id }}</strong>
            </div>
            <div>
              <span>生命骰</span>
              <strong>{{ importSummary.hitDie }}</strong>
            </div>
            <div>
              <span>主属性</span>
              <strong>{{ importSummary.primaryAbility }}</strong>
            </div>
            <div>
              <span>等级表</span>
              <strong>{{ importSummary.progressionRows }}</strong>
            </div>
            <div>
              <span>子职</span>
              <strong>{{ importSummary.subclassCount }}</strong>
            </div>
            <div>
              <span>特性</span>
              <strong>{{ importSummary.level1FeatureCount + importSummary.notableFeatureCount }}</strong>
            </div>
          </div>
        </div>

        <div class="rule-import-actions">
          <button class="rule-import-secondary" type="button" @click="resetImportDialog">取消</button>
          <button
            class="rule-import-primary"
            type="button"
            :disabled="!importDraft"
            @click="confirmImportClass"
          >
            确认导入
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
