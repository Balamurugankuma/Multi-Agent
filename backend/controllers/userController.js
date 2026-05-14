// ══════════════════════════════════════════════════
//  controllers/userController.js
//  Handles: Get Profile · Update Profile
// ══════════════════════════════════════════════════
const User           = require('../models/User');
const Payment        = require('../models/Payment');
const ChatHistory    = require('../models/ChatHistory');
const { createError } = require('../middleware/errorHandler');

// ═══════════════════════════════════════════════════
//  GET /api/user/profile
//  Returns logged-in user profile + stats
// ═══════════════════════════════════════════════════
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(createError('User not found.', 404));

    // Gather usage stats
    const [totalPayments, totalChats] = await Promise.all([
      Payment.countDocuments({ userId: req.user._id, status: 'paid' }),
      ChatHistory.countDocuments({ userId: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      user:    user.toSafeObject(),
      stats: {
        totalPayments,
        totalChats,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════
//  PUT /api/user/profile
//  Update name or avatar (email/password separate)
// ═══════════════════════════════════════════════════
const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'avatar'];
    const updates = {};

    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return next(createError('No valid fields provided for update.', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user:    user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════
//  PUT /api/user/change-password
//  Change password (requires current password)
// ═══════════════════════════════════════════════════
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user.password) {
      return next(createError('Google OAuth users cannot change password here.', 400));
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(createError('Current password is incorrect.', 401));
    }

    if (newPassword.length < 6) {
      return next(createError('New password must be at least 6 characters.', 400));
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════
//  GET /api/user/payment-history
//  Return all payments for the logged-in user
// ═══════════════════════════════════════════════════
const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success:  true,
      count:    payments.length,
      payments,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, changePassword, getPaymentHistory };
