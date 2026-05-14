// ═══════════════════════════════════════════════════════════
//  pages/SquadGame.jsx  —  Velverse AI  v4.2
//  ✅ FIXED: handleWrong stale-closure / call-before-define bug
//  ✅ FIXED: timer useEffect uses ref-based callback, never stale
//  ✅ Voice answer support
//  ✅ Score tracker in localStorage
//  Route: /game
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import VoiceButton from '../components/VoiceButton'

const QUESTIONS = {
  software: [
    { q: 'What does REST stand for?',                       a: ['representational state transfer'], hint: "It's an architectural style for APIs" },
    { q: 'Which HTTP method is used to update a resource?', a: ['put', 'patch'],                   hint: 'Two methods: one full update, one partial' },
    { q: 'What does JWT stand for?',                        a: ['json web token'],                  hint: 'Used for authentication' },
    { q: 'What database does Velverse AI use?',             a: ['mongodb'],                         hint: 'A NoSQL document database' },
    { q: 'What is bcrypt used for?',                        a: ['password hashing', 'hashing passwords', 'hash passwords'], hint: 'Security for stored passwords' },
    { q: 'What port does the Velverse backend run on?',     a: ['5000'],                            hint: 'A four-digit number starting with 5' },
    { q: 'What framework is the Velverse backend built on?',a: ['express', 'express.js'],           hint: 'A minimal Node.js web framework' },
  ],
  web: [
    { q: 'What library does the Velverse frontend use?',    a: ['react'],           hint: 'A JavaScript UI library by Meta' },
    { q: 'What build tool does Velverse use?',              a: ['vite'],            hint: 'Lightning fast frontend tooling' },
    { q: 'What does CSS stand for?',                        a: ['cascading style sheets'], hint: 'Used for styling web pages' },
    { q: 'What hook manages state in React?',               a: ['usestate', 'use state'], hint: 'useState — a fundamental React hook' },
    { q: 'What port does the Velverse frontend run on?',    a: ['3000'],            hint: 'A four-digit number starting with 3' },
  ],
  ai: [
    { q: 'What AI orchestration tool does Velverse use?',   a: ['flowise', 'flowise ai'],          hint: 'A visual LLM flow builder' },
    { q: 'What does LLM stand for?',                        a: ['large language model'],            hint: 'The AI models powering chatbots' },
    { q: 'What protocol does Velverse use for AI tools?',   a: ['mcp', 'model context protocol'],  hint: 'Enables AI to use external tools' },
    { q: 'What automation tool connects AI to workflows?',  a: ['n8n'],                            hint: 'Open-source workflow automation' },
    { q: 'How many AI squads does Velverse have?',          a: ['5', 'five'],                      hint: 'Software, Web, UX, Marketing, Data' },
    { q: 'What does RAG stand for?',                        a: ['retrieval augmented generation'], hint: 'AI technique using external knowledge' },
  ],
  general: [
    { q: 'What does API stand for?',             a: ['application programming interface'], hint: 'How software talks to software' },
    { q: 'What does SaaS stand for?',            a: ['software as a service'],            hint: 'Cloud-based software delivery model' },
    { q: 'What language is Node.js written in?', a: ['javascript'],                       hint: 'The language of the web' },
    { q: 'What does CRUD stand for?',            a: ['create read update delete'],        hint: 'The four basic database operations' },
    { q: 'What does UI stand for?',              a: ['user interface'],                   hint: 'What users see and interact with' },
    { q: 'What does UX stand for?',              a: ['user experience'],                  hint: 'How users feel when using the product' },
  ],
}

