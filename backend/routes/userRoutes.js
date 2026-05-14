// ══════════════════════════════════════════════════
//  routes/userRoutes.js
//  Base: /api/user  (all protected)
// ══════════════════════════════════════════════════
const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const {
  getProfile,
  updateProfile,
  changePassword,
  getPaymentHistory,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

// All routes below require authentication
router.use(protect);

// GET  /api/user/profile
router.get('/profile', getProfile);

// PUT  /api/user/profile
router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 chars'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ],
  validate,
  updateProfile
);

// PUT  /api/user/change-password
router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be ≥ 6 chars'),
  ],
  validate,
  changePassword
);

// GET  /api/user/payments
router.get('/payments', getPaymentHistory);

module.exports = router;
