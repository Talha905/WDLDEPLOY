const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  goal: { type: mongoose.Types.ObjectId, ref: 'Goal' },
  milestone: { type: mongoose.Types.ObjectId, ref: 'Milestone' },
  parent: { type: mongoose.Types.ObjectId, ref: 'Comment' }, // For threading
  edited: { type: Boolean, default: false },
  editedAt: { type: Date }
}, { timestamps: true });

CommentSchema.index({ goal: 1, createdAt: -1 });
CommentSchema.index({ milestone: 1, createdAt: -1 });
CommentSchema.index({ parent: 1 });

module.exports = mongoose.model('Comment', CommentSchema);