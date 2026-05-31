<template>
  <div class="form-wrap">
    <div class="form-actions top">
      <button class="btn-save" @click="save" :disabled="saving">{{ saving ? '保存中…' : '💾 保存' }}</button>
      <button v-if="canRevert" class="btn-revert" @click="$emit('revert')">
        {{ isPureCustom ? '🗑 删除条目' : '恢复默认' }}
      </button>
      <button class="btn-cancel" @click="$emit('cancel')">取消</button>
    </div>

    <!-- 基础信息 -->
    <section class="form-section">
      <h3>📝 基础信息</h3>
      <div class="field-grid">
        <field label="ID（唯一标识）">
          <input v-model="f.id" :disabled="!isNew" />
          <span class="field-hint" v-if="!isNew">ID 创建后不可修改</span>
        </field>
        <field label="颜色">
          <div class="color-row">
            <input type="color" v-model="f.color" />
            <input v-model="f.color" style="flex:1" />
          </div>
        </field>
        <field label="名称（中文）"><input v-model="f.name" placeholder="德鲁伊" /></field>
        <field label="名称（英文）"><input v-model="f.nameEn" placeholder="Druid" /></field>
        <field label="标语" full>
          <input v-model="f.tagline" placeholder="原初伟力的自然祭司" />
        </field>
        <field label="简介" full>
          <textarea v-model="f.lore" rows="2" placeholder="一句话简介…" />
        </field>
        <field label="详细背景故事" full>
          <textarea v-model="f.fullLore" rows="6" placeholder="完整职业故事…" />
        </field>
      </div>
    </section>

    <!-- 图片 -->
    <section class="form-section">
      <h3>🖼 职业图片</h3>
      <div class="img-upload-area">
        <img v-if="f.image" :src="f.image" class="img-preview" alt="预览" />
        <div class="upload-right">
          <label class="btn-upload-img">
            📷 上传图片
            <input type="file" accept="image/*" style="display:none" @change="uploadImg" :disabled="uploading" />
          </label>
          <span v-if="uploading" class="upload-status">上传中…</span>
          <span v-if="uploadErr" class="upload-err">{{ uploadErr }}</span>
          <p class="upload-hint">也可以直接填图片网址：</p>
          <input v-model="f.image" placeholder="https://… 或 /uploads/xxx.png" style="margin-top:4px" />
        </div>
      </div>
    </section>

    <!-- 职业属性 -->
    <section class="form-section">
      <h3>⚔️ 职业属性</h3>
      <div class="field-grid">
        <field label="生命骰">
          <select v-model="f.hitDie">
            <option v-for="d in HIT_DICE" :key="d" :value="d">{{ d }}</option>
          </select>
        </field>
        <field label="主要属性">
          <select v-model="f.primaryAbility">
            <option v-for="a in ABILITIES" :key="a" :value="a">{{ a }}</option>
          </select>
        </field>
        <field label="豁免属性 1">
          <select v-model="f.saves[0]">
            <option v-for="a in ABILITIES" :key="a" :value="a">{{ a }}</option>
          </select>
        </field>
        <field label="豁免属性 2">
          <select v-model="f.saves[1]">
            <option v-for="a in ABILITIES" :key="a" :value="a">{{ a }}</option>
          </select>
        </field>
        <field label="子职业解锁等级">
          <input type="number" v-model.number="f.subclassLevel" min="1" max="20" />
        </field>
      </div>
    </section>

    <!-- 施法 -->
    <section class="form-section">
      <h3>✨ 施法属性</h3>
      <div class="field-grid">
        <field label="施法属性（无则留空）">
          <select v-model="f.spellcastingAbility">
            <option value="">无施法</option>
            <option v-for="a in ABILITIES" :key="a" :value="a">{{ a }}</option>
          </select>
        </field>
        <field label="法表 ID（如 druid、wizard）">
          <input v-model="f.spellList" placeholder="druid" />
        </field>
      </div>
    </section>

    <!-- 熟练项 -->
    <section class="form-section">
      <h3>🛡 熟练项</h3>
      <div class="field-grid">
        <field label="武器熟练" full>
          <TagInput v-model="f.weapons" placeholder="如：简易武器" />
        </field>
        <field label="护甲熟练" full>
          <TagInput v-model="f.armor" placeholder="如：轻甲、盾牌" />
        </field>
        <field label="工具熟练" full>
          <TagInput v-model="f.tools" placeholder="如：草药工具" />
        </field>
        <field label="可选技能数量">
          <input type="number" v-model.number="f.skillChoices.count" min="1" max="6" />
        </field>
        <field label="可选技能池" full>
          <TagInput v-model="f.skillChoices.options" placeholder="如：奥秘、驯兽…" />
        </field>
      </div>
    </section>

    <!-- 起始装备 -->
    <section class="form-section">
      <h3>🎒 起始装备</h3>
      <div class="field-grid">
        <field label="选项 A（具体装备）" full>
          <textarea v-model="f.equipment.a" rows="3" placeholder="皮甲、盾牌、镰刀…" />
        </field>
        <field label="选项 B（金币）">
          <input v-model="f.equipment.b" placeholder="50 GP" />
        </field>
      </div>
    </section>

    <!-- 全部职业特性 -->
    <section class="form-section">
      <h3>📋 职业特性
        <span class="section-hint">（所有等级，1 级特性也在这里填写）</span>
      </h3>
      <FeatureListEditor v-model="f.allFeatures" :with-level="true" />
    </section>

    <!-- 法术进阶表 -->
    <section class="form-section">
      <h3>
        📊 法术进阶表
        <label class="toggle-label">
          <input type="checkbox" v-model="hasSpellcasting" @change="toggleSpellcasting" />
          该职业有施法能力
        </label>
      </h3>
      <div v-if="hasSpellcasting">
        <SpellTable v-model="f.spellcastingProgression" />
      </div>
      <p v-else class="no-spell-hint">关闭则不显示法术进阶表（适合战士、野蛮人等非施法职业）</p>
    </section>

    <!-- 子职业 -->
    <section class="form-section">
      <h3>🌟 子职业</h3>
      <div class="subclass-list">
        <div v-for="(sub, si) in f.subclasses" :key="si" class="subclass-card">
          <div class="subclass-header">
            <span class="subclass-num">子职业 {{ si + 1 }}：{{ sub.name || '（未命名）' }}</span>
            <button class="btn-del-sub" @click="removeSub(si)">删除子职业</button>
          </div>
          <div class="subclass-body">
            <div class="field-grid">
              <field label="ID"><input v-model="sub.id" /></field>
              <field label="颜色">
                <div class="color-row">
                  <input type="color" v-model="sub.color" />
                  <input v-model="sub.color" style="flex:1" />
                </div>
              </field>
              <field label="名称（中文）"><input v-model="sub.name" /></field>
              <field label="名称（英文）"><input v-model="sub.nameEn" /></field>
              <field label="标语" full><input v-model="sub.tagline" /></field>
              <field label="简介" full><textarea v-model="sub.desc" rows="3" /></field>
              <field label="誓约信条（仅圣武士）" full>
                <TagInput
                  :model-value="sub.tenets || []"
                  @update:model-value="sub.tenets = $event"
                  placeholder="如：言出必行、扶危济困…"
                />
              </field>
              <field label="总准备法术（每个等级各填一行，格式：等级:法术1,法术2）" full>
                <textarea
                  :value="alwaysPreparedToText(sub.alwaysPrepared)"
                  @input="sub.alwaysPrepared = textToAlwaysPrepared($event.target.value)"
                  rows="4"
                  placeholder="3:防护善恶,虔诚护盾&#10;5:援助术,诚实之域&#10;9:希望信标,解除魔法"
                  style="font-family:monospace;font-size:0.82rem"
                />
              </field>
            </div>
            <div class="subclass-features">
              <p class="sub-feat-title">子职业特性（需填写触发等级）</p>
              <FeatureListEditor v-model="sub.features" :with-level="true" />
            </div>
          </div>
        </div>
        <button class="btn-add-sub" @click="addSub">+ 添加子职业</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import TagInput from './TagInput.vue'
