const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  avatar: String,
  notificationChannels: { type: [String], enum: ['EMAIL', 'PUSH'], default: ['EMAIL'] },
  resetTokenHash: String,
  resetTokenExpiresAt: Date,
  resetRequestedAt: Date,
  resetUsedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
