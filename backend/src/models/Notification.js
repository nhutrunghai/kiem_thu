const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['TASK', 'EVENT', 'NOTE'], default: 'TASK' },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  channel: { type: String, enum: ['EMAIL', 'PUSH'], default: 'EMAIL' },
  sendAt: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED', 'CANCELED'], default: 'PENDING' },
  error: String,
  title: String,
  remindBefore: Number,
  dueDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
