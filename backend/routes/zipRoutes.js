// ══════════════════════════════════════════════════
//  routes/zipRoutes.js
//  Base: /api/zip  (all protected)
// ══════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { generateZip, previewZip } = require('../controllers/zipController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET  /api/zip/preview?sessionId=xxx&agentType=software
//   Returns a JSON preview of what the ZIP will contain
router.get('/preview', previewZip);

// POST /api/zip/generate
//   Body: { sessionId, agentType, projectName? }
//   Returns: application/zip binary stream
router.post('/generate', generateZip);

module.exports = router;
