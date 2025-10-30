const Session = require('../models/Session');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { ok, created } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

exports.createSession = async (req, res, next) => {
  try {
    const { title, description, mentor, scheduledAt, duration, tags } = req.body;
    const menteeId = req.user._id;
    
    if (!title || !mentor || !scheduledAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify mentor exists and is approved
    const mentorUser = await User.findById(mentor);
    if (!mentorUser || mentorUser.role !== 'Mentor' || !mentorUser.isMentorApproved) {
      return res.status(400).json({ error: 'Invalid mentor' });
    }

    const sessionUrl = uuidv4(); // Unique room ID for video
    const session = await Session.create({
      title,
      description,
      mentor,
      mentee: menteeId,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      sessionUrl,
      tags: tags || []
    });

    const populated = await Session.findById(session._id)
      .populate('mentor', 'name email avatarUrl')
      .populate('mentee', 'name email avatarUrl');

    return created(res, { session: populated });
  } catch (err) {
    next(err);
  }
};

exports.getSessions = async (req, res, next) => {
  try {
    const { status, upcoming, past } = req.query;
    const userId = req.user._id;
    let filter = { $or: [{ mentor: userId }, { mentee: userId }] };

    if (status) filter.status = status;
    if (upcoming === 'true') filter.scheduledAt = { $gte: new Date() };
    if (past === 'true') filter.scheduledAt = { $lt: new Date() };

    const sessions = await Session.find(filter)
      .populate('mentor', 'name email avatarUrl rating')
      .populate('mentee', 'name email avatarUrl')
      .sort({ scheduledAt: -1 });

    return ok(res, { sessions });
  } catch (err) {
    next(err);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findById(sessionId)
      .populate('mentor', 'name email avatarUrl bio expertise rating')
      .populate('mentee', 'name email avatarUrl bio');

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Check if user is participant
    const userId = req.user._id.toString();
    if (session.mentor._id.toString() !== userId && session.mentee._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return ok(res, { session });
  } catch (err) {
    next(err);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { title, description, scheduledAt, duration, notes, tags } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Only mentor or mentee can update
    if (session.mentor.toString() !== userId.toString() && session.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);
    if (duration) updates.duration = duration;
    if (notes !== undefined) updates.notes = notes;
    if (tags) updates.tags = tags;

    const updatedSession = await Session.findByIdAndUpdate(sessionId, updates, { new: true })
      .populate('mentor', 'name email avatarUrl')
      .populate('mentee', 'name email avatarUrl');

    return ok(res, { session: updatedSession });
  } catch (err) {
    next(err);
  }
};

exports.deleteSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Only mentee can cancel (or admin in the future)
    if (session.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only mentee can cancel session' });
    }

    await Session.findByIdAndUpdate(sessionId, { status: 'Cancelled' });
    return ok(res, { message: 'Session cancelled' });
  } catch (err) {
    next(err);
  }
};

exports.joinSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const userId = req.user._id.toString();
    if (session.mentor.toString() !== userId && session.mentee.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if session is accessible based on timing
    const now = new Date();
    const scheduledTime = new Date(session.scheduledAt);
    const sessionDuration = session.duration || 60; // minutes
    const sessionEndTime = new Date(scheduledTime.getTime() + (sessionDuration * 60 * 1000));
    const earlyAccessTime = new Date(scheduledTime.getTime() - (15 * 60 * 1000)); // 15 minutes before

    // Session can only be joined 15 minutes before scheduled time until it ends
    if (now < earlyAccessTime) {
      const minutesUntilAccess = Math.ceil((earlyAccessTime - now) / (60 * 1000));
      return res.status(403).json({ 
        error: 'Session not yet accessible', 
        message: `This session can be joined starting ${minutesUntilAccess} minute(s) before the scheduled time.`,
        accessTime: earlyAccessTime.toISOString(),
        scheduledTime: scheduledTime.toISOString()
      });
    }

    if (now > sessionEndTime) {
      return res.status(403).json({ 
        error: 'Session has ended', 
        message: 'This session is no longer accessible as it has ended.',
        endTime: sessionEndTime.toISOString()
      });
    }

    // Mark session as in progress if not already
    if (session.status === 'Scheduled') {
      session.status = 'InProgress';
      await session.save();
    }

    return ok(res, { sessionUrl: session.sessionUrl, session });
  } catch (err) {
    next(err);
  }
};

exports.leaveSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const userId = req.user._id.toString();
    if (session.mentor.toString() !== userId && session.mentee.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return ok(res, { message: 'Left session' });
  } catch (err) {
    next(err);
  }
};

exports.getSessionMessages = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const userId = req.user._id.toString();
    if (session.mentor.toString() !== userId && session.mentee.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await ChatMessage.find({ session: sessionId })
      .populate('sender', 'name avatarUrl')
      .sort({ timestamp: 1 });

    return ok(res, { messages });
  } catch (err) {
    next(err);
  }
};

exports.checkSessionAccess = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const userId = req.user._id.toString();
    if (session.mentor.toString() !== userId && session.mentee.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check timing
    const now = new Date();
    const scheduledTime = new Date(session.scheduledAt);
    const sessionDuration = session.duration || 60;
    const sessionEndTime = new Date(scheduledTime.getTime() + (sessionDuration * 60 * 1000));
    const earlyAccessTime = new Date(scheduledTime.getTime() - (15 * 60 * 1000));

    let accessible = false;
    let message = '';
    let timeUntilAccess = 0;
    let timeUntilEnd = 0;

    if (now < earlyAccessTime) {
      timeUntilAccess = Math.ceil((earlyAccessTime - now) / (60 * 1000));
      message = `Session will be accessible in ${timeUntilAccess} minute(s).`;
    } else if (now > sessionEndTime) {
      message = 'Session has ended and is no longer accessible.';
    } else {
      accessible = true;
      timeUntilEnd = Math.ceil((sessionEndTime - now) / (60 * 1000));
      message = `Session is accessible. ${timeUntilEnd} minute(s) remaining.`;
    }

    return ok(res, {
      accessible,
      message,
      timeUntilAccess,
      timeUntilEnd,
      scheduledTime: scheduledTime.toISOString(),
      accessTime: earlyAccessTime.toISOString(),
      endTime: sessionEndTime.toISOString()
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSessionStatus = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { status, rating, feedback } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.mentor.toString() !== userId.toString() && session.mentee.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (rating) updates.rating = rating;
    if (feedback !== undefined) updates.feedback = feedback;

    const updatedSession = await Session.findByIdAndUpdate(sessionId, updates, { new: true });
    return ok(res, { session: updatedSession });
  } catch (err) {
    next(err);
  }
};
