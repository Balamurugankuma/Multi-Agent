// ══════════════════════════════════════════════════════════
//  pages/Tasks.jsx  —  Velverse AI + TaskFlow
//  Full kanban board embedded inside the Velverse dashboard
// ══════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { useAuth }      from '../context/AuthContext'
import { useProjects }  from '../hooks/useProjects'
import { useTasks }     from '../hooks/useTasks'
import TaskCard         from '../components/TaskCard'
import TaskModal        from '../components/TaskModal'
import { projectAPI }   from '../api/api'

const STATUS_COLS = [
  { key:'todo',        label:'To Do',       color:'#94a3b8' },
  { key:'in_progress', label:'In Progress', color:'var(--accent)' },
  { key:'in_review',   label:'In Review',   color:'#fbbf24' },
  { key:'done',        label:'Done',        color:'#22c55e' },
]

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6']

export default function Tasks() {
  const { user }                                          = useAuth()
  const { projects, loading: projLoading, create: createProject, refetch: refetchProjects } = useProjects()
  const { tasks, loading: taskLoading, create, update, updateStatus, remove } = useTasks()

  const [modal,       setModal      ] = useState(false)
  const [editTask,    setEditTask   ] = useState(null)
  const [activeProj,  setActiveProj ] = useState(null)  // null = all projects
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [search,      setSearch     ] = useState('')
  const [showNewProj, setShowNewProj] = useState(false)
  const [projForm,    setProjForm   ] = useState({ name:'', description:'', color:'#6366f1' })
  const [projLoading2, setProjLoading2] = useState(false)

  const openCreate = (projectId) => {
    setEditTask(null)
    if (projectId) setEditTask({ project: projectId })
    setModal(true)
  }
  const openEdit  = (t) => { setEditTask(t); setModal(true) }
  const closeModal= () => { setModal(false); setEditTask(null) }

  const handleSubmit = async (data) => {
    if (editTask?._id) await update(editTask._id, data)
    else                await create(data)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) await remove(id)
  }

  const handleDeleteProject = async (pid) => {
    if (!window.confirm('Delete this project and ALL its tasks? This cannot be undone.')) return
    await projectAPI.delete(pid)
    if (activeProj === pid) setActiveProj(null)
    refetchProjects()
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!projForm.name.trim()) return
    setProjLoading2(true)
    try {
      await createProject(projForm)
      setProjForm({ name:'', description:'', color:'#6366f1' })
      setShowNewProj(false)
    } catch {}
    finally { setProjLoading2(false) }
  }

  // Filter tasks
  const filtered = tasks.filter(t => {
    if (activeProj && (t.project?._id || t.project) !== activeProj) return false
    if (filterStatus   && t.status   !== filterStatus)   return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Stats
  const total   = filtered.length
  const done    = filtered.filter(t => t.status === 'done').length
  const overdue = filtered.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length

  const S = { // shared inline styles
    card:  { background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)' },
    label: { fontSize:'0.75rem', fontWeight:700, color:'var(--muted2)', textTransform:'uppercase', letterSpacing:'0.06em' },
    input: { padding:'0.55rem 0.75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r2)', fontSize:'0.875rem', color:'var(--white)', background:'var(--surface)', outline:'none', fontFamily:'var(--fd)', width:'100%' },
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── Project Sidebar ─────────────────────── */}
      <aside style={{
        width:'220px', flexShrink:0, background:'var(--card)',
        borderRight:'1px solid var(--border)', padding:'1.2rem 0.9rem',
        display:'flex', flexDirection:'column', gap:'0.3rem',
        position:'sticky', top:0, height:'100vh', overflowY:'auto',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.8rem', padding:'0 0.2rem' }}>
          <span style={S.label}>Projects</span>
          <button
            onClick={() => setShowNewProj(p => !p)}
            style={{ width:'22px', height:'22px', borderRadius:'5px', background:'var(--accent-bg)', color:'var(--accent)', fontSize:'1rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer' }}
          >+</button>
        </div>

        {/* New project inline form */}
        {showNewProj && (
          <form onSubmit={handleCreateProject} style={{ ...S.card, padding:'0.8rem', marginBottom:'0.5rem', display:'flex', flexDirection:'column', gap:'7px' }}>
            <input
              style={{ ...S.input, fontSize:'0.8rem' }}
              placeholder="Project name"
              value={projForm.name}
              onChange={e => setProjForm(f => ({...f, name: e.target.value}))}
              autoFocus
            />
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
              {COLORS.map(c => (
                <button key={c} type="button"
                  onClick={() => setProjForm(f => ({...f, color:c}))}
                  style={{ width:'18px', height:'18px', borderRadius:'50%', background:c, border: projForm.color===c ? '2px solid #fff' : '2px solid transparent', cursor:'pointer', boxShadow: projForm.color===c ? `0 0 0 2px ${c}` : 'none' }}
                />
              ))}
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button type="button" onClick={() => setShowNewProj(false)} style={{ flex:1, padding:'0.4rem', border:'1px solid var(--border)', borderRadius:'5px', color:'var(--muted2)', background:'transparent', cursor:'pointer', fontSize:'0.78rem', fontFamily:'var(--fd)' }}>Cancel</button>
              <button type="submit" disabled={projLoading2} style={{ flex:1, padding:'0.4rem', background:'var(--accent)', border:'none', borderRadius:'5px', color:'#fff', cursor:'pointer', fontSize:'0.78rem', fontFamily:'var(--fd)', fontWeight:600 }}>
                {projLoading2 ? '…' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {/* All tasks button */}
        <button
          onClick={() => setActiveProj(null)}
          style={{
            display:'flex', alignItems:'center', gap:'8px', padding:'0.5rem 0.65rem',
            borderRadius:'var(--r2)', border:'none', background: !activeProj ? 'var(--accent-bg)' : 'transparent',
            color: !activeProj ? 'var(--accent)' : 'var(--muted2)', cursor:'pointer', fontSize:'0.875rem',
            fontFamily:'var(--fd)', fontWeight: !activeProj ? 600 : 400, width:'100%', textAlign:'left',
          }}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M1 2a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H2a1 1 0 01-1-1V2zm0 5a1 1 0 011-1h12a1 1 0 010 2H2a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 010 2H2a1 1 0 01-1-1z"/></svg>
          All Tasks
          <span style={{ marginLeft:'auto', fontSize:'0.7rem', background:'var(--surface)', color:'var(--muted)', borderRadius:'10px', padding:'1px 6px' }}>
            {tasks.length}
          </span>
        </button>

        {/* Project list */}
        {projLoading ? (
          <span style={{ fontSize:'0.8rem', color:'var(--muted)', padding:'0.5rem' }}>Loading…</span>
        ) : projects.length === 0 ? (
          <span style={{ fontSize:'0.8rem', color:'var(--muted)', padding:'0.5rem', fontStyle:'italic' }}>No projects yet</span>
        ) : (
          projects.map(p => (
            <div key={p._id} style={{ display:'flex', alignItems:'center', gap:'0', borderRadius:'var(--r2)', overflow:'hidden' }}>
              <button
                onClick={() => setActiveProj(activeProj === p._id ? null : p._id)}
                style={{
                  flex:1, display:'flex', alignItems:'center', gap:'8px', padding:'0.5rem 0.65rem',
                  border:'none', background: activeProj===p._id ? 'var(--accent-bg)' : 'transparent',
                  color: activeProj===p._id ? 'var(--accent)' : 'var(--muted2)', cursor:'pointer',
                  fontSize:'0.875rem', fontFamily:'var(--fd)', fontWeight: activeProj===p._id ? 600 : 400,
                  textAlign:'left', minWidth:0,
                }}
              >
                <span style={{ width:'9px', height:'9px', borderRadius:'50%', background:p.color||'var(--accent)', flexShrink:0 }} />
                <span style={{ flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</span>
                {p.taskCount > 0 && <span style={{ fontSize:'0.7rem', background:'var(--surface)', color:'var(--muted)', borderRadius:'10px', padding:'1px 6px', flexShrink:0 }}>{p.taskCount}</span>}
              </button>
              <button
                onClick={() => handleDeleteProject(p._id)}
                title="Delete project"
                style={{ padding:'0 6px', height:'100%', border:'none', background:'transparent', color:'var(--muted)', cursor:'pointer', fontSize:'0.7rem', flexShrink:0 }}
                onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color='var(--muted)'}
              >✕</button>
            </div>
          ))
        )}
      </aside>

      {/* ── Main Board ──────────────────────────── */}
      <main style={{ flex:1, padding:'2rem 1.8rem', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.45rem', fontWeight:800, color:'var(--white)', letterSpacing:'-0.03em', marginBottom:'0.2rem' }}>
              {activeProj ? projects.find(p=>p._id===activeProj)?.name || 'Project' : 'All Tasks'}
            </h1>
            <p style={{ fontSize:'0.85rem', color:'var(--muted2)' }}>
              {total} task{total !== 1 ? 's' : ''} · {done} done
              {overdue > 0 && <span style={{ color:'#ef4444', marginLeft:'8px' }}>· {overdue} overdue</span>}
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => openCreate(activeProj)}
            style={{ display:'flex', alignItems:'center', gap:'6px' }}
          >
            <span style={{ fontSize:'1.1rem', lineHeight:1 }}>+</span> New Task
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.85rem', marginBottom:'1.4rem' }}>
          {[
            { label:'Total', value:total, color:'var(--accent)' },
            { label:'In Progress', value:filtered.filter(t=>t.status==='in_progress').length, color:'var(--accent-h)' },
            { label:'Done', value:done, color:'#22c55e' },
            { label:'Overdue', value:overdue, color: overdue > 0 ? '#ef4444' : 'var(--muted)' },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, padding:'0.9rem 1rem' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:800, color:s.color, lineHeight:1, marginBottom:'0.25rem', letterSpacing:'-0.03em' }}>{s.value}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--muted)', fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'1.4rem', flexWrap:'wrap', alignItems:'center' }}>
          <input
            placeholder="🔍  Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...S.input, flex:1, minWidth:'180px' }}
            onFocus={e => e.target.style.borderColor='var(--accent)'}
            onBlur={e => e.target.style.borderColor='var(--border)'}
          />
          {[
            { val:filterStatus, set:setFilterStatus, opts:[['','All Statuses'],['todo','To Do'],['in_progress','In Progress'],['in_review','In Review'],['done','Done']] },
            { val:filterPriority, set:setFilterPriority, opts:[['','All Priorities'],['low','Low'],['medium','Medium'],['high','High'],['urgent','Urgent']] },
          ].map((f, i) => (
            <select key={i} value={f.val} onChange={e => f.set(e.target.value)}
              style={{ ...S.input, width:'auto', padding:'0.55rem 1.8rem 0.55rem 0.75rem', cursor:'pointer' }}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='var(--border)'}
            >
              {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          {(search || filterStatus || filterPriority) && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority('') }}
              style={{ padding:'0.52rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:'var(--r2)', color:'var(--muted2)', background:'transparent', cursor:'pointer', fontSize:'0.85rem', fontFamily:'var(--fd)' }}
            >Clear</button>
          )}
        </div>

        {/* Kanban board */}
        {taskLoading ? (
          <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'3rem', color:'var(--muted)' }}>
            <div className="spinner" /> Loading tasks…
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', alignItems:'start' }}>
            {STATUS_COLS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.key)
              return (
                <div key={col.key} style={{ background:'var(--surface)', borderRadius:'var(--r)', padding:'0.85rem', minHeight:'200px', border:'1px solid var(--border)' }}>
                  {/* Column header */}
                  <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'0.75rem' }}>
                    <span style={{ width:'9px', height:'9px', borderRadius:'50%', background:col.color, flexShrink:0 }} />
                    <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--white)', flex:1 }}>{col.label}</span>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, background:'var(--card)', color:'var(--muted)', borderRadius:'10px', padding:'1px 7px' }}>{colTasks.length}</span>
                  </div>

                  {/* Cards */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {colTasks.map(t => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onStatusChange={updateStatus}
                      />
                    ))}
                    {colTasks.length === 0 && (
                      <div style={{
                        padding:'1.5rem 0.5rem', textAlign:'center',
                        border:'1.5px dashed var(--border)', borderRadius:'var(--r)',
                        fontSize:'0.78rem', color:'var(--muted)', fontStyle:'italic',
                      }}>No tasks</div>
                    )}
                    {/* Quick add */}
                    <button
                      onClick={() => {
                        setEditTask({ status: col.key, project: activeProj || '' })
                        setModal(true)
                      }}
                      style={{
                        width:'100%', padding:'0.45rem', border:'1px dashed var(--border)',
                        borderRadius:'var(--r)', background:'transparent', color:'var(--muted)',
                        cursor:'pointer', fontSize:'0.78rem', fontFamily:'var(--fd)',
                        transition:'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)' }}
                    >+ Add task</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Task modal */}
      {modal && (
        <TaskModal
          task={editTask?._id ? editTask : null}
          projects={projects}
          projectId={editTask?.project || activeProj || ''}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
