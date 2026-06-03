// 魔法火焰粒子引擎（零依赖，纯 Canvas 2D）
// 三类粒子：火苗（蓝紫上飘）、符文火星（亮点飞散）、灰烬（暗色缓飘淡出）。
// 颜色与法术书学派环色（SCHOOL_RING_COLORS）的蓝紫系呼应。

const FLAME_COLORS = ['#cf9eff', '#9461aa', '#62b9e8', '#b994d6', '#e7e0ff']
const EMBER_COLORS = ['#f7e7ff', '#cf9eff', '#9fdcff']
const ASH_COLORS = ['#4e4b57', '#2a2630', '#6a5f78']

const TAU = Math.PI * 2

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

// 单个粒子：用极简物理（速度 + 重力/浮力 + 阻力），生命周期内淡出。
class Particle {
  constructor(x, y, options) {
    this.x = x
    this.y = y
    this.vx = options.vx
    this.vy = options.vy
    this.gravity = options.gravity // 正=下坠，负=上飘
    this.drag = options.drag ?? 0.96
    this.size = options.size
    this.shrink = options.shrink ?? 0.97
    this.color = options.color
    this.kind = options.kind // 'flame' | 'ember' | 'ash'
    this.life = options.life
    this.maxLife = options.life
  }

  update(dt) {
    // dt 以 16.67ms（60fps）为 1 单位归一化，保证不同帧率观感一致。
    const step = dt / 16.67
    this.vx *= this.drag
    this.vy = this.vy * this.drag + this.gravity * step
    this.x += this.vx * step
    this.y += this.vy * step
    this.size *= Math.pow(this.shrink, step)
    this.life -= dt
  }

  get alive() {
    return this.life > 0 && this.size > 0.4
  }

  draw(ctx) {
    const t = Math.max(0, this.life / this.maxLife)
    ctx.globalAlpha = this.kind === 'ash' ? t * 0.7 : t
    if (this.kind === 'flame') {
      // 火苗用径向渐变，中心亮、边缘透明，叠加为发光体。
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size)
      grad.addColorStop(0, this.color)
      grad.addColorStop(1, 'rgba(20, 8, 40, 0)')
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = this.color
    }
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, TAU)
    ctx.fill()
  }
}

// 发射器：持有粒子池，提供点燃/推进/绘制。封顶粒子数防止连点卡顿。
export class FlameEmitter {
  constructor(maxParticles = 600) {
    this.particles = []
    this.maxParticles = maxParticles
  }

  get active() {
    return this.particles.length > 0
  }

  add(particle) {
    if (this.particles.length >= this.maxParticles) return
    this.particles.push(particle)
  }

  // 小火：在 (x,y) 点燃一团魔法火焰，烧掉一颗宝石。
  burstGem(x, y, radius = 13) {
    for (let i = 0; i < 26; i += 1) {
      const angle = rand(0, TAU)
      const dist = rand(0, radius)
      this.add(new Particle(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, {
        vx: rand(-0.6, 0.6),
        vy: rand(-2.4, -0.8),
        gravity: -0.05,
        size: rand(5, 11),
        shrink: 0.93,
        color: pick(FLAME_COLORS),
        kind: 'flame',
        life: rand(420, 720),
      }))
    }
    for (let i = 0; i < 14; i += 1) {
      const angle = rand(0, TAU)
      this.add(new Particle(x, y, {
        vx: Math.cos(angle) * rand(0.8, 3.2),
        vy: Math.sin(angle) * rand(0.8, 3.2) - 1,
        gravity: 0.04,
        size: rand(1, 2.6),
        shrink: 0.99,
        color: pick(EMBER_COLORS),
        kind: 'ember',
        life: rand(500, 900),
      }))
    }
    for (let i = 0; i < 6; i += 1) {
      this.add(new Particle(x + rand(-6, 6), y, {
        vx: rand(-0.3, 0.3),
        vy: rand(-1.2, -0.4),
        gravity: -0.02,
        size: rand(2, 4),
        shrink: 0.995,
        color: pick(ASH_COLORS),
        kind: 'ash',
        life: rand(900, 1500),
      }))
    }
  }

  // 蔓延：沿底部一整条横向点燃，强力向上冲，用于某环法术位全部耗尽。
  // height = 画布高度，决定火焰要冲多高（约半屏）。
  burstSweep(baseY, width, height, offsetX = 0) {
    const columns = Math.min(72, Math.max(24, Math.floor(width / 7)))
    // 目标冲高约半个画面：用更大的向上初速 + 长寿命 + 接近 1 的阻力，让火焰持续攀升。
    const rise = Math.max(4, height * 0.011)
    for (let c = 0; c < columns; c += 1) {
      const x = offsetX + (width / columns) * c + rand(-4, 4)
      for (let i = 0; i < 3; i += 1) {
        this.add(new Particle(x, baseY + rand(-8, 4), {
          vx: rand(-0.6, 0.6),
          vy: -rise * rand(0.7, 1.25),
          gravity: -0.02,
          drag: 0.985,
          size: rand(10, 22),
          shrink: 0.965,
          color: pick(FLAME_COLORS),
          kind: 'flame',
          life: rand(1000, 1700),
        }))
      }
      if (c % 2 === 0) {
        this.add(new Particle(x, baseY, {
          vx: rand(-1.6, 1.6),
          vy: -rise * rand(0.9, 1.5),
          gravity: 0.02,
          drag: 0.99,
          size: rand(1.6, 3.4),
          shrink: 0.992,
          color: pick(EMBER_COLORS),
          kind: 'ember',
          life: rand(1100, 1800),
        }))
      }
      if (c % 4 === 0) {
        this.add(new Particle(x, baseY, {
          vx: rand(-0.6, 0.6),
          vy: -rise * rand(0.4, 0.8),
          gravity: -0.01,
          drag: 0.99,
          size: rand(3, 6),
          shrink: 0.998,
          color: pick(ASH_COLORS),
          kind: 'ash',
          life: rand(1500, 2400),
        }))
      }
    }
  }

  update(dt) {
    for (const p of this.particles) p.update(dt)
    this.particles = this.particles.filter(p => p.alive)
  }

  draw(ctx) {
    // 火苗/火星用叠加混合，营造发光；灰烬用普通混合。
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      if (p.kind === 'ash') continue
      p.draw(ctx)
    }
    ctx.globalCompositeOperation = 'source-over'
    for (const p of this.particles) {
      if (p.kind !== 'ash') continue
      p.draw(ctx)
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }

  clear() {
    this.particles.length = 0
  }
}
