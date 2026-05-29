<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { backgrounds } from '../data/backgrounds.js'
import { classes } from '../data/classes.js'
import { findFightingStyleFeatById } from '../data/fightingStyleFeats.js'
import { findGeneralFeatById } from '../data/generalFeats.js'
import { findOriginFeatById } from '../data/originFeats.js'
import { races } from '../data/races.js'
import { findSpellById } from '../data/spells.js'
import { character } from '../store/character.js'
import { ABILITY_EN, ABILITY_IDS } from '../utils/abilities.js'
import { getAbilityTotalRows } from '../utils/abilityTotals.js'
import { calculateCharacterAc, getEquippedArmor, hasShieldTraining } from '../utils/equipment.js'
import { getRequirementsForLevel } from '../utils/progression.js'

const router = useRouter()

function printSheet() {
  globalThis.print?.()
}

const SKILL_ABILITY = {
  运动: '力量',
  体操: '敏捷',
  巧手: '敏捷',
  隐匿: '敏捷',
  奥秘: '智力',
  历史: '智力',
  调查: '智力',
  自然: '智力',
  宗教: '智力',
  驯兽: '感知',
  洞悉: '感知',
  医药: '感知',
  察觉: '感知',
  求生: '感知',
  欺瞒: '魅力',
  威吓: '魅力',
  表演: '魅力',
  游说: '魅力',
}

const selectedRace = computed(() => races.find(race => race.id === character.race.id) ?? null)
const selectedClass = computed(() => classes.find(cls => cls.id === character.class.id) ?? null)
const selectedBackground = computed(() => backgrounds.find(bg => bg.id === character.background.id) ?? null)
const selectedSubclass = computed(() =>
  selectedClass.value?.subclasses?.find(subclass => subclass.id === character.class.subclassId) ?? null
)

const level = computed(() => character.level ?? 1)
const profBonus = computed(() => Math.ceil(level.value / 4) + 1)
const abilityRows = computed(() => getAbilityTotalRows(character))
const abilityMap = computed(() => Object.fromEntries(abilityRows.value.map(row => [row.id, row])))

function signed(value) {
  const number = Number(value) || 0
  return `${number >= 0 ? '+' : ''}${number}`
}

const classSaves = computed(() => selectedClass.value?.saves ?? [])
const savingRows = computed(() =>
  ABILITY_IDS.map(id => {
    const row = abilityMap.value[id]
    const isProficient = classSaves.value.includes(id)
    const total = (row?.mod ?? 0) + (isProficient ? profBonus.value : 0)
    return { id, total, text: signed(total), isProficient }
  })
)

const skillRows = computed(() => {
  const backgroundSkills = selectedBackground.value?.skills ?? []
  const classSkills = character.class.choices?.skills ?? []
  const raceSkill = character.race.choices?.skillProficiency
    ? [character.race.choices.skillProficiency]
    : []

  return Object.entries(SKILL_ABILITY).map(([skill, ability]) => {
    const row = abilityMap.value[ability]
    const baseProficient = [...backgroundSkills, ...classSkills, ...raceSkill].includes(skill)
    const expertLevel = character.skills?.[skill] ?? null
    const multiplier = expertLevel === 'expert' ? 2 : (baseProficient || expertLevel === 'proficient') ? 1 : 0
    const total = (row?.mod ?? 0) + multiplier * profBonus.value
    return {
      skill,
      ability,
      isProficient: baseProficient || Boolean(expertLevel),
      text: signed(total),
    }
  })
})

const skillsByAbility = computed(() =>
  Object.fromEntries(
    ABILITY_IDS.map(ability => [ability, skillRows.value.filter(row => row.ability === ability)])
  )
)

const dexMod = computed(() => abilityMap.value['敏捷']?.mod ?? 0)
const acBase = computed(() =>
  calculateCharacterAc({
    character,
    selectedClass: selectedClass.value,
    selectedSubclass: selectedSubclass.value,
    abilityMap: abilityMap.value,
  })
)
const equippedArmor = computed(() => getEquippedArmor(character))
const shieldText = computed(() => {
  if (!character.equipment?.shield) return '未持用盾牌'
  return hasShieldTraining(selectedClass.value) ? '盾牌 +2' : '盾牌（未受训）'
})
const speed = computed(() => selectedRace.value?.speed ?? 30)
const size = computed(() => {
  const value = selectedRace.value?.size
  if (!value) return '中型'
  return String(value).split('（')[0].split('或')[0].trim()
})
const passivePerception = computed(() => {
  const row = skillRows.value.find(skill => skill.skill === '察觉')
  return row ? 10 + Number(row.text) : 10 + (abilityMap.value['感知']?.mod ?? 0)
})

