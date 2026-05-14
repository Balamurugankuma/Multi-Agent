// ═══════════════════════════════════════════════════════════
//  components/SquadPage.jsx  —  Velverse AI  v4.1
//  ✅ Voice input via Web Speech API
//  ✅ Real-time interim transcript in textarea
//  ✅ No fake boilerplate simulation text
//  ✅ SessionId persisted in sessionStorage
//  ✅ Clean error messages when squads not configured
// ═══════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { aiAPI } from '../api/api'
import DownloadZip from './DownloadZip'
import VoiceButton from './VoiceButton'
import '../styles/Squad.css'

// ── Welcome message ───────────────────────────────────────
const initMsg = (name) => [{
  role: 'agent',
  text: `Hello! I'm the ${name} — powered by Flowise AI.\n\nDescribe your task or ask me anything. You can type or use the 🎤 mic button to speak.`,
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}]

// ── Direct Flowise fallback (demo / no backend) ───────────
async function callFlowiseDirect(endpoint, question) {
  // Empty or placeholder — return null, not fake text
  if (!endpoint || endpoint.includes('REPLACE_') || endpoint.trim() === '') return null
  const r = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ question }),
  })
  if (!r.ok) throw new Error(`Flowise HTTP ${r.status}`)
  const d = await r.json()
  return d.text || d.answer || d.result || 'Response received.'
}

