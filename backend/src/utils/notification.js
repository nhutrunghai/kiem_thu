const hasEmailChannel = (user) => {
  if (!user || !Array.isArray(user.notificationChannels)) return true;
  return user.notificationChannels.includes('EMAIL');
};

module.exports = {
  hasEmailChannel
};
