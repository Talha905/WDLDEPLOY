const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../config/roles');
const { ok, created } = require('../utils/response');

function signToken(user) {
  const payload = { sub: user._id.toString(), role: user.role };
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

exports.register = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    let finalRole = role;
    if (![ROLES.ADMIN, ROLES.MENTOR, ROLES.MENTEE].includes(finalRole)) {
      finalRole = ROLES.MENTEE;
    }
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ email, name, passwordHash, role: finalRole, isMentorApproved: finalRole === ROLES.MENTOR ? false : undefined });

    const token = signToken(user);
    return created(res, { token, user: sanitize(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const okPass = await user.comparePassword(password);
    if (!okPass) return res.status(400).json({ error: 'Invalid credentials' });
    if (user.status === 'Blocked') return res.status(403).json({ error: 'Account blocked' });
    if (user.role === ROLES.MENTOR && !user.isMentorApproved) {
      // Mentors must be approved by admin to log in as mentors; allow login as viewer
    }
    const token = signToken(user);
    return ok(res, { token, user: sanitize(user) });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  return ok(res, { user: sanitize(req.user) });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatarUrl, availability } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, bio, avatarUrl, availability }, { new: true });
    return ok(res, { user: sanitize(user) });
  } catch (err) { next(err); }
};

exports.addExpertise = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Expertise name required' });
    const user = await User.findById(req.user._id);
    user.expertise.push({ name, status: 'Pending' });
    await user.save();
    return ok(res, { user: sanitize(user) });
  } catch (err) { next(err); }
};

exports.requestMentor = async (req, res, next) => {
  try {
    // Update role to Mentor (pending approval)
    const user = await User.findById(req.user._id);
    user.role = ROLES.MENTOR;
    user.isMentorApproved = false;
    await user.save();
    return ok(res, { user: sanitize(user) });
  } catch (err) { next(err); }
};

function sanitize(user) {
  const u = user.toObject();
  delete u.passwordHash;
  return u;
}
