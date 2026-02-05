const Task = require('../models/Task');
const { VALID_TASK_STATUSES, VALID_TASK_PRIORITIES } = require('../config/constants');
const { computeReminderAt } = require('../utils/time');
const { hasEmailChannel } = require('../utils/notification');
const { isValidObjectId } = require('../utils/validators');
const { upsertNotification, cancelNotification } = require('../services/notificationService');

const listTasks = async (req, res) => {
  const tasks = await Task.find({ userId: req.userId });
  res.json(tasks);
};

const createTask = async (req, res) => {
  try {
    const { title, dueDate, status, priority } = req.body || {};
    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ message: 'Invalid dueDate' });
    }
    if (status && !VALID_TASK_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }
    if (priority && !VALID_TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid task priority' });
    }
    const reminderEnabled = !!req.body.reminderEnabled;
    const parsedMinutes = reminderEnabled ? Number(req.body.reminderMinutesBefore) : undefined;
    if (reminderEnabled && Number.isNaN(parsedMinutes)) {
      return res.status(400).json({ message: 'Invalid reminderMinutesBefore' });
    }
    const reminderMinutesBefore = reminderEnabled ? parsedMinutes : undefined;
    const reminderAt = reminderEnabled ? computeReminderAt(dueDate, reminderMinutesBefore) : undefined;
    if (reminderEnabled && !reminderAt) {
      return res.status(400).json({ message: 'Invalid reminder configuration' });
    }
    const allowEmail = hasEmailChannel(req.user);
    const task = new Task({
      ...req.body,
      title: trimmedTitle,
      reminderEnabled,
      reminderMinutesBefore,
      reminderAt,
      reminderSent: reminderEnabled ? false : undefined,
      userId: req.userId
    });
    await task.save();
    if (reminderEnabled && reminderAt && allowEmail) {
      await upsertNotification({
        userId: req.userId,
        targetId: task._id,
        targetType: 'TASK',
        channel: 'EMAIL',
        sendAt: reminderAt,
        title: task.title,
        remindBefore: reminderMinutesBefore,
        dueDate: task.dueDate
      });
    } else {
      await cancelNotification({ userId: req.userId, targetId: task._id, channel: 'EMAIL' });
    }
    res.json(task);
  } catch (e) {
    res.status(500).json({ message: 'Error creating task' });
  }
};

const updateTask = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }
    const existing = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const { status, priority, dueDate, title } = req.body || {};
    const trimmedTitle = title !== undefined ? (title || '').trim() : undefined;
    if (title !== undefined && !trimmedTitle) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (status && !VALID_TASK_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }
    if (priority && !VALID_TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid task priority' });
    }
    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ message: 'Invalid dueDate' });
    }

    const reminderEnabled = !!req.body.reminderEnabled;
    const parsedMinutes = reminderEnabled ? Number(req.body.reminderMinutesBefore) : undefined;
    if (reminderEnabled && Number.isNaN(parsedMinutes)) {
      return res.status(400).json({ message: 'Invalid reminderMinutesBefore' });
    }
    const reminderMinutesBefore = reminderEnabled ? parsedMinutes : undefined;
    const effectiveDueDate = req.body.dueDate || existing.dueDate;
    const reminderAt = reminderEnabled ? computeReminderAt(effectiveDueDate, reminderMinutesBefore) : undefined;
    if (reminderEnabled && !reminderAt) {
      return res.status(400).json({ message: 'Invalid reminder configuration' });
    }
    const allowEmail = hasEmailChannel(req.user);

    const reminderSent = reminderEnabled
      ? false
      : (req.body.reminderSent === false ? false : existing.reminderSent);
    const updatePayload = {
      ...req.body,
      reminderEnabled,
      reminderMinutesBefore,
      reminderAt,
      reminderSent
    };
    if (trimmedTitle !== undefined) {
      updatePayload.title = trimmedTitle;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updatePayload,
      { new: true }
    );

    if (reminderEnabled && reminderAt && allowEmail) {
      await upsertNotification({
        userId: req.userId,
        targetId: task._id,
        targetType: 'TASK',
        channel: 'EMAIL',
        sendAt: reminderAt,
        title: task.title,
        remindBefore: reminderMinutesBefore,
        dueDate: task.dueDate || effectiveDueDate
      });
    } else {
      await cancelNotification({ userId: req.userId, targetId: task._id, channel: 'EMAIL' });
    }

    res.json(task);
  } catch (e) {
    res.status(500).json({ message: 'Error updating task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }
    const deleted = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ message: 'Task not found' });
    await cancelNotification({ userId: req.userId, targetId: req.params.id, channel: 'EMAIL' });
    res.json({ message: 'Task deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Error deleting task' });
  }
};

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask
};
