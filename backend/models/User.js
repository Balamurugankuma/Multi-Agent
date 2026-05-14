// ══════════════════════════════════════════════════
//  models/User.js — Velverse AI User Schema
// ══════════════════════════════════════════════════
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type:     String,
      // Not required: Google OAuth users have no password
      minlength: [6, 'Password must be at least 6 characters'],
      select:   false, // Never return password in queries by default
    },
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
    plan: {
      type:    String,
      enum:    ['Starter', 'Pro', 'Enterprise'],
      default: 'Starter',
    },
    // Google OAuth fields
    googleId: {
      type:   String,
      sparse: true, // Allow null but enforce uniqueness when present
    },
    avatar: {
      type: String,
      default: null,
    },
    isVerified: {
      type:    Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt automatically
  }
);

// ── Pre-save hook: hash password before saving ────
UserSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt  = await bcrypt.genSalt(12);   // 12 rounds = strong & fast
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: compare plain password with hash ──
UserSchema.methods.matchPassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// ── Instance method: return safe user object (no password) ──
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
