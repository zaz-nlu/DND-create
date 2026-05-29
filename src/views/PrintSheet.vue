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
import { ABILITY_IDS } from '../utils/abilities.js'
import { getAbilityTotalRows } from '../utils/abilityTotals.js'
import { calculateCharacterAc, getEquippedArmor } from '../utils/equipment.js'
import { getRequirementsForLevel } from '../utils/progression.js'

const router = useRouter()

const selectedRace = computed(() => races.find(r => r.id === character.race.id) ?? null)
const selectedClass = computed(() => classes.find(c => c.id === character.class.id) ?? null)
const selectedBackground = computed(() => backgrounds.find(b => b.id === character.background.id) ?? null)
const selectedSubclass = computed(() => {
  const sub = character.class.subclassId
  return selectedClass.value?.subclasses?.find(s => s.id === sub) ?? null
})

const level = computed(() => character.level ?? 1)
const profBonus = computed(() => Math.ceil(level.value / 4) + 1)
const abilityRows = computed(() => getAbilityTotalRows(character))
const abilityMap = computed(() => Object.fromEntries(abilityRows.value.map(r => [r.id, r])))

function sign(n) { return (n >= 0 ? '+' : '') + n }

const classSaves = computed(() => selectedClass.value?.saves ?? [])
const savingThrows = computed(() =>
  ABILITY_IDS.map(id => {
    const row = abilityMap.value[id]
    const isProficient = classSaves.value.includes(id)
    const bonus = (row?.mod ?? 0) + (isProficient ? profBonus.value : 0)
    return { id, isProficient, text: sign(bonus) }
  })
)

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
  return Object.fromEntries(
    Object.entries(SKILL_ABILITY).map(([skill, ability]) => {
      const row = abilityMap.value[ability]
      const isProficient = [...bgSkills, ...classSkills, ...raceSkill].includes(skill)
      const expertLevel = character.skills?.[skill] ?? null
      const mult = expertLevel === 'expert' ? 2 : (isProficient || expertLevel === 'proficient') ? 1 : 0
      const total = (row?.mod ?? 0) + mult * profBonus.value
      return [skill, { isProficient: isProficient || !!expertLevel, text: sign(total) }]
    })
  )
})

const dexMod = computed(() => abilityMap.value['敏捷']?.mod ?? 0)
const equippedArmor = computed(() => getEquippedArmor(character))
const equippedShieldText = computed(() => character.equipment?.shield ? '盾牌' : '')
const acBase = computed(() =>
  calculateCharacterAc({
    character,
    selectedClass: selectedClass.value,
    selectedSubclass: selectedSubclass.value,
    abilityMap: abilityMap.value,
  })
)
const speed = computed(() => selectedRace.value?.speed ?? 30)
const size = computed(() => (selectedRace.value?.size ?? '中型').split('（')[0].split('或')[0].trim())
const passivePerception = computed(() => {
  const percVal = skillData.value['察觉']
  if (!percVal) return 10 + (abilityMap.value['感知']?.mod ?? 0)
  return 10 + parseInt(percVal.text)
})

const classFeatures = computed(() => {
  const f = []
  if (selectedClass.value?.level1Features) f.push(...selectedClass.value.level1Features.map(x => ({ ...x, atLevel: 1 })))
  if (selectedClass.value?.notableFeatures) f.push(...selectedClass.value.notableFeatures.filter(x => x.level <= level.value).map(x => ({ ...x, atLevel: x.level })))
  if (selectedSubclass.value?.features) f.push(...selectedSubclass.value.features.filter(x => x.level <= level.value).map(x => ({ ...x, atLevel: x.level })))
  return f.sort((a, b) => a.atLevel - b.atLevel)
})

const raceTraits = computed(() => selectedRace.value?.traits ?? [])

