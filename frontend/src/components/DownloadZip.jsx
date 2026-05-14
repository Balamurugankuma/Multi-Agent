// ══════════════════════════════════════════════════════════
//  components/DownloadZip.jsx  —  Velverse AI
//
//  A self-contained "Download Project ZIP" button.
//  Drop it anywhere inside a squad page — pass the sessionId
//  and agentType and it handles the rest:
//
//    1. Calls GET /api/zip/preview  → shows file count badge
//    2. On click: POST /api/zip/generate → triggers browser download
//
//  Works in backend mode only (falls back to a clear message
//  in demo mode so users know what to configure).
// ══════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { zipAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function DownloadZip({ sessionId, agentType, projectName, style = {} }) {
  const { useBackend } = useAuth()
  const [preview,   setPreview  ] = useState(null)   // { totalFiles, codeFiles, ready }
  const [status,    setStatus   ] = useState('idle')  // idle | loading | downloading | done | error
  const [error,     setError    ] = useState('')
  const [progress,  setProgress ] = useState('')

  // ── Fetch preview on mount / when sessionId changes ────
  useEffect(() => {
    if (!useBackend || !sessionId) return
    zipAPI.preview({ sessionId, agentType })
      .then(r => setPreview(r))
      .catch(() => setPreview(null))
  }, [sessionId, agentType, useBackend])

  // ── Trigger download ────────────────────────────────────
  const handleDownload = async () => {
    if (!useBackend) {
      setError('ZIP download requires the Node.js backend. Configure your .env and restart the server.')
      return
    }

    setStatus('downloading')
    setProgress('Gathering session code…')
    setError('')

    try {
      setProgress('Generating ZIP file…')
      const blob = await zipAPI.generate({ sessionId, agentType, projectName })

      // Trigger browser download
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${(projectName || `velverse-${agentType}-project`)
        .replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('done')
      setProgress('')

      // Reset to idle after 3s
      setTimeout(() => setStatus('idle'), 3000)

    } catch (err) {
      setStatus('error')
      setError(err.message || 'ZIP generation failed. Make sure the backend is running.')
    }
  }

  // ── Demo-mode notice ─────────────────────────────────────
  if (!useBackend) {
    return (
      <div style={{ ...containerStyle, background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)', ...style }}>
        <i className="fas fa-file-zipper" style={{ color: '#6366F1', marginRight: '8px' }} />
        <span style={{ fontSize: '0.82rem', color: '#9898a8' }}>
          ZIP download available when backend is connected
        </span>
      </div>
    )
  }

  const isLoading = status === 'downloading'

  return (
    <div style={{ ...containerStyle, ...style }}>
      {/* Preview badge */}
      {preview && preview.ready && status === 'idle' && (
        <div style={badgeStyle}>
          <i className="fas fa-code" style={{ marginRight: '5px', fontSize: '0.72rem' }} />
          {preview.codeFiles?.length || 0} code files · {preview.totalFiles} total
        </div>
      )}

      {/* Main button */}
      <button
        onClick={handleDownload}
        disabled={isLoading}
        style={{
          ...btnStyle,
          opacity: isLoading ? 0.75 : 1,
          cursor:  isLoading ? 'not-allowed' : 'pointer',
          background: status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
          borderColor: status === 'done' ? 'rgba(34,197,94,0.4)' : 'rgba(99,102,241,0.4)',
          color: status === 'done' ? '#22c55e' : '#a5b4fc',
        }}
      >
        {isLoading ? (
          <>
            <i className="fas fa-circle-notch fa-spin" style={{ marginRight: '7px' }} />
            {progress || 'Generating…'}
          </>
        ) : status === 'done' ? (
          <>
            <i className="fas fa-check" style={{ marginRight: '7px' }} />
            Downloaded!
          </>
        ) : (
          <>
            <i className="fas fa-file-zipper" style={{ marginRight: '7px' }} />
            Download Project ZIP
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div style={errorStyle}>
          <i className="fas fa-triangle-exclamation" style={{ marginRight: '6px' }} />
          {error}
        </div>
      )}

      {/* No code yet */}
      {preview && !preview.ready && status === 'idle' && (
        <div style={{ fontSize: '0.75rem', color: '#6b6b78', marginTop: '6px', textAlign: 'center' }}>
          Chat with this squad first to generate code
        </div>
      )}
    </div>
  )
}

// ── Inline styles (no CSS file dependency) ───────────────
const containerStyle = {
  display:       'flex',
  flexDirection: 'column',
  alignItems:    'stretch',
  gap:           '6px',
  padding:       '10px',
  background:    'rgba(255,255,255,0.03)',
  border:        '1px solid rgba(255,255,255,0.08)',
  borderRadius:  '10px',
}

const badgeStyle = {
  fontSize:        '0.72rem',
  color:           '#9898a8',
  background:      'rgba(99,102,241,0.08)',
  border:          '1px solid rgba(99,102,241,0.15)',
  borderRadius:    '5px',
  padding:         '3px 8px',
  textAlign:       'center',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
}

const btnStyle = {
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  padding:         '9px 14px',
  border:          '1px solid',
  borderRadius:    '8px',
  fontSize:        '0.84rem',
  fontWeight:      600,
  fontFamily:      'inherit',
  transition:      'all 0.18s',
  outline:         'none',
  width:           '100%',
}

const errorStyle = {
  fontSize:     '0.78rem',
  color:        '#ef4444',
  background:   'rgba(239,68,68,0.08)',
  border:       '1px solid rgba(239,68,68,0.2)',
  borderRadius: '6px',
  padding:      '6px 10px',
  lineHeight:   1.5,
}
