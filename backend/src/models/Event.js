const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  code: String,
  instructor: String,
  room: String,
  link: String,
  type: { type: String, enum: ['REGULAR', 'ONLINE', 'EXAM'], default: 'REGULAR' },
  dayOfWeek: Number,
  startTime: String,
  endTime: String,
  startDate: { type: String, required: true },
  color: String,
  notes: String,
  reminderMinutes: Number
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
