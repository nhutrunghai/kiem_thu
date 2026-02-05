const User = require('../models/User');
const Task = require('../models/Task');
const Note = require('../models/Note');
const Notification = require('../models/Notification');
const { computeReminderAt } = require('../utils/time');
const { upsertNotification } = require('../services/notificationService');

const getProfile = async (req, res) => {
  const user = req.user;
  res.json({ id: user._id, email: user.email, fullName: user.fullName, avatar: user.avatar, notificationChannels: user.notificationChannels });
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['fullName', 'avatar', 'notificationChannels'];
    const payload = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        payload[field] = req.body[field];
      }
    }
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    if (Array.isArray(payload.notificationChannels)) {
      payload.notificationChannels = payload.notificationChannels.filter(c => ['EMAIL', 'PUSH'].includes(c));
    } else {
      delete payload.notificationChannels;
    }

    const prevChannels = Array.isArray(req.user.notificationChannels) ? req.user.notificationChannels : ['EMAIL'];
    const user = await User.findByIdAndUpdate(req.userId, payload, { new: true });

    if (Array.isArray(payload.notificationChannels)) {
      const nextChannels = Array.isArray(user.notificationChannels) ? user.notificationChannels : [];
      const hadEmail = prevChannels.includes('EMAIL');
      const hasEmail = nextChannels.includes('EMAIL');

      if (!hasEmail) {
        await Notification.updateMany(
          { userId: req.userId, channel: 'EMAIL', status: 'PENDING' },
          { status: 'CANCELED', error: 'Email notifications disabled' }
        );
      } else if (!hadEmail && hasEmail) {
        const tasksToNotify = await Task.find({
          userId: req.userId,
          reminderEnabled: true,
          reminderSent: { $ne: true }
        });
        const now = new Date();
        for (const task of tasksToNotify) {
          const sendAt = task.reminderAt || computeReminderAt(task.dueDate, task.reminderMinutesBefore);
          if (!sendAt) continue;
          const sendDate = new Date(sendAt);
          if (Number.isNaN(sendDate.getTime()) || sendDate <= now) continue;
          await upsertNotification({
            userId: req.userId,
            targetId: task._id,
            targetType: 'TASK',
            channel: 'EMAIL',
            sendAt: sendDate,
            title: task.title,
            remindBefore: task.reminderMinutesBefore,
            dueDate: task.dueDate
          });
        }
        const notesToNotify = await Note.find({
          userId: req.userId,
          reminderEnabled: true,
          reminderAt: { $gt: now }
        });
        for (const note of notesToNotify) {
          const sendAt = note.reminderAt;
          if (!sendAt) continue;
          const noteTitle = (note.content || '').trim().slice(0, 80) || 'Note reminder';
          await upsertNotification({
            userId: req.userId,
            targetId: note._id,
            targetType: 'NOTE',
            channel: 'EMAIL',
            sendAt: sendAt,
            title: noteTitle,
            remindBefore: 0,
            dueDate: sendAt
          });
        }
      }
    }

    res.json({ id: user._id, email: user.email, fullName: user.fullName, avatar: user.avatar, notificationChannels: user.notificationChannels });
  } catch (e) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
