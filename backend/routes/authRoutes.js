// ══════════════════════════════════════════════════
//  routes/authRoutes.js
//  Base: /api/auth
// ══════════════════════════════════════════════════
const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const { signup, login, googleAuth, getMe } = require('../controllers/authController');
const { protect }  = require('../middleware/auth');
const validate     = require('../middleware/validate');

// ── POST /api/auth/signup ─────────────────────────
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  signup
);

// ── POST /api/auth/login ──────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// ── POST /api/auth/google ─────────────────────────
// Frontend sends Google ID token from Google Sign-In SDK
router.post(
  '/google',
  [body('idToken').notEmpty().withMessage('Google ID token is required')],
  validate,
  googleAuth
);

// ── GET /api/auth/me (protected) ──────────────────
router.get('/me', protect, getMe);

module.exports = router;
