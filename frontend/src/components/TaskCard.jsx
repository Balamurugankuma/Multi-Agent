// ══════════════════════════════════════════════════
//  components/TaskCard.jsx  —  Velverse AI + TaskFlow
//  Dark-themed task card matching Velverse design system
// ══════════════════════════════════════════════════

const PRIORITY_STYLES = {
  low:    { bg: 'rgba(34,197,94,0.1)',  text: '#22c55e',  dot: '#22c55e'  },
  medium: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24',  dot: '#fbbf24'  },
  high:   { bg: 'rgba(249,115,22,0.1)', text: '#f97316',  dot: '#f97316'  },
  urgent: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444',  dot: '#ef4444'  },
}

const STATUS_LABELS = {
  todo:        'To Do',
  in_progress: 'In Progress',
  in_review:   'In Review',
  done:        'Done',
}

function formatDue(d) {
  if (!d) return null
  const date  = new Date(d)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff  = Math.ceil((date - today) / 86400000)
  if (diff < 0)  return { label: 'Overdue',   color: '#ef4444' }
  if (diff === 0) return { label: 'Today',     color: '#fbbf24' }
  if (diff === 1) return { label: 'Tomorrow',  color: '#818cf8' }
  return { label: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), color: '#6b6b78' }
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const p   = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
  const due = formatDue(task.dueDate)

  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${task.status === 'done' ? 'rgba(255,255,255,0.04)' : 'var(--border)'}`,
      borderRadius: 'var(--r)',
      padding: '0.85rem 0.95rem',
      cursor: 'pointer',
      transition: 'border-color 0.18s, box-shadow 0.18s',
      opacity: task.status === 'done' ? 0.6 : 1,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = task.status === 'done' ? 'rgba(255,255,255,0.04)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'7px' }}>
        <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:p.dot, flexShrink:0 }} />
        <span style={{
          fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase',
          padding:'2px 7px', borderRadius:'10px', background:p.bg, color:p.text,
        }}>
          {task.priority}
        </span>
        {task.project?.name && (
          <span style={{
            marginLeft:'auto', fontSize:'0.68rem', color:'var(--muted)',
            background:'var(--surface)', padding:'1px 6px', borderRadius:'4px',
            display:'flex', alignItems:'center', gap:'4px',
          }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: task.project.color || 'var(--accent)', flexShrink:0 }} />
            {task.project.name}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{
        fontSize:'0.88rem', fontWeight:600, color:'var(--white)',
        marginBottom:'5px', lineHeight:1.4,
        textDecoration: task.status === 'done' ? 'line-through' : 'none',
        opacity: task.status === 'done' ? 0.7 : 1,
      }}>
        {task.title}
      </div>

      {/* Description */}
      {task.description && (
        <div style={{ fontSize:'0.78rem', color:'var(--muted2)', lineHeight:1.5, marginBottom:'8px' }}>
          {task.description.slice(0,90)}{task.description.length > 90 ? '…' : ''}
        </div>
      )}

      {/* Labels */}
      {task.labels?.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'8px' }}>
          {task.labels.slice(0,3).map(l => (
            <span key={l} style={{
              fontSize:'0.66rem', fontWeight:600, background:'var(--accent-bg)',
              color:'var(--accent)', borderRadius:'4px', padding:'1px 6px',
            }}>{l}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginTop:'8px', flexWrap:'wrap' }}>
        {due && (
          <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'0.73rem', fontWeight:600, color:due.color }}>
            <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
              <path d="M5 1a1 1 0 00-2 0v1H2a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2h-1V1a1 1 0 10-2 0v1H5V1zm-3 5h12v7H2V6z"/>
            </svg>
            {due.label}
          </span>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:'4px', marginLeft:'auto' }}>
          <select
            value={task.status}
            onChange={e => { e.stopPropagation(); onStatusChange(task._id, e.target.value) }}
            onClick={e => e.stopPropagation()}
            style={{
              fontSize:'0.7rem', fontWeight:600,
              padding:'2px 18px 2px 6px', border:'1px solid var(--border)',
              borderRadius:'5px', background:'var(--surface)', color:'var(--text)',
              cursor:'pointer', outline:'none', appearance:'none',
              backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%236b6b78' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat:'no-repeat', backgroundPosition:'right 4px center',
              maxWidth:'90px',
            }}
          >
            {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          <button
            title="Edit"
            onClick={() => onEdit(task)}
            style={{ width:'26px', height:'26px', borderRadius:'5px', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted2)', border:'1px solid transparent', background:'transparent', cursor:'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--surface)'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--white)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='var(--muted2)' }}
          >✏</button>

          <button
            title="Delete"
            onClick={() => onDelete(task._id)}
            style={{ width:'26px', height:'26px', borderRadius:'5px', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted2)', border:'1px solid transparent', background:'transparent', cursor:'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)'; e.currentTarget.style.color='#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='var(--muted2)' }}
          >✕</button>
        </div>
      </div>
    </div>
  )
}