const CATEGORIES = [
  // ── Technical ──────────────────────────────────────────
  { key: 'general',  label: 'General Tech',  icon: 'fa-lightbulb', color: '#c58442',  group: 'technical' },
  { key: 'software', label: 'Software Dev',  icon: 'fa-cubes',     color: '#6366f1',  group: 'technical' },
  { key: 'web',      label: 'Web & React',   icon: 'fa-globe',     color: '#22c55e',  group: 'technical' },
  { key: 'ai',       label: 'AI & Velverse', icon: 'fa-robot',     color: '#ec4899',  group: 'technical' },
  // ── Non-Technical ──────────────────────────────────────
  { key: 'tictactoe', label: 'Tic Tac Toe', icon: 'fa-th',        color: '#38bdf8',  group: 'non-technical' },
]
const SQUAD_NAMES = ['Software Dev', 'Web Dev', 'UI/UX', 'Marketing', 'Data Analysis']
const shuffle   = (arr) => [...arr].sort(() => Math.random() - 0.5)
const normalize = (s)   => s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '')

function loadScores() { try { return JSON.parse(localStorage.getItem('vv_game_scores') || '{}') } catch { return {} } }
function saveScore(name, pts) {
  const s = loadScores(); s[name] = (s[name] || 0) + pts
  localStorage.setItem('vv_game_scores', JSON.stringify(s))
}

