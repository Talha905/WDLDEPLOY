const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  session: { type: mongoose.Types.ObjectId, ref: 'Session', required: true },
  sender: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'system'], default: 'text' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: false });

ChatMessageSchema.index({ session: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);