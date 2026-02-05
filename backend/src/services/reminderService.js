const Notification = require('../models/Notification');
const Task = require('../models/Task');
const { transporter, isMailerReady, isMailerConfigured, EMAIL_FROM } = require('../config/mailer');
const { hasEmailChannel } = require('../utils/notification');
const { formatDateTime } = require('../utils/time');

const REMINDER_CHECK_INTERVAL_MS = 60 * 1000;

const processDueReminders = async () => {
  if (!isMailerReady() || !transporter) return;
  const now = new Date();
  try {
    const dueNotifications = await Notification.find({
      status: 'PENDING',
      sendAt: { $lte: now },
      channel: 'EMAIL'
    }).limit(50).populate('userId', 'email fullName notificationChannels');

    for (const notif of dueNotifications) {
      const user = notif.userId;
      if (!user || !user.email) {
        await Notification.updateOne({ _id: notif._id }, { status: 'CANCELED' });
        continue;
      }
      if (!hasEmailChannel(user)) {
        await Notification.updateOne({ _id: notif._id }, { status: 'CANCELED', error: 'Email notifications disabled' });
        continue;
      }

      const mailOptions = {
        from: EMAIL_FROM,
        to: user.email,
        subject: `[UniFlow] Nh?c nh?: ${notif.title || 'Nhi?m v?'}`,
        html: `
          <div style="font-family: 'Segoe UI', Roboto, sans-serif; background:#f8fafc; padding:20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 8px 30px rgba(15,23,42,0.08); overflow:hidden;">
              <tr>
                <td style="background:#2563eb; color:#fff; padding:18px 24px; font-weight:700; font-size:18px;">
                  UniFlow · Nh?c nh?
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px; font-size:15px; color:#0f172a;">Chào ${user.fullName || user.email},</p>
                  <p style="margin:0 0 16px; font-size:14px; color:#334155;">B?n có nh?c nh? s?p d?n h?n. Chi ti?t:</p>
                  <div style="border:1px solid #e2e8f0; border-radius:12px; padding:16px; background:#f8fafc; margin-bottom:16px;">
                    <div style="font-size:14px; color:#1e293b; margin-bottom:10px;"><strong>Tiêu d?:</strong> ${notif.title || 'Nhi?m v?'}</div>
                    <div style="font-size:14px; color:#1e293b; margin-bottom:10px;"><strong>Th?i di?m nh?c:</strong> ${formatDateTime(notif.sendAt)}</div>
                    <div style="font-size:14px; color:#1e293b;"><strong>Nh?c tru?c:</strong> ${notif.remindBefore || 0} phút</div>
                  </div>
                  <a href="#" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:10px 16px; border-radius:10px; font-weight:600; font-size:14px;">M? UniFlow</a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px; background:#f1f5f9; font-size:12px; color:#64748b;">
                  Ðây là email t? d?ng, vui lòng không tr? l?i. N?u b?n không mu?n nh?n, hãy t?t nh?c nh? trong nhi?m v? tuong ?ng.
                </td>
              </tr>
            </table>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        await Notification.updateOne({ _id: notif._id }, { status: 'SENT', error: null });
        if (notif.targetType === 'TASK') {
          await Task.updateOne({ _id: notif.targetId, userId: notif.userId }, { reminderSent: true, reminderEnabled: false, reminderAt: undefined });
        }
      } catch (err) {
        console.error('Send reminder email failed:', err.message);
        await Notification.updateOne({ _id: notif._id }, { status: 'FAILED', error: err.message });
      }
    }
  } catch (e) {
    console.error('Reminder scheduler error:', e.message);
  }
};

const startReminderScheduler = () => {
  if (!isMailerConfigured) return;
  setInterval(processDueReminders, REMINDER_CHECK_INTERVAL_MS);
  setTimeout(processDueReminders, 10 * 1000);
};

module.exports = {
  startReminderScheduler
};