import FeatureListEditor from './FeatureListEditor.vue'
import SpellTable from './SpellTable.vue'
import Field from './Field.vue'

const props = defineProps({
  data:      { type: Object, required: true },
  isNew:     { type: Boolean, default: false },
  canRevert:    { type: Boolean, default: false },
  isPureCustom: { type: Boolean, default: false },
  saving:       { type: Boolean, default: false },
  token:        { type: String, default: '' },
})
const emit = defineEmits(['save', 'revert', 'cancel'])

const ABILITIES = ['力量', '敏捷', '体质', '智力', '感知', '魅力']
const HIT_DICE  = ['d6', 'd8', 'd10', 'd12']

const uploading = ref(false)
const uploadErr = ref('')

const raw = JSON.parse(JSON.stringify(props.data))

const f = reactive({
  id: '', name: '', nameEn: '', tagline: '', lore: '', fullLore: '',
  color: '#888888', image: '',
  primaryAbility: '力量', hitDie: 'd8',
  spellcastingAbility: '', spellList: '',
  subclassLevel: 3,
  saves: ['力量', '体质'],
  weapons: [], armor: [], tools: [],
  skillChoices: { count: 2, options: [] },
  equipment: { a: '', b: '50 GP' },
  allFeatures: [
    ...(raw.level1Features || []).map(feat => ({ level: 1, ...feat })),
    ...(raw.notableFeatures || []),
  ],
  spellcastingProgression: null,
  subclasses: [],
  ...raw,
})

