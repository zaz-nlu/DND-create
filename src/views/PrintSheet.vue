<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { backgrounds } from '../data/backgrounds.js'
import { classes } from '../data/classes.js'
import { races } from '../data/races.js'
import { findSpellById } from '../data/spells.js'
import { findGeneralFeatById } from '../data/generalFeats.js'
import { findOriginFeatById } from '../data/originFeats.js'
import { findFightingStyleFeatById } from '../data/fightingStyleFeats.js'
import { character } from '../store/character.js'
import { ABILITY_EN, ABILITY_IDS, abilityMod } from '../utils/abilities.js'
import { getAbilityTotalRows } from '../utils/abilityTotals.js'
import { getRequirementsForLevel } from '../utils/progression.js'

const router = useRouter()

// ── 基础查询 ──────────────────────────────────────────────
const selectedRace = computed(() => races.find(r => r.id === character.race.id) ?? null)
const selectedClass = computed(() => classes.find(c => c.id === character.class.id) ?? null)
const selectedBackground = computed(() => backgrounds.find(b => b.id === character.background.id) ?? null)
const selectedSubclass = computed(() => {
  const sub = character.class.subclassId
  return selectedClass.value?.subclasses?.find(s => s.id === sub) ?? null
})

// ── 核心数值 ──────────────────────────────────────────────
const level = computed(() => character.level ?? 1)
const profBonus = computed(() => Math.ceil(level.value / 4) + 1)

const abilityRows = computed(() => getAbilityTotalRows(character))
const abilityMap = computed(() => Object.fromEntries(abilityRows.value.map(r => [r.id, r])))

const classSaves = computed(() => selectedClass.value?.saves ?? [])

const savingThrows = computed(() =>
  ABILITY_IDS.map(id => {
    const row = abilityMap.value[id]
    const isProficient = classSaves.value.includes(id)
    const bonus = (row?.mod ?? 0) + (isProficient ? profBonus.value : 0)
    return { id, bonus, text: (bonus >= 0 ? '+' : '') + bonus, isProficient }
  })
)

// ── 技能 ──────────────────────────────────────────────────
const SKILL_ABILITY = {
  '运动': '力量',
  '体操': '敏捷', '巧手': '敏捷', '隐匿': '敏捷',
  '奥秘': '智力', '历史': '智力', '调查': '智力', '自然': '智力', '宗教': '智力',
  '驯兽': '感知', '洞悉': '感知', '医学': '感知', '察觉': '感知', '求生': '感知',
  '欺瞒': '魅力', '威吓': '魅力', '表演': '魅力', '游说': '魅力',
}

const skillData = computed(() => {
  const bgSkills = selectedBackground.value?.skills ?? []
  const classSkills = character.class.choices?.skills ?? []
  const raceSkill = character.race.choices?.skillProficiency ? [character.race.choices.skillProficiency] : []
  const allProf = [...new Set([...bgSkills, ...classSkills, ...raceSkill])]

  return Object.fromEntries(
    Object.entries(SKILL_ABILITY).map(([skill, ability]) => {
      const row = abilityMap.value[ability]
      const isProficient = allProf.includes(skill)
      const expertLevel = character.skills?.[skill] ?? null
      const multiplier = expertLevel === 'expert' ? 2 : (isProficient || expertLevel === 'proficient') ? 1 : 0
      const total = (row?.mod ?? 0) + multiplier * profBonus.value
      return [skill, { isProficient: isProficient || !!expertLevel, total, text: (total >= 0 ? '+' : '') + total }]
    })
  )
})

// 按属性分组：模板列顺序
const ABILITY_SKILL_GROUPS = [
  { id: '智力', skills: ['奥秘', '历史', '调查', '自然', '宗教'] },
  { id: '力量', skills: ['运动'] },
  { id: '敏捷', skills: ['体操', '巧手', '隐匿'] },
  { id: '体质', skills: [] },
  { id: '感知', skills: ['驯兽', '洞悉', '医学', '察觉', '求生'] },
  { id: '魅力', skills: ['欺瞒', '威吓', '表演', '游说'] },
]

