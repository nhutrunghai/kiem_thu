const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'], default: 'TODO' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  reminderEnabled: { type: Boolean, default: false },
  reminderMinutesBefore: Number,
  reminderAt: Date,
  reminderSent: { type: Boolean, default: false }
});

module.exports = mongoose.model('Task', TaskSchema);