// 保证数组不为 null
if (!f.weapons)  f.weapons = []
if (!f.armor)    f.armor = []
if (!f.tools)    f.tools = []
if (!f.saves || f.saves.length < 2) f.saves = ['力量', '体质']
if (!f.skillChoices) f.skillChoices = { count: 2, options: [] }
if (!f.skillChoices.options) f.skillChoices.options = []
if (!f.equipment) f.equipment = { a: '', b: '50 GP' }
if (!f.allFeatures?.length) f.allFeatures = [
  ...(props.data.level1Features || []).map(feat => ({ level: 1, ...feat })),
  ...(props.data.notableFeatures || []),
]
if (!f.subclasses      || !f.subclasses.length)      f.subclasses      = JSON.parse(JSON.stringify(props.data.subclasses      || []))
if (f.spellcastingAbility === null || f.spellcastingAbility === undefined) f.spellcastingAbility = ''

const hasSpellcasting = ref(!!f.spellcastingProgression)

function toggleSpellcasting() {
  if (hasSpellcasting.value && !f.spellcastingProgression) {
    f.spellcastingProgression = Array.from({ length: 20 }, (_, i) => ({
      level: i + 1, cantrips: 0, prepared: 0, slots: {},
    }))
  } else if (!hasSpellcasting.value) {
    f.spellcastingProgression = null
  }
}

function addSub() {
  f.subclasses.push({
    id: '', name: '', nameEn: '', tagline: '', color: '#888', desc: '',
    tenets: [], alwaysPrepared: null, features: [],
  })
}
function removeSub(i) { f.subclasses.splice(i, 1) }

// alwaysPrepared: { 3: ['法术A','法术B'], 5: [...] } ↔ 多行文本
function alwaysPreparedToText(obj) {
  if (!obj || typeof obj !== 'object') return ''
  return Object.entries(obj)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, spells]) => `${level}:${Array.isArray(spells) ? spells.join(',') : spells}`)
    .join('\n')
}

function textToAlwaysPrepared(text) {
  if (!text.trim()) return null
  const result = {}
  for (const line of text.split('\n')) {
    const [levelStr, ...rest] = line.split(':')
    const level = levelStr.trim()
    const spells = rest.join(':').split(',').map(s => s.trim()).filter(Boolean)
    if (level && spells.length) result[level] = spells
  }
  return Object.keys(result).length ? result : null
}

