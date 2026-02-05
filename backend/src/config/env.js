const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://nhutrunghai:30122005@twitter-free-cluster.d9hq5kr.mongodb.net/UniFlow_DB?retryWrites=true&w=majority&appName=Twitter-Free-Cluster';
const JWT_SECRET = process.env.JWT_SECRET || 'nhutrunghai';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'uniflow@localhost';
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES) || 30;

module.exports = {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  APP_BASE_URL,
  RESET_TOKEN_TTL_MINUTES
};
