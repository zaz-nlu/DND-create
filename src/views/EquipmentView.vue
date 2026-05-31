<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AbilityBar from '../components/AbilityBar.vue'
import { armors } from '../data/armor.js'
import { backgrounds } from '../data/backgrounds.js'
import { classes } from '../data/classes.js'
import { getWeaponMasteryById, getWeaponPropertyById, weapons } from '../data/weapons.js'
import { character, addInventoryItem, removeInventoryItem, setEquippedArmor, setEquippedShield } from '../store/character.js'
import { getAbilityTotalRows } from '../utils/abilityTotals.js'
import { calculateCharacterAc, getEquippedArmor, hasArmorTraining, hasShieldTraining } from '../utils/equipment.js'
import StepNav from './StepNav.vue'

const router = useRouter()

const selectedClass = computed(() =>
  classes.find(cls => cls.id === character.class.id) ?? null
)

const selectedBackground = computed(() =>
  backgrounds.find(background => background.id === character.background.id) ?? null
)

const selectedSubclass = computed(() =>
  selectedClass.value?.subclasses?.find(subclass => subclass.id === character.class.subclassId) ?? null
)

const abilityRows = computed(() => getAbilityTotalRows(character))
const abilityMap = computed(() => Object.fromEntries(abilityRows.value.map(row => [row.id, row])))

const dexMod = computed(() => abilityMap.value['敏捷']?.mod ?? 0)
const strScore = computed(() => abilityMap.value['力量']?.total ?? 10)

const equippedArmor = computed(() => getEquippedArmor(character))
const shieldTrained = computed(() => hasShieldTraining(selectedClass.value))
const weaponTraining = computed(() => selectedClass.value?.weapons ?? [])
const selectedWeaponIds = computed(() =>
  new Set(
    (character.inventory?.items ?? [])
      .filter(item => item.type === 'weapon' && String(item.id).startsWith('weapon:'))
      .map(item => item.sourceId ?? String(item.id).replace('weapon:', ''))
  )
)
const selectedAc = computed(() =>
  calculateCharacterAc({
    character,
    selectedClass: selectedClass.value,
    selectedSubclass: selectedSubclass.value,
    abilityMap: abilityMap.value,
  })
)

const armorOptions = computed(() =>
  armors.map(armor => ({
    ...armor,
    trained: hasArmorTraining(selectedClass.value, armor),
    strengthPenalty: armor.strengthRequired && strScore.value < armor.strengthRequired,
    acValue: calculateArmorAcPreview(armor),
  }))
)

const weaponGroups = computed(() => [
  {
    id: 'simple-melee',
    title: '简易近战武器',
    items: weapons.filter(weapon => weapon.category === 'simple' && weapon.rangeType === 'melee'),
  },
  {
    id: 'simple-ranged',
    title: '简易远程武器',
    items: weapons.filter(weapon => weapon.category === 'simple' && weapon.rangeType === 'ranged'),
  },
  {
    id: 'martial-melee',
    title: '军用近战武器',
    items: weapons.filter(weapon => weapon.category === 'martial' && weapon.rangeType === 'melee'),
  },
  {
    id: 'martial-ranged',
    title: '军用远程武器',
    items: weapons.filter(weapon => weapon.category === 'martial' && weapon.rangeType === 'ranged'),
  },
])

const selectedWeapons = computed(() =>
  weapons.filter(weapon => selectedWeaponIds.value.has(weapon.id))
)

const armorWarning = computed(() => {
  if (!equippedArmor.value) return ''
  if (!hasArmorTraining(selectedClass.value, equippedArmor.value)) {
    return '当前职业未受训于这类护甲：力量或敏捷相关 D20 检定具有劣势，并且不能施法。'
  }
  if (equippedArmor.value.strengthRequired && strScore.value < equippedArmor.value.strengthRequired) {
    return `力量不足 ${equippedArmor.value.strengthRequired}，穿戴后移动速度减少 10 尺。`
  }
  return ''
})

const shieldWarning = computed(() => {
  if (!character.equipment.shield || shieldTrained.value) return ''
  return '当前职业没有盾牌受训，因此盾牌不会提供 +2 AC。'
})

function calculateArmorAcPreview(armor) {
  const dexBonus = armor.ac.dex
    ? Math.min(dexMod.value, armor.ac.dexMax ?? dexMod.value)
    : 0
  return armor.ac.base + dexBonus
}