// ── 战斗数值 ──────────────────────────────────────────────
const dexMod = computed(() => abilityMap.value['敏捷']?.mod ?? 0)
const initiative = computed(() => dexMod.value)
const initiativeText = computed(() => (initiative.value >= 0 ? '+' : '') + initiative.value)

const acBase = computed(() => {
  const formula = selectedSubclass.value?.acFormula ?? selectedClass.value?.acFormula
  if (formula) {
    return formula.base + formula.abilities.reduce(
      (sum, a) => sum + (abilityMap.value[a]?.mod ?? 0), 0
    )
  }
  return 10 + dexMod.value
})

const speed = computed(() => selectedRace.value?.speed ?? 30)
const size = computed(() => selectedRace.value?.size ?? '中型')
const passivePerception = computed(() => 10 + (skillData.value['察觉']?.total ?? (abilityMap.value['感知']?.mod ?? 0)))

// ── 职业特性 ──────────────────────────────────────────────
const relevantFeatures = computed(() => {
  const features = []
  if (selectedClass.value?.level1Features) {
    features.push(...selectedClass.value.level1Features.map(f => ({ ...f, level: 1 })))
  }
  if (selectedClass.value?.notableFeatures) {
    features.push(...selectedClass.value.notableFeatures.filter(f => f.level <= level.value))
  }
  return features.sort((a, b) => (a.level ?? 1) - (b.level ?? 1))
})

const subclassFeatures = computed(() => {
  if (!selectedSubclass.value?.features) return []
  return selectedSubclass.value.features.filter(f => f.level <= level.value)
})

// ── 种族特质 ──────────────────────────────────────────────
const raceTraits = computed(() => selectedRace.value?.traits ?? [])

// ── 专长 ──────────────────────────────────────────────────
const generalFeatSlots = computed(() => {
  const cls = selectedClass.value
  if (!cls) return []
  if (cls.progression) {
    return getRequirementsForLevel(cls, level.value)
      .filter(r => r.kind === 'generalFeat' && level.value >= (r.minLevel ?? 4))
  }
  return level.value >= 4 ? [{ id: 'generalFeatId', kind: 'generalFeat', minLevel: 4 }] : []
})

const generalFeatList = computed(() =>
  generalFeatSlots.value
    .map(slot => findGeneralFeatById(character.class.choices?.[slot.id]))
    .filter(Boolean)
)

const originFeat = computed(() => {
  const bgFeat = selectedBackground.value?.feat
  if (bgFeat) return bgFeat
  if (character.race.id === 'human') return findOriginFeatById(character.race.choices?.originFeatId)
  return null
})

const fightingStyleList = computed(() => {
  if (!selectedClass.value?.progression) return []
  return getRequirementsForLevel(selectedClass.value, level.value)
    .filter(r => r.kind === 'fightingStyleFeat')
    .map(slot => findFightingStyleFeatById(character.class.choices?.[slot.id]))
    .filter(Boolean)
})

// ── 训练项 ──────────────────────────────────────────────
const classProficiencies = computed(() => selectedClass.value ? {
  hitDie: selectedClass.value.hitDie,
  saves: selectedClass.value.saves ?? [],
  armor: selectedClass.value.armor ?? [],
  weapons: selectedClass.value.weapons ?? [],
  tools: selectedClass.value.tools ?? [],
} : null)

// ── 语言 ──────────────────────────────────────────────────
const languages = computed(() => selectedRace.value?.mechanics?.languages ?? ['通用语'])

// ── 施法 ──────────────────────────────────────────────────
const isSpellcaster = computed(() =>
  !!(selectedClass.value?.spellcastingProgression || selectedClass.value?.pactMagicProgression)
)

const spellcastingAbility = computed(() => selectedClass.value?.spellcastingAbility ?? null)

const spellDC = computed(() => {
  if (!spellcastingAbility.value) return null
  return 8 + profBonus.value + (abilityMap.value[spellcastingAbility.value]?.mod ?? 0)
})

