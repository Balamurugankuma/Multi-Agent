// ══════════════════════════════════════════════════════════
//  pages/Dashboard.jsx  —  Velverse AI + TaskFlow  v4.0
//  Combined dashboard: AI Squads + Task Management stats
// ══════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { userAPI, aiAPI, taskAPI, projectAPI } from '../api/api'
import '../styles/Dashboard.css'

const SQUADS = [
  { key:'software',  name:'Software Dev',     icon:'fa-cubes',       color:'#6366F1' },
  { key:'web',       name:'Web Dev',           icon:'fa-globe',       color:'#22C55E' },
  { key:'uiux',      name:'UI/UX Design',     icon:'fa-paint-brush', color:'#EC4B99' },
  { key:'marketing', name:'Digital Marketing', icon:'fa-bullseye',    color:'#FBBF24' },
  { key:'data',      name:'Data Analysis',    icon:'fa-chart-pie',   color:'#06B6D4' },
]

const NAV_LINKS = [
  ['/dashboard', 'fa-gauge',        'Dashboard'],
  ['/tasks',     'fa-check-square', 'Task Board'],
  ['/game',      'fa-gamepad',      'Squad Game'],
  ['/squads/software', 'fa-robot',  'AI Squads'],
  ['/pricing',   'fa-tag',          'Pricing'],
  ['/billing',   'fa-credit-card',  'Billing'],
  ['/community', 'fa-users',        'Community'],
]

