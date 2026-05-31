const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Database = require('better-sqlite3')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'dnd-jwt-secret-please-change-in-production'
const TYPES = ['race', 'background', 'class']

// 图片上传目录
const UPLOADS_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR)

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)
    cb(ok ? null : new Error('只支持 jpg/png/gif/webp 格式'), ok)
  },
})

// 数据库初始化
const db = new Database(path.join(__dirname, 'game-data.db'))
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS overrides (
    type TEXT NOT NULL,
    id   TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (type, id)
  );
`)

// 首次运行自动设置默认密码 admin123
;(async () => {
  const existing = db.prepare("SELECT 1 FROM settings WHERE key = 'password_hash'").get()
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10)
    db.prepare("INSERT INTO settings (key, value) VALUES ('password_hash', ?)").run(hash)
    console.log('已设置默认管理员密码：admin123，请登录后立即修改！')
  }
})()

const app = express()
app.use(cors())
app.use(express.json({ limit: '4mb' }))

// 静态托管上传的图片
app.use('/uploads', express.static(UPLOADS_DIR))

// 健康检查
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// 管理员登录
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body || {}
  if (!password) return res.status(400).json({ error: '请输入密码' })
  const row = db.prepare("SELECT value FROM settings WHERE key = 'password_hash'").get()
  if (!row) return res.status(500).json({ error: '服务器配置错误' })
  const valid = await bcrypt.compare(password, row.value)
  if (!valid) return res.status(401).json({ error: '密码错误' })
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token })
})

// 修改密码
app.post('/api/admin/change-password', verifyAdmin, async (req, res) => {
  const { newPassword } = req.body || {}
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '密码至少需要 6 位' })
  }
  const hash = await bcrypt.hash(newPassword, 10)
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('password_hash', ?)").run(hash)
  res.json({ ok: true })
})

function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: '未授权，请先登录' })
  try {
    jwt.verify(auth.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token 无效或已过期，请重新登录' })
  }
}

// 图片上传接口（需要登录）
app.post('/api/upload', verifyAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择图片文件' })
  const url = `/uploads/${req.file.filename}`
  res.json({ url })
})

// 为每个数据类型注册 CRUD 路由
for (const type of TYPES) {
  const plural = `${type}s`

  // 获取所有该类型的覆盖数据
  app.get(`/api/${plural}`, (_req, res) => {
    const rows = db.prepare('SELECT id, data FROM overrides WHERE type = ?').all(type)
    const result = rows.map(row => {
      const parsed = JSON.parse(row.data)
      return { ...parsed, id: row.id }
    })
    res.json(result)
  })

  // 创建或更新一条覆盖数据
  app.put(`/api/${plural}/:id`, verifyAdmin, (req, res) => {
    const { id } = req.params
    const data = JSON.stringify({ ...req.body, id })
    db.prepare(`
      INSERT INTO overrides (type, id, data, updated_at)
      VALUES (?, ?, ?, unixepoch())
      ON CONFLICT(type, id) DO UPDATE
        SET data = excluded.data, updated_at = unixepoch()
    `).run(type, id, data)
    res.json({ ok: true })
  })

  // 删除覆盖数据（恢复为前端默认）
  app.delete(`/api/${plural}/:id`, verifyAdmin, (req, res) => {
    db.prepare('DELETE FROM overrides WHERE type = ? AND id = ?').run(type, req.params.id)
    res.json({ ok: true })
  })
}

app.listen(PORT, () => {
  console.log(`DnD API 服务运行在端口 ${PORT}`)
})
