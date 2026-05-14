// ══════════════════════════════════════════════════
//  components/TaskModal.jsx  —  Velverse AI + TaskFlow
// ══════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'

const STATUS_OPTIONS   = ['todo','in_progress','in_review','done']
const PRIORITY_OPTIONS = ['low','medium','high','urgent']
const STATUS_LABELS    = { todo:'To Do', in_progress:'In Progress', in_review:'In Review', done:'Done' }
const PRIORITY_LABELS  = { low:'Low', medium:'Medium', high:'High', urgent:'Urgent' }

export default function TaskModal({ task, projects, projectId, onSubmit, onClose }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    status:      task?.status      || 'todo',
    priority:    task?.priority    || 'medium',
    dueDate:     task?.dueDate ? task.dueDate.slice(0,10) : '',
    labels:      task?.labels?.join(', ') || '',
    project:     task?.project?._id || task?.project || projectId || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError  ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.focus()
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handle = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.project)      { setError('Please select a project'); return }
    setLoading(true); setError('')
    try {
      await onSubmit({
        title:       form.title.trim(),
        description: form.description.trim(),
        status:      form.status,
        priority:    form.priority,
        dueDate:     form.dueDate || undefined,
        project:     form.project,
        labels:      form.labels
          ? form.labels.split(',').map(l => l.trim()).filter(Boolean)
          : [],
      })
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width:'100%', padding:'0.6rem 0.75rem',
    border:'1.5px solid var(--border)', borderRadius:'var(--r2)',
    fontSize:'0.875rem', color:'var(--white)', background:'var(--surface)',
    outline:'none', transition:'border-color 0.15s', fontFamily:'var(--fd)',
  }
  const labelStyle = { fontSize:'0.78rem', fontWeight:600, color:'var(--muted2)', marginBottom:'5px', display:'block' }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:999, padding:'1rem', backdropFilter:'blur(4px)',
        animation:'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(16px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        .vv-input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
      `}</style>

      <div style={{
        background:'var(--card)', border:'1px solid var(--border)',
        borderRadius:'var(--r-lg)', width:'100%', maxWidth:'520px',
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 24px 64px rgba(0,0,0,0.5)',
        animation:'slideUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.3rem 1.5rem 0' }}>
          <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--white)' }}>
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            style={{ width:'28px', height:'28px', borderRadius:'var(--r2)', color:'var(--muted)', fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', cursor:'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--surface)'; e.currentTarget.style.color='var(--white)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--muted)' }}
          >✕</button>
        </div>

        <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'0.9rem', padding:'1.1rem 1.5rem 1.5rem' }}>
          {error && (
            <div style={{ padding:'0.6rem 0.8rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--r2)', fontSize:'0.85rem', color:'#ef4444' }}>
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input ref={ref} className="vv-input" style={inputStyle} placeholder="What needs to be done?" value={form.title} onChange={e => set('title', e.target.value)} maxLength={200} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea className="vv-input" style={{ ...inputStyle, resize:'vertical', minHeight:'72px', lineHeight:1.5 }} placeholder="Add details…" value={form.description} onChange={e => set('description', e.target.value)} maxLength={2000} />
          </div>

          {/* Project */}
          <div>
            <label style={labelStyle}>Project *</label>
            <select className="vv-input" style={{ ...inputStyle, cursor:'pointer' }} value={form.project} onChange={e => set('project', e.target.value)}>
              <option value="">Select a project…</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          {/* Status + Priority */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select className="vv-input" style={{ ...inputStyle, cursor:'pointer' }} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select className="vv-input" style={{ ...inputStyle, cursor:'pointer' }} value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label style={labelStyle}>Due Date</label>
            <input type="date" className="vv-input" style={{ ...inputStyle, colorScheme:'dark' }} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>

          {/* Labels */}
          <div>
            <label style={labelStyle}>Labels <span style={{ fontWeight:400, color:'var(--muted)' }}>(comma separated)</span></label>
            <input className="vv-input" style={inputStyle} placeholder="bug, frontend, design" value={form.labels} onChange={e => set('labels', e.target.value)} />
          </div>

          {/* Actions */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', paddingTop:'0.4rem', borderTop:'1px solid var(--border)', marginTop:'0.2rem' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'0.55rem 1rem', border:'1.5px solid var(--border)', borderRadius:'var(--r2)', fontSize:'0.875rem', color:'var(--muted2)', background:'transparent', cursor:'pointer', fontFamily:'var(--fd)' }}
            >Cancel</button>
            <button type="submit" disabled={loading}
              style={{ padding:'0.55rem 1.2rem', background:'var(--accent)', border:'1.5px solid var(--accent)', borderRadius:'var(--r2)', fontSize:'0.875rem', fontWeight:600, color:'#fff', cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'var(--fd)' }}
            >{loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
