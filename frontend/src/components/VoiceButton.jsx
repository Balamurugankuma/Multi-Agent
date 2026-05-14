// ═══════════════════════════════════════════════════════════
//  components/VoiceButton.jsx  —  Velverse AI
//
//  Mic button that sits next to the chat input.
//  Shows animated rings while listening.
//  Handles interim text display inside the textarea.
//
//  Props:
//    onTranscript(text)  — called with each final word chunk
//    onInterim(text)     — called with interim text (for live preview)
//    disabled            — disable when AI is typing
//    lang                — BCP-47 e.g. 'en-US', 'ta-IN'
// ═══════════════════════════════════════════════════════════
import { useEffect } from 'react'
import useVoiceInput from '../hooks/useVoiceInput'

export default function VoiceButton({ onTranscript, onInterim, disabled = false, lang = 'en-US' }) {

  const { listening, interim, error, supported, start, stop } = useVoiceInput({
    onResult: (text) => onTranscript && onTranscript(text),
    lang,
    continuous:     true,
    interimResults: true,
  })

  // Push interim text into the input field live
  useEffect(() => {
    if (onInterim) onInterim(interim)
  }, [interim])

  if (!supported) return null   // hide entirely on unsupported browsers

  const toggle = () => {
    if (disabled) return
    listening ? stop() : start()
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* Pulse rings when active */}
      {listening && (
        <>
          <span style={ringStyle(1)} />
          <span style={ringStyle(2)} />
        </>
      )}

      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        title={listening ? 'Stop recording (click to stop)' : 'Voice input (click to speak)'}
        style={{
          ...btnBase,
          background:   listening ? 'rgba(239,68,68,0.18)' : 'rgba(197,132,66,0.12)',
          borderColor:  listening ? 'rgba(239,68,68,0.5)'  : 'rgba(197,132,66,0.35)',
          color:        listening ? '#ef4444'               : '#c58442',
          opacity:      disabled  ? 0.45 : 1,
          cursor:       disabled  ? 'not-allowed' : 'pointer',
          transform:    listening ? 'scale(1.08)' : 'scale(1)',
          boxShadow:    listening ? '0 0 0 3px rgba(239,68,68,0.15)' : 'none',
        }}
      >
        {/* Mic icon — filled when listening, outlined when idle */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          {listening ? (
            // Stop icon when recording
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          ) : (
            // Mic icon when idle
            <g>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
            </g>
          )}
        </svg>
      </button>

      {/* Error tooltip */}
      {error && (
        <div style={errorTip}>{error}</div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────
const btnBase = {
  width:          '40px',
  height:         '40px',
  borderRadius:   '10px',
  border:         '1.5px solid',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  flexShrink:     0,
  transition:     'all 0.22s ease',
  outline:        'none',
  position:       'relative',
  zIndex:         1,
}

const ringStyle = (i) => ({
  position:     'absolute',
  inset:        0,
  borderRadius: '10px',
  border:       '1.5px solid rgba(239,68,68,0.4)',
  animation:    `vv-ring ${0.8 + i * 0.4}s ease-out infinite`,
  zIndex:       0,
  pointerEvents:'none',
})

const errorTip = {
  position:    'absolute',
  bottom:      'calc(100% + 8px)',
  left:        '50%',
  transform:   'translateX(-50%)',
  background:  '#1c1c1c',
  border:      '1px solid rgba(239,68,68,0.3)',
  color:       '#ef4444',
  fontSize:    '0.72rem',
  padding:     '5px 10px',
  borderRadius:'6px',
  whiteSpace:  'nowrap',
  zIndex:      100,
  pointerEvents:'none',
  maxWidth:    '240px',
  textAlign:   'center',
  lineHeight:  1.4,
}