export default function SquadGame() {
  const { user }   = useAuth()
  const playerName = user?.name?.split(' ')[0] || 'Player'

  const [screen,    setScreen   ] = useState('lobby')
  const [category,  setCategory ] = useState('general')
  const [questions, setQuestions] = useState([])
  const [qIndex,    setQIndex   ] = useState(0)
  const [score,     setScore    ] = useState(0)
  const [streak,    setStreak   ] = useState(0)
  const [answer,    setAnswer   ] = useState('')
  const [feedback,  setFeedback ] = useState(null)
  const [showHint,  setShowHint ] = useState(false)
  const [timeLeft,  setTimeLeft ] = useState(20)
  const [aiSquad,   setAiSquad  ] = useState(() => SQUAD_NAMES[Math.floor(Math.random() * SQUAD_NAMES.length)])

  const timerRef       = useRef(null)
  const inputRef       = useRef(null)
  const questionsRef   = useRef([])
  const feedbackRef    = useRef(null)
  const streakRef      = useRef(0)
  const showHintRef    = useRef(false)
  const handleWrongRef = useRef(null)

  useEffect(() => { questionsRef.current = questions }, [questions])
  useEffect(() => { feedbackRef.current  = feedback  }, [feedback])
  useEffect(() => { streakRef.current    = streak    }, [streak])
  useEffect(() => { showHintRef.current  = showHint  }, [showHint])

  const current = questions[qIndex]

  const nextQuestion = useCallback(() => {
    setFeedback(null); setShowHint(false); setTimeLeft(20)
    setQIndex(i => {
      const next = i + 1
      if (next >= questionsRef.current.length) { setScreen('result'); return i }
      return next
    })
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // Define handleWrong BEFORE the useEffect that can call it via ref
  const handleWrong = useCallback(() => {
    clearInterval(timerRef.current)
    setStreak(0); setFeedback('wrong'); setAnswer('')
    setTimeout(nextQuestion, 1800)
  }, [nextQuestion])

  // Keep the ref always pointing at the latest handleWrong
  useEffect(() => { handleWrongRef.current = handleWrong }, [handleWrong])

  // Timer — reads callbacks from refs so it's never stale
  useEffect(() => {
    if (screen !== 'playing' || feedbackRef.current) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleWrongRef.current(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, qIndex, feedback])

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || feedbackRef.current) return
    clearInterval(timerRef.current)
    const norm    = normalize(answer)
    const correct = current?.a.some(a => normalize(a) === norm || normalize(a).includes(norm) || norm.includes(normalize(a)))
    if (correct) {
      const pts = showHintRef.current ? 5 : (timeLeft > 10 ? 15 : 10) + (streakRef.current >= 2 ? 5 : 0)
      setScore(s => s + pts); setStreak(s => s + 1); setFeedback('correct')
      saveScore(playerName, pts)
    } else { setStreak(0); setFeedback('wrong') }
    setAnswer('')
    setTimeout(nextQuestion, 1800)
  }, [answer, current, timeLeft, playerName, nextQuestion])

  const startGame = () => {
    if (category === 'tictactoe') { setScreen('tictactoe'); return }
    const pool = shuffle([...(QUESTIONS[category] || []), ...QUESTIONS.general]).slice(0, 8)
    setQuestions(pool); questionsRef.current = pool
    setQIndex(0); setScore(0); setStreak(0); streakRef.current = 0
    setAnswer(''); setFeedback(null); feedbackRef.current = null
    setShowHint(false); showHintRef.current = false; setTimeLeft(20)
    setAiSquad(SQUAD_NAMES[Math.floor(Math.random() * SQUAD_NAMES.length)])
    setScreen('playing')
  }

  const handleVoiceAnswer  = (text)    => setAnswer(text)
  const handleVoiceInterim = (interim) => { if (interim) setAnswer(interim) }
  const handleKey          = (e)       => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }

  const leaderboard = Object.entries(loadScores()).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // ── LOBBY ──────────────────────────────────────────────
  if (screen === 'lobby') return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'0.6rem' }}>🎮</div>
          <h1 style={h1Style}>Squad Game</h1>
          <p style={subStyle}>Test your tech knowledge with your AI squad.<br/>Use voice or type your answers.</p>
        </div>
        <div style={{ marginBottom:'2rem' }}>
          <div style={sectionLabel}>⚙️ Technical Games</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.8rem', marginBottom:'1.2rem' }}>
            {CATEGORIES.filter(c => c.group === 'technical').map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)} style={{
                ...catBtn,
                borderColor: category === c.key ? c.color : 'rgba(255,255,255,0.08)',
                background:  category === c.key ? `${c.color}18` : 'rgba(255,255,255,0.03)',
                color:       category === c.key ? c.color : '#9898a8',
              }}>
                <i className={`fas ${c.icon}`} style={{ marginRight:'7px' }} />{c.label}
              </button>
            ))}
          </div>
          <div style={sectionLabel}>🎲 Non-Technical Games</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.8rem' }}>
            {CATEGORIES.filter(c => c.group === 'non-technical').map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)} style={{
                ...catBtn,
                borderColor: category === c.key ? c.color : 'rgba(255,255,255,0.08)',
                background:  category === c.key ? `${c.color}18` : 'rgba(255,255,255,0.03)',
                color:       category === c.key ? c.color : '#9898a8',
              }}>
                <i className={`fas ${c.icon}`} style={{ marginRight:'7px' }} />{c.label}
              </button>
            ))}
          </div>
        </div>
        {leaderboard.length > 0 && (
          <div style={{ marginBottom:'2rem' }}>
            <div style={sectionLabel}>🏆 Top Scores</div>
            {leaderboard.map(([name, pts], i) => (
              <div key={name} style={lbRow}>
                <span style={{ color:['#fbbf24','#94a3b8','#cd7f32'][i]||'#6b6b78', fontWeight:700, width:'24px' }}>{i+1}.</span>
                <span style={{ flex:1, color:'#c8c0b4' }}>{name}</span>
                <span style={{ color:'#c58442', fontWeight:700 }}>{pts} pts</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={startGame} style={primaryBtn}>
          <i className="fas fa-play" style={{ marginRight:'8px' }} />Start Game
        </button>
        <Link to="/dashboard" style={{ ...ghostBtn, textAlign:'center', display:'block', marginTop:'0.8rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )

  // ── TIC TAC TOE ────────────────────────────────────────
  if (screen === 'tictactoe') return <TicTacToe onBack={() => setScreen('lobby')} />

  // ── PLAYING ────────────────────────────────────────────
  if (screen === 'playing') return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth:'620px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
          <div style={{ flex:1, height:'4px', background:'rgba(255,255,255,0.07)', borderRadius:'4px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(qIndex/questions.length)*100}%`, background:'#c58442', borderRadius:'4px', transition:'width 0.3s' }} />
          </div>
          <span style={{ fontSize:'0.8rem', color:'#6b6b78', whiteSpace:'nowrap' }}>{qIndex+1} / {questions.length}</span>
        </div>
        <div style={{ display:'flex', gap:'1rem', marginBottom:'1.8rem', flexWrap:'wrap' }}>
          <div style={statPill}><i className="fas fa-star" style={{ color:'#c58442', marginRight:'5px' }} />{score} pts</div>
          {streak >= 2 && <div style={{ ...statPill, background:'rgba(234,179,8,0.12)', borderColor:'rgba(234,179,8,0.3)', color:'#fbbf24' }}>🔥 {streak} streak</div>}
          <div style={{ ...statPill, marginLeft:'auto', background:timeLeft<=5?'rgba(239,68,68,0.12)':'rgba(255,255,255,0.05)', borderColor:timeLeft<=5?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.08)', color:timeLeft<=5?'#ef4444':'#9898a8' }}>
            <i className="fas fa-clock" style={{ marginRight:'5px' }} />{timeLeft}s
          </div>
        </div>
        <div style={{ fontSize:'0.75rem', color:'#6b6b78', marginBottom:'0.6rem' }}>
          <i className="fas fa-robot" style={{ marginRight:'5px', color:'#c58442' }} />{aiSquad} is asking:
        </div>
        <h2 style={{ fontSize:'1.35rem', fontWeight:700, color:'#f0ebe3', lineHeight:1.4, marginBottom:'1.8rem' }}>{current?.q}</h2>
        {showHint && (
          <div style={{ padding:'0.7rem 1rem', background:'rgba(197,132,66,0.08)', border:'1px solid rgba(197,132,66,0.2)', borderRadius:'8px', fontSize:'0.85rem', color:'#c58442', marginBottom:'1.2rem' }}>
            💡 Hint: {current?.hint}
          </div>
        )}
        {feedback && (
          <div style={{ padding:'1rem', borderRadius:'10px', textAlign:'center', background:feedback==='correct'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.10)', border:`1px solid ${feedback==='correct'?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, color:feedback==='correct'?'#22c55e':'#ef4444', fontSize:'1.1rem', fontWeight:700, marginBottom:'1.2rem' }}>
            {feedback==='correct' ? `✅ Correct! +${showHint?5:timeLeft>10?15:10}${streak>=2?' +5 streak bonus':''} pts` : `❌ Wrong. Answer: ${current?.a[0]}`}
          </div>
        )}
        <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'1rem' }}>
          <input ref={inputRef} type="text" value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={handleKey}
            placeholder="Type your answer… or use the mic 🎤" disabled={!!feedback} autoFocus
            style={{ flex:1, padding:'0.75rem 1rem', background:'rgba(255,255,255,0.05)', border:`1.5px solid ${feedback==='correct'?'rgba(34,197,94,0.4)':feedback==='wrong'?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.1)'}`, borderRadius:'10px', color:'#f0ebe3', fontSize:'0.95rem', fontFamily:'inherit', outline:'none' }}
          />
          <VoiceButton onTranscript={handleVoiceAnswer} onInterim={handleVoiceInterim} disabled={!!feedback} lang="en-US" />
        </div>
        <div style={{ display:'flex', gap:'0.8rem', flexWrap:'wrap' }}>
          <button onClick={handleSubmit} disabled={!answer.trim()||!!feedback} style={{ ...primaryBtn, flex:1 }}>
            <i className="fas fa-check" style={{ marginRight:'7px' }} />Submit Answer
          </button>
          {!showHint && !feedback && (
            <button onClick={() => setShowHint(true)} style={{ ...ghostBtn, padding:'0.7rem 1.2rem' }}>💡 Hint (−5 pts)</button>
          )}
          <button onClick={() => { clearInterval(timerRef.current); handleWrong() }} style={{ ...ghostBtn, padding:'0.7rem 1rem', color:'#ef4444', borderColor:'rgba(239,68,68,0.3)' }}>Skip</button>
        </div>
        <button onClick={() => { clearInterval(timerRef.current); setScreen('lobby') }} style={{ marginTop:'1.2rem', background:'transparent', border:'none', color:'#6b6b78', fontSize:'0.82rem', cursor:'pointer', width:'100%' }}>Quit game</button>
      </div>
    </div>
  )

  // ── RESULT ─────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, textAlign:'center' }}>
        <div style={{ fontSize:'4rem', marginBottom:'0.6rem' }}>{score>=80?'🏆':score>=40?'🥈':'🎯'}</div>
        <h1 style={h1Style}>Game Over!</h1>
        <p style={{ ...subStyle, marginBottom:'2rem' }}>{score>=80?'Incredible! You crushed it! 🔥':score>=40?'Great work! Keep learning!':'Good effort! Try again to improve!'}</p>
        <div style={{ display:'flex', gap:'1rem', justifyContent:'center', marginBottom:'2.5rem', flexWrap:'wrap' }}>
          <div style={bigStat}><div style={{ fontSize:'2.5rem', fontWeight:800, color:'#c58442' }}>{score}</div><div style={{ fontSize:'0.8rem', color:'#6b6b78', textTransform:'uppercase', letterSpacing:'0.08em' }}>Points</div></div>
          <div style={bigStat}><div style={{ fontSize:'2.5rem', fontWeight:800, color:'#22c55e' }}>{questions.length}</div><div style={{ fontSize:'0.8rem', color:'#6b6b78', textTransform:'uppercase', letterSpacing:'0.08em' }}>Questions</div></div>
        </div>
        <button onClick={startGame} style={{ ...primaryBtn, marginBottom:'0.8rem' }}><i className="fas fa-redo" style={{ marginRight:'7px' }} />Play Again</button>
        <Link to="/dashboard" style={{ ...ghostBtn, display:'block', textAlign:'center' }}>Back to Dashboard</Link>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  Tic Tac Toe — standalone component
// ═══════════════════════════════════════════════════════════
function TicTacToe({ onBack }) {
  const [board,   setBoard  ] = useState(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)
  const [scores,  setScores ] = useState({ X: 0, O: 0, Tie: 0 })
  const [history, setHistory] = useState([])

  const winner = calcWinner(board)
  const isDraw = !winner && board.every(Boolean)
  const status = winner
    ? `🏆 Player ${winner} wins!`
    : isDraw
    ? "🤝 It's a draw!"
    : `Player ${xIsNext ? 'X' : 'O'}'s turn`

  const handleClick = (i) => {
    if (board[i] || winner || isDraw) return
    const next = board.slice()
    next[i] = xIsNext ? 'X' : 'O'
    setBoard(next)
    setXIsNext(x => !x)
    const w = calcWinner(next)
    const d = !w && next.every(Boolean)
    if (w || d) {
      const key = w || 'Tie'
      setScores(s => ({ ...s, [key]: s[key] + 1 }))
      setHistory(h => [...h, w ? `Player ${w} won` : 'Draw'])
    }
  }

  const reset = () => {
    setBoard(Array(9).fill(null))
    setXIsNext(true)
  }
  const fullReset = () => {
    reset()
    setScores({ X: 0, O: 0, Tie: 0 })
    setHistory([])
  }

  const winLine = winner ? getWinLine(board) : []

  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth:'480px', textAlign:'center' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'0.4rem' }}>❌ ⭕</div>
        <h1 style={h1Style}>Tic Tac Toe</h1>

        {/* Score row */}
        <div style={{ display:'flex', gap:'1rem', justifyContent:'center', marginBottom:'1.5rem' }}>
          {[['X','#6366f1'],['Tie','#9898a8'],['O','#ec4899']].map(([k,c]) => (
            <div key={k} style={{ background:`${c}18`, border:`1px solid ${c}40`, borderRadius:'10px', padding:'0.5rem 1.2rem', minWidth:'60px' }}>
              <div style={{ fontSize:'1.4rem', fontWeight:800, color:c }}>{scores[k]}</div>
              <div style={{ fontSize:'0.68rem', color:'#6b6b78', textTransform:'uppercase', letterSpacing:'0.08em' }}>{k==='Tie'?'Draw':`P ${k}`}</div>
            </div>
          ))}
        </div>

        {/* Status */}
        <div style={{ fontSize:'1rem', fontWeight:600, color: winner ? '#22c55e' : isDraw ? '#c58442' : '#f0ebe3', marginBottom:'1.2rem', minHeight:'1.4em' }}>
          {status}
        </div>

        {/* Board */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', maxWidth:'270px', margin:'0 auto 1.5rem' }}>
          {board.map((cell, i) => (
            <button key={i} onClick={() => handleClick(i)} style={{
              width:'100%', aspectRatio:'1', fontSize:'2rem', fontWeight:800,
              background: winLine.includes(i) ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${winLine.includes(i) ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius:'10px',
              color: cell === 'X' ? '#6366f1' : '#ec4899',
              cursor: cell || winner || isDraw ? 'default' : 'pointer',
              transition:'all 0.15s',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {cell}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', gap:'0.8rem', flexWrap:'wrap', justifyContent:'center' }}>
          {(winner || isDraw) && (
            <button onClick={reset} style={{ ...primaryBtn, flex:'none', minWidth:'130px' }}>
              <i className="fas fa-redo" style={{ marginRight:'7px' }} />Play Again
            </button>
          )}
          <button onClick={fullReset} style={{ ...ghostBtn }}>Reset Scores</button>
          <button onClick={onBack} style={{ ...ghostBtn }}>← Back</button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop:'1.5rem', textAlign:'left' }}>
            <div style={sectionLabel}>Match History</div>
            {[...history].reverse().slice(0,5).map((h,i) => (
              <div key={i} style={{ ...lbRow, fontSize:'0.8rem', color:'#9898a8' }}>
                <span style={{ color:'#6b6b78' }}>#{history.length - i}</span>
                <span style={{ flex:1, marginLeft:'0.8rem' }}>{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function calcWinner(squares) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (const [a,b,c] of lines)
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a]
  return null
}
function getWinLine(squares) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (const line of lines) {
    const [a,b,c] = line
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return line
  }
  return []
}


const pageStyle    = { minHeight:'100vh', background:'#0d0d0d', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 1rem 2rem', fontFamily:"'DM Sans','Segoe UI',sans-serif" }
const cardStyle    = { background:'#141414', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'2.5rem', width:'100%', maxWidth:'520px', boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }
const h1Style      = { fontSize:'2rem', fontWeight:800, color:'#f0ebe3', letterSpacing:'-0.03em', marginBottom:'0.5rem' }
const subStyle     = { fontSize:'0.95rem', color:'#6b6b78', lineHeight:1.6 }
const sectionLabel = { fontSize:'0.75rem', fontWeight:700, color:'#6b6b78', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.8rem' }
const catBtn       = { padding:'0.75rem 1rem', borderRadius:'10px', border:'1.5px solid', background:'transparent', cursor:'pointer', fontSize:'0.88rem', fontWeight:600, fontFamily:'inherit', transition:'all 0.2s', textAlign:'left' }
const lbRow        = { display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.5rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.88rem' }
const primaryBtn   = { width:'100%', padding:'0.85rem', background:'#c58442', color:'#0d0d0d', border:'none', borderRadius:'10px', fontSize:'1rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center' }
const ghostBtn     = { padding:'0.7rem 1rem', background:'transparent', color:'#9898a8', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:'10px', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', textDecoration:'none', transition:'all 0.2s' }
const statPill     = { display:'flex', alignItems:'center', padding:'0.35rem 0.8rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', fontSize:'0.82rem', fontWeight:600, color:'#c8c0b4' }
const bigStat      = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'1.2rem 2rem', minWidth:'120px' }
