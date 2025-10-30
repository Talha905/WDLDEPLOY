const Dispute = require('../models/Dispute');
const Session = require('../models/Session');
const Goal = require('../models/Goal');
const { ok, created } = require('../utils/response');

exports.createDispute = async (req, res, next) => {
  try {
    let { title, description, reportedAgainst, reportedAgainstEmail, session, goal, type } = req.body;
    const reportedBy = req.user._id;

    if (!title || !description || (!reportedAgainst && !reportedAgainstEmail) || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Resolve reportedAgainst by email if provided
    if (!reportedAgainst && reportedAgainstEmail) {
      const u = await require('../models/User').findOne({ email: reportedAgainstEmail });
      if (!u) return res.status(400).json({ error: 'Reported user not found' });
      reportedAgainst = u._id;
    }

    const dispute = await Dispute.create({
      title,
      description,
      reportedBy,
      reportedAgainst,
      session,
      goal,
      type
    });

    const populated = await Dispute.findById(dispute._id)
      .populate('reportedBy', 'name email')
      .populate('reportedAgainst', 'name email')
      .populate('session', 'title scheduledAt')
      .populate('goal', 'title');

    return created(res, { dispute: populated });
  } catch (err) {
    next(err);
  }
};

exports.getDisputes = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const userId = req.user._id;
    
    let filter = {};
    
    // Non-admin can only see their own disputes
    if (req.user.role !== 'Admin') {
      filter.$or = [{ reportedBy: userId }, { reportedAgainst: userId }];
    }
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    const disputes = await Dispute.find(filter)
      .populate('reportedBy', 'name email avatarUrl')
      .populate('reportedAgainst', 'name email avatarUrl')
      .populate('assignedTo', 'name email')
      .populate('session', 'title scheduledAt')
      .populate('goal', 'title')
      .sort({ createdAt: -1 });

    return ok(res, { disputes });
  } catch (err) {
    next(err);
  }
};

exports.getDispute = async (req, res, next) => {
  try {
    const disputeId = req.params.id;
    const dispute = await Dispute.findById(disputeId)
      .populate('reportedBy', 'name email avatarUrl bio')
      .populate('reportedAgainst', 'name email avatarUrl bio')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('session', 'title scheduledAt status notes')
      .populate('goal', 'title description status');

    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    // Check access
    const userId = req.user._id.toString();
    if (req.user.role !== 'Admin' && 
        dispute.reportedBy._id.toString() !== userId && 
        dispute.reportedAgainst._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return ok(res, { dispute });
  } catch (err) {
    next(err);
  }
};

exports.updateDispute = async (req, res, next) => {
  try {
    const disputeId = req.params.id;
    const { status, priority, assignedTo } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedTo) updates.assignedTo = assignedTo;

    const dispute = await Dispute.findByIdAndUpdate(disputeId, updates, { new: true })
      .populate('reportedBy', 'name email')
      .populate('reportedAgainst', 'name email')
      .populate('assignedTo', 'name email');

    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    return ok(res, { dispute });
  } catch (err) {
    next(err);
  }
};

exports.resolveDispute = async (req, res, next) => {
  try {
    const disputeId = req.params.id;
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({ error: 'Resolution required' });
    }

    const dispute = await Dispute.findByIdAndUpdate(disputeId, {
      status: 'Resolved',
      resolution,
      resolvedAt: new Date(),
      resolvedBy: req.user._id
    }, { new: true })
      .populate('reportedBy', 'name email')
      .populate('reportedAgainst', 'name email')
      .populate('resolvedBy', 'name email');

    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    return ok(res, { dispute });
  } catch (err) {
    next(err);
  }
};