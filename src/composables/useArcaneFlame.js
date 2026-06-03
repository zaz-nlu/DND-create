// 法术书火焰特效桥接：管理覆盖层 canvas、rAF 循环与生命周期。
// 暴露 igniteGem（小火烧宝石）/ igniteSweep（底部蔓延）给组件调用。
import { onMounted, onUnmounted, ref } from 'vue'
import { FlameEmitter } from '../utils/flameParticles.js'

// 尊重系统“减少动态效果”偏好；此时完全跳过 canvas 特效，由 CSS 降级兜底。
function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function useArcaneFlame(canvasRef) {
  const enabled = ref(false)
  const emitter = new FlameEmitter()
  let ctx = null
  let rafId = null
  let lastTime = 0
  let dpr = 1
  // 空环蔓延时的“书页变暗”余烬幕：0=无，1=最暗，自动衰减。
  let veil = 0

  function resize() {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
  }

  // 把页面坐标（getBoundingClientRect）换算到 canvas 内部坐标。
  function toLocal(clientX, clientY) {
    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    return { x: (clientX - rect.left) * dpr, y: (clientY - rect.top) * dpr }
  }

  function tick(now) {
    const dt = lastTime ? Math.min(now - lastTime, 48) : 16.67
    lastTime = now
    emitter.update(dt)
    if (veil > 0) veil = Math.max(0, veil - dt / 1100)
    const canvas = canvasRef.value
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // 先铺一层从底部升起的暗色余烬幕，让魔法火焰在亮羊皮纸上更醒目。
      if (veil > 0) {
        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.35)
        grad.addColorStop(0, `rgba(28, 10, 44, ${0.6 * veil})`)
        grad.addColorStop(1, 'rgba(28, 10, 44, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      emitter.draw(ctx)
    }
    if (emitter.active || veil > 0) {
      rafId = requestAnimationFrame(tick)
    } else {
      rafId = null
      lastTime = 0
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // 无粒子时 rAF 自动停转，点燃时按需重启。
  function ensureRunning() {
    if (rafId == null) {
      lastTime = 0
      rafId = requestAnimationFrame(tick)
    }
  }

  function igniteGem(clientX, clientY) {
    if (!enabled.value) return
    resize()
    const { x, y } = toLocal(clientX, clientY)
    emitter.burstGem(x, y, 13 * dpr)
    ensureRunning()
  }

  function igniteSweep() {
    if (!enabled.value) return
    resize()
    const canvas = canvasRef.value
    if (!canvas) return
    emitter.burstSweep(canvas.height, canvas.width, canvas.height, 0)
    veil = 1
    ensureRunning()
  }

  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas || prefersReducedMotion()) return
    ctx = canvas.getContext('2d')
    if (!ctx) return // 无 2D 上下文则保持 enabled=false，走 CSS 降级
    enabled.value = true
    resize()
    window.addEventListener('resize', resize)
  })

  onUnmounted(() => {
    if (rafId != null) cancelAnimationFrame(rafId)
    rafId = null
    emitter.clear()
    window.removeEventListener('resize', resize)
  })

  return { enabled, igniteGem, igniteSweep }
}
