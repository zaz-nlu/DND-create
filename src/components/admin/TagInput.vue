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
.tag-input { display: flex; flex-direction: column; gap: 7px; }

.tags { display: flex; flex-wrap: wrap; gap: 5px; }

.tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 2px;
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.22);
  color: #C9A84C;
  font-size: 0.75rem;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.04em;
}

.tag-remove {
  background: none;
  border: none;
  color: rgba(201,168,76,0.4);
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0 2px;
  transition: color 0.15s;
}
.tag-remove:hover { color: #C07060; }

.add-row { display: flex; gap: 7px; }

.add-row input {
  flex: 1;
  padding: 6px 10px;
  border-radius: 3px;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(201,168,76,0.14);
  color: #EAD9C1;
  font-size: 0.88rem;
  font-family: 'Crimson Pro', Georgia, serif;
  outline: none;
  transition: border-color 0.2s;
}
.add-row input:focus { border-color: rgba(201,168,76,0.45); }

.btn-add-tag {
  padding: 6px 12px;
  border-radius: 3px;
  background: transparent;
  border: 1px solid rgba(201,168,76,0.24);
  color: rgba(201,168,76,0.65);
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 0.82rem;
  transition: background 0.15s, color 0.15s;
}
.btn-add-tag:hover {
  background: rgba(201,168,76,0.08);
  color: #C9A84C;
}
</style>
