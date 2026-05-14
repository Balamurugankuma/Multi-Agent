// ══════════════════════════════════════════════════
//  middleware/auth.js — JWT Protection Middleware
// ══════════════════════════════════════════════════
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect route: verify JWT ─────────────────────
const protect = async (req, res, next) => {
  let token;

  // Accept token from Authorization header: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Also accept from cookie (optional for web apps)
  // else if (req.cookies?.token) {
  //   token = req.cookies.token;
  // }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    // Verify token signature + expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach full user object to request (fresh DB read)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authentication failed.',
    });
  }
};

// ── Admin-only middleware ─────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access forbidden. Admins only.',
  });
};

// ── Helper: generate signed JWT ──────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { protect, adminOnly, generateToken };
