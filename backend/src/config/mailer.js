const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = require('./env');

let mailerReady = false;
let transporter = null;
const isMailerConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

if (isMailerConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  transporter.verify().then(() => {
    mailerReady = true;
    console.log('Email transporter ready');
  }).catch(err => {
    console.error('Email transporter error:', err.message);
  });
} else {
  console.warn('Email transport not configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS to enable reminders.');
}

const isMailerReady = () => mailerReady;

module.exports = {
  transporter,
  isMailerReady,
  isMailerConfigured,
  EMAIL_FROM
};
