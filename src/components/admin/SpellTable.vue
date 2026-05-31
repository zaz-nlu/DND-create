<template>
  <div class="spell-table-wrap">
    <div class="table-scroll">
      <table class="spell-table">
        <thead>
          <tr>
            <th>等级</th>
            <th>戏法</th>
            <th>准备</th>
            <th v-for="s in maxSlotLevel" :key="s">{{ s }}环</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.level">
            <td class="lv-cell">{{ row.level }}</td>
            <td><input type="number" v-model.number="row.cantrips" min="0" max="20" @change="emit" /></td>
            <td><input type="number" v-model.number="row.prepared" min="0" max="99" @change="emit" /></td>
            <td v-for="s in maxSlotLevel" :key="s">
              <input
                type="number"
                :value="row.slots[s] || 0"
                min="0" max="9"
                @change="setSlot(row, s, $event.target.value)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="table-hint">填 0 表示该等级没有对应法术位，直接改数字即可</p>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emits = defineEmits(['update:modelValue'])

// 建立20行响应式数据
const rows = reactive(
  Array.from({ length: 20 }, (_, i) => {
    const existing = props.modelValue.find(r => r.level === i + 1)
    return {
      level: i + 1,
      cantrips: existing?.cantrips ?? 0,
      prepared: existing?.prepared ?? 0,
      slots: { ...(existing?.slots ?? {}) },
    }
  })
)

const maxSlotLevel = computed(() => {
  let max = 0
  for (const row of rows) {
    for (const k of Object.keys(row.slots)) {
      if (Number(k) > max && row.slots[k] > 0) max = Number(k)
    }
  }
  return Math.max(max, 1)
})

function setSlot(row, slotLevel, value) {
  const v = Math.max(0, parseInt(value) || 0)
  if (v === 0) {
    delete row.slots[slotLevel]
  } else {
    row.slots[slotLevel] = v
  }
  emit()
}

function emit() {
  emits('update:modelValue', rows.map(r => ({
    level: r.level,
    cantrips: r.cantrips,
    prepared: r.prepared,
    slots: { ...r.slots },
  })))
}
</script>

<style scoped>
.spell-table-wrap { display: flex; flex-direction: column; gap: 8px; }
.table-scroll { overflow-x: auto; }
.spell-table {
  border-collapse: collapse; font-size: 0.82rem;
  min-width: 500px;
}
.spell-table th {
  padding: 6px 8px; background: rgba(100,80,160,0.25);
  color: #b0a0d0; font-weight: 600; text-align: center;
  border: 1px solid rgba(255,255,255,0.08); white-space: nowrap;
}
.spell-table td {
  padding: 3px 4px; border: 1px solid rgba(255,255,255,0.06);
  text-align: center;
}
.lv-cell { color: #8870b0; font-weight: 600; padding: 3px 8px; }
.spell-table input {
  width: 42px; padding: 3px 4px; text-align: center;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: #ddd; border-radius: 4px; outline: none; font-size: 0.82rem;
}
.spell-table input:focus { border-color: rgba(160,130,230,0.5); background: rgba(255,255,255,0.1); }
.spell-table tr:hover td { background: rgba(255,255,255,0.02); }
.table-hint { font-size: 0.78rem; color: #7060a0; margin: 0; }
</style>
