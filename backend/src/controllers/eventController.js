const Event = require('../models/Event');
const { VALID_EVENT_TYPES } = require('../config/constants');
const { toMinutes } = require('../utils/time');
const { isValidObjectId } = require('../utils/validators');

const listEvents = async (req, res) => {
  const events = await Event.find({ userId: req.userId });
  res.json(events);
};

const createEvent = async (req, res) => {
  try {
    const { title, startTime, endTime, startDate, type } = req.body || {};
    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle || !startDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (type && !VALID_EVENT_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const startDateValue = new Date(startDate);
    if (Number.isNaN(startDateValue.getTime())) {
      return res.status(400).json({ message: 'Invalid startDate' });
    }
    const computedDay = startDateValue.getDay();

    const startM = toMinutes(startTime);
    const endM = toMinutes(endTime);
    if (startM === null || endM === null || startM >= endM) {
      return res.status(400).json({ message: 'Invalid time range' });
    }

    const sameDayEvents = await Event.find({ userId: req.userId, dayOfWeek: computedDay, startDate });
    const overlaps = sameDayEvents.some(ev => {
      const evStart = toMinutes(ev.startTime);
      const evEnd = toMinutes(ev.endTime);
      if (evStart === null || evEnd === null) return false;
      return startM < evEnd && endM > evStart;
    });
    if (overlaps) return res.status(409).json({ message: 'Time slot already booked' });

    const event = new Event({ ...req.body, title: trimmedTitle, userId: req.userId, dayOfWeek: computedDay });
    await event.save();
    res.status(201).json(event);
  } catch (e) {
    res.status(500).json({ message: 'Error creating event' });
  }
};

const updateEvent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }
    const { title, startTime, endTime, startDate, swapWith, type } = req.body || {};
    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle || !startDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (type && !VALID_EVENT_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const startDateValue = new Date(startDate);
    if (Number.isNaN(startDateValue.getTime())) {
      return res.status(400).json({ message: 'Invalid startDate' });
    }
    const computedDay = startDateValue.getDay();

    const startM = toMinutes(startTime);
    const endM = toMinutes(endTime);
    if (startM === null || endM === null || startM >= endM) {
      return res.status(400).json({ message: 'Invalid time range' });
    }

    const excludeIds = [req.params.id];
    if (swapWith && isValidObjectId(swapWith)) excludeIds.push(swapWith);

    const sameDayEvents = await Event.find({ userId: req.userId, dayOfWeek: computedDay, startDate, _id: { $nin: excludeIds } });
    const overlaps = sameDayEvents.some(ev => {
      const evStart = toMinutes(ev.startTime);
      const evEnd = toMinutes(ev.endTime);
      if (evStart === null || evEnd === null) return false;
      return startM < evEnd && endM > evStart;
    });
    if (overlaps) return res.status(409).json({ message: 'Time slot already booked' });

    const updated = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, title: trimmedTitle, dayOfWeek: computedDay },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Event not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Error updating event' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }
    const deleted = await Event.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Error deleting event' });
  }
};

module.exports = {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
