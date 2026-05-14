// ══════════════════════════════════════════════════
//  controllers/aiController.js
//  Handles: Flowise AI Squad API Integration
// ══════════════════════════════════════════════════
const axios          = require('axios');
const ChatHistory    = require('../models/ChatHistory');
const { createError } = require('../middleware/errorHandler');

// Map agent type → Flowise flow ID from .env
const FLOWISE_FLOWS = {
  software:  process.env.FLOWISE_SOFTWARE_ID,
  web:       process.env.FLOWISE_WEB_ID,
  uiux:      process.env.FLOWISE_UIUX_ID,
  marketing: process.env.FLOWISE_MARKETING_ID,
  data:      process.env.FLOWISE_DATA_ID,
};

// ═══════════════════════════════════════════════════
//  POST /api/ai/chat
//  Send a message to a Flowise AI squad agent
//
//  Body: { agentType: "software", message: "Build me a REST API", sessionId: "uuid" }
//  Returns: { success, response, sessionId, saved: true }
// ═══════════════════════════════════════════════════
const chat = async (req, res, next) => {
  try {
    const { agentType, message, sessionId } = req.body;

    // Validate agent type
    if (!FLOWISE_FLOWS[agentType]) {
      return next(createError(
        `Invalid agentType. Valid options: ${Object.keys(FLOWISE_FLOWS).join(', ')}`,
        400
      ));
    }

    if (!message || message.trim().length === 0) {
      return next(createError('Message cannot be empty.', 400));
    }

    const flowId = FLOWISE_FLOWS[agentType];

    if (!flowId || flowId.startsWith('your_')) {
      return next(createError(
        `Flowise endpoint for "${agentType}" is not configured in .env`,
        503
      ));
    }

    // Build Flowise request
    const flowiseUrl = `${process.env.FLOWISE_BASE_URL}/api/v1/prediction/${flowId}`;

    const headers = {
      'Content-Type': 'application/json',
    };

    // Include API key if provided
    if (process.env.FLOWISE_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.FLOWISE_API_KEY}`;
    }

    const startTime = Date.now();

    // Call Flowise API
    const flowiseRes = await axios.post(
      flowiseUrl,
      {
        question:  message,
        sessionId: sessionId || req.user._id.toString(),
        overrideConfig: {
          sessionId: sessionId || req.user._id.toString(),
        },
      },
      {
        headers,
        timeout: 60000, // 60s timeout for AI responses
      }
    );

    const responseTimeMs = Date.now() - startTime;

    // Flowise returns: { text: "..." } or { answer: "..." }
    const aiResponse =
      flowiseRes.data?.text    ||
      flowiseRes.data?.answer  ||
      flowiseRes.data?.result  ||
      JSON.stringify(flowiseRes.data);

    // ── Save to ChatHistory ─────────────────────────
    const chatRecord = await ChatHistory.create({
      userId:          req.user._id,
      agentType,
      sessionId:       sessionId || req.user._id.toString(),
      message:         message.trim(),
      response:        aiResponse,
      flowiseEndpoint: flowId,
      responseTimeMs,
    });

    res.status(200).json({
      success:       true,
      response:      aiResponse,
      sessionId:     chatRecord.sessionId,
      agentType,
      responseTimeMs,
      saved:         true,
      chatId:        chatRecord._id,
    });

  } catch (err) {
    // Flowise API errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return next(createError('Flowise AI service is unreachable.', 503));
    }
    if (err.code === 'ECONNABORTED') {
      return next(createError('AI response timed out. Please try again.', 504));
    }
    if (err.response?.status === 401) {
      return next(createError('Flowise API key is invalid or missing.', 401));
    }
    next(err);
  }
};

// ═══════════════════════════════════════════════════
//  GET /api/ai/history?agentType=software&limit=20
//  Get chat history for logged-in user
// ═══════════════════════════════════════════════════
const getChatHistory = async (req, res, next) => {
  try {
    const { agentType, limit = 20, page = 1 } = req.query;

    const filter = { userId: req.user._id };
    if (agentType && FLOWISE_FLOWS[agentType]) {
      filter.agentType = agentType;
    }

    const skip    = (Number(page) - 1) * Number(limit);
    const history = await ChatHistory.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await ChatHistory.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page:    Number(page),
      pages:   Math.ceil(total / Number(limit)),
      history,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════
//  DELETE /api/ai/history
//  Clear all chat history for a user (optional)
// ═══════════════════════════════════════════════════
const clearChatHistory = async (req, res, next) => {
  try {
    const { agentType } = req.query;
    const filter = { userId: req.user._id };
    if (agentType) filter.agentType = agentType;

    const result = await ChatHistory.deleteMany(filter);

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} chat records deleted.`,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════
//  GET /api/ai/agents
//  Return list of available AI agents + their status
// ═══════════════════════════════════════════════════
const getAgents = async (req, res) => {
  const agents = [
    { key: 'software',  name: 'Software Dev Squad',    configured: !!FLOWISE_FLOWS.software  && !FLOWISE_FLOWS.software?.startsWith('your') },
    { key: 'web',       name: 'Web Dev Squad',         configured: !!FLOWISE_FLOWS.web       && !FLOWISE_FLOWS.web?.startsWith('your') },
    { key: 'uiux',      name: 'UI/UX Design Squad',   configured: !!FLOWISE_FLOWS.uiux      && !FLOWISE_FLOWS.uiux?.startsWith('your') },
    { key: 'marketing', name: 'Digital Marketing Squad', configured: !!FLOWISE_FLOWS.marketing && !FLOWISE_FLOWS.marketing?.startsWith('your') },
    { key: 'data',      name: 'Data Analysis Squad',  configured: !!FLOWISE_FLOWS.data      && !FLOWISE_FLOWS.data?.startsWith('your') },
  ];

  res.status(200).json({ success: true, agents });
};

module.exports = { chat, getChatHistory, clearChatHistory, getAgents };
