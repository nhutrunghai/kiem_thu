const mongoose = require('mongoose');
const Note = require('../models/Note');
const Event = require('../models/Event');
const { isValidObjectId } = require('../utils/validators');
const { upsertNotification, cancelNotification } = require('../services/notificationService');

const listNotes = async (req, res) => {
  const notes = await Note.find({ userId: req.userId });
  res.json(notes);
};

const getNoteByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }
    const note = await Note.findOne({ userId: req.userId, eventId });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching note' });
  }
};

const upsertNote = async (req, res) => {
  try {
    const { eventId, content, reminderEnabled, reminderAt } = req.body;
    if (!eventId || !isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }
    const enableReminder = !!reminderEnabled;
    let reminderAtDate = null;
    if (enableReminder && reminderAt) {
      reminderAtDate = new Date(reminderAt);
      if (Number.isNaN(reminderAtDate.getTime())) {
        return res.status(400).json({ message: 'Invalid reminder time' });
      }
      if (reminderAtDate.getTime() < Date.now()) {
        return res.status(400).json({ message: 'Reminder time cannot be in the past' });
      }
    } else if (enableReminder) {
      return res.status(400).json({ message: 'Reminder time is required' });
    }
    const note = await Note.findOneAndUpdate(
      { userId: req.userId, eventId },
      { content, reminderEnabled: enableReminder, reminderAt: enableReminder ? reminderAtDate : null, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    if (enableReminder && reminderAtDate) {
      let noteTitle = 'Note reminder';
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        const event = await Event.findOne({ _id: eventId, userId: req.userId }).select('title');
        if (event?.title) noteTitle = `Note: ${event.title}`;
      }
      const trimmedContent = (content || '').trim();
      if (trimmedContent) {
        noteTitle = `${noteTitle} - ${trimmedContent.slice(0, 80)}`;
      }
      await upsertNotification({
        userId: req.userId,
        targetId: note._id,
        targetType: 'NOTE',
        channel: 'EMAIL',
        sendAt: reminderAtDate,
        title: noteTitle,
        remindBefore: 0,
        dueDate: reminderAtDate
      });
    } else {
      await cancelNotification({ userId: req.userId, targetId: note._id, channel: 'EMAIL' });
    }
    res.json(note);
  } catch (e) {
    res.status(500).json({ message: 'Error saving note' });
  }
};

const disableReminder = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid note id' });
    }
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { reminderEnabled: false, reminderAt: null, updatedAt: Date.now() },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    await cancelNotification({ userId: req.userId, targetId: note._id, channel: 'EMAIL' });
    res.json(note);
  } catch (e) {
    res.status(500).json({ message: 'Error disabling note reminder' });
  }
};

const deleteNote = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid note id' });
    }
    const deleted = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ message: 'Note not found' });
    await cancelNotification({ userId: req.userId, targetId: req.params.id, channel: 'EMAIL' });
    res.json({ message: 'Note deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Error deleting note' });
  }
};

module.exports = {
  listNotes,
  getNoteByEvent,
  upsertNote,
  disableReminder,
  deleteNote
};
