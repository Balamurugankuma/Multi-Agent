// ══════════════════════════════════════════════════
//  controllers/authController.js
//  Handles: Signup · Login · Google OAuth
// ══════════════════════════════════════════════════
const { google }          = require('googleapis');
const OAuth2Client        = google.auth.OAuth2;
const User                = require('../models/User');
const { generateToken }   = require('../middleware/auth');
const { createError }     = require('../middleware/errorHandler');

// ── Helpers ───────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
};

// ═══════════════════════════════════════════════════
//  POST /api/auth/signup
//  Register new user with email + password
// ═══════════════════════════════════════════════════
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return next(createError('Email is already registered.', 409));
    }

    // Create user (password gets hashed in pre-save hook)
    const user = await User.create({ name, email, password });

    sendTokenResponse(user, 201, res);

  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════
//  POST /api/auth/login
//  Login with email + password → return JWT
// ═══════════════════════════════════════════════════
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Include password explicitly (schema hides it by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.password) {
      return next(createError('Invalid email or password.', 401));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(createError('Invalid email or password.', 401));
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);

  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════
//  POST /api/auth/google
//  Google OAuth — verify ID token from frontend
//  Frontend sends: { idToken: "google_id_token" }
// ═══════════════════════════════════════════════════
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return next(createError('Google ID token is required.', 400));
    }

    // Verify the Google ID token
    const client  = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket  = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find existing user or create new one
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link Google ID if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar   = picture;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // New Google user — no password needed
      user = await User.create({
        name,
        email,
        googleId,
        avatar:     picture,
        isVerified: true, // Google has already verified the email
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);

  } catch (err) {
    if (err.message?.includes('Token used too late')) {
      return next(createError('Google token expired. Please try again.', 401));
    }
    next(err);
  }
};

// ═══════════════════════════════════════════════════
//  GET /api/auth/me
//  Return currently logged-in user (protected)
// ═══════════════════════════════════════════════════
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user:    req.user.toSafeObject(),
  });
};

module.exports = { signup, login, googleAuth, getMe };
