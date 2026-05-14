// ═══════════════════════════════════════════════════════════
//  components/AIChatbot.jsx  —  Velverse AI
//
//  Full ChatGPT-style chatbot using OpenAI API directly.
//  Features:
//    • Streaming responses (word by word)
//    • Image upload (vision)
//    • File upload (text files, PDFs read as text)
//    • Multi-turn conversation history
//    • Markdown-style code block rendering
//    • Clean dark UI matching Velverse design system
//
//  Usage: <AIChatbot />
//  Requires: VITE_OPENAI_API_KEY in .env
// ═══════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from 'react'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const MODEL      = 'gpt-4o'
const IMAGE_MODEL = 'dall-e-3'

// Detect if user is requesting image generation
function isImageRequest(text) {
  const lower = text.toLowerCase()
  return /\b(generate|create|draw|make|paint|design|show me|produce|render)\b.{0,30}\b(image|picture|photo|illustration|artwork|art|logo|icon|poster|banner)\b/i.test(lower) ||
    /\b(image|picture|photo|illustration|artwork)\b.{0,20}\b(of|showing|depicting)\b/i.test(lower)
}

// ── Simple markdown renderer: code blocks + bold + line breaks ──
function renderContent(text) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.slice(3, -3).split('\n')
      const lang  = lines[0].trim()
      const code  = lines.slice(lang ? 1 : 0).join('\n')
      return (
        <pre key={i} style={codeBlockStyle}>
          {lang && <div style={codeLangStyle}>{lang}</div>}
          <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#e2e8f0' }}>{code}</code>
        </pre>
      )
    }
    // Bold **text** and line breaks
    return (
      <span key={i}>
        {part.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) => {
          if (chunk.startsWith('**') && chunk.endsWith('**'))
            return <strong key={j} style={{ color: '#f0ebe3' }}>{chunk.slice(2, -2)}</strong>
          return chunk.split('\n').map((line, k, arr) => (
            <span key={k}>{line}{k < arr.length - 1 && <br />}</span>
          ))
        })}
      </span>
    )
  })
}

// ── File reading helper ───────────────────────────────────
function readFileAsBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}
function readFileAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res(r.result)
    r.onerror = rej
    r.readAsText(file)
  })
}

const WELCOME = {
  role: 'assistant',
  content: "Hello! I'm **Velverse AI Assistant** — your intelligent workspace companion.\n\nI can help you with code, analysis, writing, planning, and more. You can also attach images or text files to your message.\n\nHow can I help you today?",
  id: 'welcome',
}

