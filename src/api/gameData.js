const BASE = import.meta.env.VITE_API_URL ?? ''

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(6000),
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` }
}

// ─── 公开读取（有超时保护，失败返回空数组） ───────────────────────────────

async function fetchOverrides(type) {
  try {
    return await apiFetch(`/api/${type}s`)
  } catch {
    return []
  }
}

export const fetchRaceOverrides       = () => fetchOverrides('race')
export const fetchBackgroundOverrides = () => fetchOverrides('background')
export const fetchClassOverrides      = () => fetchOverrides('class')

// ─── 管理员操作 ───────────────────────────────────────────────────────────

export async function adminLogin(password) {
  const data = await apiFetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
  return data.token
}

export async function adminSave(type, id, payload, token) {
  return apiFetch(`/api/${type}s/${id}`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify(payload),
  })
}

export async function adminDelete(type, id, token) {
  return apiFetch(`/api/${type}s/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
}

export async function adminChangePassword(newPassword, token) {
  return apiFetch('/api/admin/change-password', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ newPassword }),
  })
}
