// ══════════════════════════════════════════════════
//  routes/serviceRoutes.js
//  Base: /api/services
// ══════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();

const {
  getServices,
  getServiceById,
  createService,
  updateService,
} = require('../controllers/serviceController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/',    getServices);
router.get('/:id', getServiceById);

// Admin-only routes
router.post('/',    protect, adminOnly, createService);
router.put('/:id',  protect, adminOnly, updateService);

module.exports = router;