const armorTraining = computed(() => selectedClass.value?.armor ?? [])
const weaponTraining = computed(() => selectedClass.value?.weapons ?? [])
const toolTraining = computed(() => selectedClass.value?.tools ?? [])
const languages = computed(() => selectedRace.value?.mechanics?.languages ?? ['通用语'])

const classFeatures = computed(() => {
  const rows = []
  if (selectedClass.value?.level1Features) {
    rows.push(...selectedClass.value.level1Features.map(feature => ({ ...feature, level: 1 })))
  }
  if (selectedClass.value?.notableFeatures) {
    rows.push(...selectedClass.value.notableFeatures.filter(feature => feature.level <= level.value))
  }
  if (selectedSubclass.value?.features) {
    rows.push(...selectedSubclass.value.features.filter(feature => feature.level <= level.value))
  }
  return rows.sort((a, b) => (a.level ?? 1) - (b.level ?? 1))
})

const raceTraits = computed(() => selectedRace.value?.traits ?? [])

const generalFeatSlots = computed(() => {
  const cls = selectedClass.value
  if (!cls) return []
  if (cls.progression) {
    return getRequirementsForLevel(cls, level.value)
      .filter(req => req.kind === 'generalFeat' && level.value >= (req.minLevel ?? 4))
  }
  return level.value >= 4 ? [{ id: 'generalFeatId' }] : []
})
const generalFeats = computed(() =>
  generalFeatSlots.value
    .map(slot => findGeneralFeatById(character.class.choices?.[slot.id]))
    .filter(Boolean)
)
const originFeat = computed(() => {
  const feat = selectedBackground.value?.feat
  if (feat) return typeof feat === 'object' ? feat.name : feat
  if (character.race.id === 'human') {
    return findOriginFeatById(character.race.choices?.originFeatId)?.name ?? null
  }
  return null
})
const fightingStyles = computed(() => {
  if (!selectedClass.value?.progression) return []
  return getRequirementsForLevel(selectedClass.value, level.value)
    .filter(req => req.kind === 'fightingStyleFeat')
    .map(slot => findFightingStyleFeatById(character.class.choices?.[slot.id]))
    .filter(Boolean)
})

const inventoryItems = computed(() => character.inventory?.items ?? [])
const gold = computed(() => character.inventory?.gold ?? 0)

const isSpellcaster = computed(() =>
  Boolean(selectedClass.value?.spellcastingProgression || selectedClass.value?.pactMagicProgression)
)
const spellAbility = computed(() => selectedClass.value?.spellcastingAbility ?? null)
const spellAbilityMod = computed(() => abilityMap.value[spellAbility.value]?.mod ?? 0)
const spellSaveDc = computed(() => spellAbility.value ? 8 + profBonus.value + spellAbilityMod.value : '')
const spellAttack = computed(() => spellAbility.value ? signed(profBonus.value + spellAbilityMod.value) : '')
const spellSlots = computed(() => {
  const progression = selectedClass.value?.spellcastingProgression ?? selectedClass.value?.pactMagicProgression
  const row = progression?.[level.value] ?? {}
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map(spellLevel => ({
    level: spellLevel,
    total: row[String(spellLevel)] ?? 0,
    used: character.spells.slotsUsed?.[String(spellLevel)] ?? 0,
  }))
})
const spellRows = computed(() => {
  const rows = []
  for (const id of character.spells.cantrips ?? []) {
    const spell = findSpellById(id)
    if (spell) rows.push(normalizeSpell(spell))
  }
  for (const id of character.spells.prepared ?? []) {
    const spell = findSpellById(id)
    if (spell) rows.push(normalizeSpell(spell))
  }
  return rows.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
})

function normalizeSpell(spell) {
  return {
    level: spell.level ?? 0,
    name: spell.name,
    castingTime: spell.castingTime ?? '',
    range: spell.range ?? '',
    concentration: Boolean(spell.concentration),
    ritual: Boolean(spell.ritual),
    material: Boolean(String(spell.components ?? '').includes('M')),
  }
}

const abilityGroups = computed(() =>
  ABILITY_IDS.map(id => ({
    id,
    en: ABILITY_EN[id],
    score: abilityMap.value[id]?.total ?? 10,
    modText: abilityMap.value[id]?.modText ?? signed(abilityMap.value[id]?.mod ?? 0),
    save: savingRows.value.find(row => row.id === id),
    skills: skillsByAbility.value[id] ?? [],
  }))
)
</script>

