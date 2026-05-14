// ═══════════════════════════════════════════════════════
//  src/api/api.js  —  Velverse AI  Central API Client
//  All HTTP calls go through this module.
//  JWT is automatically attached on every request.
// ═══════════════════════════════════════════════════════
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({ baseURL: BASE, timeout: 60000 })

// ── Attach JWT on every request ───────────────────────
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vv_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ── Global error handling + auto-logout on 401 ────────
api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || err.message || 'Network error'
    if (err.response?.status === 401) {
      localStorage.removeItem('vv_token')
      localStorage.removeItem('vv_user')
      window.location.href = '/login'
    }
    return Promise.reject({ success: false, message: msg, status: err.response?.status })
  }
)

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  signup:     d     => api.post('/auth/signup', d),
  login:      d     => api.post('/auth/login',  d),
  googleAuth: token => api.post('/auth/google', { idToken: token }),
  getMe:      ()    => api.get('/auth/me'),
}

// ── User ──────────────────────────────────────────────
export const userAPI = {
  getProfile:     ()  => api.get('/user/profile'),
  updateProfile:  d   => api.put('/user/profile', d),
  changePassword: d   => api.put('/user/change-password', d),
  getPayments:    ()  => api.get('/user/payments'),
}

// ── Payment (Razorpay) ────────────────────────────────
export const paymentAPI = {
  createOrder:    d => api.post('/payment/razorpay/create-order', d),
  verifyPayment:  d => api.post('/payment/razorpay/verify', d),
  getHistory:     () => api.get('/payment/history'),
}

// ── AI Squads ─────────────────────────────────────────
export const aiAPI = {
  chat:         d      => api.post('/ai/chat', d),
  getHistory:   params => api.get('/ai/history', { params }),
  clearHistory: params => api.delete('/ai/history', { params }),
  getAgents:    ()     => api.get('/ai/agents'),
}

// ── Services ──────────────────────────────────────────
export const servicesAPI = {
  getAll:  () => api.get('/services'),
  getById: id => api.get(`/services/${id}`),
}

// ── ZIP Download ──────────────────────────────────────
export const zipAPI = {
  preview:  (params) => api.get('/zip/preview', { params }),
  generate: (data)   => api.post('/zip/generate', data, {
    responseType: 'blob',
    timeout: 120000,
  }),
}

// ── TaskFlow: Projects ────────────────────────────────
export const projectAPI = {
  getAll:  ()       => api.get('/projects'),
  getOne:  (id)     => api.get(`/projects/${id}`),
  create:  (d)      => api.post('/projects', d),
  update:  (id, d)  => api.put(`/projects/${id}`, d),
  delete:  (id)     => api.delete(`/projects/${id}`),
}

// ── TaskFlow: Tasks ───────────────────────────────────
export const taskAPI = {
  getAll:       (params) => api.get('/tasks', { params }),
  getOne:       (id)     => api.get(`/tasks/${id}`),
  create:       (d)      => api.post('/tasks', d),
  update:       (id, d)  => api.put(`/tasks/${id}`, d),
  updateStatus: (id, s)  => api.patch(`/tasks/${id}/status`, { status: s }),
  delete:       (id)     => api.delete(`/tasks/${id}`),
}

export default api