const spellAttack = computed(() => {
  if (!spellcastingAbility.value) return null
  const val = profBonus.value + (abilityMap.value[spellcastingAbility.value]?.mod ?? 0)
  return (val >= 0 ? '+' : '') + val
})

const spellSlotRows = computed(() => {
  const cls = selectedClass.value
  if (!cls) return []
  const prog = cls.spellcastingProgression ?? cls.pactMagicProgression ?? null
  if (!prog) return []
  const row = prog[level.value] ?? {}
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => ({
    level: l,
    total: row[String(l)] ?? 0,
    used: character.spells.slotsUsed?.[String(l)] ?? 0,
  })).filter(r => r.total > 0)
})

const spellRows = computed(() => {
  const rows = []
  // 戏法
  for (const id of character.spells.cantrips) {
    const sp = findSpellById(id)
    if (sp) rows.push({ level: 0, name: sp.name, castingTime: sp.castingTime ?? '', range: sp.range ?? '', isConcentration: !!sp.concentration, isRitual: !!sp.ritual, hasMaterial: !!(sp.components ?? '').includes('M') })
  }
  // 已准备
  for (const id of character.spells.prepared) {
    const sp = findSpellById(id)
    if (sp) rows.push({ level: sp.level ?? 1, name: sp.name, castingTime: sp.castingTime ?? '', range: sp.range ?? '', isConcentration: !!sp.concentration, isRitual: !!sp.ritual, hasMaterial: !!(sp.components ?? '').includes('M') })
  }
  // 总是准备（子职业）
  const alwaysPrepared = selectedSubclass.value?.alwaysPrepared ?? {}
  for (const [lvl, names] of Object.entries(alwaysPrepared)) {
    if (Number(lvl) <= level.value) {
      for (const name of names) {
        if (!rows.find(r => r.name === name)) {
          rows.push({ level: Number(lvl) <= 5 ? Math.ceil(Number(lvl) / 2) : 0, name, castingTime: '', range: '', isConcentration: false, isRitual: false, hasMaterial: false, alwaysPrepared: true })
        }
      }
    }
  }
  return rows.sort((a, b) => a.level - b.level)
})

// ── 物品栏 ──────────────────────────────────────────────
const inventoryItems = computed(() => character.inventory?.items ?? [])
const gold = computed(() => character.inventory?.gold ?? 0)
</script>

