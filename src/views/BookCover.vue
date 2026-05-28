<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import '../styles/book.css'

const router = useRouter()
const isOpening = ref(false)

function openScroll() {
  if (isOpening.value) return
  isOpening.value = true
  setTimeout(() => router.push('/setup'), 750)
}
</script>

<template>
  <div class="scroll-scene">
    <!-- 漂浮符文装饰 -->
    <span class="rune rune-1">ᚦ</span>
    <span class="rune rune-2">ᚠ</span>
    <span class="rune rune-3">ᚱ</span>
    <span class="rune rune-4">ᛟ</span>
    <span class="rune rune-5">ᚷ</span>
    <span class="rune rune-6">ᛉ</span>

    <p class="scroll-scene-label">命运羊皮卷 · Scroll of Destiny</p>

    <div
      class="cover-wrap"
      :class="{ furling: isOpening }"
      role="button"
      tabindex="0"
      aria-label="展开羊皮卷，开始角色创建"
      @click="openScroll"
      @keydown.enter="openScroll"
      @keydown.space.prevent="openScroll"
    >
      <!-- 顶部轴杆 -->
      <div class="cover-rod"></div>

      <!-- 羊皮纸正文 -->
      <div class="cover-parchment">
        <div class="cover-content">
          <div class="cover-ornament-top">✦ ── ✦ ── ✦</div>

          <!-- 剑与魔法徽章 -->
          <svg class="cover-emblem" viewBox="0 0 84 84" fill="none">
            <circle cx="42" cy="42" r="38" stroke="rgba(120,75,20,0.25)" stroke-width="1"/>
            <circle cx="42" cy="42" r="31" stroke="rgba(120,75,20,0.18)" stroke-width="1" stroke-dasharray="4 5"/>
            <!-- 主剑 纵向 -->
            <line x1="42" y1="10" x2="42" y2="62" stroke="rgba(70,38,8,0.75)" stroke-width="2" stroke-linecap="round"/>
            <!-- 护手 -->
            <line x1="29" y1="30" x2="55" y2="30" stroke="rgba(70,38,8,0.75)" stroke-width="2" stroke-linecap="round"/>
            <!-- 剑柄 -->
            <rect x="40" y="62" width="4" height="8" rx="1" fill="rgba(100,60,10,0.5)"/>
            <!-- 剑柄末球 -->
            <circle cx="42" cy="72" r="3.5" fill="none" stroke="rgba(100,60,10,0.6)" stroke-width="1.5"/>
            <!-- 左斜剑 -->
            <line x1="22" y1="20" x2="52" y2="58" stroke="rgba(100,60,10,0.3)" stroke-width="1.2" stroke-linecap="round"/>
            <!-- 右斜剑 -->
            <line x1="62" y1="20" x2="32" y2="58" stroke="rgba(100,60,10,0.3)" stroke-width="1.2" stroke-linecap="round"/>
            <!-- 魔法星芒 -->
            <polygon
              points="42,16 43.8,23 50,21 45.5,27 50,33 42,30 34,33 38.5,27 34,21 40.2,23"
              fill="rgba(100,60,10,0.15)"
              stroke="rgba(120,75,20,0.5)"
              stroke-width="0.8"
              stroke-linejoin="round"
            />
            <!-- 中心宝石 -->
            <circle cx="42" cy="30" r="3.5" fill="rgba(120,75,20,0.35)" stroke="rgba(80,45,10,0.6)" stroke-width="1"/>
            <circle cx="42" cy="30" r="1.5" fill="rgba(180,130,50,0.8)"/>
          </svg>

          <div class="cover-title">
            <span class="cover-title-main">命运羊皮卷</span>
            <span class="cover-title-sub">Dungeons &amp; Dragons · 5e</span>
          </div>

          <div class="cover-divider"></div>

          <p class="cover-lore">命运尚未书写，英雄的名字等待镌刻</p>

          <span class="cover-hint">✦ 点击展开 ✦</span>

          <div class="cover-ornament-bottom">── ✦ ──</div>
        </div>
      </div>

      <!-- 底部轴杆 -->
      <div class="cover-rod"></div>
    </div>

    <p class="scroll-scene-hint">触碰羊皮卷，开始你的冒险</p>
  </div>
</template>
