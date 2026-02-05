const app = require('./app');
const { PORT } = require('./config/env');
const { connectDB } = require('./config/db');
const { startReminderScheduler } = require('./services/reminderService');

connectDB();

app.listen(PORT, () => {
  console.log('?? UniFlow Server is running!');
  console.log(`?? API: http://localhost:${PORT}/api`);
  console.log(`?? Web App: http://localhost:${PORT}`);
});

startReminderScheduler();
