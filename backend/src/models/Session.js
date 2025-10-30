const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  mentor: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  mentee: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // minutes
  status: { 
    type: String, 
    enum: ['Scheduled', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  sessionUrl: { type: String }, // For video session room ID
  notes: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String, default: '' },
  tags: [{ type: String, trim: true }]
}, { timestamps: true });

SessionSchema.index({ mentor: 1, scheduledAt: 1 });
SessionSchema.index({ mentee: 1, scheduledAt: 1 });

module.exports = mongoose.model('Session', SessionSchema);