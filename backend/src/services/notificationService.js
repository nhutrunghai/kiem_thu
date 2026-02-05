const Notification = require('../models/Notification');

const upsertNotification = async ({ userId, targetId, targetType = 'TASK', channel = 'EMAIL', sendAt, title, remindBefore, dueDate }) => {
  if (!sendAt || !userId || !targetId) return;
  await Notification.findOneAndUpdate(
    { userId, targetId, channel },
    { userId, targetId, targetType, channel, sendAt, title, remindBefore, dueDate, status: 'PENDING', error: null },
    { upsert: true, new: true }
  );
};

const cancelNotification = async ({ userId, targetId, channel = 'EMAIL' }) => {
  await Notification.deleteMany({ userId, targetId, channel });
};

module.exports = {
  upsertNotification,
  cancelNotification
};
