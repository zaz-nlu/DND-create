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
          <input v-model="f.id" :disabled="!isNew" />
          <span class="field-hint" v-if="!isNew">ID 创建后不可修改</span>
        </field>
        <field label="颜色">
          <div class="color-row">
            <input type="color" v-model="f.color" />
            <input v-model="f.color" style="flex:1" />
          </div>
        </field>
        <field label="名称（中文）"><input v-model="f.name" placeholder="阿斯莫" /></field>
        <field label="名称（英文）"><input v-model="f.nameEn" placeholder="Aasimar" /></field>
        <field label="种族类型"><input v-model="f.type" placeholder="类人" /></field>
        <field label="体型">
          <input v-model="f.size" placeholder="中型或小型" />
        </field>
        <field label="移动速度（尺）">
          <input type="number" v-model.number="f.speed" min="0" max="100" />
        </field>
        <field label="寿命（年）">
          <input type="number" v-model.number="f.lifespan" min="1" />
        </field>
        <field label="简介" full>
          <textarea v-model="f.lore" rows="2" placeholder="一句话简介…" />
        </field>
        <field label="详细背景故事" full>
          <textarea v-model="f.fullLore" rows="6" placeholder="完整种族故事…" />
        </field>
        <field label="体型选项（可选多项）" full>
          <TagInput v-model="f.sizeOptions" placeholder="如：中型（约 4–7 尺高）" />
        </field>
      </div>
    </section>

    <!-- 图片 -->
    <section class="form-section">
      <h3>🖼 种族图片</h3>
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

    <!-- 机械数据 -->
    <section class="form-section">
      <h3>⚙️ 机械属性</h3>
      <div class="field-grid">
        <field label="速度（尺）">
          <input type="number" v-model.number="f.mechanics.speed" min="0" />
        </field>
        <field label="黑暗视觉（尺，0=无）">
          <input type="number" v-model.number="f.mechanics.darkvision" min="0" />
        </field>
        <field label="每级 HP 加值">
          <input type="number" v-model.number="f.mechanics.hpBonusPerLevel" min="0" />
        </field>
        <field label="伤害抗性" full>
          <TagInput v-model="f.mechanics.damageResistances" placeholder="如：光耀 Radiant" />
        </field>
        <field label="豁免优势" full>
          <TagInput v-model="f.mechanics.savingThrowAdvantages" placeholder="如：中毒状态豁免具有优势" />
        </field>
        <field label="已知戏法（展示用文本）" full>
          <TagInput v-model="f.mechanics.cantrips" placeholder="如：光亮术 Light（魅力）" />
          <span class="field-hint">仅用于卷轴展示，法术引擎请在下方「种族法术」区配置</span>
        </field>
        <field label="语言" full>
          <TagInput v-model="f.mechanics.languages" placeholder="如：通用语" />
        </field>
      </div>
    </section>

    <!-- 技能熟练（可选） -->
    <section class="form-section">
      <h3>🎯 技能熟练（可选）</h3>
      <div class="field-grid">
        <field label="启用种族技能选择" full>
          <label class="toggle-row">
            <input type="checkbox" :checked="!!f.skillProficiency" @change="toggleSkillProf" />
            <span>该种族可从特定技能池中选择熟练（如精灵选洞悉/察觉/求生）</span>
          </label>
        </field>
        <template v-if="f.skillProficiency">
          <field label="可选技能数量">
            <input type="number" v-model.number="f.skillProficiency.choose" min="1" max="3" />
          </field>
          <field label="可选技能池" full>
            <TagInput v-model="f.skillProficiency.options" placeholder="如：洞悉、察觉、求生" />
          </field>
        </template>
      </div>
    </section>

    <!-- ★ 种族法术（引擎用） -->
    <section class="form-section">
      <h3>✨ 种族法术
        <span class="section-hint">这里配置的法术会真正进入角色引擎（法术页显示、角色卡展示）</span>
      </h3>

      <!-- 施法属性 -->
      <div class="field-grid" style="margin-bottom:14px">
        <field label="施法属性（可多选，让玩家三选一）" full>
          <div class="ability-check-row">
            <label v-for="ab in ABILITIES" :key="ab" class="ability-check">
              <input
                type="checkbox"
                :checked="f.spellcastingAbilityChoice.includes(ab)"
                @change="toggleAbilityChoice(ab)"
              />
              {{ ab }}
            </label>
          </div>
          <span class="field-hint">
            选 1 个 = 固定施法属性；选多个 = 让玩家在创角时选一个；不选 = 该种族无施法属性
          </span>
        </field>
      </div>

      <!-- 固定戏法 -->
      <div class="race-spell-block">
        <div class="race-spell-block-title">
          固定戏法
          <span class="block-hint">所有该种族角色都自动获得，不占职业戏法上限</span>
        </div>
        <div
          v-for="(entry, i) in f.raceSpells.cantrips"
          :key="i"
          class="race-spell-row"
        >
          <div class="spell-select-wrap">
            <input
              :value="entry.baseId"
              list="spell-datalist"
              placeholder="输入法术英文名或中文名搜索…"
              class="spell-input"
              @input="entry.baseId = slugify($event.target.value)"
              @change="onSpellInputChange($event, entry)"
            />
            <span v-if="spellLabel(entry.baseId)" class="spell-resolved">{{ spellLabel(entry.baseId) }}</span>
          </div>
          <select v-model="entry.ability" class="ability-select">
            <option value="">用施法属性</option>
            <option v-for="ab in ABILITIES" :key="ab" :value="ab">{{ ab }}</option>
          </select>
          <button class="btn-del-row" @click="f.raceSpells.cantrips.splice(i, 1)" title="删除">✕</button>
        </div>
        <button class="btn-add-row" @click="addCantrip">+ 添加固定戏法</button>
      </div>

      <!-- 按等级解锁法术 -->
      <div class="race-spell-block" style="margin-top:14px">
        <div class="race-spell-block-title">
          按等级解锁法术
          <span class="block-hint">达到指定等级后自动出现在角色卡，每次长休后可施放一次（不消耗法术位）</span>
        </div>
        <div
          v-for="(entry, i) in f.raceSpells.leveled"
          :key="i"
          class="race-spell-row"
        >
          <div class="spell-select-wrap">
            <input
              :value="entry.baseId"
              list="spell-datalist"
              placeholder="输入法术名搜索…"
              class="spell-input"
              @input="entry.baseId = slugify($event.target.value)"
              @change="onSpellInputChange($event, entry)"
            />
            <span v-if="spellLabel(entry.baseId)" class="spell-resolved">{{ spellLabel(entry.baseId) }}</span>
          </div>
          <div class="level-select-wrap">
            <label class="level-label">解锁等级</label>
            <input
              type="number"
              v-model.number="entry.level"
              min="1"
              max="20"
              class="level-input"
            />
          </div>
          <button class="btn-del-row" @click="f.raceSpells.leveled.splice(i, 1)" title="删除">✕</button>
        </div>
        <button class="btn-add-row" @click="addLeveledSpell">+ 添加按等级法术</button>
      </div>

      <!-- 法术 datalist（浏览器原生下拉提示） -->
      <datalist id="spell-datalist">
        <option
          v-for="s in uniqueSpells"
          :key="s.baseId"
          :value="s.baseId"
          :label="`${s.name} ${s.nameEn}`"
        />
      </datalist>
    </section>

    <!-- 种族特性 -->
    <section class="form-section">
      <h3>📋 种族特性</h3>
      <FeatureListEditor v-model="f.traits" />
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import TagInput from './TagInput.vue'
import FeatureListEditor from './FeatureListEditor.vue'
import Field from './Field.vue'
import { spells } from '../../data/spells.js'

