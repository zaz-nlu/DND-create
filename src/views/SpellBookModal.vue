<template>
  <Teleport to="body">
    <Transition name="spellbook">
      <div v-if="show" class="sb-backdrop" @click.self="$emit('close')">
        <div class="sb-modal">

          <!-- 顶部标题栏 -->
          <header class="sb-header">
            <span class="sb-title">📖 法术图鉴</span>
            <div class="sb-header-right">
              <span class="sb-count">{{ filtered.length }} 条</span>
              <button class="sb-close" @click="$emit('close')">✕</button>
            </div>
          </header>

          <!-- 搜索框 -->
          <div class="sb-search-row">
            <input
              v-model="query"
              class="sb-search"
              placeholder="搜索法术名称（中文或英文）…"
              autofocus
            />
          </div>

          <!-- 环阶筛选 -->
          <div class="sb-level-bar">
            <button
              v-for="lv in levelOptions"
              :key="lv.value"
              :class="['sb-lv', { active: activeLevel === lv.value }]"
              @click="activeLevel = lv.value"
            >{{ lv.label }}</button>
          </div>

          <div class="sb-body">
            <!-- 左：法术列表 -->
            <div class="sb-list">
              <div
                v-for="spell in filtered"
                :key="spell.baseId"
                :class="['sb-row', { selected: detail?.baseId === spell.baseId }]"
                @click="detail = spell"
              >
                <div class="sb-row-main">
                  <span class="sb-spell-name">{{ spell.name }}</span>
                  <span class="sb-spell-en">{{ spell.nameEn }}</span>
                </div>
                <div class="sb-row-meta">
                  <span class="sb-tag school">{{ spell.school }}</span>
                  <span class="sb-tag level">{{ levelTag(spell.level) }}</span>
                  <span v-if="spell.concentration" class="sb-tag conc" title="专注">C</span>
                  <span v-if="spell.ritual" class="sb-tag ritual" title="仪式">R</span>
                </div>
              </div>
              <div v-if="filtered.length === 0" class="sb-empty">没有找到相关法术</div>
            </div>

            <!-- 右：法术详情 -->
            <div class="sb-detail" v-if="detail">
              <h2 class="sb-detail-name">{{ detail.name }}</h2>
              <p class="sb-detail-en">{{ detail.nameEn }}</p>

              <div class="sb-detail-tags">
                <span class="sb-tag school">{{ detail.school }}</span>
                <span class="sb-tag level">{{ levelTag(detail.level) }}</span>
                <span v-if="detail.concentration" class="sb-tag conc">专注</span>
                <span v-if="detail.ritual" class="sb-tag ritual">仪式</span>
                <span v-if="detail.material" class="sb-tag mat">材料</span>
              </div>

              <table class="sb-detail-table">
                <tr v-if="detail.castingTime">
                  <th>施法时间</th><td>{{ detail.castingTime }}</td>
                </tr>
                <tr v-if="detail.range">
                  <th>施法距离</th><td>{{ detail.range }}</td>
                </tr>
                <tr v-if="detail.components">
                  <th>法术成分</th><td>{{ detail.components }}</td>
                </tr>
                <tr v-if="detail.duration">
                  <th>持续时间</th><td>{{ detail.duration }}</td>
                </tr>
              </table>

              <div class="sb-detail-desc" v-if="detail.desc">
                <p v-for="(para, i) in detail.desc.split('\n\n')" :key="i">{{ para }}</p>
              </div>
              <div class="sb-detail-desc no-desc" v-else>
                <p>暂无详细说明</p>
              </div>

              <!-- 所属法表 -->
              <div class="sb-detail-lists">
                <span class="sb-lists-label">出现在：</span>
                <span v-for="listId in detail.lists" :key="listId" class="sb-tag list-tag">
                  {{ listName(listId) }}
                </span>
              </div>
            </div>

            <div class="sb-detail sb-detail-placeholder" v-else>
              <p>← 点击左侧法术查看详情</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { spells } from '../data/spells.js'

defineProps({ show: Boolean })
defineEmits(['close'])

const query       = ref('')
const activeLevel = ref('all')
const detail      = ref(null)

// 去重：同一法术出现在多个法表，用 baseId 合并
const uniqueSpells = computed(() => {
  const map = new Map()
  for (const spell of spells) {
    if (!map.has(spell.baseId)) {
      map.set(spell.baseId, { ...spell, lists: [] })
    }
    map.get(spell.baseId).lists.push(spell.listId)
  }
  return [...map.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'zh-Hans-CN'))
})

const levelOptions = computed(() => {
  const levels = [...new Set(uniqueSpells.value.map(s => s.level))].sort((a, b) => a - b)
  return [
    { label: '全部', value: 'all' },
    ...levels.map(lv => ({ label: levelTag(lv), value: lv })),
  ]
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return uniqueSpells.value.filter(spell => {
    if (activeLevel.value !== 'all' && spell.level !== activeLevel.value) return false
    if (!q) return true
    return spell.name.toLowerCase().includes(q) || spell.nameEn.toLowerCase().includes(q)
  })
})

function levelTag(level) {
  return level === 0 ? '戏法' : `${level} 环`
}

const listLabels = {
  druid:    '德鲁伊',
  wizard:   '法师',
  warlock:  '魔契师',
  cleric:   '牧师',
  paladin:  '圣武士',
  sorcerer: '术士',
  bard:     '吟游诗人',
  ranger:   '游侠',
}

function listName(listId) {
  return listLabels[listId] ?? listId
}
</script>

<style scoped>
.sb-backdrop {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0, 0, 0, 0.75);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

