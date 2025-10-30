const mongoose = require('mongoose');

const MilestoneEmbeddedSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date },
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

const GoalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  mentor: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  mentee: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Types.ObjectId, ref: 'Session' },
  status: { type: String, enum: ['Active', 'Completed', 'Paused'], default: 'Active' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  targetDate: { type: Date },
  completedAt: { type: Date },
  notes: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  milestones: [MilestoneEmbeddedSchema],
  progress: { type: Number, min: 0, max: 100, default: 0 }
}, { timestamps: true });

GoalSchema.index({ mentee: 1, status: 1 });
GoalSchema.index({ mentor: 1, createdAt: -1 });

module.exports = mongoose.model('Goal', GoalSchema);