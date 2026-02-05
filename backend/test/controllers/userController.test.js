const { getProfile, updateProfile } = require('../../src/controllers/userController');
const User = require('../../src/models/User');
const Task = require('../../src/models/Task');
const Note = require('../../src/models/Note');
const Notification = require('../../src/models/Notification');
const { computeReminderAt } = require('../../src/utils/time');
const { upsertNotification } = require('../../src/services/notificationService');

jest.mock('../../src/models/User', () => ({
    findByIdAndUpdate: jest.fn()
}));

jest.mock('../../src/models/Task', () => ({
    find: jest.fn()
}));

jest.mock('../../src/models/Note', () => ({
    find: jest.fn()
}));

jest.mock('../../src/models/Notification', () => ({
    updateMany: jest.fn()
}));

jest.mock('../../src/utils/time', () => ({
    computeReminderAt: jest.fn()
}));

jest.mock('../../src/services/notificationService', () => ({
    upsertNotification: jest.fn()
}));

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
});

describe('Bộ điều khiển Người dùng', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Lấy hồ sơ nên trả về thông tin người dùng', async () => {
        const req = { user: { _id: 'u1', email: 'a@b.com', fullName: 'A', avatar: 'x', notificationChannels: ['EMAIL'] } };
        const res = makeRes();

        await getProfile(req, res);

        expect(res.json).toHaveBeenCalledWith({
            id: 'u1',
            email: 'a@b.com',
            fullName: 'A',
            avatar: 'x',
            notificationChannels: ['EMAIL']
        });
    });

    describe('Cập nhật hồ sơ', () => {
        it('nên trả về 400 khi không có trường hợp lệ nào được cung cấp', async () => {
            const req = { userId: 'u1', user: {}, body: {} };
            const res = makeRes();

            await updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'No valid fields to update' });
        });

        it('nên cập nhật các trường hồ sơ', async () => {
            const req = {
                userId: 'u1',
                user: { notificationChannels: ['EMAIL'] },
                body: { fullName: 'New Name', avatar: 'new.png' }
            };
            const res = makeRes();
            const updated = { _id: 'u1', email: 'a@b.com', fullName: 'New Name', avatar: 'new.png', notificationChannels: ['EMAIL'] };

            User.findByIdAndUpdate.mockResolvedValue(updated);

            await updateProfile(req, res);

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { fullName: 'New Name', avatar: 'new.png' }, { new: true });
            expect(res.json).toHaveBeenCalledWith({
                id: 'u1',
                email: 'a@b.com',
                fullName: 'New Name',
                avatar: 'new.png',
                notificationChannels: ['EMAIL']
            });
        });

        it('nên hủy các thông báo email đang chờ khi email bị xóa', async () => {
            const req = {
                userId: 'u1',
                user: { notificationChannels: ['EMAIL', 'PUSH'] },
                body: { notificationChannels: ['PUSH'] }
            };
            const res = makeRes();
            const updated = { _id: 'u1', email: 'a@b.com', fullName: 'A', avatar: 'x', notificationChannels: ['PUSH'] };

            User.findByIdAndUpdate.mockResolvedValue(updated);

            await updateProfile(req, res);

            expect(Notification.updateMany).toHaveBeenCalledWith(
                { userId: 'u1', channel: 'EMAIL', status: 'PENDING' },
                { status: 'CANCELED', error: 'Email notifications disabled' }
            );
        });

        it('nên kích hoạt lại thông báo khi email được thêm vào', async () => {
            jest.useFakeTimers().setSystemTime(new Date('2026-02-05T10:00:00.000Z'));
            const req = {
                userId: 'u1',
                user: { notificationChannels: ['PUSH'] },
                body: { notificationChannels: ['EMAIL', 'PUSH'] }
            };
            const res = makeRes();
            const updated = { _id: 'u1', email: 'a@b.com', fullName: 'A', avatar: 'x', notificationChannels: ['EMAIL', 'PUSH'] };

            User.findByIdAndUpdate.mockResolvedValue(updated);

            const tasks = [
                { _id: 't1', title: 'Task 1', dueDate: '2026-02-06T10:00:00.000Z', reminderEnabled: true, reminderMinutesBefore: 30 },
                { _id: 't2', title: 'Task 2', dueDate: '2026-02-07T10:00:00.000Z', reminderEnabled: true, reminderMinutesBefore: 15, reminderAt: new Date('2026-02-07T09:45:00.000Z') }
            ];
            const notes = [
                { _id: 'n1', content: 'Note content', reminderEnabled: true, reminderAt: new Date('2026-02-06T12:00:00.000Z') }
            ];

            Task.find.mockResolvedValue(tasks);
            Note.find.mockResolvedValue(notes);
            computeReminderAt.mockReturnValue(new Date('2026-02-06T09:30:00.000Z'));

            await updateProfile(req, res);

            expect(Task.find).toHaveBeenCalled();
            expect(Note.find).toHaveBeenCalled();
            expect(upsertNotification).toHaveBeenCalledTimes(3);
            expect(upsertNotification).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'u1',
                targetId: 't1',
                targetType: 'TASK',
                channel: 'EMAIL'
            }));
            expect(upsertNotification).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'u1',
                targetId: 'n1',
                targetType: 'NOTE',
                channel: 'EMAIL'
            }));

            jest.useRealTimers();
        });
    });
});
