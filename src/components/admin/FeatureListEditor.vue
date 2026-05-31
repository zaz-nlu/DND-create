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
.feature-list { display: flex; flex-direction: column; gap: 10px; }

.feat-card {
  border: 1px solid rgba(201,168,76,0.12);
  border-radius: 3px;
  background: rgba(0,0,0,0.18);
  overflow: hidden;
}

.feat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 12px;
  background: rgba(201,168,76,0.05);
  border-bottom: 1px solid rgba(201,168,76,0.08);
}

.feat-num {
  font-size: 0.65rem;
  font-family: 'Cinzel', serif;
  color: rgba(201,168,76,0.58);
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.btn-del {
  padding: 3px 10px;
  border-radius: 3px;
  font-size: 0.62rem;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid rgba(140,50,30,0.32);
  color: #A06050;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-del:hover { background: rgba(140,50,30,0.12); color: #D08868; }

.feat-fields {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-row { display: flex; align-items: center; gap: 10px; }
.field-row.col { flex-direction: column; align-items: stretch; gap: 4px; }

.field-row label {
  width: 90px;
  flex-shrink: 0;
  font-size: 0.62rem;
  font-family: 'Cinzel', serif;
  color: #9A8868;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.field-row.col label { width: auto; }

.field-row input,
.field-row textarea {
  flex: 1;
  padding: 6px 10px;
  border-radius: 3px;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(201,168,76,0.12);
  color: #EAD9C1;
  font-size: 0.88rem;
  font-family: 'Crimson Pro', Georgia, serif;
  outline: none;
  resize: vertical;
  line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field-row input:focus,
.field-row textarea:focus {
  border-color: rgba(201,168,76,0.44);
  box-shadow: 0 0 0 2px rgba(201,168,76,0.06);
}

.btn-add {
  padding: 8px 0;
  border-radius: 3px;
  width: 100%;
  background: transparent;
  border: 1px dashed rgba(201,168,76,0.16);
  color: rgba(201,168,76,0.38);
  cursor: pointer;
  font-size: 0.68rem;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.btn-add:hover {
  background: rgba(201,168,76,0.05);
  color: #C9A84C;
  border-color: rgba(201,168,76,0.32);
}
</style>
