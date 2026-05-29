<template>
  <div class="html-exporter">
    <button class="export-btn" type="button" @click="router.push('/print')">
      打开 HTML 角色卡
    </button>
    <span class="export-note">进入后可用浏览器打印，选择“另存为 PDF”。</span>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.html-exporter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.export-btn {
  border: 1px solid rgba(201, 168, 76, 0.42);
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  color: #160e06;
  border-radius: 6px;
  padding: 9px 18px;
  font-family: var(--font-title);
  font-weight: 700;
  cursor: pointer;
}

.export-btn:active {
  transform: scale(0.98);
}

.export-note {
  color: var(--text-muted);
  font-size: 13px;
}
</style>
