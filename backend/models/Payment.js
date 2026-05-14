// ══════════════════════════════════════════════════
//  models/Payment.js — Velverse AI Payment Schema
// ══════════════════════════════════════════════════
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    serviceName: {
      type:     String,
      required: true,
      trim:     true,
    },
    plan: {
      type:    String,
      enum:    ['Starter', 'Pro', 'Enterprise'],
      default: 'Starter',
    },
    amount: {
      type:     Number,
      required: true,
      min:      [0, 'Amount cannot be negative'],
    },
    currency: {
      type:    String,
      default: 'INR',
      enum:    ['INR', 'USD', 'EUR'],
    },
    // Razorpay fields
    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    // Stripe fields (alternative)
    stripeSessionId:   { type: String, default: null },
    stripePaymentIntent: { type: String, default: null },
    // Generic
    paymentId: {
      type: String, // Stores whichever gateway was used
    },
    gateway: {
      type:    String,
      enum:    ['razorpay', 'stripe', 'free'],
      default: 'razorpay',
    },
    status: {
      type:    String,
      enum:    ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    date: {
      type:    Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Extra data from gateway
    },
  },
  { timestamps: true }
);

// Index for fast user payment lookups
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
