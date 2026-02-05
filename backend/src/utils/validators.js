const mongoose = require('mongoose');

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

module.exports = {
  normalizeEmail,
  isValidEmail,
  isValidObjectId
};
