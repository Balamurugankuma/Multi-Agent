// ============================================================
//  models/Task.js
// ============================================================
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type:     String,
    required: [true, 'Task title is required'],
    trim:     true,
    minlength: [2,   'Title must be at least 2 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type:     String,
    trim:     true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default:  '',
  },
  status: {
    type:    String,
    enum:    ['todo', 'in_progress', 'in_review', 'done'],
    default: 'todo',
  },
  priority: {
    type:    String,
    enum:    ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  dueDate: {
    type: Date,
  },
  labels: [{
    type: String,
    trim: true,
    maxlength: 30,
  }],
  project: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Project',
    required: [true, 'Project is required'],
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },
  createdBy: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  completedAt: {
    type: Date,
  },
  order: {
    type:    Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
});

// ── Indexes for common query patterns ─────────────────────
taskSchema.index({ project:   1, status: 1 });
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ dueDate:   1 });

// ── Auto-set completedAt when status → done ───────────────
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done') {
      this.completedAt = undefined;
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
