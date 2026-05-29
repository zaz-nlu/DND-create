<template>
  <div class="pdf-exporter">
    <button class="export-btn" @click="handleExport" :disabled="isExporting">
      <span v-if="!isExporting">💾 导出角色卡 PDF</span>
      <span v-else>⏳ 正在生成...</span>
    </button>
    <button class="preview-btn" @click="handlePreview" :disabled="isExporting">
      👁 预览 PDF
    </button>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>
    <div v-if="success" class="success-message">
      ✅ PDF已生成并下载！
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { character } from '../store/character.js'
import { exportCharacterPdf, previewCharacterPdf } from '../utils/pdfFiller.js'

const isExporting = ref(false)
const error = ref('')
const success = ref(false)

const handleExport = async () => {
  error.value = ''
  success.value = false
  isExporting.value = true

  try {
    const characterName = character.name || '角色卡'
    await exportCharacterPdf(character, characterName)
    success.value = true
    setTimeout(() => success.value = false, 3000)
  } catch (err) {
    error.value = err.message || '导出失败，请检查PDF文件是否存在'
    console.error(err)
  } finally {
    isExporting.value = false
  }
}

const handlePreview = async () => {
  error.value = ''
  isExporting.value = true

  try {
    await previewCharacterPdf(character)
  } catch (err) {
    error.value = err.message || '预览失败，请检查PDF文件是否存在'
    console.error(err)
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.pdf-exporter {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.export-btn,
.preview-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s;
}

.preview-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.export-btn:hover:not(:disabled),
.preview-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.export-btn:disabled,
.preview-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 10px 15px;
  background: #fee;
  color: #c33;
  border-radius: 5px;
  font-size: 13px;
  flex-basis: 100%;
}

.success-message {
  padding: 10px 15px;
  background: #efe;
  color: #3c3;
  border-radius: 5px;
  font-size: 13px;
  flex-basis: 100%;
}
</style>