function armorFormulaText(armor) {
  if (!armor.ac.dex) return `${armor.ac.base}`
  if (armor.ac.dexMax) return `${armor.ac.base} + 敏捷调整值（最大 ${armor.ac.dexMax}）`
  return `${armor.ac.base} + 敏捷调整值`
}

function weaponPropertyText(weapon) {
  const propertyNames = (weapon.properties ?? [])
    .map(id => getWeaponPropertyById(id)?.name ?? id)
  if (weapon.range) propertyNames.push(`射程 ${weapon.range}`)
  if (weapon.versatileDamage) propertyNames.push(`多用 ${weapon.versatileDamage}`)
  return propertyNames.join('、') || '—'
}

function weaponMasteryText(weapon) {
  return getWeaponMasteryById(weapon.mastery)?.name ?? weapon.mastery ?? '—'
}

function hasWeaponTraining(weapon) {
  const trainingText = weaponTraining.value.join(' ')
  if (trainingText.includes('军用武器')) return true
  if (weapon.category === 'simple' && trainingText.includes('简易武器')) return true
  if (
    weapon.category === 'martial'
    && weapon.properties?.includes('light')
    && trainingText.includes('具备轻型词条的军用武器')
  ) {
    return true
  }
  return false
}

function weaponDescription(weapon) {
  const parts = [
    `${weapon.damage} ${weapon.damageType}`,
    weapon.range ? `射程 ${weapon.range}` : '',
    `词条：${weaponPropertyText(weapon)}`,
    `精通：${weaponMasteryText(weapon)}`,
  ].filter(Boolean)
  return parts.join('；')
}

function toggleWeapon(weapon) {
  const itemId = `weapon:${weapon.id}`
  if (selectedWeaponIds.value.has(weapon.id)) {
    removeInventoryItem(itemId)
    return
  }

  addInventoryItem({
    id: itemId,
    sourceId: weapon.id,
    type: 'weapon',
    name: `${weapon.name} / ${weapon.nameEn}`,
    qty: 1,
    desc: weaponDescription(weapon),
    damage: weapon.damage,
    damageType: weapon.damageType,
    range: weapon.range ?? '',
    mastery: weaponMasteryText(weapon),
    properties: weapon.properties ?? [],
  })
}

function selectArmor(armorId) {
  setEquippedArmor(armorId)
}

function toggleShield() {
  setEquippedShield(!character.equipment.shield)
}
</script>

