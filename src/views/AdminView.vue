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

/* ══ 全局容器 ══════════════════════════════════════════════ */
.admin-wrap {
  min-height: 100vh;
  background: var(--bg, #0C0A17);
  color: var(--text, #EAD9C1);
  font-family: var(--font-body, 'Crimson Pro', Georgia, serif);
}

/* ══ 登录界面 ════════════════════════════════════════════════ */
.login-box {
  max-width: 420px;
  margin: 90px auto;
  padding: 52px 44px 44px;
  background: linear-gradient(160deg, #181430 0%, #0F0C22 100%);
  border: 1px solid rgba(201,168,76,0.22);
  border-radius: 4px;
  text-align: center;
  box-shadow: 0 0 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.05) inset;
  position: relative;
}
.login-box::before {
  content: '⚔';
  position: absolute;
  top: -20px; left: 50%; transform: translateX(-50%);
  font-size: 26px;
  color: var(--gold, #C9A84C);
  background: #0C0A17;
  padding: 0 18px;
  filter: drop-shadow(0 0 14px rgba(201,168,76,0.55));
}
.login-box h1 {
  font-family: var(--font-deco, 'Cinzel Decorative', serif);
  font-size: 1.45rem;
  color: var(--gold-bright, #F2DC98);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  text-shadow: 0 0 24px rgba(201,168,76,0.35);
}
.login-hint {
  color: var(--text-muted, #9A8868);
  font-size: 0.88rem;
  font-style: italic;
  margin-bottom: 28px;
  line-height: 1.6;
}
.login-box input {
  width: 100%;
  padding: 11px 16px;
  margin-bottom: 14px;
  background: rgba(0,0,0,0.45);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 3px;
  color: var(--text, #EAD9C1);
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.login-box input:focus {
  border-color: rgba(201,168,76,0.55);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.08);
}
.login-box button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #C9A84C, #E5C97A);
  border: none;
  border-radius: 3px;
  color: #1A0F05;
  font-size: 0.82rem;
  font-family: var(--font-title, 'Cinzel', serif);
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  cursor: pointer;
  transition: box-shadow 0.2s, opacity 0.2s;
}
.login-box button:hover { box-shadow: 0 0 22px rgba(201,168,76,0.4); }
.login-box button:disabled { opacity: 0.5; cursor: not-allowed; }

/* ══ 仪表板骨架 ═════════════════════════════════════════════ */
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: radial-gradient(ellipse at 80% 0%, rgba(80,40,160,0.07) 0%, transparent 55%), #0C0A17;
}

/* ══ 顶部标题栏 ══════════════════════════════════════════════ */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 24px;
  background: linear-gradient(90deg, #13102A 0%, #0F0C22 100%);
  border-bottom: 1px solid rgba(201,168,76,0.15);
  flex-shrink: 0;
}
.dash-header h1 {
  margin: 0;
  font-family: var(--font-deco, 'Cinzel Decorative', serif);
  font-size: 1rem;
  color: var(--gold, #C9A84C);
  letter-spacing: 0.12em;
  text-shadow: 0 0 18px rgba(201,168,76,0.3);
}
.header-actions { display: flex; gap: 8px; }

/* ══ 改密码面板 ══════════════════════════════════════════════ */
.change-pwd-box {
  padding: 10px 24px;
  background: rgba(201,168,76,0.04);
  border-bottom: 1px solid rgba(201,168,76,0.1);
  display: flex;
  align-items: center;
  gap: 10px;
}
.change-pwd-box input {
  padding: 7px 12px;
  border-radius: 3px;
  background: rgba(0,0,0,0.45);
  border: 1px solid rgba(201,168,76,0.2);
  color: var(--text, #EAD9C1);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}
.change-pwd-box input:focus { border-color: rgba(201,168,76,0.5); }
.change-pwd-box button {
  padding: 7px 16px;
  border-radius: 3px;
  background: linear-gradient(135deg, #C9A84C, #E5C97A);
  border: none;
  color: #1A0F05;
  font-family: var(--font-title, 'Cinzel', serif);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.change-pwd-box button:hover { box-shadow: 0 0 14px rgba(201,168,76,0.35); }

/* ══ 标签导航 ════════════════════════════════════════════════ */
.tabs {
  display: flex;
  padding: 0 24px;
  background: #13102A;
  border-bottom: 1px solid rgba(201,168,76,0.12);
  flex-shrink: 0;
  gap: 0;
}
.tab {
  padding: 10px 22px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted, #9A8868);
  cursor: pointer;
  font-size: 0.72rem;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 7px;
  transition: color 0.2s, border-color 0.2s;
  margin-bottom: -1px;
}
.tab:hover { color: var(--gold-light, #E5C97A); }
.tab.active {
  color: var(--gold-bright, #F2DC98);
  border-bottom-color: var(--gold, #C9A84C);
  text-shadow: 0 0 14px rgba(201,168,76,0.35);
}
.badge {
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 0.65rem;
  color: var(--text-muted, #9A8868);
  font-family: inherit;
  letter-spacing: 0.06em;
}
.tab.active .badge {
  background: rgba(201,168,76,0.18);
  color: var(--gold, #C9A84C);
  border-color: rgba(201,168,76,0.35);
}

/* ══ 内容区布局 ══════════════════════════════════════════════ */
.content { display: flex; flex: 1; overflow: hidden; }

/* ══ 左侧列表面板 ════════════════════════════════════════════ */
.item-list {
  width: 240px;
  min-width: 200px;
  background: linear-gradient(180deg, #13102A 0%, #0F0C22 100%);
  border-right: 1px solid rgba(201,168,76,0.1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: rgba(201,168,76,0.15) transparent;
}
.item-list::-webkit-scrollbar { width: 3px; }
.item-list::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.18); border-radius: 2px; }

.list-header {
  padding: 11px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(201,168,76,0.1);
  font-family: var(--font-title, 'Cinzel', serif);
  font-size: 0.65rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted, #9A8868);
  flex-shrink: 0;
}

.list-item {
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.15s;
  position: relative;
}
.list-item::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: transparent;
  transition: background 0.2s;
}
.list-item:hover { background: rgba(201,168,76,0.04); }
.list-item:hover::before { background: rgba(201,168,76,0.25); }
.list-item.selected { background: rgba(201,168,76,0.07); }
.list-item.selected::before { background: var(--gold, #C9A84C); }

.item-name {
  font-size: 0.85rem;
  font-family: var(--font-title, 'Cinzel', serif);
  color: var(--text, #EAD9C1);
  letter-spacing: 0.03em;
}
.list-item.selected .item-name { color: var(--gold-light, #E5C97A); }

.tag {
  font-size: 0.6rem;
  padding: 2px 7px;
  border-radius: 2px;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.tag.default {
  background: rgba(255,255,255,0.04);
  color: rgba(160,140,100,0.5);
  border: 1px solid rgba(255,255,255,0.06);
}
.tag.custom {
  background: rgba(140,50,30,0.2);
  color: #D08060;
  border: 1px solid rgba(140,50,30,0.4);
}
.tag.pure {
  background: rgba(30,100,55,0.2);
  color: #70B880;
  border: 1px solid rgba(30,100,55,0.4);
}

/* ══ 编辑器面板 ══════════════════════════════════════════════ */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}
.editor-panel.placeholder {
  justify-content: center;
  align-items: center;
  color: rgba(201,168,76,0.18);
  font-size: 0.9rem;
  font-style: italic;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.12em;
  background: radial-gradient(ellipse at center, rgba(201,168,76,0.015) 0%, transparent 65%);
}

/* ══ 通用小按钮 ══════════════════════════════════════════════ */
.btn-sm {
  padding: 5px 13px;
  border-radius: 3px;
  background: transparent;
  border: 1px solid rgba(201,168,76,0.22);
  color: var(--text-muted, #9A8868);
  cursor: pointer;
  font-size: 0.68rem;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.btn-sm:hover {
  color: var(--gold-light, #E5C97A);
  border-color: rgba(201,168,76,0.45);
  background: rgba(201,168,76,0.06);
}
.btn-sm.danger {
  border-color: rgba(140,50,30,0.4);
  color: #B06850;
}
.btn-sm.danger:hover {
  background: rgba(140,50,30,0.15);
  border-color: rgba(140,50,30,0.65);
  color: #D09070;
}

/* ══ 消息提示 ════════════════════════════════════════════════ */
.error { color: #C07060; font-size: 0.85rem; margin: 4px 0; font-style: italic; }
.ok    { color: #70B080; font-size: 0.85rem; margin: 4px 0; }

.save-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 22px;
  border-radius: 3px;
  font-size: 0.78rem;
  font-family: var(--font-title, 'Cinzel', serif);
  letter-spacing: 0.08em;
  box-shadow: 0 4px 28px rgba(0,0,0,0.65);
  animation: slideInToast 0.3s ease;
  border: 1px solid;
}
.save-toast.ok {
  background: rgba(20,55,30,0.97);
  border-color: rgba(60,140,70,0.4);
  color: #80C890;
}
.save-toast.error {
  background: rgba(50,15,15,0.97);
  border-color: rgba(140,50,30,0.4);
  color: #D08060;
}

@keyframes slideInToast {
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

code {
  background: rgba(201,168,76,0.08);
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 0.85em;
  color: var(--gold-light, #E5C97A);
  border: 1px solid rgba(201,168,76,0.15);
}
</style>
