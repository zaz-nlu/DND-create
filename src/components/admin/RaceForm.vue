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
        <field label="已知戏法" full>
          <TagInput v-model="f.mechanics.cantrips" placeholder="如：光亮术 Light（魅力）" />
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

    <!-- 种族特性 -->
    <section class="form-section">
      <h3>✨ 种族特性</h3>
      <FeatureListEditor v-model="f.traits" />
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import TagInput from './TagInput.vue'
import FeatureListEditor from './FeatureListEditor.vue'
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

const uploading = ref(false)
const uploadErr = ref('')

const f = reactive({
  id: '', name: '', nameEn: '', lore: '', fullLore: '',
  type: '类人', size: '中型', speed: 30, lifespan: 100, color: '#888888', image: '',
  sizeOptions: [],
  skillProficiency: null,
  mechanics: { speed: 30, darkvision: 0, hpBonusPerLevel: 0, damageResistances: [], savingThrowAdvantages: [], cantrips: [], languages: [] },
  traits: [],
  ...JSON.parse(JSON.stringify(props.data)),
})

if (!f.mechanics) f.mechanics = { speed: 30, darkvision: 0, hpBonusPerLevel: 0, damageResistances: [], savingThrowAdvantages: [], cantrips: [], languages: [] }
if (!f.mechanics.damageResistances)     f.mechanics.damageResistances = []
if (!f.mechanics.savingThrowAdvantages) f.mechanics.savingThrowAdvantages = []
if (!f.mechanics.cantrips)              f.mechanics.cantrips = []
if (!f.mechanics.languages)             f.mechanics.languages = []
if (!f.sizeOptions)                     f.sizeOptions = []
if (!f.traits)                          f.traits = []

function toggleSkillProf(e) {
  f.skillProficiency = e.target.checked ? { choose: 1, options: [] } : null
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

function save() { emit('save', JSON.parse(JSON.stringify(f))) }
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
</style>
