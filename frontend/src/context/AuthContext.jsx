// ═══════════════════════════════════════════════════════
//  context/AuthContext.jsx  —  Velverse AI
//  Auth backed by Node.js + JWT (not Firebase)
//  Dual mode: real backend when available, localStorage mock otherwise
// ═══════════════════════════════════════════════════════
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, userAPI } from '../api/api'

export const FLOWISE_ENDPOINTS = {
  software:  'https://cloud.flowiseai.com/api/v1/prediction/009c3c44-c388-4734-bf25-3fe82655778c',
  web:       'https://cloud.flowiseai.com/api/v1/prediction/REPLACE_WEB_DEV_ENDPOINT',
  uiux:      'https://cloud.flowiseai.com/api/v1/prediction/REPLACE_UIUX_ENDPOINT',
  marketing: 'https://cloud.flowiseai.com/api/v1/prediction/REPLACE_MARKETING_ENDPOINT',
  data:      'https://cloud.flowiseai.com/api/v1/prediction/REPLACE_DATA_ANALYSIS_ENDPOINT',
}

const AuthCtx = createContext(null)

const save  = (t, u) => { localStorage.setItem('vv_token', t); localStorage.setItem('vv_user', JSON.stringify(u)) }
const clear = ()     => { localStorage.removeItem('vv_token'); localStorage.removeItem('vv_user') }
const saved = ()     => { try { return JSON.parse(localStorage.getItem('vv_user')) } catch { return null } }

// Check if backend is reachable
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const isBackendMode = () => BACKEND_URL.includes('localhost') || BACKEND_URL.startsWith('http')

export function AuthProvider({ children }) {
  const [user,    setUser   ] = useState(saved)
  const [loading, setLoading] = useState(true)
  const [useBackend, setUseBackend] = useState(true)

  const isLoggedIn = !!user

  useEffect(() => {
    const token = localStorage.getItem('vv_token')
    if (!token) { setLoading(false); return }

    authAPI.getMe()
      .then(({ user: u }) => { setUser(u); localStorage.setItem('vv_user', JSON.stringify(u)); setUseBackend(true) })
      .catch(() => {
        // Backend unavailable — fall back to localStorage mock
        const saved_user = saved()
        if (saved_user) { setUser(saved_user); setUseBackend(false) }
        else { clear(); setUser(null) }
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Register ──────────────────────────────────────────
  const register = async (name, email, password) => {
    try {
      if (useBackend) {
        const { token, user: u } = await authAPI.signup({ name, email, password })
        save(token, u); setUser(u)
      } else {
        // Mock mode
        const mock = { _id: Date.now().toString(), name, email, plan: 'Starter', role: 'user' }
        save('mock_token_' + Date.now(), mock); setUser(mock)
      }
      return { success: true }
    } catch (e) { return { success: false, error: e.message } }
  }

  // ── Login ─────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      if (useBackend) {
        const { token, user: u } = await authAPI.login({ email, password })
        save(token, u); setUser(u)
      } else {
        const mock = { _id: Date.now().toString(), name: email.split('@')[0], email, plan: 'Starter', role: 'user' }
        save('mock_' + Date.now(), mock); setUser(mock)
      }
      return { success: true }
    } catch (e) { return { success: false, error: e.message } }
  }

  // ── Google OAuth ──────────────────────────────────────
  const loginWithGoogle = async (idToken) => {
    try {
      const { token, user: u } = await authAPI.googleAuth(idToken)
      save(token, u); setUser(u)
      return { success: true }
    } catch (e) { return { success: false, error: e.message } }
  }

  const logout     = useCallback(() => { clear(); setUser(null) }, [])
  const updatePlan = useCallback((plan) => {
    setUser(p => { const u = { ...p, plan }; localStorage.setItem('vv_user', JSON.stringify(u)); return u })
  }, [])
  const refreshUser = useCallback(async () => {
    try {
      const { user: u } = await userAPI.getProfile()
      setUser(u); localStorage.setItem('vv_user', JSON.stringify(u))
    } catch {}
  }, [])

  return (
    <AuthCtx.Provider value={{
      user, loading, isLoggedIn, useBackend,
      register, login, loginWithGoogle, logout, updatePlan, refreshUser,
      FLOWISE_ENDPOINTS,
      // Legacy compat
      isFirebaseMode: false,
      loginWithGithub: async () => ({ success: false, error: 'GitHub OAuth requires backend config' }),
    }}>
      {!loading && children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
