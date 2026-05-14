import { Link } from 'react-router-dom'
import '../styles/Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <div className="footer-logo-mark"><i className="fas fa-robot" /></div>
              VELVERSE AI
            </div>
            <p className="footer-tagline">
              Five AI squads. One platform. Infinite output. The future of IT delivery is autonomous.
            </p>
            <div className="footer-socials">
              {[['twitter','fa-twitter'],['github','fa-github'],['linkedin','fa-linkedin'],['discord','fa-discord']].map(([n,i]) => (
                <a key={n} href="#" className="soc-btn" aria-label={n}><i className={`fab ${i}`} /></a>
              ))}
            </div>
          </div>
          {[
            { title:'Platform', links:[['Home','/'],['AI Squads','/squads/software'],['Pricing','/pricing'],['Dashboard','/dashboard']] },
            { title:'Company',  links:[['Community','/community'],['Success Stories','/success-stories'],['Blog','#'],['Careers','#']] },
            { title:'Legal',    links:[['Privacy Policy','#'],['Terms of Service','#'],['Security','#'],['Status','#']] },
          ].map(col => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              <ul className="footer-links">
                {col.links.map(([label,to]) => (
                  <li key={label}><Link to={to}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 Velverse AI, Inc. All rights reserved.</span>
          <span className="footer-copy">
            <i className="fas fa-shield-alt" style={{color:'var(--accent)',marginRight:6}} />
            SOC2 Compliant · Enterprise Security
          </span>
        </div>
      </div>
    </footer>
  )
}
