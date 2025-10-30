const mongoose = require('mongoose');

const DisputeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  reportedBy: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  reportedAgainst: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Types.ObjectId, ref: 'Session' },
  goal: { type: mongoose.Types.ObjectId, ref: 'Goal' },
  type: { type: String, enum: ['Session', 'Goal', 'Conduct', 'Payment', 'Other'], required: true },
  status: { type: String, enum: ['Open', 'InReview', 'Resolved', 'Closed'], default: 'Open' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  assignedTo: { type: mongoose.Types.ObjectId, ref: 'User' },
  resolution: { type: String, default: '' },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

DisputeSchema.index({ status: 1, priority: 1 });
DisputeSchema.index({ reportedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Dispute', DisputeSchema);