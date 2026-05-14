import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AIChatbot from '../components/AIChatbot'
import '../styles/Home.css'

/* ─── Animated Canvas Network ─── */
function AICanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let anim
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const nodes = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.2 + 0.6
    }))
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99,102,241,0.7)'; ctx.fill()
      })
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 120) * .1})`; ctx.lineWidth = .6; ctx.stroke()
          }
        }
      anim = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(anim); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="ai-canvas" />
}

/* ─── Data ─── */
const SQUADS = [
  { icon:'fa-cubes',       name:'Software Dev',     desc:'APIs, microservices, scalable backends.',  to:'/squads/software' },
  { icon:'fa-globe',       name:'Web Dev',           desc:'React, Next.js, responsive frontends.',   to:'/squads/web' },
  { icon:'fa-paint-brush', name:'UI/UX Design',      desc:'Wireframes, design systems, prototypes.', to:'/squads/uiux' },
  { icon:'fa-bullseye',    name:'Digital Marketing', desc:'SEO, campaigns, growth automation.',      to:'/squads/marketing' },
  { icon:'fa-chart-pie',   name:'Data Analysis',     desc:'ML pipelines, dashboards, insights.',     to:'/squads/data' },
]

const PROJECTS = [
  { title:'FinTech Dashboard',  tags:['Web Dev','Data'],   icon:'fa-chart-line', desc:'Real-time AI-powered trading analytics platform.' },
  { title:'E-Commerce AI',      tags:['Software','UI/UX'], icon:'fa-store',      desc:'Autonomous inventory management & smart recommendations.' },
  { title:'HealthTech Portal',  tags:['Full Stack'],       icon:'fa-heartbeat',  desc:'Patient management with ML diagnostics integration.' },
  { title:'SaaS Automation',    tags:['All Squads'],       icon:'fa-robot',      desc:'Multi-squad 72-hour delivery: code, design & marketing.' },
]

const STORIES = [
  { name:'Arjun Mehta',  role:'CTO, PaySprint',    av:'AM', text:'Velverse AI delivered our entire fintech MVP in 3 weeks. The multi-squad approach is unlike anything I\'ve experienced in 15 years.' },
  { name:'Priya Nair',   role:'Founder, ShopAI',   av:'PN', text:'The data analysis squad built our recommendation engine from scratch. Revenue increased 40% in the first month after launch.' },
  { name:'David Chen',   role:'VP Eng, CloudBase', av:'DC', text:'We replaced 4 freelancers with one Velverse subscription. Faster, cheaper, and infinitely better coordinated across disciplines.' },
]

const WORKFLOW = [
  { n:'01', icon:'fa-search',  title:'Analyze', desc:'NLP engine extracts goals, stack requirements and constraints.' },
  { n:'02', icon:'fa-sitemap', title:'Assign',  desc:'Optimal squad combination assembled based on complexity.' },
  { n:'03', icon:'fa-code',    title:'Generate',desc:'All squads build in parallel — code, design, content, data.' },
  { n:'04', icon:'fa-link',    title:'Integrate',desc:'Cross-squad sync ensures all outputs connect with QA.' },
  { n:'05', icon:'fa-rocket',  title:'Deliver', desc:'Repo, docs, demo and deployment — production-ready output.' },
]

const STATS = [
  { num:'850+', label:'Projects Delivered' },
  { num:'12ms', label:'Avg Response Time' },
  { num:'5',    label:'AI Squads Online' },
  { num:'99.9%',label:'Uptime SLA' },
]

/* Fix 3: Full 8 ORBIT_NODES */
const ORBIT_NODES = [
  { cl:'on1', icon:'fa-code',        label:'Dev' },
  { cl:'on2', icon:'fa-globe',       label:'Web' },
  { cl:'on3', icon:'fa-paint-brush', label:'UI' },
  { cl:'on4', icon:'fa-bullseye',    label:'Mkt' },
  { cl:'on5', icon:'fa-chart-pie',   label:'Data' },
  { cl:'on6', icon:'fa-shield-alt',  label:'Sec' },
  { cl:'on7', icon:'fa-database',    label:'DB' },
  { cl:'on8', icon:'fa-cloud',       label:'Cloud' },
]

const MQ_ITEMS = ['Software Dev','Web Dev','UI/UX Design','Digital Marketing','Data Analysis','AI Automation','Cloud Deploy','Security','ML Models','API Design','DevOps','Analytics']

export default function Home() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const handleAccess = () => navigate(isLoggedIn ? '/dashboard' : '/login')

  return (
    <div className="home-page">
      <AICanvas />
      <div className="bg-grid" />

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              Next-Gen Agentic Platform
            </div>
            {/* Fix 6: Updated title */}
            <h1 className="hero-title">
              AI Multi-Agent System for<br/>
              <span className="gradient-text">Software, Marketing &amp; Analytics</span>
            </h1>
            <p className="hero-sub">
              Five specialized AI squads — software development, web, design, marketing, and data analytics —
              collaborating autonomously to deliver your projects at machine speed.
            </p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={handleAccess} style={{padding:'0.72rem 1.5rem',fontSize:'0.9rem'}}>
                <i className="fas fa-rocket" />
                {isLoggedIn ? 'Open Dashboard' : 'Get Access — Free'}
              </button>
              <Link to="/pricing" className="btn-ghost" style={{padding:'0.72rem 1.4rem'}}>
                View Pricing
              </Link>
            </div>
            <div className="hero-stats">
              {STATS.map(s => (
                <div className="hero-stat" key={s.label}>
                  <strong>{s.num}</strong><span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="orbit-wrap anim-float">
              <div className="orbit-ring orbit-r1" />
              <div className="orbit-ring orbit-r2" />
              <div className="orbit-ring orbit-r3" />
              <div className="orbit-core"><i className="fas fa-robot" style={{fontSize:'2rem',color:'var(--accent)'}} /></div>
              {/* Fix 3: Render all 8 orbit nodes */}
              {ORBIT_NODES.map(n => (
                <div key={n.cl} className={`orbit-node ${n.cl}`}>
                  <i className={`fas ${n.icon}`} style={{color:'var(--accent)',fontSize:'1rem'}} />
                  <span className="orbit-label">{n.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="marquee-bar">
        <div className="marquee-track">
          {[...Array(2)].map((_,ri) => MQ_ITEMS.map((item,i) => (
            <span className="mq-item" key={`${ri}-${i}`}>
              <span className="mq-dot" />{item}
            </span>
          )))}
        </div>
      </div>

      {/* ═══ INTRO ═══ */}
      <section className="section">
        <div className="container">
          <div className="intro-grid">
            <div>
              <div className="eyebrow">About Velverse AI</div>
              <h2 className="section-title">The first true <span className="gradient-text">agentic IT company</span></h2>
              <p className="section-sub" style={{marginBottom:'1.2rem'}}>
                Velverse AI replaces entire IT departments with self-coordinating agents. Our squads don't just execute —
                they understand your business, plan autonomously, and deliver production-ready output.
              </p>
              <p className="section-sub" style={{marginBottom:'2.2rem'}}>
                One request triggers the full pipeline: requirements analysis, squad assembly, parallel execution,
                cross-squad integration, QA, and delivery.
              </p>
              <div style={{display:'flex',gap:'0.8rem',flexWrap:'wrap'}}>
                <button className="btn-primary" onClick={handleAccess}>Start Building</button>
                <Link to="/pricing" className="btn-ghost">View Pricing</Link>
              </div>
            </div>
            <div className="intro-feature-cards">
              {[
                { icon:'fa-bolt',       title:'Instant Assignment',  desc:'Tasks reach the optimal squad in under 12ms.' },
                { icon:'fa-infinity',   title:'Unlimited Scale',     desc:'All squads work in parallel, no bottlenecks.' },
                { icon:'fa-shield-alt', title:'Enterprise Security', desc:'SOC2 compliant, end-to-end encrypted output.' },
                { icon:'fa-sync-alt',   title:'Auto-Iteration',      desc:'Agents self-review and improve before delivery.' },
              ].map(c => (
                <div key={c.title} className="ifc">
                  <div className="ifc-icon"><i className={`fas ${c.icon}`} /></div>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fix 2: AI Squads section — only shown when logged in */}
      {isLoggedIn && (
        <section className="section" style={{background:'var(--surface)'}}>
          <div className="container">
            <div style={{textAlign:'center',marginBottom:'3.5rem'}}>
              <div className="eyebrow" style={{justifyContent:'center'}}>Our AI Squads</div>
              <h2 className="section-title">Elite teams, <span className="gradient-text">zero overhead</span></h2>
              <p className="section-sub" style={{margin:'0 auto'}}>
                Five specialized units working in perfect sync across every dimension of your project.
              </p>
            </div>
            <div className="squads-grid">
              {SQUADS.map((s, i) => (
                <Link to={s.to} key={s.name} className="squad-card glass-card">
                  <div className="squad-num">0{i+1}</div>
                  <div className="squad-icon"><i className={`fas ${s.icon}`} /></div>
                  <div className="squad-name">{s.name}</div>
                  <div className="squad-desc">{s.desc}</div>
                  <div className="squad-cta">Open Squad <i className="fas fa-arrow-right" /></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* If NOT logged in, show a teaser CTA for squads */}
      {!isLoggedIn && (
        <section className="section" style={{background:'var(--surface)'}}>
          <div className="container">
            <div className="squads-locked-banner">
              <div className="slb-icon"><i className="fas fa-lock" /></div>
              <h2 className="section-title" style={{marginBottom:'0.6rem'}}>Unlock AI Squads</h2>
              <p className="section-sub" style={{margin:'0 auto 2rem',textAlign:'center'}}>
                Sign in or create a free account to access all five specialized AI squads and start building.
              </p>
              <div style={{display:'flex',gap:'0.8rem',justifyContent:'center',flexWrap:'wrap'}}>
                <Link to="/login" className="btn-primary"><i className="fas fa-sign-in-alt" /> Sign In</Link>
                <Link to="/login" className="btn-ghost">Create Free Account</Link>
              </div>
              {/* Preview squad names blurred */}
              <div className="squads-preview-blur">
                {SQUADS.map(s => (
                  <div key={s.name} className="spb-item">
                    <i className={`fas ${s.icon}`} />
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ SHOWCASE ═══ */}
      <section className="section">
        <div className="container">
          <div className="eyebrow">Project Showcase</div>
          <h2 className="section-title" style={{marginBottom:'0.5rem'}}>Built by <span className="gradient-text">Velverse AI</span></h2>
          <p className="section-sub" style={{marginBottom:'3rem'}}>Real projects delivered end-to-end by our autonomous AI squads.</p>
          <div className="showcase-grid">
            {PROJECTS.map(p => (
              <div key={p.title} className="sc-card glass-card">
                <div className="sc-thumb">
                  <i className={`fas ${p.icon}`} style={{fontSize:'2.5rem',color:'var(--accent)',opacity:0.7}} />
                </div>
                <div className="sc-body">
                  <div className="sc-tags">
                    {p.tags.map(t => <span key={t} className="badge badge-indigo">{t}</span>)}
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKFLOW ═══ */}
      <section className="section wf-section">
        <div className="container">
          <div style={{textAlign:'center',marginBottom:'3.5rem'}}>
            <div className="eyebrow" style={{justifyContent:'center'}}>How It Works</div>
            <h2 className="section-title">From request to <span className="gradient-text">delivery</span></h2>
          </div>
          <div className="wf-steps">
            {WORKFLOW.map((s, i) => (
              <div key={s.n} className="wf-step">
                <div className="wf-icon-wrap"><i className={`fas ${s.icon}`} /></div>
                <span className="wf-num-badge">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < WORKFLOW.length - 1 && <div className="wf-connector"><i className="fas fa-chevron-right" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SUCCESS STORIES ═══ */}
      <section className="section">
        <div className="container">
          <div style={{textAlign:'center',marginBottom:'3.5rem'}}>
            <div className="eyebrow" style={{justifyContent:'center'}}>Customer Success</div>
            <h2 className="section-title">What our clients <span className="gradient-text">say</span></h2>
          </div>
          <div className="stories-grid">
            {STORIES.map(s => (
              <div key={s.name} className="story-card glass-card">
                <div className="story-stars">{'★'.repeat(5)}</div>
                <p className="story-quote">"{s.text}"</p>
                <div className="story-author">
                  <div className="story-av">{s.av}</div>
                  <div><div className="story-name">{s.name}</div><div className="story-role">{s.role}</div></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:'2.5rem'}}>
            {/* Fix 4: "Get Access" → "Open Dashboard" when logged in */}
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn-primary">
                <i className="fas fa-th-large" /> Open Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn-ghost">Get Access — Free</Link>
            )}
          </div>
        </div>
      </section>

      {/* ═══ COMMUNITY ═══ — Fix 7: Discord + GitHub links */}
      <section className="section" style={{background:'var(--surface)'}}>
        <div className="container">
          <div className="community-card">
            <div className="comm-content">
              <div className="eyebrow" style={{justifyContent:'center'}}>Community</div>
              <h2 className="section-title" style={{textAlign:'center'}}>
                Join <span className="gradient-text">12,000+ builders</span>
              </h2>
              <p className="section-sub" style={{textAlign:'center',margin:'0 auto 2rem'}}>
                Connect with developers, founders and AI engineers building the next generation of products.
              </p>
              <div className="comm-links">
                <a
                  href="https://discord.gg/velverseai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="comm-link-btn discord"
                >
                  <i className="fab fa-discord" />
                  <div>
                    <div className="cll-title">Join Discord</div>
                    <div className="cll-sub">12,000+ members · velverseai community</div>
                  </div>
                  <i className="fas fa-arrow-right cll-arrow" />
                </a>
                <a
                  href="https://github.com/velverseai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="comm-link-btn github"
                >
                  <i className="fab fa-github" />
                  <div>
                    <div className="cll-title">GitHub Repository</div>
                    <div className="cll-sub">Open source tools &amp; integrations</div>
                  </div>
                  <i className="fas fa-arrow-right cll-arrow" />
                </a>
              </div>
              <div className="comm-avatars">
                {['#6366f1','#818cf8','#4f46e5','#a5b4fc','#6366f1','#818cf8','#4f46e5','#a5b4fc'].map((c,i) => (
                  <div key={i} className="comm-av" style={{background:c,zIndex:8-i}} />
                ))}
                <span className="comm-count">+11,992 members online</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AI CHATBOT ═══ */}
      <section className="section" id="chatbot" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>Velverse AI Assistant</div>
            <h2 className="section-title">
              Chat with our <span className="gradient-text">AI directly</span>
            </h2>
            <p className="section-sub" style={{ margin: '0 auto 0.5rem' }}>
              Ask anything — code, design, strategy, analysis. Supports images and file uploads.
            </p>
            <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
              <i className="fas fa-info-circle" style={{ marginRight: '5px' }} />
              Requires an OpenAI API key. Click the{' '}
              <i className="fas fa-key" style={{ color: 'var(--accent)' }} />{' '}
              icon inside the chat to add yours — stored only in your browser.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AIChatbot />
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="section">
        <div className="container">
          <div className="cta-box">
            <h2 className="section-title" style={{marginBottom:'0.8rem'}}>
              Ready to ship with <span className="gradient-text">AI speed?</span>
            </h2>
            <p className="section-sub" style={{margin:'0 auto 2.5rem'}}>
              Join hundreds of teams delivering faster, cheaper and smarter with Velverse AI.
            </p>
            <div style={{display:'flex',gap:'0.8rem',justifyContent:'center',flexWrap:'wrap'}}>
              <button className="btn-primary" onClick={handleAccess} style={{padding:'0.78rem 1.8rem'}}>
                <i className="fas fa-rocket" />
                {isLoggedIn ? 'Open Dashboard' : 'Get Access — Free'}
              </button>
              <Link to="/pricing" className="btn-ghost" style={{padding:'0.78rem 1.5rem'}}>See Pricing</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
