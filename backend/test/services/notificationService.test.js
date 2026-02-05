const { upsertNotification, cancelNotification } = require('../../src/services/notificationService');
const Notification = require('../../src/models/Notification');

jest.mock('../../src/models/Notification', () => ({
    findOneAndUpdate: jest.fn(),
    deleteMany: jest.fn()
}));

describe('Dịch vụ thông báo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('nên bỏ qua upsert khi thiếu các trường bắt buộc', async () => {
        await upsertNotification({ userId: 'u1', targetId: 't1' });
        await upsertNotification({ sendAt: new Date(), targetId: 't1' });
        await upsertNotification({ sendAt: new Date(), userId: 'u1' });

        expect(Notification.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('nên upsert thông báo khi cung cấp dữ liệu hợp lệ', async () => {
        const payload = {
            userId: 'u1',
            targetId: 't1',
            targetType: 'TASK',
            channel: 'EMAIL',
            sendAt: new Date('2026-02-05T10:00:00.000Z'),
            title: 'Task',
            remindBefore: 30,
            dueDate: new Date('2026-02-05T10:30:00.000Z')
        };

        await upsertNotification(payload);

        expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
            { userId: 'u1', targetId: 't1', channel: 'EMAIL' },
            expect.objectContaining({
                userId: 'u1',
                targetId: 't1',
                targetType: 'TASK',
                channel: 'EMAIL',
                sendAt: payload.sendAt,
                title: 'Task',
                remindBefore: 30,
                dueDate: payload.dueDate,
                status: 'PENDING',
                error: null
            }),
            { upsert: true, new: true }
        );
    });

    it('nên hủy thông báo theo người dùng và đối tượng', async () => {
        await cancelNotification({ userId: 'u1', targetId: 't1' });

        expect(Notification.deleteMany).toHaveBeenCalledWith({ userId: 'u1', targetId: 't1', channel: 'EMAIL' });
    });
});