// ═══════════════════════════════════════════════════════════
export default function AIChatbot() {
  const [messages,   setMessages  ] = useState([WELCOME])
  const [input,      setInput     ] = useState('')
  const [loading,    setLoading   ] = useState(false)
  const [attachments,setAttachments] = useState([])  // { type:'image'|'text', name, data, preview? }
  const [apiKeyInput,setApiKeyInput] = useState('')
  const [savedKey,   setSavedKey  ] = useState(() => localStorage.getItem('vv_openai_key') || OPENAI_KEY)
  const [showKeyForm,setShowKeyForm] = useState(false)
  const [streamText, setStreamText ] = useState('')

  const bottomRef  = useRef(null)
  const messagesContainerRef = useRef(null)
  const fileRef    = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages, streamText])

  const activeKey = savedKey || OPENAI_KEY

  const saveKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('vv_openai_key', apiKeyInput.trim())
      setSavedKey(apiKeyInput.trim())
      setApiKeyInput('')
      setShowKeyForm(false)
    }
  }

  // ── Build OpenAI message array ────────────────────────
  const buildMessages = async (userText, files) => {
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role:    m.role,
        content: typeof m.content === 'string'
          ? m.content
          : m.content,
      }))

    // Build user content (may include image parts)
    const userContent = []

    // Text
    if (userText.trim()) userContent.push({ type: 'text', text: userText })

    // Attachments
    for (const att of files) {
      if (att.type === 'image') {
        userContent.push({ type: 'image_url', image_url: { url: att.data, detail: 'auto' } })
      } else {
        userContent.push({ type: 'text', text: `\n\n[File: ${att.name}]\n${att.data}` })
      }
    }

    return [
      {
        role: 'system',
        content: 'You are Velverse AI Assistant — a helpful, knowledgeable, and concise AI for software development, design, marketing and business. Format code in markdown code blocks. Be direct and practical.',
      },
      ...history,
      { role: 'user', content: userContent.length === 1 && userContent[0].type === 'text' ? userContent[0].text : userContent },
    ]
  }

  // ── Send message with streaming ───────────────────────
  const sendMessage = useCallback(async () => {
    const text  = input.trim()
    const files = [...attachments]
    if ((!text && files.length === 0) || loading) return

    if (!activeKey) { setShowKeyForm(true); return }

    // Optimistically add user message
    const userMsg = {
      role: 'user',
      content: text,
      attachments: files,
      id: Date.now().toString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setAttachments([])
    setLoading(true)
    setStreamText('')

    try {
      // ── Image generation path ─────────────────────────
      if (isImageRequest(text) && files.length === 0) {
        const imgResp = await fetch('https://api.openai.com/v1/images/generations', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${activeKey}`,
          },
          body: JSON.stringify({
            model:   IMAGE_MODEL,
            prompt:  text,
            n:       1,
            size:    '1024x1024',
            quality: 'standard',
          }),
        })

        if (!imgResp.ok) {
          const err = await imgResp.json()
          throw new Error(err.error?.message || `HTTP ${imgResp.status}`)
        }

        const imgData = await imgResp.json()
        const imageUrl = imgData.data?.[0]?.url
        const revisedPrompt = imgData.data?.[0]?.revised_prompt

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: revisedPrompt ? `🎨 **Generated Image**\n\n_Prompt used: ${revisedPrompt}_` : '🎨 **Generated Image**',
          imageUrl,
          id: Date.now().toString(),
        }])
        setLoading(false)
        return
      }

      const msgs = await buildMessages(text, files)

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          model:  MODEL,
          messages: msgs,
          stream: true,
          max_tokens: 2000,
        }),
      })

      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error?.message || `HTTP ${resp.status}`)
      }

      // Stream reader
      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let   full    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const raw = line.slice(6)
          if (raw === '[DONE]') break
          try {
            const json  = JSON.parse(raw)
            const delta = json.choices?.[0]?.delta?.content || ''
            full += delta
            setStreamText(full)
          } catch { /* ignore parse errors in stream */ }
        }
      }

      setStreamText('')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: full || '(no response)',
        id: Date.now().toString(),
      }])
    } catch (err) {
      setStreamText('')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ **Error:** ${err.message}\n\nPlease check your OpenAI API key.`,
        id: Date.now().toString(),
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, attachments, loading, activeKey, messages])

  // ── File attachment handler ───────────────────────────
  const handleFiles = async (fileList) => {
    const newAtts = []
    for (const file of Array.from(fileList)) {
      if (file.type.startsWith('image/')) {
        const data = await readFileAsBase64(file)
        newAtts.push({ type: 'image', name: file.name, data, preview: data })
      } else {
        try {
          const data = await readFileAsText(file)
          newAtts.push({ type: 'text', name: file.name, data: data.slice(0, 50000) })
        } catch {
          newAtts.push({ type: 'text', name: file.name, data: '[Could not read file]' })
        }
      }
    }
    setAttachments(prev => [...prev, ...newAtts])
  }

  const handleDrop = (e) => {
    e.preventDefault(); handleFiles(e.dataTransfer.files)
  }
  const handlePaste = (e) => {
    const items = e.clipboardData?.items || []
    const imageItems = Array.from(items).filter(i => i.type.startsWith('image/'))
    if (imageItems.length) {
      e.preventDefault()
      handleFiles(imageItems.map(i => i.getAsFile()))
    }
  }
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const clearChat = () => {
    setMessages([WELCOME]); setStreamText(''); setAttachments('')
  }

  // ═══════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div style={wrapStyle} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>

      {/* ── Header ──────────────────────────────────────── */}
      <div style={headerStyle}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={avatarStyle}><i className="fas fa-robot" style={{ fontSize:'1rem' }} /></div>
          <div>
            <div style={{ fontWeight:700, fontSize:'0.92rem', color:'#f0ebe3' }}>Velverse AI Assistant</div>
            <div style={{ fontSize:'0.7rem', color:'#22c55e', display:'flex', alignItems:'center', gap:'4px' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
              {activeKey ? 'Online · Powered by AI' : 'API key required'}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          <button onClick={() => setShowKeyForm(v => !v)} title="Set API key" style={iconBtnStyle}>
            <i className="fas fa-key" />
          </button>
          <button onClick={clearChat} title="Clear chat" style={iconBtnStyle}>
            <i className="fas fa-trash-alt" />
          </button>
        </div>
      </div>

      {/* ── API Key Form ─────────────────────────────────── */}
      {showKeyForm && (
        <div style={keyFormStyle}>
          <div style={{ fontSize:'0.78rem', color:'#9898a8', marginBottom:'8px' }}>
            <i className="fas fa-key" style={{ marginRight:'6px', color:'#c58442' }} />
            Enter your OpenAI API key (stored locally, never sent to our servers)
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              placeholder="sk-..."
              style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'8px', padding:'0.5rem 0.8rem', color:'#f0ebe3', fontSize:'0.82rem', outline:'none' }}
            />
            <button onClick={saveKey} style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', padding:'0.5rem 1rem', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>Save</button>
          </div>
          {savedKey && <div style={{ fontSize:'0.72rem', color:'#22c55e', marginTop:'6px' }}>✓ API key is set</div>}
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────── */}
      <div ref={messagesContainerRef} style={messagesStyle}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap:'4px' }}>
            {msg.role === 'assistant' && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
                <div style={{ ...avatarStyle, width:'22px', height:'22px', fontSize:'0.65rem' }}><i className="fas fa-robot" /></div>
                <span style={{ fontSize:'0.7rem', color:'var(--muted, #6b6b78)', fontWeight:600 }}>VELVERSE AI</span>
              </div>
            )}
            {/* Generated images */}
            {msg.imageUrl && (
              <div style={{ marginTop: msg.content ? '10px' : 0 }}>
                <img src={msg.imageUrl} alt="Generated" style={{ maxWidth:'100%', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)', display:'block' }} />
                <a href={msg.imageUrl} target="_blank" rel="noreferrer" style={{ display:'inline-block', marginTop:'6px', fontSize:'0.72rem', color:'#6366f1', textDecoration:'none' }}>
                  <i className="fas fa-external-link-alt" style={{ marginRight:'4px' }} />Open full size
                </a>
              </div>
            )}
            {/* Image attachments */}
            {msg.attachments?.filter(a => a.type === 'image').map((att, i) => (
              <img key={i} src={att.preview} alt={att.name} style={{ maxWidth:'260px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)' }} />
            ))}
            {/* File attachments */}
            {msg.attachments?.filter(a => a.type === 'text').map((att, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'8px', padding:'5px 10px', fontSize:'0.76rem', color:'#a5b4fc' }}>
                <i className="fas fa-file-alt" />{att.name}
              </div>
            ))}
            {/* Text bubble */}
            {msg.content && (
              <div style={{
                ...bubbleStyle,
                background:    msg.role === 'user' ? 'var(--accent, #6366f1)' : 'rgba(255,255,255,0.05)',
                border:        msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                borderRadius:  msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                maxWidth:      msg.role === 'user' ? '75%' : '90%',
              }}>
                {renderContent(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))}
              </div>
            )}
          </div>
        ))}

        {/* Streaming response */}
        {streamText && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'4px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ ...avatarStyle, width:'22px', height:'22px', fontSize:'0.65rem' }}><i className="fas fa-robot" /></div>
              <span style={{ fontSize:'0.7rem', color:'#6b6b78', fontWeight:600 }}>VELVERSE AI</span>
            </div>
            <div style={{ ...bubbleStyle, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px 14px 14px 4px', maxWidth:'90%' }}>
              {renderContent(streamText)}
              <span style={{ display:'inline-block', width:'8px', height:'14px', background:'var(--accent, #6366f1)', marginLeft:'2px', borderRadius:'1px', animation:'blink 0.8s step-end infinite', verticalAlign:'middle' }} />
            </div>
          </div>
        )}

        {/* Thinking indicator */}
        {loading && !streamText && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <div style={{ ...avatarStyle, width:'22px', height:'22px', fontSize:'0.65rem' }}><i className="fas fa-robot" /></div>
            <div style={{ ...bubbleStyle, padding:'0.7rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px 14px 14px 4px' }}>
              <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#6b6b78', display:'inline-block', animation:`bounce 1.2s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Attachment previews ──────────────────────────── */}
      {attachments.length > 0 && (
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', padding:'8px 16px 0', background:'rgba(255,255,255,0.02)' }}>
          {attachments.map((att, i) => (
            <div key={i} style={{ position:'relative', display:'flex', alignItems:'center' }}>
              {att.type === 'image' ? (
                <img src={att.preview} alt={att.name} style={{ width:'48px', height:'48px', objectFit:'cover', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.12)' }} />
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'8px', padding:'6px 10px', fontSize:'0.74rem', color:'#a5b4fc' }}>
                  <i className="fas fa-file-alt" />{att.name.slice(0, 18)}{att.name.length > 18 ? '…' : ''}
                </div>
              )}
              <button onClick={() => setAttachments(a => a.filter((_, j) => j !== i))} style={{ position:'absolute', top:'-6px', right:'-6px', width:'16px', height:'16px', borderRadius:'50%', background:'#ef4444', border:'none', color:'#fff', fontSize:'0.6rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Input row ────────────────────────────────────── */}
      <div style={inputRowStyle}>
        <input ref={fileRef} type="file" multiple accept="image/*,.txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.csv,.html,.css" style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} />

        <button onClick={() => fileRef.current?.click()} title="Attach file or image" style={{ ...iconBtnStyle, flexShrink:0, background:'rgba(255,255,255,0.05)', borderRadius:'10px', width:'38px', height:'38px' }}>
          <i className="fas fa-paperclip" />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          placeholder="Message Velverse AI… (Enter to send · Shift+Enter for new line · paste images)"
          rows={1}
          style={inputStyle}
        />

        <button onClick={sendMessage} disabled={(!input.trim() && attachments.length === 0) || loading} title="Send" style={{
          ...sendBtnStyle,
          opacity: (!input.trim() && attachments.length === 0) || loading ? 0.4 : 1,
          cursor:  (!input.trim() && attachments.length === 0) || loading ? 'not-allowed' : 'pointer',
        }}>
          {loading
            ? <i className="fas fa-circle-notch fa-spin" />
            : <i className="fas fa-paper-plane" />
          }
        </button>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────
const wrapStyle = {
  display:       'flex',
  flexDirection: 'column',
  width:         '100%',
  maxWidth:      '800px',
  height:        '600px',
  background:    'var(--card, #101013)',
  border:        '1px solid rgba(255,255,255,0.08)',
  borderRadius:  '18px',
  overflow:      'hidden',
  boxShadow:     '0 32px 80px rgba(0,0,0,0.5)',
  fontFamily:    "var(--fd, 'Plus Jakarta Sans', sans-serif)",
}
const headerStyle = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  padding:        '12px 16px',
  borderBottom:   '1px solid rgba(255,255,255,0.07)',
  background:     'rgba(255,255,255,0.02)',
  flexShrink:     0,
}
const avatarStyle = {
  width:          '34px',
  height:         '34px',
  borderRadius:   '10px',
  background:     'var(--accent, #6366f1)',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  color:          '#fff',
  flexShrink:     0,
}
const iconBtnStyle = {
  width:          '32px',
  height:         '32px',
  background:     'transparent',
  border:         '1px solid rgba(255,255,255,0.1)',
  borderRadius:   '8px',
  color:          '#6b6b78',
  cursor:         'pointer',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  fontSize:       '0.8rem',
  transition:     'all 0.15s',
}
const keyFormStyle = {
  padding:    '12px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  background: 'rgba(99,102,241,0.05)',
  flexShrink: 0,
}
const messagesStyle = {
  flex:        1,
  overflowY:   'auto',
  padding:     '16px',
  display:     'flex',
  flexDirection:'column',
  gap:         '14px',
}
const bubbleStyle = {
  padding:    '0.7rem 1rem',
  borderRadius:'14px',
  fontSize:   '0.88rem',
  lineHeight: 1.65,
  color:      '#e2e8f0',
  wordBreak:  'break-word',
}
const codeBlockStyle = {
  background:   'rgba(0,0,0,0.45)',
  border:       '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding:      '0.8rem 1rem',
  margin:       '0.5rem 0',
  overflowX:    'auto',
  whiteSpace:   'pre',
}
const codeLangStyle = {
  fontSize:    '0.68rem',
  color:       '#6b6b78',
  fontFamily:  'JetBrains Mono, monospace',
  marginBottom:'0.4rem',
  textTransform:'uppercase',
}
const inputRowStyle = {
  display:     'flex',
  gap:         '8px',
  padding:     '10px 12px',
  borderTop:   '1px solid rgba(255,255,255,0.07)',
  background:  'rgba(255,255,255,0.02)',
  alignItems:  'flex-end',
  flexShrink:  0,
}
const inputStyle = {
  flex:         1,
  background:   'rgba(255,255,255,0.05)',
  border:       '1.5px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding:      '0.6rem 0.9rem',
  color:        '#f0ebe3',
  fontSize:     '0.88rem',
  fontFamily:   'inherit',
  outline:      'none',
  resize:       'none',
  minHeight:    '38px',
  maxHeight:    '120px',
  overflowY:    'auto',
  lineHeight:   1.5,
}
const sendBtnStyle = {
  width:          '38px',
  height:         '38px',
  background:     'var(--accent, #6366f1)',
  border:         'none',
  borderRadius:   '12px',
  color:          '#fff',
  fontSize:       '0.9rem',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  transition:     'all 0.18s',
  flexShrink:     0,
}
