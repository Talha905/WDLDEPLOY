const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/roles');

const ExpertiseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { _id: false });

const AvailabilitySchema = new mongoose.Schema({
  day: { type: String },
  slots: [{ start: String, end: String }]
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.MENTEE },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  expertise: { type: [ExpertiseSchema], default: [] },
  isMentorApproved: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Blocked'], default: 'Active' },
  rating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
  availability: { type: [AvailabilitySchema], default: [] }
}, { timestamps: true });

UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

module.exports = mongoose.model('User', UserSchema);