const ABILITIES = ['力量', '敏捷', '体质', '智力', '感知', '魅力']

const props = defineProps({
  data:         { type: Object, required: true },
  isNew:        { type: Boolean, default: false },
  canRevert:    { type: Boolean, default: false },
  isPureCustom: { type: Boolean, default: false },
  saving:       { type: Boolean, default: false },
  token:        { type: String, default: '' },
})
const emit = defineEmits(['save', 'revert', 'cancel'])

const uploading = ref(false)
const uploadErr = ref('')

// ── 法术数据（去重，按 baseId）────────────────────────────────────────────────
const uniqueSpells = computed(() => {
  const map = new Map()
  for (const s of spells) {
    if (!map.has(s.baseId)) map.set(s.baseId, { baseId: s.baseId, name: s.name, nameEn: s.nameEn, level: s.level })
  }
  return [...map.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'zh-Hans-CN'))
})

const spellByBaseId = computed(() => {
  const m = new Map()
  for (const s of uniqueSpells.value) m.set(s.baseId, s)
  return m
})

function spellLabel(baseId) {
  if (!baseId) return ''
  const s = spellByBaseId.value.get(baseId)
  if (!s) return ''
  return `${s.name}（${s.nameEn}）· ${s.level === 0 ? '戏法' : s.level + '环'}`
}

