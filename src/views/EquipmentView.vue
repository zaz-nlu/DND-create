<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { backgrounds } from '../data/backgrounds.js'
import { classes } from '../data/classes.js'
import { character } from '../store/character.js'
import StepNav from './StepNav.vue'
import AbilityBar from '../components/AbilityBar.vue'

const router = useRouter()

const selectedClass = computed(() =>
  classes.find(cls => cls.id === character.class.id) ?? null
)

const selectedBackground = computed(() =>
  backgrounds.find(background => background.id === character.background.id) ?? null
)
</script>

<template>
  <div class="equipment-page">
    <StepNav step="10 / 10" label="装备占位" back-to="/hp" />
    <AbilityBar />

    <header class="equipment-header">
      <div class="equipment-step-badge">步骤 10 / 10 · 装备</div>
      <h1 class="equipment-title">装备清单稍后整理</h1>
      <p class="equipment-sub">流程已经能走到终点。下一轮可以把职业装备、背景装备和金币方案拆成可选择项。</p>
    </header>

    <main class="equipment-layout">
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

      <section class="equipment-panel equipment-panel-summary">
        <div class="equipment-kicker">角色草稿</div>
        <h2>{{ character.name || '未命名角色' }}</h2>
        <div class="equipment-summary-grid">
          <span>等级</span><strong>Lv.{{ character.level }}</strong>
          <span>属性方式</span><strong>{{ character.abilities.method || '未选择' }}</strong>
          <span>最大生命值</span><strong>{{ character.hp.max || '未计算' }}</strong>
        </div>
      </section>
    </main>

    <div class="equipment-finish-bar">
      <button class="equipment-finish-btn" type="button" @click="router.push('/sheet')">
        查看角色卡 →
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
  max-width: 620px;
  margin: 8px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.equipment-layout {
  width: min(1080px, calc(100% - 32px));
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

@media (min-width: 820px) {
  .equipment-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .equipment-panel-summary {
    grid-column: 1 / -1;
  }
}
</style>
