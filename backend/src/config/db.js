const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const connectDB = () => mongoose.connect(MONGODB_URI)
  .then(() => console.log('? UniFlow DB Connected Successfully'))
  .catch(err => console.error('? DB Connection Error:', err));

module.exports = {
  connectDB
};
