const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, trim: true }],
  votes: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  answerCount: { type: Number, default: 0 },
  hasAcceptedAnswer: { type: Boolean, default: false },
  acceptedAnswer: { type: mongoose.Types.ObjectId, ref: 'Answer' }
}, { timestamps: true });

const AnswerSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Types.ObjectId, ref: 'Question', required: true },
  votes: { type: Number, default: 0 },
  isAccepted: { type: Boolean, default: false }
}, { timestamps: true });

const KnowledgeArticleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  tags: [{ type: String, trim: true }],
  isPublished: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

QuestionSchema.index({ tags: 1, votes: -1 });
KnowledgeArticleSchema.index({ category: 1, isPublished: 1 });
KnowledgeArticleSchema.index({ '$**': 'text' });

module.exports = {
  Question: mongoose.model('Question', QuestionSchema),
  Answer: mongoose.model('Answer', AnswerSchema),
  KnowledgeArticle: mongoose.model('KnowledgeArticle', KnowledgeArticleSchema)
};