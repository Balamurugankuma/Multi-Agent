import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Auth.css'

export default function Login() {
  const [params]        = useSearchParams()
  const [tab, setTab]   = useState(params.get('tab') === 'signup' ? 'signup' : 'login')
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [error, setErr] = useState('')
  const [busy,  setBusy] = useState(false)

  const { login, register, loginWithGoogle, isLoggedIn, useBackend } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (isLoggedIn) navigate('/dashboard', { replace:true }) }, [isLoggedIn])

  // Load Google Identity Services
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || clientId.includes('your_')) return
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => {
      window.google?.accounts.id.initialize({ client_id: clientId, callback: handleGoogle })
      window.google?.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme:'filled_black', size:'large', width:340, text:'continue_with' }
      )
    }
    document.body.appendChild(s)
    return () => { try { document.body.removeChild(s) } catch {} }
  }, [])

  const field = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const goTab = t => { setTab(t); setErr('') }

  const finish = res => {
    if (res.success) { navigate('/dashboard'); return }
    const m = res.error || 'Something went wrong'
    if (m.includes('Invalid email') || m.includes('wrong-password')) setErr('Incorrect email or password.')
    else if (m.includes('already registered') || m.includes('exists'))  setErr('Email already registered. Sign in instead.')
    else if (m.includes('6'))   setErr('Password must be at least 6 characters.')
    else                        setErr(m)
  }

  const doLogin  = async e => {
    e.preventDefault(); setErr('')
    if (!form.email || !form.password) return setErr('Please fill in all fields.')
    setBusy(true); finish(await login(form.email, form.password)); setBusy(false)
  }
  const doSignup = async e => {
    e.preventDefault(); setErr('')
    if (!form.name || !form.email || !form.password) return setErr('Please fill in all fields.')
    if (form.password !== form.confirm) return setErr('Passwords do not match.')
    if (form.password.length < 6) return setErr('Password must be at least 6 characters.')
    setBusy(true); finish(await register(form.name, form.email, form.password)); setBusy(false)
  }
  const handleGoogle = async (response) => {
    setBusy(true); setErr('')
    finish(await loginWithGoogle(response.credential)); setBusy(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <div className="auth-logo-mark"><i className="fas fa-robot" /></div>
          VELVERSE AI
        </Link>
        <div style={{marginBottom:'1.6rem'}}>
          <h1 style={{fontSize:'1.32rem',fontWeight:800,color:'var(--white)',marginBottom:'0.28rem',letterSpacing:'-0.03em'}}>
            {tab==='login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{fontSize:'0.84rem',color:'var(--muted2)',lineHeight:1.5}}>
            {tab==='login' ? 'Sign in to access your AI squads and dashboard.' : 'Get started free — no credit card required.'}
          </p>
          {!useBackend && (
            <p style={{fontSize:'0.76rem',color:'var(--accent)',marginTop:'0.4rem',background:'var(--accent-bg)',padding:'0.3rem 0.6rem',borderRadius:'5px'}}>
              <i className="fas fa-circle-info" style={{marginRight:'4px'}} />Demo mode — backend not connected
            </p>
          )}
        </div>

        {error && <div className="auth-error"><i className="fas fa-circle-exclamation" /> {error}</div>}

        <div id="google-btn" style={{marginBottom:'0.5rem',minHeight:'44px',display:'flex',justifyContent:'center'}} />
        <div className="auth-or"><span>or continue with email</span></div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab==='login'?' active':''}`}  onClick={() => goTab('login')}>Sign In</button>
          <button className={`auth-tab${tab==='signup'?' active':''}`} onClick={() => goTab('signup')}>Create Account</button>
        </div>

        {tab === 'login' && (
          <form className="auth-form" onSubmit={doLogin} noValidate>
            <div className="auth-field">
              <label className="form-label">Email address</label>
              <input name="email" type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={field} autoComplete="email" />
            </div>
            <div className="auth-field">
              <label className="form-label">Password</label>
              <input name="password" type="password" className="form-input" placeholder="••••••••"
                value={form.password} onChange={field} autoComplete="current-password" />
            </div>
            <div className="auth-forgot"><a href="#">Forgot password?</a></div>
            <button type="submit" className="btn-primary auth-submit" disabled={busy}>
              {busy ? <><i className="fas fa-circle-notch fa-spin" /> Signing in…</> : <><i className="fas fa-arrow-right-to-bracket" /> Sign In</>}
            </button>
            <p className="auth-terms">Don't have an account? <a href="#" onClick={e=>{e.preventDefault();goTab('signup')}}>Create one free →</a></p>
          </form>
        )}

        {tab === 'signup' && (
          <form className="auth-form" onSubmit={doSignup} noValidate>
            <div className="auth-field">
              <label className="form-label">Full name</label>
              <input name="name" type="text" className="form-input" placeholder="Your full name"
                value={form.name} onChange={field} autoComplete="name" />
            </div>
            <div className="auth-field">
              <label className="form-label">Email address</label>
              <input name="email" type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={field} autoComplete="email" />
            </div>
            <div className="auth-row">
              <div>
                <label className="form-label">Password</label>
                <input name="password" type="password" className="form-input" placeholder="Min 6 chars"
                  value={form.password} onChange={field} autoComplete="new-password" />
              </div>
              <div>
                <label className="form-label">Confirm</label>
                <input name="confirm" type="password" className="form-input" placeholder="Repeat"
                  value={form.confirm} onChange={field} autoComplete="new-password" />
              </div>
            </div>
            <button type="submit" className="btn-primary auth-submit" disabled={busy}>
              {busy ? <><i className="fas fa-circle-notch fa-spin" /> Creating account…</> : <><i className="fas fa-user-plus" /> Create Free Account</>}
            </button>
            <p className="auth-terms">By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</p>
          </form>
        )}
      </div>
    </div>
  )
}
