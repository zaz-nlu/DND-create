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
.spell-table-wrap { display: flex; flex-direction: column; gap: 10px; }

.table-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(201,168,76,0.15) transparent;
}
.table-scroll::-webkit-scrollbar { height: 3px; }
.table-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.18); }

.spell-table {
  border-collapse: collapse;
  font-size: 0.82rem;
  min-width: 500px;
  width: 100%;
}

.spell-table th {
  padding: 7px 8px;
  background: rgba(201,168,76,0.08);
  color: var(--gold, #C9A84C);
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-align: center;
  border: 1px solid rgba(201,168,76,0.1);
  white-space: nowrap;
}

.spell-table td {
  padding: 3px 4px;
  border: 1px solid rgba(255,255,255,0.04);
  text-align: center;
}

.lv-cell {
  color: rgba(201,168,76,0.55);
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 3px 8px;
}

.spell-table input {
  width: 42px;
  padding: 3px 4px;
  text-align: center;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(201,168,76,0.1);
  color: #EAD9C1;
  border-radius: 2px;
  outline: none;
  font-size: 0.82rem;
  font-family: 'Crimson Pro', Georgia, serif;
  transition: border-color 0.2s;
}
.spell-table input:focus {
  border-color: rgba(201,168,76,0.45);
  background: rgba(0,0,0,0.5);
}
.spell-table tr:hover td { background: rgba(201,168,76,0.02); }

.table-hint {
  font-size: 0.75rem;
  color: var(--text-muted, #9A8868);
  margin: 0;
  font-style: italic;
}
</style>
