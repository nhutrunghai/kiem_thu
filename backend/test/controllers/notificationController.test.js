const { listNotifications, updateNotification } = require('../../src/controllers/notificationController');
const Notification = require('../../src/models/Notification');

jest.mock('../../src/models/Notification', () => ({
    find: jest.fn(),
    findOneAndUpdate: jest.fn()
}));

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
});

describe('Bộ điều khiển Thông báo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Liệt kê thông báo nên trả về notifications cho người dùng', async () => {
        const req = { userId: 'user1' };
        const res = makeRes();
        const notifications = [{ _id: 'n1' }];

        Notification.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(notifications)
        });

        await listNotifications(req, res);

        expect(Notification.find).toHaveBeenCalledWith({ userId: 'user1' });
        expect(res.json).toHaveBeenCalledWith(notifications);
    });

    describe('Cập nhật thông báo', () => {
        it('nên kiểm tra thông báo id', async () => {
            const req = { userId: 'user1', params: { id: 'bad' }, body: {} };
            const res = makeRes();

            await updateNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid notification id' });
        });

        it('nên kiểm tra sendAt', async () => {
            const req = {
                userId: 'user1',
                params: { id: '507f1f77bcf86cd799439011' },
                body: { sendAt: 'bad-date' }
            };
            const res = makeRes();

            await updateNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid sendAt' });
        });

        it('nên trả về 404 khi thông báo không tìm thấy', async () => {
            const req = {
                userId: 'user1',
                params: { id: '507f1f77bcf86cd799439011' },
                body: { title: 'Updated' }
            };
            const res = makeRes();

            Notification.findOneAndUpdate.mockResolvedValue(null);
            await updateNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
        });

        it('nên cập nhật thông báo thành công', async () => {
            const req = {
                userId: 'user1',
                params: { id: '507f1f77bcf86cd799439011' },
                body: { title: 'Updated' }
            };
            const res = makeRes();
            const updated = { _id: req.params.id, title: 'Updated' };

            Notification.findOneAndUpdate.mockResolvedValue(updated);
            await updateNotification(req, res);

            expect(res.json).toHaveBeenCalledWith(updated);
        });
    });
});