<template>
  <div class="html-sheet">
    <div class="sheet-toolbar no-print">
      <button type="button" class="toolbar-btn secondary" @click="router.push('/sheet')">
        返回角色卡
      </button>
      <button type="button" class="toolbar-btn primary" @click="printSheet">
        打印 / 另存为 PDF
      </button>
      <span class="toolbar-tip">这是 HTML 角色卡。浏览器打印时选择“另存为 PDF”即可导出。</span>
    </div>

    <section class="paper page-one">
      <header class="sheet-header">
        <div class="field-block identity">
          <label>角色姓名</label>
          <div class="fill big">{{ character.name || '未命名角色' }}</div>
          <div class="identity-grid">
            <div><span>种族</span><strong>{{ selectedRace?.name || '—' }}</strong></div>
            <div><span>职业</span><strong>{{ selectedClass?.name || '—' }}</strong></div>
            <div><span>背景</span><strong>{{ selectedBackground?.name || '—' }}</strong></div>
            <div><span>子职</span><strong>{{ selectedSubclass?.name || '—' }}</strong></div>
          </div>
        </div>

        <div class="level-shield">
          <span>等级</span>
          <strong>{{ level }}</strong>
          <small>{{ selectedClass?.hitDie || 'd8' }}</small>
        </div>

        <div class="top-stats">
          <div class="stat-box">
            <label>护甲等级</label>
            <strong>{{ acBase }}</strong>
          </div>
          <div class="stat-box">
            <label>先攻</label>
            <strong>{{ signed(dexMod) }}</strong>
          </div>
          <div class="stat-box">
            <label>速度</label>
            <strong>{{ speed }}</strong>
          </div>
          <div class="stat-box wide">
            <label>生命值</label>
            <strong>{{ character.hp.current || character.hp.max || 0 }} / {{ character.hp.max || 0 }}</strong>
          </div>
          <div class="stat-box">
            <label>被动察觉</label>
            <strong>{{ passivePerception }}</strong>
          </div>
          <div class="stat-box">
            <label>体型</label>
            <strong>{{ size }}</strong>
          </div>
        </div>
      </header>

      <main class="page-one-grid">
        <aside class="left-rail">
          <div v-for="group in abilityGroups" :key="group.id" class="ability-card">
            <div class="ability-head">
              <span>{{ group.id }}</span>
              <small>{{ group.en }}</small>
            </div>
            <div class="ability-score-row">
              <div class="mod-circle">{{ group.modText }}</div>
              <div class="score-fill">{{ group.score }}</div>
            </div>
            <div class="mini-row strong">
              <span :class="['dot', { on: group.save?.isProficient }]"></span>
              <b>{{ group.save?.text }}</b>
              <span>豁免</span>
            </div>
            <div v-for="skill in group.skills" :key="skill.skill" class="mini-row">
              <span :class="['dot', { on: skill.isProficient }]"></span>
              <b>{{ skill.text }}</b>
              <span>{{ skill.skill }}</span>
            </div>
          </div>

          <section class="sheet-panel small-panel">
            <h2>英雄激励</h2>
            <div class="inspiration-star">✦</div>
          </section>

          <section class="sheet-panel training-panel">
            <h2>装备训练 & 熟练项</h2>
            <div class="tag-row">
              <span v-for="armor in ['轻甲', '中甲', '重甲', '盾牌']" :key="armor" :class="{ on: armorTraining.includes(armor) }">
                {{ armor }}
              </span>
            </div>
            <p><b>武器</b>{{ weaponTraining.join('、') || '—' }}</p>
            <p><b>工具</b>{{ toolTraining.join('、') || '—' }}</p>
          </section>
        </aside>

        <section class="main-rail">
          <section class="sheet-panel attacks-panel">
            <h2>武器 & 伤害戏法</h2>
            <table>
              <thead>
                <tr><th>名称</th><th>攻击加值 / DC</th><th>伤害 & 类型</th><th>备注</th></tr>
              </thead>
              <tbody>
                <tr v-for="item in inventoryItems.slice(0, 7)" :key="item.id">
                  <td>{{ item.name }}</td><td></td><td></td><td>{{ item.desc || '' }}</td>
                </tr>
                <tr v-for="index in Math.max(0, 7 - inventoryItems.length)" :key="`weapon-${index}`">
                  <td></td><td></td><td></td><td></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="sheet-panel features-panel">
            <h2>职业特性</h2>
            <div class="feature-columns">
              <div v-for="feature in classFeatures" :key="`${feature.level}-${feature.name}`" class="feature-line">
                <span>{{ feature.level || 1 }}</span>
                <strong>{{ feature.name }}</strong>
              </div>
            </div>
          </section>

          <div class="bottom-panels">
            <section class="sheet-panel">
              <h2>种族特质</h2>
              <div v-for="trait in raceTraits" :key="trait.id || trait.name" class="note-line">
                {{ trait.name }}
              </div>
            </section>
            <section class="sheet-panel">
              <h2>专长</h2>
              <div v-if="originFeat" class="note-line">起源：{{ originFeat }}</div>
              <div v-for="feat in fightingStyles" :key="feat.id" class="note-line">战斗风格：{{ feat.name }}</div>
              <div v-for="feat in generalFeats" :key="feat.id" class="note-line">通用：{{ feat.name }}</div>
            </section>
          </div>
        </section>

        <aside class="right-rail">
          <section class="sheet-panel">
            <h2>外貌</h2>
            <div class="portrait-box"></div>
          </section>
          <section class="sheet-panel story-panel">
            <h2>背景故事 & 个性特点</h2>
            <div class="grid-fill"></div>
            <div class="alignment-row"><span>阵营</span><div class="fill"></div></div>
          </section>
          <section class="sheet-panel">
            <h2>语言</h2>
            <div v-for="language in languages" :key="language" class="note-line">{{ language }}</div>
          </section>
          <section class="sheet-panel gear-panel">
            <h2>装备</h2>
            <div class="note-line">护甲：{{ equippedArmor ? `${equippedArmor.nameZh}（${equippedArmor.name}）` : '未穿护甲' }}</div>
            <div class="note-line">盾牌：{{ shieldText }}</div>
            <div v-for="item in inventoryItems.slice(0, 9)" :key="item.id" class="note-line">
              {{ item.qty > 1 ? `${item.qty}× ` : '' }}{{ item.name }}
            </div>
          </section>
          <section class="sheet-panel coins-panel">
            <h2>钱币</h2>
            <div class="coin-grid">
              <div><span>CP</span><b>—</b></div>
              <div><span>SP</span><b>—</b></div>
              <div><span>EP</span><b>—</b></div>
              <div><span>GP</span><b>{{ gold }}</b></div>
              <div><span>PP</span><b>—</b></div>
            </div>
          </section>
        </aside>
      </main>
    </section>

    <section v-if="isSpellcaster" class="paper page-two">
      <header class="spell-header">
        <section class="sheet-panel spell-meta">
          <h2>施法关键信息</h2>
          <div class="spell-meta-grid">
            <span>施法属性</span><strong>{{ spellAbility || '—' }}</strong>
            <span>法术豁免 DC</span><strong>{{ spellSaveDc || '—' }}</strong>
            <span>法术攻击加值</span><strong>{{ spellAttack || '—' }}</strong>
          </div>
        </section>

        <section class="sheet-panel slot-panel">
          <h2>法术位</h2>
          <div class="slot-grid">
            <div v-for="slot in spellSlots" :key="slot.level">
              <span>LEVEL {{ slot.level }}</span>
              <b>{{ slot.total }}</b>
              <small>已消耗 {{ slot.used }}</small>
            </div>
          </div>
        </section>
      </header>

      <main class="spell-layout">
        <section class="sheet-panel spell-list-panel">
          <h2>戏法 & 已准备法术</h2>
          <table>
            <thead>
              <tr>
                <th>环阶</th>
                <th>法术名</th>
                <th>施法时间</th>
                <th>距离</th>
                <th>C/R/M</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="spell in spellRows" :key="`${spell.level}-${spell.name}`">
                <td>{{ spell.level === 0 ? '戏法' : `${spell.level}环` }}</td>
                <td>{{ spell.name }}</td>
                <td>{{ spell.castingTime }}</td>
                <td>{{ spell.range }}</td>
                <td>
                  <span :class="['flag', { on: spell.concentration }]">C</span>
                  <span :class="['flag', { on: spell.ritual }]">R</span>
                  <span :class="['flag', { on: spell.material }]">M</span>
                </td>
                <td></td>
              </tr>
              <tr v-for="index in Math.max(0, 34 - spellRows.length)" :key="`spell-empty-${index}`">
                <td></td><td></td><td></td><td></td><td></td><td></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </section>
  </div>
