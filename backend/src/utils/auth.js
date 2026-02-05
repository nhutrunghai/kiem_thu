const crypto = require('crypto');
const { APP_BASE_URL } = require('../config/env');

const MIN_PASSWORD_LENGTH = 8;
const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const buildResetUrl = (token) => `${trimTrailingSlash(APP_BASE_URL)}/reset?token=${encodeURIComponent(token)}`;
const hashToken = (token = '') => crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  MIN_PASSWORD_LENGTH,
  trimTrailingSlash,
  buildResetUrl,
  hashToken
};
