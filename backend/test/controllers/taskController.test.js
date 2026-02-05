const { listTasks, createTask, updateTask, deleteTask } = require('../../src/controllers/taskController');
const Task = require('../../src/models/Task');
const { upsertNotification, cancelNotification } = require('../../src/services/notificationService');
const { hasEmailChannel } = require('../../src/utils/notification');
const { computeReminderAt } = require('../../src/utils/time');

jest.mock('../../src/models/Task', () => {
    const model = jest.fn();
    model.find = jest.fn();
    model.findOne = jest.fn();
    model.findOneAndUpdate = jest.fn();
    model.findOneAndDelete = jest.fn();
    return model;
});

jest.mock('../../src/services/notificationService', () => ({
    upsertNotification: jest.fn(),
    cancelNotification: jest.fn()
}));

jest.mock('../../src/utils/notification', () => ({
    hasEmailChannel: jest.fn()
}));

jest.mock('../../src/utils/time', () => ({
    computeReminderAt: jest.fn()
}));

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
});

describe('Bộ điều khiển Công việc', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Liệt kê công việc nên trả về tasks cho người dùng', async () => {
        const req = { userId: 'user1' };
        const res = makeRes();
        const tasks = [{ _id: 't1' }];

        Task.find.mockResolvedValue(tasks);
        await listTasks(req, res);

        expect(Task.find).toHaveBeenCalledWith({ userId: 'user1' });
        expect(res.json).toHaveBeenCalledWith(tasks);
    });

    describe('Tạo công việc', () => {
        it('nên kiểm tra tiêu đề', async () => {
            const req = { userId: 'user1', body: { title: '   ' } };
            const res = makeRes();

            await createTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Title is required' });
        });

        it('nên kiểm tra dueDate', async () => {
            const req = { userId: 'user1', body: { title: 'Task', dueDate: 'bad-date' } };
            const res = makeRes();

            await createTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid dueDate' });
        });

        it('nên kiểm tra trạng thái', async () => {
            const req = { userId: 'user1', body: { title: 'Task', dueDate: '2026-02-05', status: 'BAD' } };
            const res = makeRes();

            await createTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task status' });
        });

        it('nên kiểm tra mức độ ưu tiên', async () => {
            const req = { userId: 'user1', body: { title: 'Task', dueDate: '2026-02-05', priority: 'BAD' } };
            const res = makeRes();

            await createTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task priority' });
        });

        it('nên kiểm tra số phút nhắc trước', async () => {
            const req = {
                userId: 'user1',
                body: { title: 'Task', dueDate: '2026-02-05', reminderEnabled: true, reminderMinutesBefore: 'bad' }
            };
            const res = makeRes();

            await createTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid reminderMinutesBefore' });
        });

        it('nên kiểm tra cấu hình nhắc nhở', async () => {
            const req = {
                userId: 'user1',
                body: { title: 'Task', dueDate: '2026-02-05', reminderEnabled: true, reminderMinutesBefore: -1 }
            };
            const res = makeRes();
            computeReminderAt.mockReturnValue(null);

            await createTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid reminder configuration' });
        });

        it('nên tạo công việc và lên lịch thông báo khi được phép', async () => {
            const dueDate = '2026-02-05T10:00:00.000Z';
            const reminderAt = new Date('2026-02-05T09:30:00.000Z');
            const req = {
                userId: 'user1',
                user: { notificationChannels: ['EMAIL'] },
                body: {
                    title: '  Task  ',
                    dueDate,
                    reminderEnabled: true,
                    reminderMinutesBefore: 30
                }
            };
            const res = makeRes();
            computeReminderAt.mockReturnValue(reminderAt);
            hasEmailChannel.mockReturnValue(true);

            const savedTask = {
                _id: 't1',
                title: 'Task',
                dueDate,
                reminderEnabled: true,
                reminderMinutesBefore: 30,
                reminderAt,
                reminderSent: false,
                userId: 'user1',
                save: jest.fn().mockResolvedValue(true)
            };
            Task.mockImplementation((data) => {
                expect(data.title).toBe('Task');
                expect(data.reminderEnabled).toBe(true);
                expect(data.reminderMinutesBefore).toBe(30);
                expect(data.reminderAt).toBe(reminderAt);
                expect(data.reminderSent).toBe(false);
                return savedTask;
            });

            await createTask(req, res);

            expect(upsertNotification).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'user1',
                targetId: savedTask._id,
                targetType: 'TASK',
                channel: 'EMAIL',
                sendAt: reminderAt,
                title: 'Task',
                remindBefore: 30,
                dueDate
            }));
            expect(cancelNotification).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(savedTask);
        });

        it('nên hủy thông báo khi kênh email bị tắt', async () => {
            const dueDate = '2026-02-05T10:00:00.000Z';
            const reminderAt = new Date('2026-02-05T09:30:00.000Z');
            const req = {
                userId: 'user1',
                user: { notificationChannels: ['PUSH'] },
                body: {
                    title: 'Task',
                    dueDate,
                    reminderEnabled: true,
                    reminderMinutesBefore: 30
                }
            };
            const res = makeRes();
            computeReminderAt.mockReturnValue(reminderAt);
            hasEmailChannel.mockReturnValue(false);

            const savedTask = { _id: 't1', title: 'Task', dueDate, save: jest.fn().mockResolvedValue(true) };
            Task.mockImplementation(() => savedTask);

            await createTask(req, res);

            expect(cancelNotification).toHaveBeenCalledWith({ userId: 'user1', targetId: 't1', channel: 'EMAIL' });
        });
    });

    describe('Cập nhật công việc', () => {
        it('nên trả về 400 nếu id công việc không hợp lệ', async () => {
            const req = { userId: 'user1', params: { id: 'bad' }, body: {} };
            const res = makeRes();

            await updateTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task id' });
        });

        it('nên trả về 404 khi không tìm thấy công việc', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' }, body: {} };
            const res = makeRes();
            Task.findOne.mockResolvedValue(null);

            await updateTask(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
        });

        it('nên kiểm tra trạng thái', async () => {
            const req = {
                userId: 'user1',
                params: { id: '507f1f77bcf86cd799439011' },
                body: { status: 'BAD' }
            };
            const res = makeRes();
            Task.findOne.mockResolvedValue({ _id: req.params.id, dueDate: '2026-02-05' });

            await updateTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task status' });
        });

        it('nên cập nhật công việc và lên lịch thông báo khi được bật', async () => {
            const dueDate = '2026-02-05T10:00:00.000Z';
            const reminderAt = new Date('2026-02-05T09:30:00.000Z');
            const req = {
                userId: 'user1',
                user: { notificationChannels: ['EMAIL'] },
                params: { id: '507f1f77bcf86cd799439011' },
                body: { title: '  Updated  ', reminderEnabled: true, reminderMinutesBefore: 30 }
            };
            const res = makeRes();

            Task.findOne.mockResolvedValue({ _id: req.params.id, dueDate, reminderSent: true });
            computeReminderAt.mockReturnValue(reminderAt);
            hasEmailChannel.mockReturnValue(true);
            const updated = { _id: req.params.id, title: 'Updated', dueDate };
            Task.findOneAndUpdate.mockResolvedValue(updated);

            await updateTask(req, res);

            expect(Task.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: req.params.id, userId: 'user1' },
                expect.objectContaining({ title: 'Updated', reminderEnabled: true, reminderMinutesBefore: 30, reminderAt }),
                { new: true }
            );
            expect(upsertNotification).toHaveBeenCalled();
            expect(cancelNotification).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('nên hủy thông báo khi nhắc nhở tắt', async () => {
            const dueDate = '2026-02-05T10:00:00.000Z';
            const req = {
                userId: 'user1',
                user: { notificationChannels: ['EMAIL'] },
                params: { id: '507f1f77bcf86cd799439011' },
                body: { reminderEnabled: false }
            };
            const res = makeRes();

            Task.findOne.mockResolvedValue({ _id: req.params.id, dueDate, reminderSent: true });
            hasEmailChannel.mockReturnValue(true);
            Task.findOneAndUpdate.mockResolvedValue({ _id: req.params.id });

            await updateTask(req, res);

            expect(cancelNotification).toHaveBeenCalledWith({ userId: 'user1', targetId: req.params.id, channel: 'EMAIL' });
        });
    });

    describe('Xóa công việc', () => {
        it('nên trả về 400 nếu id công việc không hợp lệ', async () => {
            const req = { userId: 'user1', params: { id: 'bad' } };
            const res = makeRes();

            await deleteTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task id' });
        });

        it('nên trả về 404 khi không tìm thấy công việc', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' } };
            const res = makeRes();

            Task.findOneAndDelete.mockResolvedValue(null);
            await deleteTask(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
        });

        it('nên xóa công việc và hủy thông báo', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' } };
            const res = makeRes();

            Task.findOneAndDelete.mockResolvedValue({ _id: req.params.id });
            await deleteTask(req, res);

            expect(cancelNotification).toHaveBeenCalledWith({ userId: 'user1', targetId: req.params.id, channel: 'EMAIL' });
            expect(res.json).toHaveBeenCalledWith({ message: 'Task deleted' });
        });
    });
});
