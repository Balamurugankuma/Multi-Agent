import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Pricing.css'

const PLANS = [
  {
    name:'Starter',
    desc:'Perfect for individuals and small teams getting started.',
    price:{ month:0, year:0 },
    monthlyEquiv:{ month:0, year:0 },
    color:'var(--accent)', cta:'Start Free', ctaStyle:'outline',
    features:[
      {t:'All 5 AI squads'},{t:'3 concurrent projects'},{t:'50 API calls / day'},
      {t:'Community support'},{t:'Basic analytics'},{t:'Priority support',x:true},{t:'Custom integrations',x:true},
    ]
  },
  {
    name:'Pro',
    desc:'For growing teams that need more power and priority delivery.',
    price:{ month:29, year:290 },
    monthlyEquiv:{ month:29, year:24 },
    color:'var(--accent)', cta:'Start Pro Trial', ctaStyle:'primary', popular:true,
    features:[
      {t:'All 5 AI squads'},{t:'Unlimited projects'},{t:'Unlimited API calls'},
      {t:'Priority squad assignment'},{t:'Advanced analytics'},{t:'Email & chat support'},
      {t:'Webhook integrations'},{t:'White-label output',x:true},
    ]
  },
  {
    name:'Enterprise',
    desc:'For organisations needing dedicated capacity and SLAs.',
    price:{ month:249, year:2490 },
    monthlyEquiv:{ month:249, year:208 },
    color:'var(--accent)', cta:'Contact Sales', ctaStyle:'outline',
    features:[
      {t:'Everything in Pro'},{t:'Dedicated agent pool'},{t:'99.9% uptime SLA'},
      {t:'White-label output'},{t:'SSO / SAML'},{t:'Custom model fine-tuning'},
      {t:'24/7 dedicated success manager'},{t:'On-prem deployment option'},
    ]
  }
]

export default function Pricing() {
  const [period, setPeriod] = useState('month')
  const { isLoggedIn }      = useAuth()
  const navigate             = useNavigate()

  // Pass period AND the resolved price to billing
  const handlePlan = (plan) => {
    if (!isLoggedIn) { navigate('/login'); return }
  navigate('/billing', {
  state: {
    plan:  plan.name,
    price: plan.price[period],
    period: period === 'month' ? 'monthly' : 'annual',   // ← map to Billing's expected values
    monthlyEquiv: plan.monthlyEquiv[period],
  }
})
  }

  return (
    <div className="pricing-page">
      <div className="bg-grid" />
      <div className="container">

        {/* Hero */}
        <div className="pricing-hero">
          <div className="eyebrow" style={{justifyContent:'center'}}>Pricing</div>
          <h1 className="section-title" style={{fontSize:'clamp(2rem,5vw,3.2rem)',textAlign:'center'}}>
            Simple, <span className="gradient-text">transparent pricing</span>
          </h1>
          <p className="section-sub" style={{margin:'0 auto 0',textAlign:'center'}}>
            No hidden fees. No seat limits. Cancel anytime.
          </p>
          {/* Billing toggle */}
          <div className="pricing-toggle">
            <button
              className={`toggle-opt${period==='month'?' active':''}`}
              onClick={()=>setPeriod('month')}
            >Monthly</button>
            <button
              className={`toggle-opt${period==='year'?' active':''}`}
              onClick={()=>setPeriod('year')}
            >Annual</button>
            {period==='year' && <span className="save-badge">Save 20%</span>}
          </div>
        </div>

        {/* Plans */}
        <div className="pricing-grid">
          {PLANS.map(plan => (
            <div key={plan.name} className={`plan-card${plan.popular?' featured':''}`}>
              {plan.popular && <div className="plan-popular">Most Popular</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-desc">{plan.desc}</div>

              {/* Price display — updates when period changes */}
              <div className="plan-price">
                {plan.price[period] === 0 ? (
                  <span className="plan-num">Free</span>
                ) : (
                  <>
                    <span className="plan-cur">$</span>
                    <span className="plan-num">{plan.price[period]}</span>
                    <div className="plan-period-wrap">
                      <span className="plan-period">/ {period === 'month' ? 'mo' : 'yr'}</span>
                      {period === 'year' && (
                        <span className="plan-monthly-note">${plan.monthlyEquiv.year}/mo billed annually</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="plan-divider" />
              <ul className="plan-features">
                {plan.features.map(f => (
                  <li key={f.t} className={f.x?'muted':''}>
                    <i className={f.x?'fas fa-xmark fc-x':'fas fa-check fc-check'} />
                    {f.t}
                  </li>
                ))}
              </ul>
              <button className={`plan-cta ${plan.ctaStyle}`} onClick={() => handlePlan(plan)}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Compare Table */}
        <div className="features-compare">
          <div className="fc-title">Compare All Features</div>
          <table className="fc-table">
            <thead>
              <tr>
                <th>Feature</th><th>Starter</th><th>Pro</th><th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['AI Squads Access',     '✓','✓','✓'],
                ['Concurrent Projects',  '3','Unlimited','Unlimited'],
                ['API Calls / Day',      '50','Unlimited','Unlimited'],
                ['Priority Assignment',  '✗','✓','✓'],
                ['Analytics',           'Basic','Advanced','Custom'],
                ['Support',             'Community','Email & Chat','24/7 Dedicated'],
                ['SLA Uptime',          '99%','99.5%','99.9%'],
                ['White-label',         '✗','✗','✓'],
                ['SSO / SAML',          '✗','✗','✓'],
                ['Custom Fine-tuning',  '✗','✗','✓'],
              ].map(([feat,...cols]) => (
                <tr key={feat}>
                  <td>{feat}</td>
                  {cols.map((v,i) => (
                    <td key={i}>
                      {v==='✓' ? <i className="fas fa-check fc-check" /> :
                       v==='✗' ? <i className="fas fa-xmark fc-x" /> : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