// 把中文/英文名转为 baseId（如果用户直接选了 datalist 就用 value，否则尝试搜索）
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function onSpellInputChange(e, entry) {
  const raw = e.target.value.trim()
  // 如果直接输入了 baseId（已在 datalist 中），直接用
  if (spellByBaseId.value.has(raw)) {
    entry.baseId = raw
    return
  }
  // 尝试按中文名 / 英文名匹配
  const lower = raw.toLowerCase()
  const found = uniqueSpells.value.find(s =>
    s.name.includes(raw) ||
    s.nameEn.toLowerCase().includes(lower) ||
    s.baseId === slugify(raw)
  )
  if (found) entry.baseId = found.baseId
  else entry.baseId = slugify(raw)
}

// ── 表单数据 ──────────────────────────────────────────────────────────────────
const raw = JSON.parse(JSON.stringify(props.data))

const f = reactive({
  id: '', name: '', nameEn: '', lore: '', fullLore: '',
  type: '类人', size: '中型', speed: 30, lifespan: 100, color: '#888888', image: '',
  sizeOptions: [],
  skillProficiency: null,
  mechanics: { speed: 30, darkvision: 0, hpBonusPerLevel: 0, damageResistances: [], savingThrowAdvantages: [], cantrips: [], languages: [] },
  traits: [],
  spellcastingAbilityChoice: [],
  raceSpells: { cantrips: [], leveled: [] },
  ...raw,
})

// 补全缺失字段（兼容旧数据）
if (!f.mechanics) f.mechanics = { speed: 30, darkvision: 0, hpBonusPerLevel: 0, damageResistances: [], savingThrowAdvantages: [], cantrips: [], languages: [] }
if (!f.mechanics.damageResistances)     f.mechanics.damageResistances = []
if (!f.mechanics.savingThrowAdvantages) f.mechanics.savingThrowAdvantages = []
if (!f.mechanics.cantrips)              f.mechanics.cantrips = []
if (!f.mechanics.languages)             f.mechanics.languages = []
if (!f.sizeOptions)                     f.sizeOptions = []
if (!f.traits)                          f.traits = []
if (!f.spellcastingAbilityChoice)       f.spellcastingAbilityChoice = []
if (!f.raceSpells)                      f.raceSpells = { cantrips: [], leveled: [] }
if (!f.raceSpells.cantrips)             f.raceSpells.cantrips = []
if (!f.raceSpells.leveled)              f.raceSpells.leveled = []

// ── 操作函数 ──────────────────────────────────────────────────────────────────
function toggleSkillProf(e) {
  f.skillProficiency = e.target.checked ? { choose: 1, options: [] } : null
}

function toggleAbilityChoice(ab) {
  const idx = f.spellcastingAbilityChoice.indexOf(ab)
  if (idx >= 0) f.spellcastingAbilityChoice.splice(idx, 1)
  else f.spellcastingAbilityChoice.push(ab)
}

function addCantrip() {
  f.raceSpells.cantrips.push({ baseId: '', ability: '' })
}