const featSlots = computed(() => {
  const cls = selectedClass.value
  if (!cls) return []
  if (cls.progression) return getRequirementsForLevel(cls, level.value).filter(r => r.kind === 'generalFeat' && level.value >= (r.minLevel ?? 4))
  return level.value >= 4 ? [{ id: 'generalFeatId' }] : []
})
const generalFeats = computed(() => featSlots.value.map(s => findGeneralFeatById(character.class.choices?.[s.id])).filter(Boolean))
const originFeat = computed(() => {
  const bgFeat = selectedBackground.value?.feat
  if (bgFeat) return typeof bgFeat === 'object' ? bgFeat.name : bgFeat
  if (character.race.id === 'human') { const f = findOriginFeatById(character.race.choices?.originFeatId); return f?.name ?? null }
  return null
})
const fightingStyles = computed(() => {
  if (!selectedClass.value?.progression) return []
  return getRequirementsForLevel(selectedClass.value, level.value)
    .filter(r => r.kind === 'fightingStyleFeat')
    .map(s => findFightingStyleFeatById(character.class.choices?.[s.id]))
    .filter(Boolean)
})

const armorProf = computed(() => selectedClass.value?.armor ?? [])
const languages = computed(() => selectedRace.value?.mechanics?.languages ?? ['通用语'])

const isSpellcaster = computed(() => !!(selectedClass.value?.spellcastingProgression || selectedClass.value?.pactMagicProgression))
const spellAbility = computed(() => selectedClass.value?.spellcastingAbility ?? null)
const spellDC = computed(() => spellAbility.value ? 8 + profBonus.value + (abilityMap.value[spellAbility.value]?.mod ?? 0) : null)
const spellAttack = computed(() => spellAbility.value ? sign(profBonus.value + (abilityMap.value[spellAbility.value]?.mod ?? 0)) : null)

const spellSlots = computed(() => {
  const prog = selectedClass.value?.spellcastingProgression ?? selectedClass.value?.pactMagicProgression ?? null
  if (!prog) return []
  const row = prog[level.value] ?? {}
  return [1,2,3,4,5,6,7,8,9].map(l => ({ level: l, total: row[String(l)] ?? 0, used: character.spells.slotsUsed?.[String(l)] ?? 0 })).filter(r => r.total > 0)
})

const spellList = computed(() => {
  const rows = []
  for (const id of character.spells.cantrips) {
    const sp = findSpellById(id); if (sp) rows.push({ level: 0, name: sp.name, time: sp.castingTime ?? '', range: sp.range ?? '', C: !!sp.concentration, R: !!sp.ritual, M: !!(sp.components ?? '').includes('M') })
  }
  for (const id of character.spells.prepared) {
    const sp = findSpellById(id); if (sp) rows.push({ level: sp.level ?? 1, name: sp.name, time: sp.castingTime ?? '', range: sp.range ?? '', C: !!sp.concentration, R: !!sp.ritual, M: !!(sp.components ?? '').includes('M') })
  }
  return rows.sort((a, b) => a.level - b.level)
})

const inventoryItems = computed(() => character.inventory?.items ?? [])
const gold = computed(() => character.inventory?.gold ?? 0)

const ABILITY_GROUPS = [
  { id: '力量',  en: 'STR', skills: ['运动'] },
  { id: '敏捷',  en: 'DEX', skills: ['体操', '巧手', '隐匿'] },
  { id: '体质',  en: 'CON', skills: [] },
  { id: '智力',  en: 'INT', skills: ['奥秘', '历史', '调查', '自然', '宗教'] },
  { id: '感知',  en: 'WIS', skills: ['驯兽', '洞悉', '医学', '察觉', '求生'] },
  { id: '魅力',  en: 'CHA', skills: ['欺瞒', '威吓', '表演', '游说'] },
]
</script>

