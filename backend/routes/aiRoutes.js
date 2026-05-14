// ══════════════════════════════════════════════════
//  routes/aiRoutes.js
//  Base: /api/ai  (all protected)
// ══════════════════════════════════════════════════
const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const {
  chat,
  getChatHistory,
  clearChatHistory,
  getAgents,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

// All routes require authentication
router.use(protect);

// GET  /api/ai/agents — list all squads + config status
router.get('/agents', getAgents);

// POST /api/ai/chat — send message to a Flowise squad
router.post(
  '/chat',
  [
    body('agentType')
      .notEmpty().withMessage('agentType is required')
      .isIn(['software','web','uiux','marketing','data'])
      .withMessage('Invalid agentType'),
    body('message')
      .trim().notEmpty().withMessage('Message cannot be empty')
      .isLength({ max: 4000 }).withMessage('Message too long (max 4000 chars)'),
    body('sessionId').optional().isString(),
  ],
  validate,
  chat
);

// GET  /api/ai/history?agentType=software&limit=20&page=1
router.get('/history', getChatHistory);

// DELETE /api/ai/history?agentType=software
router.delete('/history', clearChatHistory);

module.exports = router;
