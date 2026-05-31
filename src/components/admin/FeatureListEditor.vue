<template>
  <div class="feature-list">
    <div v-for="(feat, i) in items" :key="i" class="feat-card">
      <div class="feat-header">
        <span class="feat-num">特性 {{ i + 1 }}</span>
        <button class="btn-del" @click="remove(i)">删除</button>
      </div>
      <div class="feat-fields">
        <div class="field-row" v-if="withLevel">
          <label>触发等级</label>
          <input type="number" v-model.number="feat.level" min="1" max="20" />
        </div>
        <div class="field-row">
          <label>名称（中文）</label>
          <input v-model="feat.name" placeholder="特性名称" />
        </div>
        <div class="field-row">
          <label>名称（英文）</label>
          <input v-model="feat.nameEn" placeholder="Feature Name" />
        </div>
        <div class="field-row col">
          <label>说明</label>
          <textarea v-model="feat.desc" rows="8" placeholder="特性详细说明…" />
        </div>
      </div>
    </div>
    <button class="btn-add" @click="add">+ 添加特性</button>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  withLevel:  { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

// 本地副本，避免直接修改 prop
const items = reactive(props.modelValue.map(f => ({ ...f })))

watch(items, () => emit('update:modelValue', items.map(f => ({ ...f }))), { deep: true })

function add() {
  items.push(props.withLevel
    ? { level: 1, name: '', nameEn: '', desc: '' }
    : { id: '', name: '', nameEn: '', desc: '' }
  )
}

function remove(i) { items.splice(i, 1) }
</script>

<style scoped>
.feature-list { display: flex; flex-direction: column; gap: 12px; }
.feat-card {
  border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
  background: rgba(255,255,255,0.03); overflow: hidden;
}
.feat-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: rgba(100,80,160,0.15);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.feat-num { font-size: 0.82rem; color: #a090c0; font-weight: 600; }
.btn-del {
  padding: 3px 10px; border-radius: 4px; font-size: 0.78rem;
  background: rgba(233,69,96,0.15); border: 1px solid rgba(233,69,96,0.3);
  color: #e94560; cursor: pointer;
}
.btn-del:hover { background: rgba(233,69,96,0.3); }
.feat-fields { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.field-row { display: flex; align-items: center; gap: 10px; }
.field-row.col { flex-direction: column; align-items: stretch; gap: 4px; }
.field-row label { width: 90px; flex-shrink: 0; font-size: 0.8rem; color: #8870b0; }
.field-row.col label { width: auto; }
.field-row input, .field-row textarea {
  flex: 1; padding: 6px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: #ddd; font-size: 0.85rem; outline: none; resize: vertical;
}
.field-row input:focus, .field-row textarea:focus { border-color: rgba(160,130,230,0.5); }
.btn-add {
  padding: 8px 0; border-radius: 8px; width: 100%;
  background: rgba(100,80,160,0.15); border: 1px dashed rgba(160,130,230,0.3);
  color: #a090c0; cursor: pointer; font-size: 0.85rem;
}
.btn-add:hover { background: rgba(100,80,160,0.25); color: #c8b8f0; }
</style>