<template>
  <div class="print-root">
    <!-- ── 控制栏（打印时隐藏）── -->
    <div class="no-print print-controls">
      <button class="btn-back" @click="router.push('/sheet')">← 返回角色卡</button>
      <button class="btn-print" @click="() => window.print()">🖨 打印 / 导出 PDF</button>
      <p class="hint">在打印对话框中选择"另存为 PDF"即可导出</p>
    </div>

    <!-- ══════════════ PAGE 1 ══════════════ -->
    <div class="print-page page-1">

      <!-- ── 顶栏 ── -->
      <div class="header-strip">
        <div class="header-name">
          <div class="field-label">角色姓名</div>
          <div class="field-value name-big">{{ character.name || '——' }}</div>
        </div>
        <div class="header-meta">
          <div class="header-meta-row">
            <span class="meta-item"><span class="label">背景</span><span class="value">{{ selectedBackground?.name || '——' }}</span></span>
            <span class="meta-item"><span class="label">职业</span><span class="value">{{ selectedClass?.name || '——' }}</span></span>
            <span class="meta-item"><span class="label">等级</span><span class="value">{{ level }}</span></span>
          </div>
          <div class="header-meta-row">
            <span class="meta-item"><span class="label">种族</span><span class="value">{{ selectedRace?.name || '——' }}</span></span>
            <span class="meta-item"><span class="label">子职</span><span class="value">{{ selectedSubclass?.name || '——' }}</span></span>
          </div>
        </div>
        <div class="header-combat">
          <div class="combat-box">
            <div class="combat-label">护甲等级</div>
            <div class="combat-value">{{ acBase }}</div>
          </div>
          <div class="hp-block">
            <div class="hp-row">
              <div class="hp-item">
                <div class="label">生命值上限</div>
                <div class="value">{{ character.hp.max }}</div>
              </div>
              <div class="hp-item">
                <div class="label">当前生命值</div>
                <div class="value">{{ character.hp.current }}</div>
              </div>
              <div class="hp-item">
                <div class="label">临时生命值</div>
                <div class="value">{{ character.hp.temp || '——' }}</div>
              </div>
            </div>
          </div>
          <div class="hitdie-block">
            <div class="label">生命骰</div>
            <div class="value">{{ level }}{{ selectedClass?.hitDie || 'd8' }}</div>
          </div>
          <div class="death-block">
            <div class="label">死亡豁免</div>
            <div class="death-row">
              <span>成功</span>
              <span class="circles">○ ○ ○</span>
            </div>
            <div class="death-row">
              <span>失败</span>
              <span class="circles">○ ○ ○</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 主体 ── -->
      <div class="main-body">

        <!-- 左列：属性 + 熟练 -->
        <div class="left-col">
          <div class="prof-box">
            <div class="label">熟练加值</div>
            <div class="value">+{{ profBonus }}</div>
          </div>
          <div class="insp-box">
            <div class="label">英雄激励</div>
            <div class="circle-empty"></div>
          </div>

          <!-- 属性块 -->
          <div
            v-for="group in ABILITY_SKILL_GROUPS"
            :key="group.id"
            class="ability-block"
          >
            <div class="ability-header">
              <div class="ability-name-label">{{ group.id }}</div>
              <div class="ability-score-row">
                <div class="ability-mod">{{ abilityMap[group.id]?.modText ?? '+0' }}</div>
                <div class="ability-score">{{ abilityMap[group.id]?.total ?? '——' }}</div>
              </div>
            </div>
            <!-- 豁免 -->
            <div class="save-row">
              <span class="check-circle">{{ savingThrows.find(s => s.id === group.id)?.isProficient ? '●' : '○' }}</span>
              <span class="save-val">{{ savingThrows.find(s => s.id === group.id)?.text }}</span>
              <span class="save-label">豁免</span>
            </div>
            <!-- 技能 -->
            <div
              v-for="skill in group.skills"
              :key="skill"
              class="skill-row"
            >
              <span class="check-circle">{{ skillData[skill]?.isProficient ? '●' : '○' }}</span>
              <span class="skill-val">{{ skillData[skill]?.text ?? '+0' }}</span>
              <span class="skill-name">{{ skill }}</span>
            </div>
          </div>
        </div>

        <!-- 右区 -->
        <div class="right-col">
          <!-- 战斗顶行 -->
          <div class="combat-top">
            <div class="stat-box">
              <div class="label">先攻</div>
              <div class="value">{{ initiativeText }}</div>
            </div>
            <div class="stat-box">
              <div class="label">速度</div>
              <div class="value">{{ speed }}尺</div>
            </div>
            <div class="stat-box">
              <div class="label">体型</div>
              <div class="value">{{ size }}</div>
            </div>
            <div class="stat-box">
              <div class="label">被动察觉</div>
              <div class="value">{{ passivePerception }}</div>
            </div>
          </div>

          <!-- 武器 & 伤害 -->
          <div class="section-box">
            <div class="section-title">武器 &amp; 伤害戏法</div>
            <table class="weapon-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>攻击加值 / DC</th>
                  <th>伤害 &amp; 类型</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in inventoryItems.slice(0, 6)" :key="item.id">
                  <td>{{ item.name }}</td>
                  <td>——</td>
                  <td>——</td>
                  <td>{{ item.desc || '' }}</td>
                </tr>
                <tr v-for="i in Math.max(0, 6 - inventoryItems.length)" :key="'empty-' + i">
                  <td>&nbsp;</td><td></td><td></td><td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 职业特性 -->
          <div class="section-box">
            <div class="section-title">职业特性</div>
            <div class="features-grid">
              <div v-for="f in [...relevantFeatures, ...subclassFeatures]" :key="f.id" class="feature-entry">
                <span class="feature-name">{{ f.name }}</span>
                <span class="feature-lv">（{{ f.level }}级）</span>
              </div>
            </div>
          </div>

          <!-- 种族特质 + 专长 -->
          <div class="two-col-boxes">
            <div class="section-box">
              <div class="section-title">种族特质</div>
              <div v-for="t in raceTraits" :key="t.id" class="feature-entry">
                <span class="feature-name">{{ t.name }}</span>
              </div>
            </div>
            <div class="section-box">
              <div class="section-title">专长</div>
              <div v-if="originFeat" class="feature-entry">
                <span class="feat-tag origin">起源</span>
                <span class="feature-name">{{ typeof originFeat === 'object' ? originFeat.name : originFeat }}</span>
              </div>
              <div v-for="f in fightingStyleList" :key="f.id" class="feature-entry">
                <span class="feat-tag style">战斗</span>
                <span class="feature-name">{{ f.name }}</span>
              </div>
              <div v-for="f in generalFeatList" :key="f.id" class="feature-entry">
                <span class="feat-tag general">通用</span>
                <span class="feature-name">{{ f.name }}</span>
              </div>
            </div>
          </div>

          <!-- 装备训练 -->
          <div class="section-box equip-training" v-if="classProficiencies">
            <div class="section-title">装备训练 &amp; 熟练项</div>
            <div class="training-row">
              <span class="label">护甲受训</span>
              <span
                v-for="type in ['轻甲', '中甲', '重甲', '盾牌']"
                :key="type"
                :class="['armor-chip', { active: classProficiencies.armor.includes(type) }]"
              >{{ type }}</span>
            </div>
            <div class="training-row">
              <span class="label">武器</span>
              <span class="value">{{ classProficiencies.weapons.join('、') }}</span>
            </div>
            <div class="training-row" v-if="classProficiencies.tools.length">
              <span class="label">工具</span>
              <span class="value">{{ classProficiencies.tools.join('、') }}</span>
            </div>
            <div class="training-row">
              <span class="label">语言</span>
              <span class="value">{{ languages.join('、') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════ PAGE 2（施法页） ══════════════ -->
    <div v-if="isSpellcaster" class="print-page page-2">
      <div class="spell-page-body">

        <!-- 左：施法数据 -->
        <div class="spell-left">
          <div class="section-box spell-stats">
            <div class="section-title">施法信息</div>
            <div class="spell-stat-item">
              <div class="label">施法关键属性</div>
              <div class="value">{{ spellcastingAbility }}</div>
            </div>
            <div class="spell-stat-item">
              <div class="label">属性调整值</div>
              <div class="value">{{ abilityMap[spellcastingAbility]?.modText ?? '+0' }}</div>
            </div>
            <div class="spell-stat-item">
              <div class="label">法术豁免DC</div>
              <div class="value">{{ spellDC }}</div>
            </div>
            <div class="spell-stat-item">
              <div class="label">法术攻击加值</div>
              <div class="value">{{ spellAttack }}</div>
            </div>
          </div>

          <div class="section-box">
            <div class="section-title">法术位</div>
            <table class="slot-table">
              <thead>
                <tr><th>环阶</th><th>总数</th><th>已消耗</th></tr>
              </thead>
              <tbody>
                <tr v-for="row in spellSlotRows" :key="row.level">
                  <td>{{ row.level }}环</td>
                  <td>{{ row.total }}</td>
                  <td>{{ row.used }}</td>
                </tr>
                <tr v-for="i in Math.max(0, 6 - spellSlotRows.length)" :key="'es' + i">
                  <td>&nbsp;</td><td></td><td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section-box">
            <div class="section-title">钱币</div>
            <table class="coin-table">
              <tbody>
                <tr>
                  <td><div class="coin-label">GP</div><div class="coin-val">{{ gold }}</div></td>
                  <td><div class="coin-label">SP</div><div class="coin-val">——</div></td>
                  <td><div class="coin-label">CP</div><div class="coin-val">——</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 中：法术列表 -->
        <div class="spell-mid">
          <div class="section-title">戏法 &amp; 已准备法术</div>
          <table class="spell-table">
            <thead>
              <tr>
                <th class="col-lv">环阶</th>
                <th class="col-name">法术名</th>
                <th class="col-time">施法时间</th>
                <th class="col-range">距离</th>
                <th class="col-flags">专注C / 仪式R / 材料M</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sp, i) in spellRows" :key="i">
                <td class="col-lv">{{ sp.level === 0 ? '戏法' : sp.level + '环' }}</td>
                <td class="col-name">{{ sp.name }}{{ sp.alwaysPrepared ? ' ★' : '' }}</td>
                <td class="col-time">{{ sp.castingTime }}</td>
                <td class="col-range">{{ sp.range }}</td>
                <td class="col-flags">
                  <span :class="{ flag: true, active: sp.isConcentration }">C</span>
                  <span :class="{ flag: true, active: sp.isRitual }">R</span>
                  <span :class="{ flag: true, active: sp.hasMaterial }">M</span>
                </td>
              </tr>
              <tr v-for="i in Math.max(0, 28 - spellRows.length)" :key="'blank-' + i" class="blank-row">
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 右：个人信息 -->
        <div class="spell-right">
          <div class="section-box info-box">
            <div class="section-title">装备</div>
            <div v-for="item in inventoryItems" :key="item.id" class="info-line">
              {{ item.qty > 1 ? item.qty + '× ' : '' }}{{ item.name }}
            </div>
            <div class="info-line gold-line">GP: {{ gold }}</div>
          </div>
          <div class="section-box info-box tall">
            <div class="section-title">背景故事 &amp; 个性特点</div>
            <div class="blank-lines">
              <div v-for="i in 14" :key="i" class="blank-line"></div>
            </div>
          </div>
          <div class="section-box info-box">
            <div class="section-title">语言</div>
            <div v-for="lang in languages" :key="lang" class="info-line">{{ lang }}</div>
          </div>
          <div class="section-box info-box">
            <div class="section-title">外貌 &amp; 阵营</div>
            <div class="blank-lines">
              <div v-for="i in 6" :key="i" class="blank-line"></div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── 全局打印设置 ── */
@media print {
  @page { size: A4 portrait; margin: 8mm; }
  .no-print { display: none !important; }
  .print-root { padding: 0; background: white; }
  .print-page { box-shadow: none; margin: 0; page-break-after: always; }
}

/* ── 页面容器 ── */
.print-root {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 20px;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  color: #111;
}

.print-page {
  background: white;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto 20mm;
  box-shadow: 0 2px 12px rgba(0,0,0,.15);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 6mm;
  font-size: 8pt;
}

/* ── 控制栏 ── */
.print-controls {
  width: 210mm;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-back, .btn-print {
  padding: 8px 18px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-back { background: #555; color: white; }
.btn-print { background: #c9a84c; color: #1a1000; }
.hint { font-size: 12px; color: #666; margin: 0; }

/* ── 顶部信息栏 ── */
.header-strip {
  display: flex;
  gap: 4mm;
  border: 1.5px solid #333;
  padding: 3mm;
  margin-bottom: 3mm;
  border-radius: 2px;
}

.header-name {
  flex: 2;
  border-right: 1px solid #ccc;
  padding-right: 3mm;
}

.header-meta {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 2mm;
  border-right: 1px solid #ccc;
  padding-right: 3mm;
}

.header-meta-row {
  display: flex;
  gap: 6mm;
}

.meta-item { display: flex; gap: 2mm; align-items: baseline; }
.meta-item .label { font-size: 6pt; color: #555; }
.meta-item .value { font-weight: bold; font-size: 9pt; border-bottom: 1px solid #999; min-width: 20mm; }

.header-combat {
  flex: 3;
  display: flex;
  gap: 3mm;
  align-items: flex-start;
  flex-wrap: wrap;
}

.combat-box {
  text-align: center;
  border: 1.5px solid #333;
  padding: 1mm 2mm;
  border-radius: 50%;
  width: 12mm;
  height: 12mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.hp-block, .hitdie-block, .death-block {
  display: flex;
  flex-direction: column;
  gap: 1mm;
}

.hp-row { display: flex; gap: 3mm; }
.hp-item .label, .hitdie-block .label, .death-block .label {
  font-size: 6pt;
  color: #555;
}
.hp-item .value, .hitdie-block .value { font-weight: bold; font-size: 10pt; }

.death-row { display: flex; gap: 2mm; align-items: center; font-size: 7pt; }
.circles { letter-spacing: 1px; }

.name-big { font-size: 13pt; font-weight: bold; border-bottom: 1px solid #333; }

.field-label { font-size: 6pt; color: #555; margin-bottom: 1mm; }

/* ── 主体布局 ── */
.main-body {
  display: flex;
  gap: 4mm;
  flex: 1;
}

/* ── 左列：属性 ── */
.left-col {
  width: 42mm;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2mm;
}

.prof-box, .insp-box {
  border: 1px solid #333;
  padding: 1.5mm 2mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 2px;
}

.prof-box .label, .insp-box .label { font-size: 6pt; color: #555; }
.prof-box .value { font-weight: bold; font-size: 11pt; }
.circle-empty { width: 7mm; height: 7mm; border: 1px solid #333; border-radius: 50%; }

.ability-block {
  border: 1px solid #333;
  border-radius: 3px;
  padding: 1.5mm;
}

.ability-header {
  display: flex;
  align-items: center;
  gap: 2mm;
  margin-bottom: 1mm;
}

.ability-name-label {
  font-size: 7pt;
  font-weight: bold;
  color: #333;
  width: 8mm;
}

.ability-score-row {
  display: flex;
  gap: 2mm;
  align-items: baseline;
}

.ability-mod {
  font-size: 12pt;
  font-weight: bold;
  background: #f0e8d0;
  border: 1px solid #999;
  border-radius: 50%;
  width: 9mm;
  height: 9mm;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ability-score {
  font-size: 9pt;
  font-weight: bold;
  border-bottom: 1px solid #999;
  min-width: 5mm;
  text-align: center;
}

.save-row, .skill-row {
  display: flex;
  align-items: center;
  gap: 1.5mm;
  font-size: 7pt;
  line-height: 1.5;
}

.check-circle { font-size: 8pt; color: #333; }
.save-val, .skill-val { font-weight: bold; min-width: 6mm; text-align: right; font-size: 7pt; }
.save-label { color: #555; font-style: italic; }
.skill-name { color: #222; }

/* ── 右区 ── */
.right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2mm;
}

.combat-top {
  display: flex;
  gap: 3mm;
  margin-bottom: 1mm;
}

.stat-box {
  border: 1px solid #333;
  padding: 1.5mm 2.5mm;
  border-radius: 2px;
  text-align: center;
  flex: 1;
}

.stat-box .label { font-size: 6pt; color: #555; display: block; }
.stat-box .value { font-size: 11pt; font-weight: bold; }

/* ── 通用 section ── */
.section-box {
  border: 1px solid #333;
  padding: 2mm;
  border-radius: 2px;
}

.section-title {
  font-size: 7pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #555;
  border-bottom: 1px solid #ddd;
  margin-bottom: 1.5mm;
  padding-bottom: .5mm;
}

/* ── 武器表 ── */
.weapon-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7pt;
}

.weapon-table th {
  background: #eee;
  padding: 1mm 1.5mm;
  text-align: left;
  border: .5px solid #ccc;
  font-size: 6pt;
}

.weapon-table td {
  padding: .8mm 1.5mm;
  border: .5px solid #ddd;
  height: 5mm;
}

/* ── 特性列表 ── */
.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5mm 3mm;
}

.feature-entry {
  font-size: 7pt;
  display: flex;
  align-items: baseline;
  gap: 1mm;
}

.feature-name { font-weight: 600; }
.feature-lv { color: #888; font-size: 6pt; }

/* ── 专长标签 ── */
.feat-tag {
  font-size: 5.5pt;
  padding: .5mm 1mm;
  border-radius: 2px;
  font-weight: bold;
  flex-shrink: 0;
}

.feat-tag.origin { background: #d4e8d0; color: #2a5a2a; }
.feat-tag.general { background: #d0d8f0; color: #2a2a6a; }
.feat-tag.style { background: #f0d8d0; color: #6a2a2a; }

/* ── 两列盒子 ── */
.two-col-boxes {
  display: flex;
  gap: 2mm;
}

.two-col-boxes .section-box { flex: 1; }

/* ── 装备训练 ── */
.training-row {
  display: flex;
  align-items: center;
  gap: 2mm;
  font-size: 7pt;
  margin-bottom: 1mm;
  flex-wrap: wrap;
}

.training-row .label { font-weight: bold; min-width: 12mm; color: #444; flex-shrink: 0; }
.training-row .value { color: #222; }

.armor-chip {
  padding: .5mm 2mm;
  border: .5px solid #aaa;
  border-radius: 2px;
  color: #888;
  font-size: 6.5pt;
}

.armor-chip.active {
  background: #f0e8d0;
  border-color: #c9a84c;
  color: #333;
  font-weight: bold;
}

/* ══════════════ PAGE 2 ══════════════ */
.page-2 { padding: 6mm; }

.spell-page-body {
  display: flex;
  gap: 4mm;
  height: 100%;
}

.spell-left {
  width: 38mm;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3mm;
}

.spell-stats .spell-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 7.5pt;
  padding: 1mm 0;
  border-bottom: .5px solid #eee;
}

.spell-stat-item .label { color: #555; }
.spell-stat-item .value { font-weight: bold; font-size: 9pt; }

.slot-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7pt;
}

.slot-table th, .slot-table td {
  border: .5px solid #ccc;
  padding: .8mm 1.5mm;
  text-align: center;
}

.slot-table th { background: #eee; font-size: 6.5pt; }

.coin-table { width: 100%; }
.coin-table td { padding: 1mm; text-align: center; }
.coin-label { font-size: 6pt; color: #888; }
.coin-val { font-weight: bold; font-size: 9pt; }

/* ── 法术中列 ── */
.spell-mid { flex: 1; display: flex; flex-direction: column; }

.spell-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7pt;
  flex: 1;
}

.spell-table th {
  background: #eee;
  padding: 1mm 1.5mm;
  border: .5px solid #ccc;
  text-align: left;
  font-size: 6.5pt;
}

.spell-table td {
  padding: .7mm 1.5mm;
  border: .5px solid #ddd;
  height: 4.5mm;
}

.col-lv { width: 8mm; text-align: center; }
.col-name { width: 35mm; }
.col-time { width: 16mm; }
.col-range { width: 16mm; }
.col-flags { width: 20mm; text-align: center; }

.flag { margin: 0 1mm; font-size: 7pt; color: #bbb; font-weight: bold; }
.flag.active { color: #333; }

.blank-row td { background: #fafafa; }

/* ── 右信息列 ── */
.spell-right {
  width: 44mm;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3mm;
}

.info-box { overflow: hidden; }
.info-box.tall { flex: 1; }

.info-line {
  font-size: 7pt;
  padding: .5mm 0;
  border-bottom: .5px solid #eee;
}

.gold-line { font-weight: bold; }

.blank-lines { display: flex; flex-direction: column; flex: 1; }
.blank-line { flex: 1; border-bottom: .5px solid #ddd; min-height: 4.5mm; }

/* ── label/value 通用 ── */
.label { font-size: 6pt; color: #555; }
.value { font-weight: bold; font-size: 10pt; }
.combat-label { font-size: 6pt; color: #555; }
.combat-value { font-size: 13pt; font-weight: bold; }
</style>
