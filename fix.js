// fix.js — Run this from the velverse-taskflow root folder:
//   node fix.js
const fs   = require('fs');
const path = require('path');

const base = path.join(__dirname, 'backend');

// ── 1. config/razorpay.js ────────────────────────
fs.writeFileSync(
  path.join(base, 'config', 'razorpay.js'),
`const Razorpay = require('razorpay');
const getRazorpay = () => {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret ||
      keyId.includes('your_key') ||
      keyId === 'rzp_test_your_key_id_here') return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};
module.exports = getRazorpay;
`);
console.log('✅ config/razorpay.js written');

// ── 2. routes/paymentRoutes.js ───────────────────
fs.writeFileSync(
  path.join(base, 'routes', 'paymentRoutes.js'),
`const express = require('express');
const router  = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify',       verifyRazorpayPayment);
router.get('/history',                getPaymentHistory);
module.exports = router;
`);
console.log('✅ routes/paymentRoutes.js written');

// ── 3. controllers/paymentController.js ──────────
fs.writeFileSync(
  path.join(base, 'controllers', 'paymentController.js'),
`const crypto      = require('crypto');
const getRazorpay = require('../config/razorpay');
const Payment     = require('../models/Payment');
const User        = require('../models/User');
const { createError } = require('../middleware/errorHandler');

const PRICES = { Starter: 0, Pro: 249900, Enterprise: 2099900 };

const createRazorpayOrder = async (req, res, next) => {
  try {
    const { plan = 'Pro', currency = 'INR', period = 'monthly' } = req.body;
    const base = PRICES[plan];
    if (base === undefined) return next(createError('Invalid plan.', 400));
    if (base === 0) {
      await User.findByIdAndUpdate(req.user._id, { plan });
      return res.json({ success: true, free: true, plan });
    }
    const amount = period === 'annual' ? Math.round(base * 12 * 0.80) : base;
    const rzp = getRazorpay();
    if (!rzp) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay not configured — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend .env',
      });
    }
    const order = await rzp.orders.create({
      amount,
      currency,
      receipt: 'vv_' + Date.now(),
    });
    await Payment.create({
      userId:          req.user._id,
      serviceName:     'Velverse ' + plan,
      plan,
      amount:          amount / 100,
      currency,
      razorpayOrderId: order.id,
      status:          'created',
      gateway:         'razorpay',
    });
    res.status(201).json({
      success: true,
      order,
      key:      process.env.RAZORPAY_KEY_ID,
      amount,
      currency,
      plan,
      prefill: { name: req.user.name, email: req.user.email },
    });
  } catch (err) { next(err); }
};

const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return next(createError('Missing payment fields.', 400));
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature)))
      return next(createError('Payment signature invalid.', 400));
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, status: 'paid', paidAt: new Date() },
      { new: true }
    );
    if (!payment) return next(createError('Payment record not found.', 404));
    await User.findByIdAndUpdate(payment.userId, { plan: payment.plan });
    res.json({ success: true, plan: payment.plan });
  } catch (err) { next(err); }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(20).lean();
    res.json({ success: true, payments });
  } catch (err) { next(err); }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment, getPaymentHistory };
`);
console.log('✅ controllers/paymentController.js written');

// ── Verify ───────────────────────────────────────
console.log('');
console.log('Verifying files contain no Stripe references...');
const routes = fs.readFileSync(path.join(base, 'routes', 'paymentRoutes.js'), 'utf8');
const ctrl   = fs.readFileSync(path.join(base, 'controllers', 'paymentController.js'), 'utf8');

if (routes.includes('Stripe') || routes.includes('stripe')) {
  console.log('❌ paymentRoutes.js still has Stripe — something went wrong');
} else {
  console.log('✅ paymentRoutes.js — clean (no Stripe)');
}

if (ctrl.includes('createStripe') || ctrl.includes('stripeWebhook')) {
  console.log('❌ paymentController.js still has Stripe exports — something went wrong');
} else {
  console.log('✅ paymentController.js — clean (no Stripe exports)');
}

console.log('');
console.log('All done! Now run:  npm run dev');
