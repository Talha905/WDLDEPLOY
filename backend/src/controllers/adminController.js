const User = require('../models/User');
const Session = require('../models/Session');
const Goal = require('../models/Goal');
const Dispute = require('../models/Dispute');
const { ok } = require('../utils/response');

exports.getUsers = async (req, res, next) => {
  try {
    const { role, status, search, isMentorApproved, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (isMentorApproved === 'true') filter.isMentorApproved = true;
    if (isMentorApproved === 'false') filter.isMentorApproved = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return ok(res, { 
      users, 
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isMentorApproved } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (isMentorApproved !== undefined) updates.isMentorApproved = isMentorApproved;

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    return ok(res, { user });
  } catch (err) {
    next(err);
  }
};

exports.getPendingExpertise = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find users with pending expertise
    const usersWithPendingExpertise = await User.find({
      'expertise.status': 'Pending'
    })
    .select('name email expertise avatarUrl role')
    .sort({ 'expertise.createdAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Flatten the result to show each pending expertise as a separate item
    const pendingExpertise = [];
    usersWithPendingExpertise.forEach(user => {
      const pending = user.expertise.filter(exp => exp.status === 'Pending');
      pending.forEach(exp => {
        pendingExpertise.push({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          userAvatar: user.avatarUrl,
          expertiseName: exp.name,
          expertiseStatus: exp.status,
          submittedAt: exp.createdAt || user.createdAt
        });
      });
    });

    const total = pendingExpertise.length;

    return ok(res, {
      expertise: pendingExpertise,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.approveExpertise = async (req, res, next) => {
  try {
    const { userId, expertiseName } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const expertise = user.expertise.find(e => e.name === expertiseName);
    if (!expertise) return res.status(404).json({ error: 'Expertise not found' });

    expertise.status = status;
    await user.save();

    return ok(res, { 
      message: `Expertise ${status.toLowerCase()} successfully`,
      user: { _id: user._id, name: user.name, expertise: user.expertise }
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    // Query params for extended analytics
    const { startDate, endDate, granularity = 'day' } = req.query;

    // Basic analytics aggregation (global totals)
    const [userStats, sessionStats, disputeStats, goalStats] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Session.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Dispute.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Goal.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    // Recent activity
    const [recentUsers, recentSessions, recentDisputes] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      Session.find({}).sort({ createdAt: -1 }).limit(5).populate('mentor mentee', 'name'),
      Dispute.find({}).sort({ createdAt: -1 }).limit(5).populate('reportedBy reportedAgainst', 'name')
    ]);

    // Helper: date range and grouping key
    const parseDate = (v) => (v ? new Date(v) : null);
    let start = parseDate(startDate);
    let end = parseDate(endDate);

    // Default timeseries window: last 30 days if nothing provided
    if (!start && !end) {
      end = new Date();
      start = new Date(end);
      start.setDate(start.getDate() - 30);
    }

    // If end provided, make it exclusive by adding 1 day
    let endExclusive = end ? new Date(end) : null;
    if (endExclusive) {
      endExclusive.setDate(endExclusive.getDate() + 1);
    }

    const inRange = () => {
      const cond = {};
      if (start) cond.$gte = start;
      if (endExclusive) cond.$lt = endExclusive;
      return Object.keys(cond).length ? { createdAt: cond } : {};
    };

    // Build date key per granularity
    const dateKeyExpr = (() => {
      if (granularity === 'month') {
        return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      }
      if (granularity === 'week') {
        // ISO week key: YYYY-Www
        return {
          $concat: [
            { $toString: { $isoWeekYear: '$createdAt' } },
            '-',
            {
              $cond: [
                { $lte: [{ $isoWeek: '$createdAt' }, 9] },
                { $concat: ['W0', { $toString: { $isoWeek: '$createdAt' } }] },
                { $concat: ['W', { $toString: { $isoWeek: '$createdAt' } }] }
              ]
            }
          ]
        };
      }
      // default day
      return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    })();

    // Time-series aggregations (within optional range)
    const [usersSeries, sessionsSeries, goalsSeries, disputesSeries] = await Promise.all([
      // Users created per bucket
      User.aggregate([
        { $match: inRange() },
        { $group: { _id: dateKeyExpr, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Sessions per bucket and status
      Session.aggregate([
        { $match: inRange() },
        { $group: { _id: { date: dateKeyExpr, status: '$status' }, count: { $sum: 1 } } },
        { $sort: { '_id.date': 1 } }
      ]),
      // Goals per bucket and status
      Goal.aggregate([
        { $match: inRange() },
        { $group: { _id: { date: dateKeyExpr, status: '$status' }, count: { $sum: 1 } } },
        { $sort: { '_id.date': 1 } }
      ]),
      // Disputes per bucket and status
      Dispute.aggregate([
        { $match: inRange() },
        { $group: { _id: { date: dateKeyExpr, status: '$status' }, count: { $sum: 1 } } },
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    // Derived dispute metrics (within range): resolution rate and avg resolution time (hours)
    const [disputesOpened, disputesResolved] = await Promise.all([
      Dispute.aggregate([
        { $match: inRange() },
        { $count: 'total' }
      ]),
      Dispute.aggregate([
        { $match: { ...inRange(), status: { $in: ['Resolved', 'Closed'] }, resolvedAt: { $ne: null } } },
        {
          $project: {
            diffHours: {
              $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60]
            }
          }
        },
        { $group: { _id: null, count: { $sum: 1 }, avgResolutionHours: { $avg: '$diffHours' } } }
      ])
    ]);

    const opened = (disputesOpened[0]?.total) || 0;
    const resolvedCount = (disputesResolved[0]?.count) || 0;
    const avgResolutionHours = (disputesResolved[0]?.avgResolutionHours) || 0;
    const resolutionRate = opened ? Math.round((resolvedCount / opened) * 100) : 0;

    // Reshape session/goal/dispute series into status keyed arrays for convenience
    const reshapeStatusSeries = (arr) => {
      const out = {};
      arr.forEach(({ _id, count }) => {
        const date = _id.date;
        const status = _id.status || 'Unknown';
        if (!out[status]) out[status] = [];
        out[status].push({ date, count });
      });
      return out;
    };

    // Operational status ("website status" metrics)
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [
      usersTodayCount,
      sessionsScheduledTodayCount,
      sessionsCompletedTodayCount,
      sessionsNext24hCount,
      activeSessionsNowCount,
      pendingMentorApprovalsCount,
      pendingExpertiseUsersCount,
      openDisputesCount,
      blockedUsersCount
    ] = await Promise.all([
      // New users created today
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      // Sessions scheduled today
      Session.countDocuments({ scheduledAt: { $gte: startOfToday, $lte: endOfToday } }),
      // Sessions completed today (based on updatedAt)
      Session.countDocuments({ status: 'Completed', updatedAt: { $gte: startOfToday } }),
      // Sessions scheduled in the next 24 hours
      Session.countDocuments({ status: 'Scheduled', scheduledAt: { $gte: now, $lt: next24h } }),
      // Sessions currently in progress
      Session.countDocuments({ status: 'InProgress' }),
      // Pending mentor approvals
      User.countDocuments({ role: 'Mentor', isMentorApproved: false }),
      // Users with at least one pending expertise item
      User.countDocuments({ 'expertise.status': 'Pending' }),
      // Open or in-review disputes
      Dispute.countDocuments({ status: { $in: ['Open', 'InReview'] } }),
      // Blocked users
      User.countDocuments({ status: 'Blocked' })
    ]);

    let version = null;
    try {
      // backend/package.json relative to src/controllers
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const pkg = require('../../package.json');
      version = pkg.version || null;
    } catch (e) {
      version = null;
    }

    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeMinutes = Math.round(uptimeSeconds / 60);

    return ok(res, {
      stats: {
        users: userStats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {}),
        sessions: sessionStats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {}),
        disputes: disputeStats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {}),
        goals: goalStats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {})
      },
      recent: {
        users: recentUsers,
        sessions: recentSessions,
        disputes: recentDisputes
      },
      timeseries: {
        granularity,
        range: { start: start || null, end: end || null },
        users: usersSeries.map(d => ({ date: d._id, count: d.count })),
        sessions: reshapeStatusSeries(sessionsSeries),
        goals: reshapeStatusSeries(goalsSeries),
        disputes: reshapeStatusSeries(disputesSeries)
      },
      derived: {
        disputes: { resolutionRate, avgResolutionHours }
      },
      status: {
        usersToday: usersTodayCount,
        sessionsScheduledToday: sessionsScheduledTodayCount,
        sessionsCompletedToday: sessionsCompletedTodayCount,
        completionRateToday: sessionsScheduledTodayCount ? Math.round((sessionsCompletedTodayCount / sessionsScheduledTodayCount) * 100) : 0,
        sessionsNext24h: sessionsNext24hCount,
        activeSessionsNow: activeSessionsNowCount,
        pendingMentorApprovals: pendingMentorApprovalsCount,
        pendingExpertiseUsers: pendingExpertiseUsersCount,
        openDisputes: openDisputesCount,
        blockedUsers: blockedUsersCount,
        uptimeSeconds,
        uptimeMinutes,
        version
      }
    });
  } catch (err) {
    next(err);
  }
};
