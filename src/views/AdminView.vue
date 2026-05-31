<template>
  <div class="admin-wrap">
    <!-- 登录界面 -->
    <div v-if="!token" class="login-box">
      <h1>⚔ DnD 数据管理后台</h1>
      <p class="login-hint">首次登录密码为 <code>admin123</code>，请登录后立即修改</p>
      <input
        v-model="passwordInput"
        type="password"
        placeholder="输入管理员密码"
        @keyup.enter="doLogin"
      />
      <button @click="doLogin" :disabled="loggingIn">
        {{ loggingIn ? '登录中…' : '登录' }}
      </button>
      <p v-if="loginError" class="error">{{ loginError }}</p>
    </div>

    <!-- 管理后台主界面 -->
    <div v-else class="dashboard">
      <header class="dash-header">
        <h1>⚔ DnD 数据管理</h1>
        <div class="header-actions">
          <button class="btn-sm" @click="showChangePwd = !showChangePwd">修改密码</button>
          <button class="btn-sm danger" @click="logout">退出登录</button>
        </div>
      </header>

      <!-- 修改密码面板 -->
      <div v-if="showChangePwd" class="change-pwd-box">
        <input v-model="newPwd" type="password" placeholder="新密码（至少 6 位）" />
        <button @click="doChangePwd">确认修改</button>
        <span v-if="pwdMsg" :class="pwdMsg.ok ? 'ok' : 'error'">{{ pwdMsg.text }}</span>
      </div>

      <!-- 数据类型标签 -->
      <div class="tabs">
        <button
          v-for="t in dataTypes"
          :key="t.key"
          :class="['tab', { active: activeTab === t.key }]"
          @click="switchTab(t.key)"
        >
          {{ t.label }}
          <span class="badge">{{ overrideCount(t.key) }}</span>
        </button>
      </div>

      <div class="content">
        <!-- 左侧列表 -->
        <aside class="item-list">
          <div class="list-header">
            <span>{{ currentType.label }}列表</span>
            <button class="btn-sm" @click="startNew">+ 新增</button>
          </div>
          <div
            v-for="item in currentList"
            :key="item.id"
            :class="['list-item', { selected: selected?.id === item.id, overridden: item._overridden }]"
            @click="selectItem(item)"
          >
            <span class="item-name">{{ item.name }}</span>
            <span v-if="isPureCustom(item.id)" class="tag pure">新增</span>
            <span v-else-if="item._overridden" class="tag custom">已改</span>
            <span v-else class="tag default">默认</span>
          </div>
        </aside>

        <!-- 右侧编辑器（表单化） -->
        <main class="editor-panel" v-if="selected">
          <BackgroundForm
            v-if="activeTab === 'background'"
            :key="formKey"
            :data="selected"
            :is-new="isNew"
            :can-revert="!isNew && selected._overridden"
            :is-pure-custom="!isNew && isPureCustom(selected.id)"
            :saving="saving"
            @save="saveItem"
            @revert="revertItem"
            @cancel="selected = null"
          />
          <RaceForm
            v-else-if="activeTab === 'race'"
            :key="formKey"
            :data="selected"
            :is-new="isNew"
            :can-revert="!isNew && selected._overridden"
            :is-pure-custom="!isNew && isPureCustom(selected.id)"
            :saving="saving"
            :token="token"
            @save="saveItem"
            @revert="revertItem"
            @cancel="selected = null"
          />
          <ClassForm
            v-else-if="activeTab === 'class'"
            :key="formKey"
            :data="selected"
            :is-new="isNew"
            :can-revert="!isNew && selected._overridden"
            :is-pure-custom="!isNew && isPureCustom(selected.id)"
            :saving="saving"
            :token="token"
            @save="saveItem"
            @revert="revertItem"
            @cancel="selected = null"
          />
        </main>

        <main class="editor-panel placeholder" v-else>
          <p>← 从左侧选择一条数据开始编辑，或点击「新增」</p>
        </main>
      </div>

      <div v-if="saveMsg" :class="['save-toast', saveMsg.ok ? 'ok' : 'error']">
        {{ saveMsg.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { hardcodedRaces } from '../data/races.js'
import { hardcodedBackgrounds } from '../data/backgrounds.js'
import { builtinClasses } from '../data/classes.js'
import {
  adminLogin, adminSave, adminDelete, adminChangePassword,
  fetchRaceOverrides, fetchBackgroundOverrides, fetchClassOverrides,
} from '../api/gameData.js'
import BackgroundForm from '../components/admin/BackgroundForm.vue'
import RaceForm       from '../components/admin/RaceForm.vue'
import ClassForm      from '../components/admin/ClassForm.vue'

// ─── 认证 ────────────────────────────────────────────────────────────────────
const token = ref(localStorage.getItem('dnd_admin_token') || '')
const passwordInput = ref('')
const loggingIn = ref(false)
const loginError = ref('')

async function doLogin() {
  loggingIn.value = true
  loginError.value = ''
  try {
    token.value = await adminLogin(passwordInput.value)
    localStorage.setItem('dnd_admin_token', token.value)
    passwordInput.value = ''
    await loadOverrides()
  } catch (e) {
    loginError.value = e.message
  } finally {
    loggingIn.value = false
  }
}

function logout() {
  token.value = ''
  localStorage.removeItem('dnd_admin_token')
}

// ─── 修改密码 ────────────────────────────────────────────────────────────────
const showChangePwd = ref(false)
const newPwd = ref('')
const pwdMsg = ref(null)

async function doChangePwd() {
  try {
    await adminChangePassword(newPwd.value, token.value)
    pwdMsg.value = { ok: true, text: '密码已修改！' }
    newPwd.value = ''
  } catch (e) {
    pwdMsg.value = { ok: false, text: e.message }
  }
}

// ─── 数据 ────────────────────────────────────────────────────────────────────
const dataTypes = [
  { key: 'race',       label: '种族', hardcoded: hardcodedRaces,      fetcher: fetchRaceOverrides },
  { key: 'background', label: '背景', hardcoded: hardcodedBackgrounds, fetcher: fetchBackgroundOverrides },
  { key: 'class',      label: '职业', hardcoded: builtinClasses,       fetcher: fetchClassOverrides },
]

const activeTab = ref('race')
const overrides = ref({ race: [], background: [], class: [] })
const selected  = ref(null)
const isNew     = ref(false)
const saving    = ref(false)
const saveMsg   = ref(null)
const formKey   = ref(0)  // 切换条目时强制重建表单

const currentType = computed(() => dataTypes.find(t => t.key === activeTab.value))

const currentList = computed(() => {
  const type = activeTab.value
  const overrideMap = Object.fromEntries(overrides.value[type].map(o => [o.id, o]))
  const hardcoded = currentType.value.hardcoded

  // 默认条目（含覆盖标记）
  const list = hardcoded.map(item => {
    const override = overrideMap[item.id] || {}
    const merged = { ...item, ...override, _overridden: !!overrideMap[item.id] }
    // 关键数组字段：若数据库覆盖把 subclasses/traits 等清空了，回退到内置数据
    if (!merged.subclasses?.length  && item.subclasses?.length)  merged.subclasses  = item.subclasses
    if (!merged.traits?.length      && item.traits?.length)       merged.traits       = item.traits
    if (!merged.level1Features?.length && item.level1Features?.length) merged.level1Features = item.level1Features
    if (!merged.notableFeatures?.length && item.notableFeatures?.length) merged.notableFeatures = item.notableFeatures
    return merged
  })

  // 纯自定义条目（不在默认列表里）
  for (const o of overrides.value[type]) {
    if (!hardcoded.find(h => h.id === o.id)) {
      list.push({ ...o, _overridden: true })
    }
  }
  return list
})

function overrideCount(type) {
  return overrides.value[type].length
}

async function loadOverrides() {
  for (const t of dataTypes) {
    try {
      overrides.value[t.key] = await t.fetcher()
    } catch {
      overrides.value[t.key] = []
    }
  }
}

if (token.value) loadOverrides()

function switchTab(key) {
  activeTab.value = key
  selected.value = null
}

function selectItem(item) {
  isNew.value = false
  selected.value = item
  formKey.value++
}

function startNew() {
  isNew.value = true
  const ts = Date.now()
  const templates = {
    race:       { id: `custom-race-${ts}`, name: '新种族', nameEn: 'New Race', color: '#888888', image: '', lore: '', fullLore: '', type: '类人', size: '中型', speed: 30, lifespan: 100, sizeOptions: [], mechanics: { speed: 30, darkvision: 0, hpBonusPerLevel: 0, damageResistances: [], cantrips: [], languages: ['通用语'] }, traits: [] },
    background: { id: `custom-bg-${ts}`, name: '新背景', nameEn: 'New Background', color: '#888888', lore: '', fullLore: '', abilityScores: ['力量', '敏捷', '魅力'], feat: { name: '', nameEn: '' }, skills: [], tools: [], equipment: { a: '', b: '50 GP' } },
    class:      { id: `custom-class-${ts}`, name: '新职业', nameEn: 'New Class', tagline: '', color: '#888888', image: '', lore: '', fullLore: '', primaryAbility: '力量', hitDie: 'd8', spellcastingAbility: '', spellList: '', subclassLevel: 3, saves: ['力量', '体质'], weapons: [], armor: [], tools: [], skillChoices: { count: 2, options: [] }, equipment: { a: '', b: '50 GP' }, level1Features: [], spellcastingProgression: null, subclasses: [] },
  }
  selected.value = templates[activeTab.value]
  formKey.value++
}

// 判断条目是不是纯自定义（不存在于默认数据里）
function isPureCustom(id) {
  return !currentType.value.hardcoded.find(item => item.id === id)
}

// 深度合并：用 formData 覆盖 original，但保留 original 中 formData 没有的字段
function deepMerge(original, formData) {
  if (Array.isArray(formData)) return formData  // 数组完全替换，不合并
  if (typeof formData !== 'object' || formData === null) return formData
  const result = { ...original }
  for (const key of Object.keys(formData)) {
    const orig = original?.[key]
    const next = formData[key]
    if (orig && typeof orig === 'object' && !Array.isArray(orig) &&
        next && typeof next === 'object' && !Array.isArray(next)) {
      result[key] = deepMerge(orig, next)
    } else {
      result[key] = next
    }
  }
  return result
}

async function saveItem(formData) {
  if (!formData?.id) { showToast({ ok: false, text: '缺少 ID 字段' }); return }
  // 把原始默认数据里的隐藏字段（progression、alwaysPrepared、pactMagicProgression 等）
  // 合并进 formData，避免编辑后丢失
  const original = currentType.value.hardcoded.find(item => item.id === formData.id) || {}
  const merged = deepMerge(original, formData)
  saving.value = true
  try {
    await adminSave(activeTab.value, merged.id, merged, token.value)
    await loadOverrides()
    showToast({ ok: true, text: '已保存！' })
    const saved = currentList.value.find(i => i.id === merged.id)
    if (saved) selectItem(saved)
  } catch (e) {
    if (e.message.includes('401')) { logout(); return }
    showToast({ ok: false, text: e.message })
  } finally {
    saving.value = false
  }
}

async function revertItem() {
  const pureCustom = isPureCustom(selected.value.id)
  const prompt = pureCustom
    ? `确定彻底删除自定义条目「${selected.value.name}」吗？此操作无法撤销！`
    : `确定恢复「${selected.value.name}」为默认数据吗？`
  if (!confirm(prompt)) return
  try {
    await adminDelete(activeTab.value, selected.value.id, token.value)
    await loadOverrides()
    showToast({ ok: true, text: pureCustom ? '已删除！' : '已恢复默认！' })
    selected.value = null
  } catch (e) {
    if (e.message.includes('401')) { logout(); return }
    showToast({ ok: false, text: e.message })
  }
}

function showToast(msg) {
  saveMsg.value = msg
  setTimeout(() => { saveMsg.value = null }, 3000)
}
</script>

<style scoped>
* { box-sizing: border-box; }

.admin-wrap {
  min-height: 100vh;
  background: #1a1a2e;
  color: #e0e0e0;
  font-family: 'Segoe UI', sans-serif;
}

/* 登录 */
.login-box {
  max-width: 400px;
  margin: 120px auto;
  padding: 40px;
  background: #16213e;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.login-box h1 { margin-bottom: 8px; font-size: 1.5rem; }
.login-hint { color: #888; font-size: 0.85rem; margin-bottom: 20px; }
.login-box input {
  width: 100%; padding: 12px; margin-bottom: 12px;
  background: #0f3460; border: 1px solid #444; border-radius: 8px;
  color: #fff; font-size: 1rem;
}
.login-box button {
  width: 100%; padding: 12px;
  background: #e94560; border: none; border-radius: 8px;
  color: #fff; font-size: 1rem; cursor: pointer;
}
.login-box button:disabled { opacity: 0.6; }

/* 仪表板 */
.dashboard { display: flex; flex-direction: column; height: 100vh; }

.dash-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px;
  background: #16213e;
  border-bottom: 1px solid #333;
}
.dash-header h1 { margin: 0; font-size: 1.2rem; }
.header-actions { display: flex; gap: 8px; }

.change-pwd-box {
  padding: 12px 24px;
  background: #0f3460;
  display: flex; align-items: center; gap: 10px;
}
.change-pwd-box input {
  padding: 8px 12px; border-radius: 6px;
  background: #1a1a2e; border: 1px solid #555; color: #fff;
}
.change-pwd-box button {
  padding: 8px 16px; border-radius: 6px;
  background: #e94560; border: none; color: #fff; cursor: pointer;
}

/* 标签 */
.tabs {
  display: flex; gap: 4px;
  padding: 12px 24px;
  background: #16213e;
  border-bottom: 1px solid #333;
}
.tab {
  padding: 8px 20px; border-radius: 6px;
  background: transparent; border: 1px solid #444;
  color: #aaa; cursor: pointer; font-size: 0.95rem;
  display: flex; align-items: center; gap: 6px;
}
.tab.active { background: #e94560; border-color: #e94560; color: #fff; }
.badge {
  background: rgba(255,255,255,0.2); border-radius: 10px;
  padding: 1px 7px; font-size: 0.75rem;
}

/* 内容区 */
.content {
  display: flex; flex: 1; overflow: hidden;
}

/* 左侧列表 */
.item-list {
  width: 240px; min-width: 200px;
  background: #16213e;
  border-right: 1px solid #333;
  overflow-y: auto;
  display: flex; flex-direction: column;
}
.list-header {
  padding: 12px 16px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #333;
  font-weight: 600; font-size: 0.9rem;
}
.list-item {
  padding: 10px 16px; cursor: pointer;
  border-bottom: 1px solid #222;
  display: flex; align-items: center; justify-content: space-between;
  transition: background 0.15s;
}
.list-item:hover { background: #0f3460; }
.list-item.selected { background: #0f3460; border-left: 3px solid #e94560; }
.item-name { font-size: 0.9rem; }
.tag {
  font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;
}
.tag.default { background: #333; color: #888; }
.tag.custom { background: #e94560; color: #fff; }
.tag.pure   { background: #4caf50; color: #fff; }

/* 编辑器 */
.editor-panel {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
  padding: 0;
}
.editor-panel.placeholder {
  justify-content: center; align-items: center;
  color: #555; font-size: 1.1rem;
}
.editor-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #333;
  background: #1a1a2e;
}
.editor-header h2 { margin: 0; font-size: 1rem; }
.editor-actions { display: flex; gap: 8px; }
.editor-note {
  margin: 0; padding: 8px 20px;
  background: #0f3460;
  font-size: 0.8rem; color: #aaa;
}
/* 图片上传 */
.img-upload-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px;
  background: #0f1a30;
  border-bottom: 1px solid #1e2a40;
  flex-wrap: wrap;
}
.img-preview {
  width: 56px; height: 56px; border-radius: 8px;
  overflow: hidden; border: 1px solid #444; flex-shrink: 0;
}
.img-preview img { width: 100%; height: 100%; object-fit: cover; }
.btn-upload {
  padding: 8px 16px; border-radius: 6px;
  background: #1a3a5a; border: 1px solid #2a5a8a;
  color: #7ab8f0; cursor: pointer; font-size: 0.85rem;
  white-space: nowrap;
}
.btn-upload:hover { background: #1e4a70; }
.upload-hint { font-size: 0.78rem; color: #5a7a9a; }

.json-editor {
  flex: 1; resize: none;
  background: #0d0d1a; color: #a8d8a8;
  border: none; padding: 16px 20px;
  font-family: 'Consolas', 'Monaco', monospace; font-size: 0.85rem;
  line-height: 1.6; outline: none;
}

/* 按钮 */
.btn-sm {
  padding: 6px 14px; border-radius: 6px;
  background: #333; border: 1px solid #555;
  color: #ddd; cursor: pointer; font-size: 0.85rem;
}
.btn-sm:hover { background: #444; }
.btn-sm.danger { background: #5a1a1a; border-color: #e94560; color: #e94560; }
.btn-primary {
  padding: 8px 18px; border-radius: 6px;
  background: #4caf50; border: none;
  color: #fff; cursor: pointer; font-size: 0.9rem;
}
.btn-primary:disabled { opacity: 0.6; }
.btn-danger {
  padding: 8px 18px; border-radius: 6px;
  background: #5a1a1a; border: 1px solid #e94560;
  color: #e94560; cursor: pointer; font-size: 0.9rem;
}

/* 提示 */
.error { color: #e94560; font-size: 0.85rem; margin: 4px 0; }
.ok    { color: #4caf50; font-size: 0.85rem; }

.save-toast {
  position: fixed; bottom: 24px; right: 24px;
  padding: 12px 20px; border-radius: 8px;
  font-size: 0.95rem; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  animation: slideIn 0.3s ease;
}
.save-toast.ok    { background: #1b5e20; color: #a5d6a7; }
.save-toast.error { background: #5a1a1a; color: #ef9a9a; }

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

code { background: #333; padding: 1px 5px; border-radius: 3px; font-size: 0.85em; }
</style>
