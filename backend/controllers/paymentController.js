const crypto      = require('crypto');
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
