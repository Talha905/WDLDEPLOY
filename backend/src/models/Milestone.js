const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  goal: { type: mongoose.Types.ObjectId, ref: 'Goal', required: true },
  status: { type: String, enum: ['Pending', 'InProgress', 'Completed'], default: 'Pending' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

MilestoneSchema.index({ goal: 1, order: 1 });

module.exports = mongoose.model('Milestone', MilestoneSchema);