<template>
  <div class="equipment-page">
    <StepNav step="9 / 10" label="装备选择" back-to="/abilities" />
    <AbilityBar />

    <header class="equipment-header">
      <div class="equipment-step-badge">步骤 10 / 10 · 装备</div>
      <h1 class="equipment-title">选择护甲与盾牌</h1>
      <p class="equipment-sub">这里先只处理会影响角色卡的穿戴项。武器、工具和冒险装备保留为清单数据，不强行做成商店。</p>
    </header>

    <main class="equipment-layout">
      <section class="equipment-panel equipment-panel-summary">
        <div class="equipment-kicker">当前防护</div>
        <div class="equipment-ac-row">
          <div>
            <h2>AC {{ selectedAc }}</h2>
            <p>{{ equippedArmor ? `${equippedArmor.nameZh} · ${equippedArmor.name}` : '未穿护甲' }}</p>
          </div>
          <button
            type="button"
            :class="['shield-toggle', { active: character.equipment.shield }]"
            @click="toggleShield"
          >
            盾牌 {{ character.equipment.shield ? '+2' : '未持用' }}
          </button>
        </div>
        <div class="equipment-summary-grid">
          <span>敏捷调整值</span><strong>{{ dexMod >= 0 ? `+${dexMod}` : dexMod }}</strong>
          <span>职业护甲受训</span><strong>{{ selectedClass?.armor?.length ? selectedClass.armor.join('、') : '无' }}</strong>
          <span>盾牌受训</span><strong>{{ shieldTrained ? '有' : '无' }}</strong>
        </div>
        <p v-if="armorWarning" class="equipment-warning">{{ armorWarning }}</p>
        <p v-if="shieldWarning" class="equipment-warning">{{ shieldWarning }}</p>
      </section>

      <section class="equipment-panel equipment-panel-wide">
        <div class="equipment-kicker">护甲</div>
        <div class="armor-grid">
          <button
            type="button"
            :class="['armor-card', { selected: !character.equipment.armorId }]"
            @click="selectArmor(null)"
          >
            <span class="armor-name">不穿护甲</span>
            <span class="armor-ac">AC {{ 10 + dexMod }}</span>
            <span class="armor-meta">基础防御</span>
          </button>

          <button
            v-for="armor in armorOptions"
            :key="armor.id"
            type="button"
            :class="['armor-card', { selected: character.equipment.armorId === armor.id, untrained: !armor.trained }]"
            @click="selectArmor(armor.id)"
          >
            <span class="armor-name">{{ armor.nameZh }}</span>
            <span class="armor-en">{{ armor.name }}</span>
            <span class="armor-ac">AC {{ armor.acValue }}</span>
            <span class="armor-meta">{{ armorFormulaText(armor) }}</span>
            <span class="armor-tags">
              <span>{{ armor.category }}</span>
              <span v-if="armor.stealthDisadvantage">隐匿劣势</span>
              <span v-if="armor.strengthRequired">力量 {{ armor.strengthRequired }}</span>
              <span v-if="!armor.trained">未受训</span>
            </span>
          </button>
        </div>
      </section>

      <section class="equipment-panel equipment-panel-wide">
        <div class="equipment-kicker">武器</div>
        <div class="weapon-summary">
          <span>已选择 {{ selectedWeapons.length }} 件</span>
          <strong>{{ selectedWeapons.map(weapon => weapon.name).join('、') || '未选择武器' }}</strong>
        </div>
        <div class="weapon-groups">
          <section v-for="group in weaponGroups" :key="group.id" class="weapon-group">
            <h3>{{ group.title }}</h3>
            <div class="weapon-grid">
              <button
                v-for="weapon in group.items"
                :key="weapon.id"
                type="button"
                :class="[
                  'weapon-card',
                  {
                    selected: selectedWeaponIds.has(weapon.id),
                    untrained: !hasWeaponTraining(weapon),
                  },
                ]"
                @click="toggleWeapon(weapon)"
              >
                <span class="weapon-name">{{ weapon.name }}</span>
                <span class="weapon-en">{{ weapon.nameEn }}</span>
                <span class="weapon-damage">{{ weapon.damage }} {{ weapon.damageType }}</span>
                <span class="weapon-meta">{{ weaponPropertyText(weapon) }}</span>
                <span class="weapon-tags">
                  <span>精通 {{ weaponMasteryText(weapon) }}</span>
                  <span v-if="!hasWeaponTraining(weapon)">未熟练</span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </section>

      <section class="equipment-panel">
        <div class="equipment-kicker">职业起始装备</div>
        <h2>{{ selectedClass?.name ?? '未选择职业' }}</h2>
        <p>{{ selectedClass?.equipment?.a || '方案 A 待补充' }}</p>
        <p>{{ selectedClass?.equipment?.b || '方案 B 待补充' }}</p>
      </section>

      <section class="equipment-panel">
        <div class="equipment-kicker">背景起始装备</div>
        <h2>{{ selectedBackground?.name ?? '未选择背景' }}</h2>
        <p>{{ selectedBackground?.equipment?.a || '方案 A 待补充' }}</p>
        <p>{{ selectedBackground?.equipment?.b || '方案 B 待补充' }}</p>
      </section>
    </main>

    <div class="equipment-finish-bar">
      <button class="equipment-finish-btn" type="button" @click="router.push('/hp')">
        设定生命值 →
      </button>
    </div>
  </div>
</template>

<style scoped>
.equipment-page {
  min-height: 100dvh;
  background:
    radial-gradient(ellipse at 16% 12%, rgba(160, 120, 60, 0.12), transparent 46%),
    radial-gradient(ellipse at 84% 18%, rgba(70, 110, 130, 0.12), transparent 44%),
    var(--bg);
  padding-bottom: 44px;
}

.equipment-header {
  padding: 42px 20px 20px;
  text-align: center;
}

.equipment-step-badge,
.equipment-kicker {
  font-family: var(--font-title);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
}

.equipment-step-badge {
  display: inline-block;
  font-size: 10px;
  border: 1px solid var(--border-gold);
  border-radius: 999px;
  padding: 4px 14px;
  background: rgba(201, 168, 76, 0.08);
  margin-bottom: 12px;
}

.equipment-title {
  font-family: var(--font-deco);
  font-size: clamp(25px, 5vw, 38px);
  color: var(--gold-bright);
}