function addLeveledSpell() {
  f.raceSpells.leveled.push({ baseId: '', level: 3 })
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

const errors = ref([])

function validate() {
  const errs = []
  if (!f.id?.trim())   errs.push('ID 不能为空')
  if (!f.name?.trim()) errs.push('名称（中文）不能为空')
  if (!f.nameEn?.trim()) errs.push('名称（英文）不能为空')
  if (!f.speed || f.speed <= 0) errs.push('移动速度必须大于 0')
  if (!Array.isArray(f.mechanics?.languages) || f.mechanics.languages.length === 0)
    errs.push('至少填写 1 种语言（通用语）')
  // raceSpells 戏法/法术不能有空 baseId
  const badCantrip = (f.raceSpells?.cantrips ?? []).some(c => !c.baseId?.trim())
  const badLeveled = (f.raceSpells?.leveled  ?? []).some(c => !c.baseId?.trim())
  if (badCantrip || badLeveled) errs.push('种族法术中有未填写法术名的条目，请删除或填写完整')
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
.img-upload-area { display: flex; gap: 16px; align-items: flex-start; }
.img-preview { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.15); flex-shrink: 0; }
.upload-right { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.btn-upload-img {
  display: inline-block; padding: 7px 14px; border-radius: 6px;
  background: rgba(60,100,180,0.25); border: 1px solid rgba(100,150,230,0.4);
  color: #90b8f0; cursor: pointer; font-size: 0.85rem; width: fit-content;
}
.upload-status { font-size: 0.8rem; color: #a0a0a0; }
.upload-err    { font-size: 0.8rem; color: #e94560; }
.upload-hint   { font-size: 0.78rem; color: #6050a0; margin: 0; }

.toggle-row {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; font-size: 0.85rem; color: #aaa;
}
.toggle-row input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }

/* 施法属性多选 */
.ability-check-row {
  display: flex; flex-wrap: wrap; gap: 10px;
}
.ability-check {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.85rem; color: #c9a84c; cursor: pointer;
}
.ability-check input { width: 14px; height: 14px; cursor: pointer; accent-color: #c9a84c; }

/* 种族法术区块 */
.race-spell-block {
  border: 1px solid rgba(201,168,76,0.14);
  border-radius: 4px;
  padding: 12px 14px;
  background: rgba(0,0,0,0.12);
}

.race-spell-block-title {
  font-family: var(--font-title, 'Cinzel', serif);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(201,168,76,0.7);
  margin-bottom: 10px;
}

.block-hint {
  font-family: var(--font-body, 'Crimson Pro', serif);
  font-size: 0.72rem;
  color: var(--text-muted, #9A8868);
  font-weight: normal;
  letter-spacing: 0;
  text-transform: none;
  margin-left: 8px;
}

.race-spell-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px; flex-wrap: wrap;
}

.spell-select-wrap {
  flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 3px;
}

.spell-input {
  width: 100%; padding: 6px 10px; border-radius: 3px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(201,168,76,0.22);
  color: var(--text, #EAD9C1); font-size: 0.85rem;
}
.spell-input:focus { outline: none; border-color: rgba(201,168,76,0.55); }

.spell-resolved {
  font-size: 0.72rem; color: rgba(201,168,76,0.7); padding-left: 2px;
}

.ability-select {
  padding: 6px 8px; border-radius: 3px; min-width: 110px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(201,168,76,0.22);
  color: var(--text, #EAD9C1); font-size: 0.82rem;
}

.level-select-wrap {
  display: flex; align-items: center; gap: 5px; flex-shrink: 0;
}

.level-label {
  font-size: 0.78rem; color: var(--text-muted, #9A8868); white-space: nowrap;
}

.level-input {
  width: 58px; padding: 6px 8px; border-radius: 3px; text-align: center;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(201,168,76,0.22);
  color: var(--text, #EAD9C1); font-size: 0.85rem;
}

.btn-del-row {
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 3px;
  background: transparent; border: 1px solid rgba(140,50,30,0.35);
  color: #B06850; cursor: pointer; font-size: 0.85rem; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.btn-del-row:hover { background: rgba(140,50,30,0.15); color: #D09070; }

.btn-add-row {
  margin-top: 6px; padding: 6px 14px; border-radius: 3px;
  background: transparent; border: 1px dashed rgba(201,168,76,0.25);
  color: rgba(201,168,76,0.5); font-size: 0.75rem;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.1em; cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.btn-add-row:hover {
  background: rgba(201,168,76,0.06);
  color: var(--gold, #C9A84C);
  border-color: rgba(201,168,76,0.45);
}

.section-hint {
  font-size: 0.62rem; color: rgba(201,168,76,0.38);
  font-weight: normal; margin-left: 8px; font-style: italic;
  letter-spacing: 0.05em; text-transform: none;
  font-family: var(--font-body, 'Crimson Pro', serif);
}

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
.form-errors li::before { content: '✕  '; opacity: 0.7; }
</style>