</template>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  .no-print {
    display: none !important;
  }

  .html-sheet {
    background: #fff !important;
    padding: 0 !important;
  }

  .paper {
    width: 210mm !important;
    height: 297mm !important;
    box-shadow: none !important;
    margin: 0 !important;
    page-break-after: always;
    overflow: hidden !important;
  }

  .paper:last-child {
    page-break-after: auto;
  }
}

* {
  box-sizing: border-box;
}

.html-sheet {
  min-height: 100vh;
  background: #d9d9d9;
  padding: 18px 0 32px;
  color: #141414;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.sheet-toolbar {
  width: 210mm;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-btn {
  border: 0;
  border-radius: 6px;
  padding: 9px 16px;
  font-weight: 700;
  cursor: pointer;
}

.toolbar-btn.primary {
  background: #1d4f8f;
  color: #fff;
}

.toolbar-btn.secondary {
  background: #333;
  color: #fff;
}

.toolbar-tip {
  color: #555;
  font-size: 13px;
}

.paper {
  width: 210mm;
  height: 297mm;
  margin: 0 auto 18px;
  padding: 4mm;
  background: #fff;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.sheet-header {
  height: 31mm;
  display: grid;
  grid-template-columns: 80mm 25mm 1fr;
  gap: 3mm;
  margin-bottom: 2mm;
}

.field-block,
.sheet-panel,
.stat-box,
.level-shield {
  position: relative;
  border: 1.7px solid #111;
  background:
    linear-gradient(135deg, transparent 0 10px, rgba(12, 74, 150, 0.06) 10px 100%),
    #fff;
}

.field-block::before,
.sheet-panel::before,
.stat-box::before,
.level-shield::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid #4a4a4a;
  pointer-events: none;
}

