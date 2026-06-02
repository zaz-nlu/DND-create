<template>
  <div class="form-wrap">
    <div class="form-actions top">
      <button class="btn-save" @click="save" :disabled="saving">{{ saving ? '保存中…' : '💾 保存' }}</button>
      <button v-if="canRevert" class="btn-revert" @click="$emit('revert')">
        {{ isPureCustom ? '🗑 删除条目' : '恢复默认' }}
      </button>
      <button class="btn-cancel" @click="$emit('cancel')">取消</button>
    </div>

    <ul v-if="errors.length" class="form-errors">
      <li v-for="e in errors" :key="e">{{ e }}</li>
    </ul>

    <!-- 基础信息 -->
    <section class="form-section">
      <h3>📝 基础信息</h3>
      <div class="field-grid">
        <field label="ID（唯一标识）">
          <input v-model="f.id" :disabled="!isNew" placeholder="acolyte" />
          <span class="field-hint" v-if="!isNew">ID 创建后不可修改</span>
        </field>
        <field label="颜色">
          <div class="color-row">
            <input type="color" v-model="f.color" />
            <input v-model="f.color" placeholder="#C4A45A" style="flex:1" />
          </div>
        </field>
        <field label="名称（中文）">
          <input v-model="f.name" placeholder="侍僧" />
        </field>
        <field label="名称（英文）">
          <input v-model="f.nameEn" placeholder="Acolyte" />
        </field>
        <field label="简介" full>
          <textarea v-model="f.lore" rows="2" placeholder="一句话简介…" />
        </field>
        <field label="详细背景故事" full>
          <textarea v-model="f.fullLore" rows="5" placeholder="完整背景故事…" />
        </field>
      </div>
    </section>

    <!-- 属性加值 -->
    <section class="form-section">
      <h3>⚔️ 属性与专长</h3>
      <div class="field-grid">
        <field label="可加成属性（选3个）" full>
          <div class="ability-row">
            <select v-for="(_, i) in 3" :key="i" v-model="f.abilityScores[i]">
              <option v-for="a in ABILITIES" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>
        </field>
        <field label="起源专长名（中文）">
          <input v-model="f.feat.name" placeholder="魔法学徒（牧师）" />
        </field>
        <field label="起源专长名（英文）">
          <input v-model="f.feat.nameEn" placeholder="Magic Initiate (Cleric)" />
        </field>
      </div>
    </section>

    <!-- 熟练项 -->
    <section class="form-section">
      <h3>🎯 熟练项</h3>
      <div class="field-grid">
        <field label="技能熟练（2个）" full>
          <TagInput v-model="f.skills" placeholder="如：洞悉、宗教" />
        </field>
        <field label="工具熟练" full>
          <TagInput v-model="f.tools" placeholder="如：书法工具" />
        </field>
      </div>
    </section>

    <!-- 起始装备 -->
    <section class="form-section">
      <h3>🎒 起始装备</h3>
      <div class="field-grid">
        <field label="选项 A（具体装备）" full>
          <textarea v-model="f.equipment.a" rows="3" placeholder="书写用具、书籍…" />
        </field>
        <field label="选项 B（金币）">
          <input v-model="f.equipment.b" placeholder="50 GP" />
        </field>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import TagInput from './TagInput.vue'
import Field from './Field.vue'

const props = defineProps({
  data:     { type: Object, required: true },
  isNew:    { type: Boolean, default: false },
  canRevert:    { type: Boolean, default: false },
  isPureCustom: { type: Boolean, default: false },
  saving:       { type: Boolean, default: false },
})
const emit = defineEmits(['save', 'revert', 'cancel'])

const ABILITIES = ['力量', '敏捷', '体质', '智力', '感知', '魅力']

const f = reactive({
  id: '', name: '', nameEn: '', lore: '', fullLore: '', color: '#888888',
  abilityScores: ['力量', '敏捷', '魅力'],
  feat: { name: '', nameEn: '' },
  skills: [], tools: [],
  equipment: { a: '', b: '50 GP' },
  ...JSON.parse(JSON.stringify(props.data)),
})

if (!f.feat)         f.feat = { name: '', nameEn: '' }
if (!f.abilityScores) f.abilityScores = ['力量', '敏捷', '魅力']
if (!f.equipment)    f.equipment = { a: '', b: '50 GP' }
if (!f.skills)       f.skills = []
if (!f.tools)        f.tools = []

const errors = ref([])

function validate() {
  const errs = []
  if (!f.id?.trim())   errs.push('ID 不能为空')
  if (!f.name?.trim()) errs.push('名称（中文）不能为空')
  if (!Array.isArray(f.abilityScores) || f.abilityScores.length !== 3 || f.abilityScores.some(a => !a))
    errs.push('必须选择 3 个可加成属性')
  if (new Set(f.abilityScores).size !== 3)
    errs.push('3 个可加成属性不能重复')
  if (!f.feat?.nameEn?.trim()) errs.push('起源专长英文名不能为空（用于系统匹配）')
  if (!Array.isArray(f.skills) || f.skills.length < 1) errs.push('至少填写 1 个技能熟练')
  return errs
}

function save() {
  errors.value = validate()
  if (errors.value.length) return
  emit('save', JSON.parse(JSON.stringify(f)))
}
</script>

<style scoped src="./form.css" />
<style scoped>
.form-errors {
  margin: 0 24px 12px;
  padding: 10px 16px;
  background: rgba(180, 60, 40, 0.12);
  border: 1px solid rgba(180, 60, 40, 0.35);
  border-radius: 4px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-errors li {
  color: #D08060;
  font-size: 0.82rem;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.05em;
}
.form-errors li::before {
  content: '✕  ';
  opacity: 0.7;
}
</style>
