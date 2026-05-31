<template>
  <div class="tag-input">
    <div class="tags" v-if="modelValue.length">
      <span v-for="(tag, i) in modelValue" :key="i" class="tag">
        {{ tag }}
        <button class="tag-remove" @click="remove(i)">×</button>
      </span>
    </div>
    <div class="add-row">
      <input
        v-model="inputVal"
        :placeholder="placeholder || '输入后按回车添加…'"
        @keydown.enter.prevent="add"
      />
      <button class="btn-add-tag" @click="add">+</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  placeholder: String,
})
const emit = defineEmits(['update:modelValue'])
const inputVal = ref('')

function add() {
  const val = inputVal.value.trim()
  if (!val) return
  emit('update:modelValue', [...props.modelValue, val])
  inputVal.value = ''
}

function remove(i) {
  const arr = [...props.modelValue]
  arr.splice(i, 1)
  emit('update:modelValue', arr)
}
</script>

<style scoped>
.tag-input { display: flex; flex-direction: column; gap: 6px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 12px;
  background: rgba(100, 80, 180, 0.3); border: 1px solid rgba(160, 130, 230, 0.4);
  color: #c8b8f0; font-size: 0.82rem;
}
.tag-remove {
  background: none; border: none; color: #a090c0;
  cursor: pointer; font-size: 0.9rem; line-height: 1; padding: 0 2px;
}
.tag-remove:hover { color: #e94560; }
.add-row { display: flex; gap: 6px; }
.add-row input {
  flex: 1; padding: 6px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
  color: #ddd; font-size: 0.85rem; outline: none;
}
.add-row input:focus { border-color: rgba(160,130,230,0.5); }
.btn-add-tag {
  padding: 6px 12px; border-radius: 6px;
  background: rgba(100,80,180,0.3); border: 1px solid rgba(160,130,230,0.4);
  color: #c8b8f0; cursor: pointer; font-size: 0.9rem;
}
.btn-add-tag:hover { background: rgba(120,100,200,0.4); }
</style>