.equipment-sub {
  max-width: 660px;
  margin: 8px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.equipment-layout {
  width: min(1120px, calc(100% - 32px));
  margin: 24px auto 0;
  display: grid;
  gap: 14px;
}

.equipment-panel {
  border: 1px solid var(--border-dark);
  background: rgba(19, 16, 42, 0.76);
  padding: 18px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
}

.equipment-panel-wide,
.equipment-panel-summary {
  grid-column: 1 / -1;
}

.equipment-kicker {
  font-size: 10px;
  margin-bottom: 8px;
}

.equipment-panel h2 {
  color: var(--gold-light);
  font-size: 22px;
  margin-bottom: 12px;
}

.equipment-panel p {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
  padding-top: 10px;
  border-top: 1px solid var(--border-dark);
}

.equipment-panel p + p {
  margin-top: 10px;
}

.equipment-ac-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  margin-bottom: 14px;
}

.equipment-ac-row p {
  border: 0;
  padding: 0;
}

.shield-toggle {
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(201, 168, 76, 0.35);
  background: rgba(201, 168, 76, 0.08);
  color: var(--gold-light);
  font-family: var(--font-title);
  cursor: pointer;
}

.shield-toggle.active {
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  color: #160E06;
}

.equipment-summary-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px 18px;
  color: var(--text-muted);
  font-size: 14px;
}

.equipment-summary-grid strong {
  color: var(--text);
  font-family: var(--font-title);
  font-weight: 500;
}

.equipment-warning {
  margin-top: 14px;
  color: #E9C46A !important;
  background: rgba(233, 196, 106, 0.08);
  border: 1px solid rgba(233, 196, 106, 0.22) !important;
  padding: 10px 12px !important;
}

.armor-grid {
  display: grid;
  gap: 10px;
}

.armor-card {
  min-height: 118px;
  text-align: left;
  border: 1px solid var(--border-dark);
  background: rgba(8, 7, 22, 0.38);
  padding: 14px;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}

.armor-card:active {
  transform: scale(0.99);
}

.armor-card.selected {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.12);
}

.armor-card.untrained:not(.selected) {
  opacity: 0.72;
}

.armor-name,
.armor-ac {
  display: block;
  font-family: var(--font-title);
}

.armor-name {
  font-size: 16px;
  color: var(--gold-light);
}

.armor-en,
.armor-meta {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 3px;
}

.armor-ac {
  font-size: 20px;
  margin-top: 10px;
}

.armor-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}

.armor-tags span {
  border: 1px solid rgba(201, 168, 76, 0.22);
  color: var(--gold);
  font-size: 11px;
  padding: 2px 6px;
}

.weapon-summary {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  border: 1px solid var(--border-dark);
  background: rgba(8, 7, 22, 0.28);
  padding: 10px 12px;
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 14px;
}

.weapon-summary strong {
  color: var(--gold-light);
  font-family: var(--font-title);
  font-weight: 500;
  text-align: right;
}

.weapon-groups {
  display: grid;
  gap: 18px;
}

.weapon-group h3 {
  color: var(--gold-light);
  font-size: 16px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--border-dark);
  padding-bottom: 8px;
}

.weapon-grid {
  display: grid;
  gap: 10px;
}

.weapon-card {
  min-height: 118px;
  text-align: left;
  border: 1px solid var(--border-dark);
  background: rgba(8, 7, 22, 0.38);
  padding: 14px;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}

.weapon-card:active {
  transform: scale(0.99);
}

.weapon-card.selected {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.12);
}

.weapon-card.untrained:not(.selected) {
  opacity: 0.72;
}

.weapon-name,
.weapon-damage {
  display: block;
  font-family: var(--font-title);
}

.weapon-name {
  font-size: 16px;
  color: var(--gold-light);
}

.weapon-en,
.weapon-meta {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 3px;
}

.weapon-damage {
  font-size: 18px;
  margin-top: 10px;
}

.weapon-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}

.weapon-tags span {
  border: 1px solid rgba(201, 168, 76, 0.22);
  color: var(--gold);
  font-size: 11px;
  padding: 2px 6px;
}

.equipment-finish-bar {
  padding: 16px 20px 32px;
  display: flex;
  justify-content: center;
}

.equipment-finish-btn {
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
  color: #1A0F05;
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  padding: 0 36px;
  border-radius: var(--r);
  min-height: 48px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.equipment-finish-btn:active {
  transform: scale(0.97);
}

@media (min-width: 720px) {
  .armor-grid,
  .weapon-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .equipment-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .armor-grid,
  .weapon-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
