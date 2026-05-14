// ============================================================
//  models/Project.js
// ============================================================
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Project name is required'],
    trim:     true,
    minlength: [2,   'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: {
    type:     String,
    trim:     true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default:  '',
  },
  color: {
    type:    String,
    default: '#6366f1',
    match:   [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code'],
  },
  owner: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  }],
  isArchived: {
    type:    Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
});

// ── Indexes ───────────────────────────────────────────────
projectSchema.index({ owner: 1, createdAt: -1 });

// ── Cascade delete tasks when project is deleted ──────────
projectSchema.pre('deleteOne', { document: true }, async function (next) {
  await this.model('Task').deleteMany({ project: this._id });
  next();
});

module.exports = mongoose.model('Project', projectSchema);
