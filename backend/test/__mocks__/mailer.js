// Mock for src/config/mailer.js
module.exports = {
    transporter: {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    },
    isMailerReady: jest.fn().mockReturnValue(false),
    isMailerConfigured: false,
    EMAIL_FROM: 'test@uniflow.com'
};
