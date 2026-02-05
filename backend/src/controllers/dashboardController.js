const Event = require('../models/Event');
const Task = require('../models/Task');
const { toMinutes } = require('../utils/time');

const getStats = async (req, res) => {
  try {
    const [events, tasks] = await Promise.all([
      Event.find({ userId: req.userId }).select('dayOfWeek startTime endTime'),
      Task.find({ userId: req.userId }).select('status')
    ]);

    const today = new Date().getDay();
    const classesToday = events.filter(event => event.dayOfWeek === today).length;
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const activeTasks = tasks.length - completedTasks;

    const hoursPerDay = Array(7).fill(0);
    for (const event of events) {
      if (typeof event.dayOfWeek !== 'number' || event.dayOfWeek < 0 || event.dayOfWeek > 6) continue;
      const startM = toMinutes(event.startTime);
      const endM = toMinutes(event.endTime);
      if (startM === null || endM === null) continue;
      const duration = (endM - startM) / 60;
      if (duration > 0) hoursPerDay[event.dayOfWeek] += duration;
    }

    const studyHoursData = hoursPerDay.map((hours, day) => ({
      day,
      hours: Number(hours.toFixed(1))
    }));

    res.json({ classesToday, activeTasks, completedTasks, studyHoursData });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

module.exports = {
  getStats
};
