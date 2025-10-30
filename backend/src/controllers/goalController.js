const Goal = require('../models/Goal');
const Milestone = require('../models/Milestone');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const User = require('../models/User');
const { ok, created } = require('../utils/response');

// Goal CRUD
exports.createGoal = async (req, res, next) => {
  try {
    const { title, description, mentee, session, targetDate, priority, tags, milestones, progress } = req.body;
    const mentorId = req.user._id;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // If mentee is not provided, use the current user (for self-created goals)
    const finalMentee = mentee || req.user._id;
    
    // Verify mentee exists if different from current user
    if (finalMentee.toString() !== req.user._id.toString()) {
      const menteeUser = await User.findById(finalMentee);
      if (!menteeUser) {
        return res.status(400).json({ error: 'Mentee not found' });
      }
    }

    const goal = await Goal.create({
      title,
      description,
      mentor: mentorId,
      mentee: finalMentee,
      session,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      priority: priority || 'Medium',
      tags: tags || [],
      milestones: milestones || [],
      progress: progress || 0
    });

    const populated = await Goal.findById(goal._id)
      .populate('mentor', 'name email avatarUrl')
      .populate('mentee', 'name email avatarUrl')
      .populate('session', 'title scheduledAt');

    return created(res, { goal: populated });
  } catch (err) {
    next(err);
  }
};

exports.getGoals = async (req, res, next) => {
  try {
    const { status, mentee: menteeFilter } = req.query;
    const userId = req.user._id;
    
    let filter = { $or: [{ mentor: userId }, { mentee: userId }] };
    if (status) filter.status = status;
    if (menteeFilter && req.user.role === 'Mentor') filter.mentee = menteeFilter;

    const goals = await Goal.find(filter)
      .populate('mentor', 'name email avatarUrl')
      .populate('mentee', 'name email avatarUrl')
      .populate('session', 'title scheduledAt')
      .sort({ createdAt: -1 });

    return ok(res, { goals });
  } catch (err) {
    next(err);
  }
};

exports.getGoal = async (req, res, next) => {
  try {
    const goalId = req.params.id;
    const goal = await Goal.findById(goalId)
      .populate('mentor', 'name email avatarUrl bio expertise')
      .populate('mentee', 'name email avatarUrl')
      .populate('session', 'title scheduledAt status');

    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    // Check access
    const userId = req.user._id.toString();
    if (goal.mentor._id.toString() !== userId && goal.mentee._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return ok(res, { goal });
  } catch (err) {
    next(err);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const goalId = req.params.id;
    const { title, description, status, priority, targetDate, notes, tags, progress, milestones } = req.body;
    const userId = req.user._id;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    // Check access
    if (goal.mentor.toString() !== userId.toString() && goal.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status) {
      updates.status = status;
      if (status === 'Completed') updates.completedAt = new Date();
    }
    if (priority) updates.priority = priority;
    if (targetDate) updates.targetDate = new Date(targetDate);
    if (notes !== undefined) updates.notes = notes;
    if (tags) updates.tags = tags;
    if (milestones) updates.milestones = milestones;
    if (progress !== undefined) updates.progress = Math.min(100, Math.max(0, progress));

    const updatedGoal = await Goal.findByIdAndUpdate(goalId, updates, { new: true })
      .populate('mentor', 'name email avatarUrl')
      .populate('mentee', 'name email avatarUrl')
      .populate('session', 'title scheduledAt');

    return ok(res, { goal: updatedGoal });
  } catch (err) {
    next(err);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    const goalId = req.params.id;
    const userId = req.user._id;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    // Only mentor can delete
    if (goal.mentor.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only mentor can delete goal' });
    }

    await Goal.findByIdAndDelete(goalId);
    return ok(res, { message: 'Goal deleted' });
  } catch (err) {
    next(err);
  }
};

// Milestone CRUD
exports.createMilestone = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const { title, description, dueDate, order } = req.body;
    const userId = req.user._id;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (goal.mentor.toString() !== userId.toString() && goal.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const milestone = await Milestone.create({
      title,
      description,
      goal: goalId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      order: order || 0,
      createdBy: userId
    });

    const populated = await Milestone.findById(milestone._id).populate('createdBy', 'name avatarUrl');
    return created(res, { milestone: populated });
  } catch (err) {
    next(err);
  }
};

exports.updateMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const { title, description, status, dueDate, order } = req.body;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId).populate('goal');
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const goal = milestone.goal;
    if (goal.mentor.toString() !== userId.toString() && goal.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status) {
      updates.status = status;
      if (status === 'Completed') updates.completedAt = new Date();
    }
    if (dueDate) updates.dueDate = new Date(dueDate);
    if (order !== undefined) updates.order = order;

    const updatedMilestone = await Milestone.findByIdAndUpdate(milestoneId, updates, { new: true })
      .populate('createdBy', 'name avatarUrl');

    return ok(res, { milestone: updatedMilestone });
  } catch (err) {
    next(err);
  }
};

exports.deleteMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId).populate('goal');
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const goal = milestone.goal;
    if (goal.mentor.toString() !== userId.toString() && goal.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Milestone.findByIdAndDelete(milestoneId);
    return ok(res, { message: 'Milestone deleted' });
  } catch (err) {
    next(err);
  }
};

// Comments
exports.addComment = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const { content, parent, milestone } = req.body;
    const userId = req.user._id;

    if (!content) return res.status(400).json({ error: 'Comment content required' });

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (goal.mentor.toString() !== userId.toString() && goal.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = await Comment.create({
      content,
      author: userId,
      goal: goalId,
      milestone: milestone || undefined,
      parent: parent || undefined
    });

    const populated = await Comment.findById(comment._id).populate('author', 'name avatarUrl');
    return created(res, { comment: populated });
  } catch (err) {
    next(err);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const userId = req.user._id;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (goal.mentor.toString() !== userId.toString() && goal.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comments = await Comment.find({ goal: goalId })
      .populate('author', 'name avatarUrl')
      .sort({ createdAt: 1 });

    return ok(res, { comments });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Can only delete own comments' });
    }

    await Comment.findByIdAndDelete(commentId);
    return ok(res, { message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

// Attachments
exports.uploadAttachment = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const userId = req.user._id;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file provided' });

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (goal.mentor.toString() !== userId.toString() && goal.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attachment = await Attachment.create({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy: userId,
      goal: goalId,
      filePath: `/uploads/${file.filename}`
    });

    const populated = await Attachment.findById(attachment._id).populate('uploadedBy', 'name avatarUrl');
    return created(res, { attachment: populated });
  } catch (err) {
    next(err);
  }
};

exports.getAttachments = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const userId = req.user._id;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (goal.mentor.toString() !== userId.toString() && goal.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attachments = await Attachment.find({ goal: goalId })
      .populate('uploadedBy', 'name avatarUrl')
      .sort({ createdAt: -1 });

    return ok(res, { attachments });
  } catch (err) {
    next(err);
  }
};