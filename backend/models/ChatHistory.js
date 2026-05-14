// ══════════════════════════════════════════════════
//  models/ChatHistory.js — AI Chat History Schema
// ══════════════════════════════════════════════════
const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    agentType: {
      type:     String,
      required: true,
      enum:     ['software', 'web', 'uiux', 'marketing', 'data'],
    },
    sessionId: {
      type: String,
      index: true,
    },
    message: {
      type:     String,
      required: true,
    },
    response: {
      type:     String,
      required: true,
    },
    flowiseEndpoint: {
      type: String,
    },
    tokensUsed: {
      type:    Number,
      default: 0,
    },
    responseTimeMs: {
      type: Number,
    },
    timestamp: {
      type:    Date,
      default: Date.now,
      index:   true,
    },
  },
  { timestamps: false } // Using custom timestamp field
);

// Compound index for user + agent queries
ChatHistorySchema.index({ userId: 1, agentType: 1, timestamp: -1 });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
