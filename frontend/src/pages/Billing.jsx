// ═══════════════════════════════════════════════════════
//  pages/Billing.jsx  —  Velverse AI
//  Razorpay integrated via backend
// ═══════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { paymentAPI } from '../api/api'
import '../styles/Billing.css'

const PLANS = {
  monthly: [
    { name:'Starter',    price:0,      label:'Free forever' },
    { name:'Pro',        price:2499,   label:'₹2,499/mo' },
    { name:'Enterprise', price:20999,  label:'₹20,999/mo' },
  ],
  annual: [
    { name:'Starter',    price:0,      label:'Free forever' },
    { name:'Pro',        price:23990,  label:'₹1,999/mo billed annually' },
    { name:'Enterprise', price:199990, label:'₹16,666/mo billed annually' },
  ],
}

export default function Billing() {
  const { state }            = useLocation()
  const navigate             = useNavigate()
  const { user, updatePlan, useBackend } = useAuth()
  const [period,   setPeriod ] = useState(state?.period || 'monthly')
  const [plan,     setPlan   ] = useState(state?.plan   || 'Pro')
  const [busy,     setBusy   ] = useState(false)
  const [msg,      setMsg    ] = useState('')
  const [history,  setHistory] = useState([])

  const plans   = PLANS[period]
  const selected = plans.find(p => p.name === plan) || plans[1]
  const subtotal = selected.price
  const gst      = Math.round(subtotal * 0.18)
  const total    = subtotal + gst

  useEffect(() => {
    if (useBackend) {
      paymentAPI.getHistory().then(r => setHistory(r.payments || [])).catch(() => {})
    }
  }, [useBackend])

  const handlePay = async () => {
    if (subtotal === 0) { setMsg('You are on the free Starter plan — no payment required.'); return }
    if (!useBackend) { setMsg('⚠️ Backend not connected. Configure .env to enable live payments.'); return }
    setBusy(true); setMsg('')
    try {
      const order = await paymentAPI.createOrder({ plan, currency:'INR', period })
      if (order.free) { setMsg('Plan is free!'); setBusy(false); return }

      if (!window.Razorpay) { setMsg('Razorpay SDK not loaded. Check index.html.'); setBusy(false); return }

      const rzp = new window.Razorpay({
        key:         order.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      order.order.amount,
        currency:    order.order.currency,
        order_id:    order.order.id,
        name:        'Velverse AI',
        description: `${plan} Plan (${period})`,
        prefill:     order.prefill,
        theme:       { color: '#6366F1' },
        handler: async (response) => {
          try {
            const verify = await paymentAPI.verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            })
            if (verify.success) {
              updatePlan(plan)
              setMsg(`✅ Payment successful! You are now on the ${plan} plan.`)
              setTimeout(() => navigate('/dashboard'), 2000)
            }
          } catch { setMsg('Payment verification failed. Contact support.') }
        },
        modal: { ondismiss: () => setBusy(false) },
      })
      rzp.open()
    } catch (e) { setMsg(e.message || 'Payment failed. Please try again.') }
    setBusy(false)
  }

  return (
    <div className="billing-page">
      <div className="billing-inner">
        <div className="billing-left">
          <h1 className="billing-title">Billing &amp; Plans</h1>

          {/* Period toggle */}
          <div className="billing-period-toggle">
            <button className={`bpt-opt${period==='monthly'?' active':''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
            <button className={`bpt-opt${period==='annual'?' active':''}`} onClick={() => setPeriod('annual')}>
              Annual <span className="bpt-save">Save 20%</span>
            </button>
          </div>

          {/* Plan selector */}
          <div className="billing-plans">
            {plans.map(p => (
              <div key={p.name} className={`billing-plan-card${plan===p.name?' selected':''}`} onClick={() => setPlan(p.name)}>
                <div className="bpc-radio">{plan===p.name && <div className="bpc-dot" />}</div>
                <div>
                  <div className="bpc-name">{p.name}</div>
                  <div className="bpc-price">{p.label}</div>
                </div>
              </div>
            ))}
          </div>

          {msg && <div className={`billing-msg${msg.startsWith('✅')?' success':''}`}>{msg}</div>}

          <button className="btn-primary billing-pay-btn" onClick={handlePay}
            disabled={busy || subtotal===0}>
            {busy ? <><i className="fas fa-circle-notch fa-spin" /> Processing…</> :
             subtotal===0 ? 'Current Plan (Free)' : `Pay ₹${total.toLocaleString('en-IN')} →`}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="billing-history">
              <h3>Payment History</h3>
              <table className="billing-table">
                <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {history.map(p => (
                    <tr key={p._id}>
                      <td>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                      <td>{p.plan}</td>
                      <td>₹{p.amount?.toLocaleString('en-IN')}</td>
                      <td><span className={`billing-badge badge-${p.status}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="billing-right">
          <div className="billing-summary">
            <h3>Order Summary</h3>
            <div className="bs-row"><span>Plan</span><span>Velverse {plan}</span></div>
            <div className="bs-row"><span>Billing</span><span style={{textTransform:'capitalize'}}>{period}</span></div>
            <div className="bs-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="bs-row"><span>GST (18%)</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
            <div className="bs-divider" />
            <div className="bs-row bs-total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            <div className="bs-secure"><i className="fas fa-lock" /> Secured by Razorpay</div>
          </div>
          <div className="bs-user-info">
            <div className="bs-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div><div className="bs-name">{user?.name}</div><div className="bs-email">{user?.email}</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