// ── Main component ────────────────────────────────────────
export default function SquadPage({ name, desc, icon, squadKey, taskTypes = [], outputs = [] }) {
  const { isLoggedIn, useBackend, FLOWISE_ENDPOINTS } = useAuth()

  const [messages, setMessages] = useState(() => initMsg(name))
  const [input,    setInput   ] = useState('')
  const [typing,   setTyping  ] = useState(false)
  const [task,     setTask    ] = useState({ type: '', priority: 'medium', deadline: '', notes: '' })
  const [voiceLang, setVoiceLang] = useState('en-US')

  // ── Persist sessionId so ZIP download works after refresh ─
  const [sessionId] = useState(() => {
    const key      = `vv_session_${squadKey}`
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const fresh = `vv_${Date.now()}`
    sessionStorage.setItem(key, fresh)
    return fresh
  })

  const bottomRef  = useRef(null)
  const chatMessagesRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const container = chatMessagesRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages, typing])

  // ── Add message to chat ───────────────────────────────
  const addMsg = (role, text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(m => [...m, { role, text, time }])
  }

  // ── Send message ──────────────────────────────────────
  const sendMsg = async (text) => {
    if (!text.trim() || typing) return
    addMsg('user', text)
    setInput('')
    setTyping(true)

    try {
      let aiText

      if (useBackend) {
        const res = await aiAPI.chat({ agentType: squadKey, message: text, sessionId })
        aiText = res.response
      } else {
        aiText = await callFlowiseDirect(FLOWISE_ENDPOINTS?.[squadKey], text)
      }

      if (!aiText) {
        addMsg('agent',
          `⚙️ The ${name} is not configured yet.\n\n` +
          `Add this to your backend .env file:\n` +
          `FLOWISE_${squadKey.toUpperCase()}_ID=your-flow-id-here\n\n` +
          `Then restart: npm run dev`
        )
      } else {
        addMsg('agent', aiText)
      }

    } catch (err) {
      // Try direct Flowise as last resort
      try {
        const aiText = await callFlowiseDirect(FLOWISE_ENDPOINTS?.[squadKey], text)
        if (aiText) {
          addMsg('agent', aiText)
        } else {
          addMsg('agent',
            `⚙️ Could not reach the AI backend.\n\nMake sure your backend is running:\n  npm run dev\n\nError: ${err.message || 'Network error'}`
          )
        }
      } catch {
        addMsg('agent',
          `⚙️ Connection failed. Start the backend with npm run dev.\n\nError: ${err.message || 'Network error'}`
        )
      }
    } finally {
      setTyping(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input) }
  }

  // ── Voice handlers ────────────────────────────────────
  // Called with the final transcript chunk from VoiceButton
  const handleVoiceTranscript = (text) => {
    setInput(text)
    // Auto-send after a brief pause so user can review
    // Remove this line if you want manual send after voice
    // sendMsg(text)
  }

  // Called with interim (in-progress) text — shows live in textarea
  const handleVoiceInterim = (interim) => {
    if (interim) setInput(interim)
  }

  // ── Task submission ───────────────────────────────────
  const submitTask = () => {
    if (!task.type) return
    const msg =
      `New task — Type: ${task.type} | Priority: ${task.priority}` +
      (task.deadline ? ` | Deadline: ${task.deadline}` : '') +
      (task.notes    ? `\n\nDetails: ${task.notes}`    : '')
    sendMsg(msg)
    setTask({ type: '', priority: 'medium', deadline: '', notes: '' })
  }

  // ── Locked screen ─────────────────────────────────────
  if (!isLoggedIn) return (
    <div className="squad-locked">
      <div className="squad-locked-inner">
        <i className="fas fa-lock" style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '1rem' }} />
        <h2>Sign in to access {name}</h2>
        <p>Create a free account to start using all 5 AI squads.</p>
        <Link to="/login" className="btn-primary">Get Access Free →</Link>
      </div>
    </div>
  )

  return (
    <div className="squad-page">

      {/* ── Header ────────────────────────────────────── */}
      <div className="squad-header">
        <div className="squad-header-left">
          <div className="squad-icon"><i className={`fas ${icon}`} /></div>
          <div>
            <h1 className="squad-name">{name}</h1>
            <p className="squad-desc">{desc}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {!useBackend && (
            <span style={{ fontSize: '0.72rem', color: 'var(--accent)', background: 'rgba(99,102,241,0.1)', padding: '0.25rem 0.6rem', borderRadius: '5px' }}>
              Demo Mode
            </span>
          )}
          <div className="squad-status-badge"><span className="squad-dot" /> Online</div>
        </div>
      </div>

      <div className="squad-body">

        {/* ── Left Panel: Task + Downloads ────────────── */}
        <div className="squad-task-panel">
          <h3 className="panel-title"><i className="fas fa-plus-circle" /> New Task</h3>
          <div className="squad-form">

            <label className="form-label">Task Type</label>
            <select className="form-input" value={task.type} onChange={e => setTask(t => ({ ...t, type: e.target.value }))}>
              <option value="">Select task type…</option>
              {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="form-label" style={{ marginTop: '0.75rem' }}>Priority</label>
            <select className="form-input" value={task.priority} onChange={e => setTask(t => ({ ...t, priority: e.target.value }))}>
              {['low', 'medium', 'high', 'critical'].map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>

            <label className="form-label" style={{ marginTop: '0.75rem' }}>Deadline</label>
            <input type="date" className="form-input" value={task.deadline}
              onChange={e => setTask(t => ({ ...t, deadline: e.target.value }))} />

            <label className="form-label" style={{ marginTop: '0.75rem' }}>Details</label>
            <textarea className="form-input" rows={3} placeholder="Describe your task in detail…"
              value={task.notes} onChange={e => setTask(t => ({ ...t, notes: e.target.value }))} />

            <button className="btn-primary squad-submit-btn" onClick={submitTask} disabled={!task.type}>
              <i className="fas fa-paper-plane" /> Submit Task
            </button>
          </div>

          {/* Sample outputs */}
          {outputs.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className="panel-title"><i className="fas fa-download" /> Sample Outputs</h3>
              {outputs.map((o, i) => (
                <div key={i} className="squad-output-item">
                  <span className="output-badge">{o.type}</span>
                  <span className="output-title">{o.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* ZIP download */}
          <div style={{ marginTop: '1.5rem' }}>
            <h3 className="panel-title"><i className="fas fa-file-zipper" /> Download Code</h3>
            <DownloadZip sessionId={sessionId} agentType={squadKey}
              projectName={`velverse-${squadKey}-project`} />
          </div>

          {/* Voice language selector */}
          <div style={{ marginTop: '1.5rem' }}>
            <h3 className="panel-title"><i className="fas fa-microphone" /> Voice Language</h3>
            <select className="form-input" value={voiceLang}
              onChange={e => setVoiceLang(e.target.value)}>
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (India)</option>
              <option value="ta-IN">Tamil</option>
              <option value="hi-IN">Hindi</option>
              <option value="te-IN">Telugu</option>
              <option value="kn-IN">Kannada</option>
            </select>
          </div>
        </div>

        {/* ── Chat Panel ──────────────────────────────── */}
        <div className="squad-chat-panel">
          <div ref={chatMessagesRef} className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.role === 'agent' && (
                  <div className="chat-avatar"><i className={`fas ${icon}`} /></div>
                )}
                <div className="chat-bubble">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
                  <span className="chat-time">{m.time}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="chat-msg agent">
                <div className="chat-avatar"><i className={`fas ${icon}`} /></div>
                <div className="chat-bubble typing-indicator"><span /><span /><span /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input row with Voice Button ────────────── */}
          <div className="chat-input-row">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={`Message ${name}… (Enter to send · Shift+Enter for new line · 🎤 mic to speak)`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />

            {/* Voice button — sits between textarea and send button */}
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              onInterim={handleVoiceInterim}
              disabled={typing}
              lang={voiceLang}
            />

            <button className="chat-send-btn"
              onClick={() => sendMsg(input)}
              disabled={!input.trim() || typing}>
              <i className="fas fa-paper-plane" />
            </button>
          </div>

          {/* Mic hint text — shown below input */}
          <p style={{
            fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center',
            marginTop: '6px', opacity: 0.7,
          }}>
            🎤 Click the mic to speak · your words appear in the box · press Enter or Send to submit
          </p>
        </div>
      </div>
    </div>
  )
}