.sb-modal {
  width: 100%; max-width: 880px;
  height: 90vh; max-height: 680px;
  background: #1c1a2e;
  border-radius: 16px;
  border: 1px solid rgba(160, 130, 230, 0.3);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(160,130,230,0.1);
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* 标题栏 */
.sb-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, #2d1b69, #1c1a2e);
  border-bottom: 1px solid rgba(160, 130, 230, 0.2);
  flex-shrink: 0;
}
.sb-title { font-size: 1.1rem; font-weight: 700; color: #d4b8ff; letter-spacing: 0.03em; }
.sb-header-right { display: flex; align-items: center; gap: 12px; }
.sb-count { font-size: 0.8rem; color: #9080b0; }
.sb-close {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255,255,255,0.08); border: none;
  color: #aaa; font-size: 0.85rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.sb-close:hover { background: rgba(255,255,255,0.15); color: #fff; }

/* 搜索 */
.sb-search-row { padding: 10px 16px 0; flex-shrink: 0; }
.sb-search {
  width: 100%; padding: 9px 14px; border-radius: 8px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(160,130,230,0.25);
  color: #e0d8ff; font-size: 0.9rem; outline: none;
}
.sb-search::placeholder { color: #7060a0; }
.sb-search:focus { border-color: rgba(160,130,230,0.6); background: rgba(255,255,255,0.09); }

/* 环阶筛选 */
.sb-level-bar {
  display: flex; gap: 4px; padding: 8px 16px;
  flex-shrink: 0; flex-wrap: wrap;
  border-bottom: 1px solid rgba(160,130,230,0.15);
}
.sb-lv {
  padding: 4px 10px; border-radius: 12px;
  background: rgba(255,255,255,0.05); border: 1px solid transparent;
  color: #9080b0; font-size: 0.78rem; cursor: pointer;
  transition: all 0.15s;
}
.sb-lv.active, .sb-lv:hover { background: rgba(160,130,230,0.2); border-color: rgba(160,130,230,0.4); color: #d4b8ff; }

/* 主体布局 */
.sb-body {
  display: flex; flex: 1; overflow: hidden;
}

/* 左侧列表 */
.sb-list {
  width: 260px; min-width: 200px;
  overflow-y: auto; flex-shrink: 0;
  border-right: 1px solid rgba(160,130,230,0.15);
}
.sb-row {
  padding: 9px 14px; cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.12s;
}
.sb-row:hover { background: rgba(160,130,230,0.1); }
.sb-row.selected { background: rgba(160,130,230,0.2); border-left: 3px solid #a080d0; }
.sb-row-main { display: flex; flex-direction: column; margin-bottom: 4px; }
.sb-spell-name { font-size: 0.88rem; color: #e0d8ff; font-weight: 600; }
.sb-spell-en { font-size: 0.72rem; color: #7060a0; margin-top: 1px; }
.sb-row-meta { display: flex; flex-wrap: wrap; gap: 4px; }
.sb-empty { padding: 24px 16px; text-align: center; color: #7060a0; font-size: 0.85rem; }

/* 右侧详情 */
.sb-detail {
  flex: 1; overflow-y: auto; padding: 20px 22px;
}
.sb-detail-placeholder {
  display: flex; align-items: center; justify-content: center;
  color: #7060a0; font-size: 0.95rem;
}
.sb-detail-name { margin: 0 0 2px; font-size: 1.3rem; color: #e8d8ff; }
.sb-detail-en { margin: 0 0 12px; font-size: 0.85rem; color: #9080b0; }
.sb-detail-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }

.sb-detail-table {
  width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.85rem;
}
.sb-detail-table th {
  width: 80px; text-align: left; padding: 5px 10px 5px 0;
  color: #9080b0; font-weight: 500; white-space: nowrap;
  vertical-align: top;
}
.sb-detail-table td { padding: 5px 0; color: #ccc4e8; }
.sb-detail-table tr { border-bottom: 1px solid rgba(255,255,255,0.04); }

.sb-detail-desc { font-size: 0.85rem; line-height: 1.7; color: #b8aed8; }
.sb-detail-desc p { margin: 0 0 10px; }
.sb-detail-desc.no-desc { color: #7060a0; }

.sb-detail-lists {
  margin-top: 16px; padding-top: 12px;
  border-top: 1px solid rgba(160,130,230,0.15);
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
}
.sb-lists-label { font-size: 0.78rem; color: #7060a0; }

/* 标签 */
.sb-tag {
  padding: 2px 7px; border-radius: 10px; font-size: 0.72rem; white-space: nowrap;
}
.sb-tag.school  { background: rgba(100,80,160,0.35); color: #c4b0f0; }
.sb-tag.level   { background: rgba(60,100,160,0.35); color: #90c0f0; }
.sb-tag.conc    { background: rgba(160,100,40,0.35); color: #f0c080; }
.sb-tag.ritual  { background: rgba(40,140,100,0.35); color: #80e0b0; }
.sb-tag.mat     { background: rgba(100,60,40,0.35); color: #e0b080; }
.sb-tag.list-tag { background: rgba(80,60,120,0.4); color: #b0a0d8; }

/* 动画 */
.spellbook-enter-active, .spellbook-leave-active { transition: opacity 0.2s, transform 0.2s; }
.spellbook-enter-from, .spellbook-leave-to { opacity: 0; transform: scale(0.96); }

/* 移动端适配 */
@media (max-width: 600px) {
  .sb-modal { max-height: 95vh; border-radius: 12px 12px 0 0; align-self: flex-end; }
  .sb-backdrop { align-items: flex-end; padding: 0; }
  .sb-body { flex-direction: column; }
  .sb-list { width: 100%; height: 220px; min-width: unset; border-right: none; border-bottom: 1px solid rgba(160,130,230,0.15); }
  .sb-detail { padding: 14px 16px; }
}
</style>