export default function Dashboard() {
  const { user, logout, useBackend } = useAuth()
  const navigate = useNavigate()
  const [stats,    setStats   ] = useState({ totalChats:0, totalPayments:0 })
  const [agents,   setAgents  ] = useState([])
  const [history,  setHistory ] = useState([])
  const [taskStats,setTaskStats] = useState({ total:0, done:0, inProgress:0, overdue:0 })
  const [projects, setProjects] = useState([])
  const [loading,  setLoading ] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!useBackend) { setLoading(false); return }

    Promise.allSettled([
      userAPI.getProfile(),
      aiAPI.getAgents(),
      aiAPI.getHistory({ limit:5 }),
      taskAPI.getAll({ limit:200 }),
      projectAPI.getAll(),
    ]).then(([profRes, agentsRes, histRes, tasksRes, projRes]) => {
      if (profRes.status  === 'fulfilled') setStats(profRes.value.data?.stats || {})
      if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value.data?.agents || [])
      if (histRes.status  === 'fulfilled') setHistory(histRes.value.data?.history || [])
      if (projRes.status  === 'fulfilled') setProjects(projRes.value.data?.projects || [])
      if (tasksRes.status === 'fulfilled') {
        const tasks   = tasksRes.value.data?.tasks || []
        const now     = new Date()
        const done    = tasks.filter(t => t.status === 'done').length
        const inProg  = tasks.filter(t => t.status === 'in_progress').length
        const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length
        setTaskStats({ total: tasks.length, done, inProgress: inProg, overdue })
      }
    }).finally(() => setLoading(false))
  }, [user, useBackend])

  const handleLogout = () => { logout(); navigate('/') }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <i className="fas fa-circle-notch fa-spin" style={{ fontSize:'2rem', color:'var(--accent)' }} />
    </div>
  )

  return (
    <div className="dashboard">

      {/* ── Sidebar ───────────────────────────── */}
      <aside className="dash-sidebar">
        <Link to="/" className="dash-logo">
          <div className="dash-logo-mark"><i className="fas fa-robot" /></div>
          <span>VELVERSE AI</span>
        </Link>

        <nav className="dash-nav">
          {NAV_LINKS.map(([to, ic, lb]) => (
            <Link key={to} to={to} className="dash-nav-link">
              <i className={`fas ${ic}`} />{lb}
            </Link>
          ))}
        </nav>

        <div className="dash-user-chip">
          <div className="dash-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div>
            <div className="dash-uname">{user?.name}</div>
            <div className="dash-plan">{user?.plan || 'Starter'} Plan</div>
          </div>
        </div>
        <button className="dash-logout-btn" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt" /> Sign Out
        </button>
      </aside>

      {/* ── Main ──────────────────────────────── */}
      <main className="dash-main">

        {/* Topbar */}
        <div className="dash-topbar">
          <div>
            <h1 className="dash-greeting">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{ fontSize:'0.85rem', color:'var(--muted2)', marginTop:'0.2rem' }}>
              {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
            </p>
          </div>
          <div style={{ display:'flex', gap:'0.8rem', alignItems:'center' }}>
            {!useBackend && (
              <span style={{ fontSize:'0.75rem', color:'var(--accent)', background:'rgba(99,102,241,0.1)', padding:'0.3rem 0.7rem', borderRadius:'6px' }}>
                <i className="fas fa-circle-info" style={{ marginRight:'4px' }} />Demo Mode
              </span>
            )}
            <Link to="/billing" className="btn-primary dash-upgrade-btn">
              {user?.plan === 'Starter' ? 'Upgrade Plan' : `${user?.plan} Plan`}
            </Link>
          </div>
        </div>

        {/* ── AI Platform Stats ─────────────── */}
        <h2 className="dash-section-title">AI Platform</h2>
        <div className="dash-stats">
          {[
            { label:'AI Squads',     value:'5',                      icon:'fa-robot',    color:'#6366F1' },
            { label:'Chat Sessions', value:stats.totalChats || 0,    icon:'fa-comments', color:'#22C55E' },
            { label:'Payments',      value:stats.totalPayments || 0, icon:'fa-receipt',  color:'#FBBF24' },
            { label:'Your Plan',     value:user?.plan || 'Starter',  icon:'fa-crown',    color:'#EC4B99' },
          ].map(s => (
            <div key={s.label} className="dash-stat-card">
              <div className="dsc-icon" style={{ background:`${s.color}22`, color:s.color }}>
                <i className={`fas ${s.icon}`} />
              </div>
              <div className="dsc-value">{s.value}</div>
              <div className="dsc-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TaskFlow Stats ────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'1.8rem 0 0.9rem' }}>
          <h2 className="dash-section-title" style={{ margin:0 }}>Task Board</h2>
          <Link to="/tasks" style={{ fontSize:'0.82rem', color:'var(--accent)', fontWeight:600, display:'flex', alignItems:'center', gap:'5px' }}>
            Open Full Board <i className="fas fa-arrow-right" style={{ fontSize:'0.72rem' }} />
          </Link>
        </div>
        <div className="dash-stats">
          {[
            { label:'Total Tasks',   value:taskStats.total,      icon:'fa-list-check',  color:'#6366F1' },
            { label:'In Progress',   value:taskStats.inProgress, icon:'fa-spinner',     color:'#818CF8' },
            { label:'Completed',     value:taskStats.done,       icon:'fa-circle-check',color:'#22C55E' },
            { label:'Overdue',       value:taskStats.overdue,    icon:'fa-clock',       color: taskStats.overdue > 0 ? '#EF4444' : '#6b6b78' },
          ].map(s => (
            <div key={s.label} className="dash-stat-card" style={{ cursor:'pointer' }} onClick={() => navigate('/tasks')}>
              <div className="dsc-icon" style={{ background:`${s.color}22`, color:s.color }}>
                <i className={`fas ${s.icon}`} />
              </div>
              <div className="dsc-value" style={{ color:s.color === '#EF4444' && s.value > 0 ? s.color : undefined }}>
                {s.value}
              </div>
              <div className="dsc-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Projects quick view */}
        {projects.length > 0 && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'1.8rem 0 0.9rem' }}>
              <h2 className="dash-section-title" style={{ margin:0 }}>Recent Projects</h2>
              <Link to="/tasks" style={{ fontSize:'0.82rem', color:'var(--accent)', fontWeight:600 }}>View all →</Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'0.8rem' }}>
              {projects.slice(0, 4).map(p => (
                <Link key={p._id} to="/tasks" style={{ textDecoration:'none' }}>
                  <div style={{
                    background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)',
                    padding:'1rem', cursor:'pointer', transition:'border-color 0.18s',
                    borderLeft:`3px solid ${p.color || 'var(--accent)'}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = p.color || 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--white)', marginBottom:'0.3rem' }}>{p.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--muted2)' }}>
                      {p.doneCount || 0}/{p.taskCount || 0} tasks done
                    </div>
                    {p.taskCount > 0 && (
                      <div style={{ marginTop:'0.6rem', height:'3px', background:'var(--border)', borderRadius:'2px', overflow:'hidden' }}>
                        <div style={{ height:'100%', background:p.color||'var(--accent)', borderRadius:'2px', width:`${Math.round(((p.doneCount||0)/(p.taskCount||1))*100)}%`, transition:'width 0.4s' }} />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              <Link to="/tasks" style={{ textDecoration:'none' }}>
                <div style={{
                  background:'var(--card)', border:'1.5px dashed var(--border)', borderRadius:'var(--r)',
                  padding:'1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  gap:'0.5rem', color:'var(--muted)', fontSize:'0.85rem', minHeight:'80px', transition:'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)' }}
                >
                  <i className="fas fa-plus" /> New Project
                </div>
              </Link>
            </div>
          </>
        )}

        {/* ── AI Squads ─────────────────────── */}
        <h2 className="dash-section-title">AI Squads</h2>
        <div className="dash-squads">
          {SQUADS.map(sq => {
            const agent = agents.find(a => a.key === sq.key)
            return (
              <Link key={sq.key} to={`/squads/${sq.key}`} className="dash-squad-card">
                <div className="dsc-squad-icon" style={{ background:`${sq.color}22`, color:sq.color }}>
                  <i className={`fas ${sq.icon}`} />
                </div>
                <div className="dsc-squad-name">{sq.name}</div>
                <div className={`dsc-squad-status ${agent?.configured ? 'online' : 'sim'}`}>
                  <span className="dot" />
                  {agent?.configured ? 'Live' : 'Simulation'}
                </div>
                <div className="dsc-squad-cta">Open Squad →</div>
              </Link>
            )
          })}
        </div>

        {/* ── Recent Activity ────────────────── */}
        {history.length > 0 && (
          <>
            <h2 className="dash-section-title">Recent AI Activity</h2>
            <div className="dash-activity">
              {history.map((h, i) => (
                <div key={i} className="dash-activity-row">
                  <div className="dar-agent">{h.agentType}</div>
                  <div className="dar-msg">{h.message?.slice(0, 80)}…</div>
                  <div className="dar-time">
                    {new Date(h.timestamp).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </main>
    </div>
  )
}
