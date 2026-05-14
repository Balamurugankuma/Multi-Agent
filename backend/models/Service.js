// ══════════════════════════════════════════════════
//  models/Service.js — Velverse AI Service Schema
// ══════════════════════════════════════════════════
const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    serviceName: {
      type:     String,
      required: true,
      trim:     true,
      unique:   true,
    },
    description: {
      type:     String,
      required: true,
    },
    price: {
      monthly: { type: Number, required: true, min: 0 },
      annual:  { type: Number, required: true, min: 0 },
    },
    currency: {
      type:    String,
      default: 'INR',
    },
    category: {
      type: String,
      enum: ['subscription', 'one-time', 'usage-based'],
      default: 'subscription',
    },
    features: [String],
    isActive: {
      type:    Boolean,
      default: true,
    },
    squads: [String], // e.g. ['Software Dev', 'Web Dev']
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', ServiceSchema);
