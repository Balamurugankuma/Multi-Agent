import '../styles/Community.css'

const POSTS = [
  { user:'Arjun M', av:'AM', time:'2h ago', title:'Built a full SaaS in 48 hours with Velverse AI squads', likes:142, comments:38, tags:['showcase','web-dev'] },
  { user:'Priya N', av:'PN', time:'5h ago', title:'How I use the Data Analysis squad to automate monthly reporting', likes:89, comments:21, tags:['tutorial','data'] },
  { user:'David C', av:'DC', time:'1d ago', title:'Velverse vs traditional freelancers — my 3-month comparison', likes:234, comments:67, tags:['opinion','productivity'] },
  { user:'Sam K',   av:'SK', time:'2d ago', title:'Tips for getting the best outputs from the UI/UX squad', likes:178, comments:44, tags:['tips','design'] },
]
const EVENTS = [
  { title:'Velverse AI Hackathon 2026',     date:'Apr 15–17', type:'Hackathon' },
  { title:'AI Squads Deep Dive Webinar', date:'Mar 22',    type:'Webinar' },
  { title:'Community Q&A with the Team', date:'Mar 18',   type:'Live' },
]
const AV_COLORS = ['#6366f1','#818cf8','#4f46e5','#a5b4fc']

export default function Community() {
  return (
    <div className="community-page">
      <div className="bg-grid" />
      <div className="container">

        {/* Hero with Discord + GitHub links — Fix 7 */}
        <div className="comm-hero">
          <div className="eyebrow" style={{justifyContent:'center'}}>Community</div>
          <h1 className="section-title" style={{textAlign:'center'}}>
            Build together with <span className="gradient-text">12,000+ members</span>
          </h1>
          <p className="section-sub" style={{textAlign:'center',margin:'0 auto 2.5rem'}}>
            Share projects, get feedback, attend events and shape the future of autonomous software development.
          </p>

          {/* Primary community links */}
          <div className="comm-hero-links">
            <a
              href="https://discord.gg/velverseai"
              target="_blank"
              rel="noopener noreferrer"
              className="comm-hero-btn discord"
            >
              <i className="fab fa-discord" />
              <div>
                <div className="chb-title">Join Discord</div>
                <div className="chb-sub">12,000+ members · Active daily</div>
              </div>
              <i className="fas fa-arrow-right chb-arrow" />
            </a>
            <a
              href="https://github.com/velverseai"
              target="_blank"
              rel="noopener noreferrer"
              className="comm-hero-btn github"
            >
              <i className="fab fa-github" />
              <div>
                <div className="chb-title">GitHub Repository</div>
                <div className="chb-sub">Open source integrations &amp; tools</div>
              </div>
              <i className="fas fa-arrow-right chb-arrow" />
            </a>
          </div>

          {/* Member avatars */}
          <div className="comm-member-row">
            <div className="comm-av-stack">
              {['AM','PN','DC','SK','YT','MH','JR','LC'].map((ini,i) => (
                <div key={i} className="cav" style={{background:AV_COLORS[i%4],zIndex:8-i}}>{ini}</div>
              ))}
            </div>
            <span className="comm-member-txt">Joined by 12,400+ developers worldwide</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="comm-stats-strip">
          {[
            {n:'12,400+', l:'Members',        icon:'fa-users'},
            {n:'8,920',   l:'Discussions',    icon:'fa-comments'},
            {n:'3,241',   l:'Projects Shared',icon:'fa-folder-open'},
            {n:'87',      l:'Countries',      icon:'fa-globe'},
          ].map(s => (
            <div key={s.l} className="css-item">
              <i className={`fas ${s.icon}`} />
              <div className="css-num">{s.n}</div>
              <div className="css-label">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="comm-layout">
          {/* Posts */}
          <div>
            <div className="comm-section-label">Recent Discussions</div>
            {POSTS.map((p,i) => (
              <div key={i} className="comm-post glass-card">
                <div className="comm-post-header">
                  <div className="cph-av" style={{background:AV_COLORS[i%4]}}>{p.av}</div>
                  <div className="cph-meta">
                    <span className="cph-name">{p.user}</span>
                    <span className="cph-time">{p.time}</span>
                  </div>
                  <div className="cph-tags">
                    {p.tags.map(t => <span key={t} className="badge badge-indigo">{t}</span>)}
                  </div>
                </div>
                <h3 className="comm-post-title">{p.title}</h3>
                <div className="comm-post-foot">
                  <span className="cpf-stat"><i className="fas fa-heart" />{p.likes}</span>
                  <span className="cpf-stat"><i className="fas fa-comment" />{p.comments}</span>
                  <button className="cpf-read">Read →</button>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div>
            <div className="comm-section-label">Upcoming Events</div>
            {EVENTS.map((e,i) => (
              <div key={i} className="comm-event glass-card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.6rem'}}>
                  <span className={`badge ${e.type==='Hackathon'?'badge-amber':e.type==='Live'?'badge-green':'badge-indigo'}`}>{e.type}</span>
                  <span style={{fontSize:'0.72rem',color:'var(--muted)',fontFamily:'var(--fm)'}}>{e.date}</span>
                </div>
                <h4 className="comm-event-title">{e.title}</h4>
                <button className="btn-accent-outline" style={{width:'100%',justifyContent:'center',marginTop:'0.8rem'}}>
                  Register Free
                </button>
              </div>
            ))}

            {/* Quick links card */}
            <div className="comm-section-label" style={{marginTop:'1.5rem'}}>Connect</div>
            <div className="glass-card comm-connect-card">
              <a href="https://discord.gg/velverseai" target="_blank" rel="noopener noreferrer" className="comm-connect-link">
                <i className="fab fa-discord" style={{color:'#7289da',fontSize:'1.1rem'}} />
                <span>Discord Server</span>
                <i className="fas fa-external-link-alt comm-ext-icon" />
              </a>
              <a href="https://github.com/velverseai" target="_blank" rel="noopener noreferrer" className="comm-connect-link">
                <i className="fab fa-github" style={{color:'var(--white)',fontSize:'1.1rem'}} />
                <span>GitHub Repository</span>
                <i className="fas fa-external-link-alt comm-ext-icon" />
              </a>
              <a href="https://twitter.com/velverseai" target="_blank" rel="noopener noreferrer" className="comm-connect-link">
                <i className="fab fa-twitter" style={{color:'#1d9bf0',fontSize:'1.1rem'}} />
                <span>Twitter / X</span>
                <i className="fas fa-external-link-alt comm-ext-icon" />
              </a>
              <a href="https://linkedin.com/company/velverseai" target="_blank" rel="noopener noreferrer" className="comm-connect-link">
                <i className="fab fa-linkedin" style={{color:'#0a66c2',fontSize:'1.1rem'}} />
                <span>LinkedIn</span>
                <i className="fas fa-external-link-alt comm-ext-icon" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
