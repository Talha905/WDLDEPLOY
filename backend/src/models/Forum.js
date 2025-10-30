const mongoose = require('mongoose');

const ForumCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#007bff' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ForumThreadSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Types.ObjectId, ref: 'ForumCategory' },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  lastReplyAt: { type: Date, default: Date.now },
  lastReplyBy: { type: mongoose.Types.ObjectId, ref: 'User' },
  tags: [{ type: String, trim: true }]
}, { timestamps: true });

const ForumPostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  thread: { type: mongoose.Types.ObjectId, ref: 'ForumThread', required: true },
  parent: { type: mongoose.Types.ObjectId, ref: 'ForumPost' },
  isDeleted: { type: Boolean, default: false },
  editedAt: { type: Date }
}, { timestamps: true });

ForumThreadSchema.index({ category: 1, lastReplyAt: -1 });
ForumPostSchema.index({ thread: 1, createdAt: 1 });

module.exports = {
  ForumCategory: mongoose.model('ForumCategory', ForumCategorySchema),
  ForumThread: mongoose.model('ForumThread', ForumThreadSchema),
  ForumPost: mongoose.model('ForumPost', ForumPostSchema)
};