.identity {
  padding: 3mm;
}

label,
.sheet-panel h2 {
  display: block;
  margin: 0;
  font-size: 8px;
  font-weight: 700;
  text-align: center;
}

.fill,
.score-fill,
.identity-grid strong,
.stat-box strong,
.note-line,
.grid-fill,
td {
  background:
    linear-gradient(#cfe0f6 50%, #c5d8f0 50%),
    #cfe0f6;
  background-size: 100% 4mm;
}

.fill.big {
  height: 7mm;
  margin: 1mm 0 1.4mm;
  padding: 1mm 2mm;
  font-size: 13px;
  font-weight: 700;
}

.identity-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5mm 2mm;
}

.identity-grid div {
  display: grid;
  grid-template-columns: 13mm 1fr;
  align-items: center;
  gap: 1mm;
}

.identity-grid span {
  font-size: 8px;
}

.identity-grid strong {
  min-height: 5mm;
  padding: 0.8mm 1.2mm;
  font-size: 10px;
}

.level-shield {
  display: grid;
  place-items: center;
  padding: 2mm;
  text-align: center;
  clip-path: polygon(50% 0, 100% 18%, 100% 72%, 50% 100%, 0 72%, 0 18%);
}

.level-shield span {
  font-size: 9px;
  font-weight: 700;
}

.level-shield strong {
  font-size: 28px;
  line-height: 1;
}

.level-shield small {
  font-size: 9px;
}

.top-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2mm;
}

.stat-box {
  min-height: 13mm;
  padding: 1.8mm 2mm;
  text-align: center;
}

.stat-box.wide {
  grid-column: span 2;
}

.stat-box strong {
  display: block;
  min-height: 7mm;
  margin-top: 1mm;
  padding-top: 1mm;
  font-size: 15px;
}

.page-one-grid {
  display: grid;
  grid-template-columns: 51mm 1fr 61mm;
  gap: 2mm;
}

.left-rail,
.main-rail,
.right-rail {
  display: grid;
  gap: 1.4mm;
  align-content: start;
}

.ability-card {
  border: 1.7px solid #111;
  padding: 1.35mm;
  min-height: 25.5mm;
}

.ability-head {
  display: flex;
  justify-content: center;
  gap: 1.5mm;
  font-weight: 700;
  font-size: 10px;
}

.ability-head small {
  color: #666;
}

.ability-score-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5mm;
  margin: 0.6mm 0;
}

.mod-circle {
  width: 11mm;
  height: 11mm;
  border: 1.7px solid #111;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e7f0fb;
  font-size: 13px;
  font-weight: 700;
}

.score-fill {
  width: 16mm;
  height: 6.5mm;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
}

.mini-row {
  display: grid;
  grid-template-columns: 3.4mm 7mm 1fr;
  align-items: center;
  gap: 1mm;
  min-height: 3.35mm;
  font-size: 8px;
}