<template>
  <div class="root">

    <div class="controls no-print">
      <button class="btn-back" @click="router.push('/sheet')">← 返回角色卡</button>
      <button class="btn-print" @click="() => window.print()">🖨 打印 / 导出 PDF</button>
      <span class="hint">打印对话框中选「另存为 PDF」即可导出</span>
    </div>

    <!-- ══ 第一页 ══ -->
    <div class="page">

      <!-- 顶部信息 -->
      <div class="top-bar">
        <div class="top-identity">
          <div class="char-name">{{ character.name || '无名冒险者' }}</div>
          <div class="char-meta">
            <span v-if="selectedRace">{{ selectedRace.name }}</span>
            <span class="sep" v-if="selectedClass">·</span>
            <span v-if="selectedClass">{{ selectedClass.name }}（{{ selectedClass.hitDie }}）</span>
            <span class="sep" v-if="selectedSubclass">·</span>
            <span v-if="selectedSubclass">{{ selectedSubclass.name }}</span>
            <span class="sep" v-if="selectedBackground">·</span>
            <span v-if="selectedBackground">{{ selectedBackground.name }}背景</span>
          </div>
          <div class="char-meta">等级 {{ level }} &nbsp;·&nbsp; 熟练加值 +{{ profBonus }}</div>
        </div>
        <div class="top-combat">
          <div class="c-box"><div class="cl">护甲等级</div><div class="cv">{{ acBase }}</div></div>
          <div class="c-box"><div class="cl">先攻</div><div class="cv">{{ sign(dexMod) }}</div></div>
          <div class="c-box"><div class="cl">速度</div><div class="cv">{{ speed }}尺</div></div>
          <div class="c-box"><div class="cl">体型</div><div class="cv">{{ size }}</div></div>
          <div class="c-box"><div class="cl">被动察觉</div><div class="cv">{{ passivePerception }}</div></div>
          <div class="c-box hp-box">
            <div class="cl">HP 上限 / 当前 / 临时</div>
            <div class="cv">{{ character.hp.max }} / {{ character.hp.current }} / {{ character.hp.temp || 0 }}</div>
          </div>
          <div class="c-box"><div class="cl">生命骰</div><div class="cv">{{ level }}{{ selectedClass?.hitDie || 'd8' }}</div></div>
        </div>
      </div>

      <div class="main-body">

        <!-- 左：属性 + 豁免 + 技能 -->
        <div class="left-col">
          <div v-for="group in ABILITY_GROUPS" :key="group.id" class="ability-block">
            <div class="ab-header">
              <div class="ab-circle">{{ abilityMap[group.id]?.modText ?? '+0' }}</div>
              <div class="ab-info">
                <div class="ab-name">{{ group.id }} <span class="ab-en">{{ group.en }}</span></div>
                <div class="ab-score">{{ abilityMap[group.id]?.total ?? '—' }}</div>
              </div>
            </div>
            <div class="skill-list">
              <div class="skill-row save-row">
                <span class="dot">{{ savingThrows.find(s => s.id === group.id)?.isProficient ? '●' : '○' }}</span>
                <span class="sv">{{ savingThrows.find(s => s.id === group.id)?.text }}</span>
                <span class="sn si">豁免</span>
              </div>
              <div v-for="sk in group.skills" :key="sk" class="skill-row">
                <span class="dot">{{ skillData[sk]?.isProficient ? '●' : '○' }}</span>
                <span class="sv">{{ skillData[sk]?.text }}</span>
                <span class="sn">{{ sk }}</span>
              </div>
            </div>
          </div>

          <!-- 装备训练 -->
          <div class="equip-box">
            <div class="section-head">装备训练 &amp; 熟练项</div>
            <div class="eq-row">
              <span class="eq-lbl">当前穿戴</span>
              <span class="eq-val">
                {{ equippedArmor ? `${equippedArmor.nameZh}（${equippedArmor.name}）` : '未穿护甲' }}
                {{ equippedShieldText }}
              </span>
            </div>
            <div class="armor-row">
              <span class="eq-lbl">护甲</span>
              <span v-for="t in ['轻甲','中甲','重甲','盾牌']" :key="t"
                    :class="['armor-chip', { on: armorProf.includes(t) }]">{{ t }}</span>
            </div>
            <div class="eq-row">
              <span class="eq-lbl">武器</span>
              <span class="eq-val">{{ (selectedClass?.weapons ?? []).join('、') || '——' }}</span>
            </div>
            <div class="eq-row" v-if="selectedClass?.tools?.length">
              <span class="eq-lbl">工具</span>
              <span class="eq-val">{{ selectedClass.tools.join('、') }}</span>
            </div>
            <div class="eq-row">
              <span class="eq-lbl">语言</span>
              <span class="eq-val">{{ languages.join('、') }}</span>
            </div>
          </div>
        </div>

        <!-- 右：武器 + 特性 + 专长 -->
        <div class="right-col">

          <div class="section-box">
            <div class="section-head">武器 &amp; 伤害戏法</div>
            <table class="weapon-tbl">
              <thead>
                <tr><th>名称</th><th>攻击加值 / DC</th><th>伤害 &amp; 类型</th><th>备注</th></tr>
              </thead>
              <tbody>
                <tr v-for="item in inventoryItems.slice(0, 6)" :key="item.id">
                  <td>{{ item.name }}</td><td></td><td></td><td>{{ item.desc || '' }}</td>
                </tr>
                <tr v-for="i in Math.max(0, 6 - inventoryItems.length)" :key="'ew'+i">
                  <td>&nbsp;</td><td></td><td></td><td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section-box flex-grow">
            <div class="section-head">职业特性</div>
            <div class="features-grid">
              <div v-for="f in classFeatures" :key="f.id || f.name" class="feat-row">
                <span class="feat-lv">{{ f.atLevel }}</span>
                <span class="feat-name">{{ f.name }}</span>
              </div>
            </div>
          </div>

          <div class="two-boxes">
            <div class="section-box">
              <div class="section-head">种族特质</div>
              <div v-for="t in raceTraits" :key="t.id" class="feat-row">
                <span class="feat-name">{{ t.name }}</span>
              </div>
            </div>
            <div class="section-box">
              <div class="section-head">专长</div>
              <div v-if="originFeat" class="feat-row">
                <span class="ftag o">起源</span><span class="feat-name">{{ originFeat }}</span>
              </div>
              <div v-for="f in fightingStyles" :key="f.id" class="feat-row">
                <span class="ftag s">战斗</span><span class="feat-name">{{ f.name }}</span>
              </div>
              <div v-for="f in generalFeats" :key="f.id" class="feat-row">
                <span class="ftag g">通用</span><span class="feat-name">{{ f.name }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ══ 第二页：施法（仅施法职业） ══ -->
    <div v-if="isSpellcaster" class="page">
      <div class="p2-layout">

        <div class="p2-left">
          <div class="section-box">
            <div class="section-head">施法信息</div>
            <div class="spell-info-row"><span class="sil">关键属性</span><span class="siv">{{ spellAbility }}</span></div>
            <div class="spell-info-row"><span class="sil">属性调整值</span><span class="siv">{{ abilityMap[spellAbility]?.modText ?? '+0' }}</span></div>
            <div class="spell-info-row"><span class="sil">法术豁免DC</span><span class="siv">{{ spellDC }}</span></div>
            <div class="spell-info-row"><span class="sil">法术攻击加值</span><span class="siv">{{ spellAttack }}</span></div>
          </div>

          <div class="section-box">
            <div class="section-head">法术位</div>
            <table class="slot-tbl">
              <thead><tr><th>环阶</th><th>总数</th><th>已消耗</th></tr></thead>
              <tbody>
                <tr v-for="r in spellSlots" :key="r.level">
                  <td>{{ r.level }}环</td><td>{{ r.total }}</td><td>{{ r.used }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section-box">
            <div class="section-head">钱币</div>
            <div class="coin-row">
              <div class="coin"><div class="ck">GP</div><div class="cv2">{{ gold }}</div></div>
              <div class="coin"><div class="ck">SP</div><div class="cv2">—</div></div>
              <div class="coin"><div class="ck">CP</div><div class="cv2">—</div></div>
            </div>
          </div>

          <div class="section-box flex-grow">
            <div class="section-head">装备</div>
            <div v-for="item in inventoryItems" :key="item.id" class="item-line">
              {{ item.qty > 1 ? item.qty + '× ' : '' }}{{ item.name }}
            </div>
          </div>
        </div>

        <div class="p2-mid">
          <div class="section-head" style="margin-bottom:1.5mm">戏法 &amp; 已准备法术</div>
          <table class="spell-tbl">
            <thead>
              <tr>
                <th style="width:9mm">环阶</th>
                <th>法术名</th>
                <th style="width:18mm">施法时间</th>
                <th style="width:16mm">距离</th>
                <th style="width:16mm;text-align:center">C / R / M</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sp,i) in spellList" :key="i">
                <td style="text-align:center">{{ sp.level === 0 ? '戏法' : sp.level+'环' }}</td>
                <td>{{ sp.name }}</td>
                <td>{{ sp.time }}</td>
                <td>{{ sp.range }}</td>
                <td style="text-align:center">
                  <span :class="['flag', { on: sp.C }]">C</span>
                  <span :class="['flag', { on: sp.R }]">R</span>
                  <span :class="['flag', { on: sp.M }]">M</span>
                </td>
              </tr>
              <tr v-for="i in Math.max(0, 30 - spellList.length)" :key="'b'+i" class="blank-tr">
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p2-right">
          <div class="section-box">
            <div class="section-head">语言</div>
            <div v-for="lang in languages" :key="lang" class="item-line">{{ lang }}</div>
          </div>
          <div class="section-box flex-grow">
            <div class="section-head">背景故事 &amp; 个性特点</div>
          </div>
          <div class="section-box">
            <div class="section-head">外貌 &amp; 阵营</div>
            <div style="height:20mm"></div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
@media print {
  @page { size: A4 portrait; margin: 8mm; }
  .no-print { display: none !important; }
  .root { padding: 0; background: white; }
  .page { box-shadow: none !important; margin-bottom: 0 !important; page-break-after: always; }
  .page:last-child { page-break-after: avoid; }
}

* { box-sizing: border-box; }

.root {
  background: #ddd;
  min-height: 100vh;
  padding: 16px;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: 7.5pt;
  color: #111;
}

.page {
  background: white;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto 16mm;
  box-shadow: 0 2px 12px rgba(0,0,0,.2);
  padding: 7mm;
  display: flex;
  flex-direction: column;
  gap: 3mm;
}

.controls {
  width: 210mm;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-back { padding: 7px 14px; background: #555; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 13px; }
.btn-print { padding: 7px 18px; background: #c9a84c; color: #1a0f00; border: none; border-radius: 5px; cursor: pointer; font-size: 13px; font-weight: 700; }
.hint { font-size: 11px; color: #777; }

/* 顶栏 */
.top-bar { display: flex; gap: 4mm; border-bottom: 1.5px solid #333; padding-bottom: 3mm; }
.top-identity { flex: 1; }
.char-name { font-size: 16pt; font-weight: 700; line-height: 1.1; margin-bottom: 1mm; }
.char-meta { font-size: 7.5pt; color: #444; margin-bottom: .5mm; }
.sep { margin: 0 1mm; color: #aaa; }
.top-combat { display: flex; gap: 2mm; flex-wrap: wrap; align-items: flex-start; }
.c-box { border: 1px solid #444; padding: 1.5mm 2mm; border-radius: 2px; text-align: center; min-width: 16mm; }
.c-box.hp-box { min-width: 38mm; }
.cl { font-size: 5.5pt; color: #666; }
.cv { font-size: 11pt; font-weight: 700; line-height: 1.1; }

/* 主体 */
.main-body { display: flex; gap: 4mm; flex: 1; }

/* 左列 */
.left-col { width: 52mm; flex-shrink: 0; display: flex; flex-direction: column; gap: 1.5mm; }

.ability-block { border: 1px solid #333; border-radius: 2px; padding: 1.5mm; }
.ab-header { display: flex; gap: 2mm; align-items: center; margin-bottom: 1.5mm; }
.ab-circle {
  width: 12mm; height: 12mm; border: 1.5px solid #333; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12pt; font-weight: 700; background: #f5f0e0; flex-shrink: 0;
}
.ab-name { font-size: 7.5pt; font-weight: 700; }
.ab-en { font-size: 6pt; color: #888; margin-left: 1mm; }
.ab-score { font-size: 9pt; font-weight: 700; color: #555; }
.skill-list { display: flex; flex-direction: column; gap: .3mm; }
.skill-row { display: flex; align-items: center; gap: 1mm; font-size: 6.5pt; }
.dot { font-size: 9pt; line-height: 1; flex-shrink: 0; }
.sv { font-weight: 700; min-width: 7mm; text-align: right; flex-shrink: 0; }
.sn { }
.si { font-style: italic; color: #666; }
.save-row { margin-bottom: 1mm; }

.equip-box { border: 1px solid #333; border-radius: 2px; padding: 1.5mm; margin-top: auto; }
.armor-row { display: flex; align-items: center; gap: 1.5mm; flex-wrap: wrap; margin-bottom: 1mm; }
.eq-lbl { font-size: 5.5pt; font-weight: 700; color: #666; min-width: 7mm; }
.armor-chip { font-size: 6pt; padding: .3mm 1.5mm; border: .5px solid #aaa; border-radius: 2px; color: #999; }
.armor-chip.on { background: #f0e8d0; border-color: #c9a84c; color: #333; font-weight: 700; }
.eq-row { display: flex; gap: 1.5mm; margin-bottom: .5mm; align-items: baseline; }
.eq-val { font-size: 6.5pt; flex: 1; border-bottom: .5px solid #ddd; }

/* 右列 */
.right-col { flex: 1; display: flex; flex-direction: column; gap: 2mm; }
.section-box { border: 1px solid #333; border-radius: 2px; padding: 1.5mm; }
.section-box.flex-grow { flex: 1; }
.section-head { font-size: 6.5pt; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #444; border-bottom: 1px solid #ddd; padding-bottom: .5mm; margin-bottom: 1.5mm; }

.weapon-tbl { width: 100%; border-collapse: collapse; font-size: 6.5pt; }
.weapon-tbl th { background: #eee; padding: .7mm 1.5mm; border: .5px solid #bbb; font-size: 6pt; text-align: left; }
.weapon-tbl td { padding: .6mm 1.5mm; border: .5px solid #e0e0e0; height: 5.5mm; }

.features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5mm 4mm; }
.feat-row { display: flex; align-items: baseline; gap: 1.5mm; font-size: 7pt; }
.feat-lv { font-size: 5.5pt; color: #999; min-width: 4mm; }
.feat-name { font-weight: 600; }

.two-boxes { display: flex; gap: 2mm; }
.two-boxes .section-box { flex: 1; }

.ftag { font-size: 5.5pt; padding: .3mm 1mm; border-radius: 1px; font-weight: 700; flex-shrink: 0; }
.ftag.o { background: #d4e8d0; color: #1a4a1a; }
.ftag.g { background: #d0d8f0; color: #1a1a5a; }
.ftag.s { background: #f0d8d0; color: #5a1a1a; }

/* 第二页 */
.p2-layout { display: flex; gap: 4mm; flex: 1; }
.p2-left { width: 38mm; flex-shrink: 0; display: flex; flex-direction: column; gap: 2mm; }
.p2-mid { flex: 1; display: flex; flex-direction: column; }
.p2-right { width: 44mm; flex-shrink: 0; display: flex; flex-direction: column; gap: 2mm; }

.spell-info-row { display: flex; justify-content: space-between; padding: .8mm 0; border-bottom: .5px solid #eee; font-size: 7pt; }
.sil { color: #666; }
.siv { font-weight: 700; font-size: 8.5pt; }

.slot-tbl { width: 100%; border-collapse: collapse; font-size: 7pt; }
.slot-tbl th, .slot-tbl td { border: .5px solid #ccc; padding: .7mm 1.5mm; text-align: center; }
.slot-tbl th { background: #eee; font-size: 6pt; }

.coin-row { display: flex; gap: 2mm; margin-top: 1mm; }
.coin { flex: 1; text-align: center; }
.ck { font-size: 6pt; color: #888; }
.cv2 { font-size: 8.5pt; font-weight: 700; border-bottom: .5px solid #bbb; }

.item-line { font-size: 7pt; padding: .5mm 0; border-bottom: .5px solid #eee; }

.spell-tbl { width: 100%; border-collapse: collapse; font-size: 7pt; flex: 1; }
.spell-tbl th { background: #eee; padding: .7mm 1mm; border: .5px solid #bbb; font-size: 6.5pt; text-align: left; }
.spell-tbl td { padding: .5mm 1mm; border: .5px solid #e0e0e0; height: 4.8mm; }
.blank-tr td { background: #fafafa; }

.flag { font-weight: 700; font-size: 7pt; color: #ccc; margin: 0 .5mm; }
.flag.on { color: #222; }
</style>
