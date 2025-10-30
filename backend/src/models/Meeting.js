const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  meetingCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  participants: [{
    socketId: String,
    email: String,
    uid: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  messages: [{
    message: String,
    senderEmail: String,
    senderUid: String,
    senderName: String,
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  whiteboardData: {
    type: String,
    default: null
  },
  endedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
});

// Indexes for performance
MeetingSchema.index({ meetingCode: 1 });
MeetingSchema.index({ createdAt: -1 });
MeetingSchema.index({ 'participants.email': 1 });

const Meeting = mongoose.model('Meeting', MeetingSchema);

module.exports = Meeting;