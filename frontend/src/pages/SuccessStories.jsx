import '../styles/SuccessStories.css'

const STORIES = [
  { name:'Arjun Mehta',    role:'CTO, PaySprint',        av:'AM', color:'#00f5c4', metric:'3 weeks', metricLabel:'MVP delivered', text:'We handed Velverse AI our entire fintech platform requirements. Three weeks later we had a production-grade MVP — authentication, payment gateway, admin dashboard, analytics. Our 12-person dev team couldn\'t have done it in 3 months.', squads:['Software Dev','Web Dev','Data Analysis'] },
  { name:'Priya Nair',     role:'Founder, ShopAI',       av:'PN', color:'#7c5cfc', metric:'+40%',    metricLabel:'Revenue uplift',  text:'The data analysis squad built our recommendation engine from scratch. It analyzed 2 years of purchase data and output a production-ready ML model. First month after launch, revenue jumped 40%.', squads:['Data Analysis','Software Dev'] },
  { name:'David Chen',     role:'VP Engineering, CloudBase',av:'DC', color:'#ff6b6b', metric:'4×',   metricLabel:'Faster delivery', text:'We benchmarked Velverse against our internal team and 4 different agencies. Velverse won on every metric: speed, quality, cost, and coordination. We\'ve replaced our agency budget entirely.', squads:['Software Dev','UI/UX Design'] },
  { name:'Sarah Kim',      role:'Product Lead, Launchly', av:'SK', color:'#fbbf24', metric:'$180K',  metricLabel:'Annual savings',  text:'Velverse replaced our 6-person design and marketing team. The UI/UX squad designs and iterates in hours, not weeks. We reinvested the savings into product development.', squads:['UI/UX Design','Digital Marketing'] },
  { name:'Mohammed Hassan', role:'CEO, NetFlow',          av:'MH', color:'#10b981', metric:'99.8%',  metricLabel:'Uptime achieved', text:'Our infrastructure was failing weekly. The software squad rebuilt our entire backend in 2 weeks — new architecture, automated deploys, monitoring. Uptime went from 94% to 99.8%.', squads:['Software Dev'] },
  { name:'Yuki Tanaka',    role:'Head of Data, Lumex',   av:'YT', color:'#38bdf8', metric:'6hrs',   metricLabel:'Monthly reports', text:'What used to take our analyst team 3 days now takes 6 hours. The data analysis squad automated our entire reporting pipeline and built an executive dashboard we could never have afforded otherwise.', squads:['Data Analysis'] },
]

export default function SuccessStories() {
  return (
    <div className="stories-page">
      <div className="bg-grid" />
      <div className="container">
        <div className="stories-hero">
          <div className="eyebrow" style={{justifyContent:'center'}}>Success Stories</div>
          <h1 className="section-title" style={{textAlign:'center'}}>
            Real results from <span className="gradient-text">real teams</span>
          </h1>
          <p className="section-sub" style={{textAlign:'center',margin:'0 auto'}}>
            Join hundreds of companies achieving more with Velverse AI.
          </p>
        </div>

        {/* Stats bar */}
        <div className="stories-stats">
          {[['850+','Projects completed'],['40%','Average revenue uplift'],['4×','Faster than traditional'],['$2M+','Saved by clients']].map(([n,l]) => (
            <div key={l} className="ss-stat">
              <div className="ss-stat-num">{n}</div>
              <div className="ss-stat-label">{l}</div>
            </div>
          ))}
        </div>

        <div className="stories-full-grid">
          {STORIES.map(s => (
            <div key={s.name} className="story-full-card glass-card">
              <div className="sfc-metric" style={{color:s.color}}>
                <div className="sfc-metric-num">{s.metric}</div>
                <div className="sfc-metric-label">{s.metricLabel}</div>
              </div>
              <p className="sfc-text">"{s.text}"</p>
              <div className="sfc-squads">
                {s.squads.map(sq => <span key={sq} className="badge badge-green">{sq}</span>)}
              </div>
              <div className="sfc-author">
                <div className="sfc-av" style={{background:s.color}}>{s.av}</div>
                <div>
                  <div className="sfc-name">{s.name}</div>
                  <div className="sfc-role">{s.role}</div>
                </div>
                <div className="sfc-stars">{'★'.repeat(5)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{textAlign:'center',padding:'60px 0 80px'}}>
          <h2 className="section-title" style={{marginBottom:'1rem'}}>Ready to write <span className="gradient-text">your story?</span></h2>
          <p className="section-sub" style={{margin:'0 auto 2rem'}}>Join thousands of teams delivering with Velverse AI.</p>
          <a href="/login" className="btn-primary" style={{padding:'1rem 2.5rem',fontSize:'1rem'}}>
            <i className="fas fa-rocket" /> Get Access Free
          </a>
        </div>
      </div>
    </div>
  )
}
