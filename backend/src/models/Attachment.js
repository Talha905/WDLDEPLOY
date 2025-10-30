const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  goal: { type: mongoose.Types.ObjectId, ref: 'Goal' },
  milestone: { type: mongoose.Types.ObjectId, ref: 'Milestone' },
  comment: { type: mongoose.Types.ObjectId, ref: 'Comment' },
  filePath: { type: String, required: true }
}, { timestamps: true });

AttachmentSchema.index({ goal: 1 });
AttachmentSchema.index({ milestone: 1 });

module.exports = mongoose.model('Attachment', AttachmentSchema);