async function uploadImg(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploading.value = true
  uploadErr.value = ''
  try {
    const form = new FormData()
    form.append('image', file)
    const base = import.meta.env.VITE_API_URL ?? ''
    const res = await fetch(`${base}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${props.token}` },
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '上传失败')
    f.image = `${base || window.location.origin}${data.url}`
  } catch (err) {
    uploadErr.value = err.message
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

function save() {
  const data = JSON.parse(JSON.stringify(f))
  data.level1Features = (data.allFeatures || [])
    .filter(feat => (feat.level ?? 1) === 1)
    .map(({ level, ...rest }) => rest)
  data.notableFeatures = (data.allFeatures || [])
    .filter(feat => (feat.level ?? 1) !== 1)
  delete data.allFeatures
  emit('save', data)
}
</script>

<style scoped src="./form.css" />
<style scoped>
.section-hint {
  font-size: 0.62rem;
  color: rgba(201,168,76,0.38);
  font-weight: normal;
  margin-left: 8px;
  font-style: italic;
  letter-spacing: 0.05em;
  text-transform: none;
}

.toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  color: var(--text-muted, #9A8868);
  font-weight: normal;
  cursor: pointer;
  margin-left: 12px;
  letter-spacing: 0.08em;
  font-family: var(--font-title, 'Cinzel', serif);
}
.no-spell-hint {
  font-size: 0.82rem;
  color: var(--text-muted, #9A8868);
  margin: 4px 0;
  font-style: italic;
}

/* ── 子职业卡片 ── */
.subclass-list { display: flex; flex-direction: column; gap: 14px; }

.subclass-card {
  border: 1px solid rgba(201,168,76,0.16);
  border-radius: 3px;
  overflow: hidden;
  background: rgba(0,0,0,0.18);
}

.subclass-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 16px;
  background: linear-gradient(90deg, rgba(201,168,76,0.07) 0%, transparent 100%);
  border-bottom: 1px solid rgba(201,168,76,0.1);
}

.subclass-num {
  font-size: 0.68rem;
  font-family: var(--font-title, 'Cinzel', serif);
  color: var(--gold, #C9A84C);
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.btn-del-sub {
  padding: 4px 11px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid rgba(140,50,30,0.38);
  color: #B06850;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-del-sub:hover { background: rgba(140,50,30,0.14); color: #D09070; }

.subclass-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: none;
  overflow: visible;
}

.subclass-features { display: flex; flex-direction: column; gap: 8px; }

.sub-feat-title {
  font-size: 0.62rem;
  font-family: var(--font-title, 'Cinzel', serif);
  color: rgba(201,168,76,0.45);
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.btn-add-sub {
  padding: 10px 0;
  border-radius: 3px;
  width: 100%;
  background: transparent;
  border: 1px dashed rgba(201,168,76,0.18);
  color: rgba(201,168,76,0.38);
  cursor: pointer;
  font-size: 0.72rem;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.btn-add-sub:hover {
  background: rgba(201,168,76,0.05);
  color: var(--gold, #C9A84C);
  border-color: rgba(201,168,76,0.38);
}

/* ── 图片上传 ── */
.img-upload-area { display: flex; gap: 16px; align-items: flex-start; }
.img-preview {
  width: 80px;
  height: 80px;
  border-radius: 3px;
  object-fit: cover;
  border: 1px solid rgba(201,168,76,0.2);
  flex-shrink: 0;
}
.upload-right { display: flex; flex-direction: column; gap: 7px; flex: 1; }
.btn-upload-img {
  display: inline-block;
  padding: 7px 14px;
  border-radius: 3px;
  background: transparent;
  border: 1px solid rgba(201,168,76,0.28);
  color: var(--gold, #C9A84C);
  cursor: pointer;
  font-size: 0.72rem;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  width: fit-content;
  transition: background 0.2s;
}
.btn-upload-img:hover { background: rgba(201,168,76,0.08); }
.upload-status { font-size: 0.78rem; color: var(--text-muted, #9A8868); font-style: italic; }
.upload-err    { font-size: 0.78rem; color: #C07060; font-style: italic; }
.upload-hint   { font-size: 0.72rem; color: var(--text-muted, #9A8868); margin: 0; }
</style>
