const Notification = require('../models/Notification');
const { isValidObjectId } = require('../utils/validators');

const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.userId }).sort({ sendAt: 1 });
  res.json(notifications);
};

const updateNotification = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }
    const payload = { ...req.body };
    if (payload.sendAt) {
      payload.sendAt = new Date(payload.sendAt);
      if (Number.isNaN(payload.sendAt.getTime())) {
        return res.status(400).json({ message: 'Invalid sendAt' });
      }
    }
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      payload,
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  } catch (e) {
    res.status(500).json({ message: 'Error updating notification' });
  }
};

module.exports = {
  listNotifications,
  updateNotification
};