.mini-row.strong {
  border-top: 1px solid #111;
  padding-top: 0.45mm;
  margin-top: 0.45mm;
}

.dot {
  width: 2.35mm;
  height: 2.35mm;
  border: 1px solid #2f5f9e;
  border-radius: 50%;
  display: inline-block;
}

.dot.on {
  background: #2f5f9e;
  box-shadow: inset 0 0 0 1px #fff;
}

.sheet-panel {
  padding: 2mm;
}

.sheet-panel h2 {
  border-bottom: 1px solid #111;
  padding-bottom: 0.5mm;
  margin-bottom: 1mm;
}

.small-panel {
  min-height: 15mm;
  text-align: center;
}

.inspiration-star {
  width: 7mm;
  height: 7mm;
  margin: 1mm auto 0;
  display: grid;
  place-items: center;
  color: #2f5f9e;
  font-size: 14px;
}

.training-panel {
  min-height: 32mm;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2mm;
  margin-bottom: 2mm;
}

.tag-row span {
  border: 1px solid #2f5f9e;
  color: #777;
  padding: 0.6mm 1.4mm;
  font-size: 8px;
}

.tag-row span.on {
  background: #d8e7fb;
  color: #111;
  font-weight: 700;
}

.training-panel p {
  margin: 0.8mm 0;
  font-size: 8px;
}

.training-panel b {
  display: inline-block;
  min-width: 9mm;
}

.attacks-panel {
  min-height: 47mm;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8px;
}

th {
  border-bottom: 1px solid #111;
  padding: 1mm;
  font-weight: 700;
  text-align: left;
}

td {
  border: 1px solid #fff;
  height: 5.1mm;
  padding: 0.6mm;
}

.features-panel {
  min-height: 70mm;
}

.feature-columns {
  columns: 2;
  column-gap: 4mm;
}

.feature-line,
.note-line {
  break-inside: avoid;
  min-height: 4.5mm;
  padding: 0.65mm 0.8mm;
  margin-bottom: 0.55mm;
  font-size: 8.5px;
}

.feature-line span {
  display: inline-grid;
  place-items: center;
  width: 5mm;
  height: 5mm;
  border: 1px solid #2f5f9e;
  margin-right: 1mm;
  color: #2f5f9e;
  font-size: 8px;
}

.bottom-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2mm;
}

.bottom-panels .sheet-panel {
  min-height: 58mm;
}

.portrait-box {
  height: 24mm;
  background: linear-gradient(90deg, #fff 0 18mm, #cfe0f6 18mm 100%);
}

.story-panel {
  min-height: 61mm;
}

.grid-fill {
  height: 43mm;
}

.alignment-row {
  display: grid;
  grid-template-columns: 12mm 1fr;
  align-items: center;
  gap: 2mm;
  margin-top: 2mm;
  font-size: 9px;
}

.gear-panel {
  min-height: 70mm;
}

.coins-panel {
  min-height: 20mm;
}

.coin-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.2mm;
}

.coin-grid div {
  text-align: center;
}

.coin-grid span {
  display: block;
  font-size: 8px;
}

.coin-grid b {
  display: block;
  height: 8mm;
  border: 1px solid #111;
  background: #cfe0f6;
  padding-top: 1.5mm;
}

.page-two {
  display: grid;
  grid-template-rows: 35mm 1fr;
  gap: 3mm;
}

.spell-header {
  display: grid;
  grid-template-columns: 48mm 1fr;
  gap: 3mm;
}

.spell-meta-grid {
  display: grid;
  grid-template-columns: 1fr 16mm;
  gap: 1.2mm;
  font-size: 9px;
}

.spell-meta-grid strong {
  background: #cfe0f6;
  text-align: center;
  padding: 1mm;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 1mm;
}

.slot-grid div {
  text-align: center;
  font-size: 7px;
}

.slot-grid b {
  display: block;
  height: 8mm;
  border: 1px solid #2f5f9e;
  background: #cfe0f6;
  padding-top: 1.5mm;
  font-size: 12px;
}

.slot-grid small {
  display: block;
  margin-top: 0.8mm;
  color: #555;
}

.spell-layout,
.spell-list-panel {
  min-height: 0;
}

.spell-list-panel table {
  font-size: 8px;
}

.spell-list-panel td {
  height: 5.35mm;
}

.flag {
  color: #9aa5b1;
  font-weight: 700;
  margin-right: 1mm;
}

.flag.on {
  color: #143f73;
}
</style>
