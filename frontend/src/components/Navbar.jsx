import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Navbar.css'

const NAV_LINKS = [
  { label:'Home',       to:'/' },
  { label:'Squads',     to:'/squads/software' },
  { label:'Pricing',    to:'/pricing' },
  { label:'Community',  to:'/community' },
  { label:'Stories',    to:'/success-stories' },
  { label:'Task Board', to:'/tasks' },
  { label:'🎮 Game',    to:'/game' },
]

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth()
  const [scrolled, setScrolled]      = useState(false)
  const [open, setOpen]              = useState(false)
  const location = useLocation()
  const navigate  = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => setOpen(false), [location])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <img src="/logo.png" alt="Velverse AI" className="nav-logo-img" />
            <span className="nav-logo-text">VELVERSE AI</span>
          </Link>

          <ul className="nav-links">
            {NAV_LINKS.map(l => (
              <li key={l.to}>
                <Link to={l.to} className={location.pathname === l.to ? 'active' : ''}>{l.label}</Link>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="nav-user-chip">
                  <div className="nav-avatar">{(user?.name?.[0] || 'U').toUpperCase()}</div>
                  {user?.name?.split(' ')[0] || 'Dashboard'}
                </Link>
                <button className="nav-logout-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Log in</Link>
                <Link to="/login" className="btn-primary">Get Access</Link>
              </>
            )}
          </div>

          <button
            className={`nav-hamburger${open ? ' open' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`nav-drawer${open ? ' open' : ''}`}>
        {NAV_LINKS.map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}
        <div className="nav-drawer-divider" />
        <div className="nav-drawer-actions">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="btn-accent-outline" style={{justifyContent:'center'}}>Dashboard</Link>
              <button className="nav-logout-btn" onClick={handleLogout} style={{width:'100%',padding:'0.75rem'}}>
                <i className="fas fa-sign-out-alt" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost" style={{justifyContent:'center'}}>Log in</Link>
              <Link to="/login" className="btn-primary" style={{justifyContent:'center'}}>Get Access</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
