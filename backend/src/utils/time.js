const toMinutes = (timeStr = '') => {
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const computeReminderAt = (dueDate, minutesBefore) => {
  if (!dueDate && minutesBefore !== 0) return null;
  const due = new Date(dueDate);
  const mins = Number(minutesBefore);
  if (Number.isNaN(mins) || mins < 0 || Number.isNaN(due.getTime())) return null;
  return new Date(due.getTime() - mins * 60 * 1000);
};

const formatDateTime = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', { hour12: false });
};

module.exports = {
  toMinutes,
  computeReminderAt,
  formatDateTime
};
