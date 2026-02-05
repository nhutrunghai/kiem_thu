describe('Dịch vụ nhắc nhở', () => {
    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
    });

    it('không lên lịch khi mailer chưa được cấu hình', () => {
        jest.doMock('../../src/config/mailer', () => ({
            transporter: null,
            isMailerReady: jest.fn(),
            isMailerConfigured: false,
            EMAIL_FROM: 'test@uniflow.com'
        }));

        const setIntervalSpy = jest.spyOn(global, 'setInterval');
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

        const { startReminderScheduler } = require('../../src/services/reminderService');
        startReminderScheduler();

        expect(setIntervalSpy).not.toHaveBeenCalled();
        expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('nên lên lịch nhắc nhở khi mailer đã được cấu hình', () => {
        jest.doMock('../../src/config/mailer', () => ({
            transporter: { sendMail: jest.fn() },
            isMailerReady: jest.fn(),
            isMailerConfigured: true,
            EMAIL_FROM: 'test@uniflow.com'
        }));

        const setIntervalSpy = jest.spyOn(global, 'setInterval');
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

        const { startReminderScheduler } = require('../../src/services/reminderService');
        startReminderScheduler();

        expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60 * 1000);
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10 * 1000);
    });
});
