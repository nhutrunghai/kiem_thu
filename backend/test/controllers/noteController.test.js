const { listNotes, getNoteByEvent, upsertNote, disableReminder, deleteNote } = require('../../src/controllers/noteController');
const Note = require('../../src/models/Note');
const Event = require('../../src/models/Event');
const { upsertNotification, cancelNotification } = require('../../src/services/notificationService');

jest.mock('../../src/models/Note', () => {
    const model = jest.fn();
    model.find = jest.fn();
    model.findOne = jest.fn();
    model.findOneAndUpdate = jest.fn();
    model.findOneAndDelete = jest.fn();
    return model;
});

jest.mock('../../src/models/Event', () => {
    const model = jest.fn();
    model.findOne = jest.fn();
    return model;
});

jest.mock('../../src/services/notificationService', () => ({
    upsertNotification: jest.fn(),
    cancelNotification: jest.fn()
}));

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
});

describe('Bộ điều khiển Ghi chú', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Liệt kê ghi chú nên trả về notes cho người dùng', async () => {
        const req = { userId: 'user1' };
        const res = makeRes();
        const notes = [{ _id: 'n1' }];

        Note.find.mockResolvedValue(notes);
        await listNotes(req, res);

        expect(Note.find).toHaveBeenCalledWith({ userId: 'user1' });
        expect(res.json).toHaveBeenCalledWith(notes);
    });

    describe('Lấy ghi chú theo sự kiện', () => {
        it('nên kiểm tra sự kiện id', async () => {
            const req = { userId: 'user1', params: { eventId: 'bad' } };
            const res = makeRes();

            await getNoteByEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid event id' });
        });

        it('nên trả về 404 khi ghi chú không tìm thấy', async () => {
            const req = { userId: 'user1', params: { eventId: '507f1f77bcf86cd799439011' } };
            const res = makeRes();
            Note.findOne.mockResolvedValue(null);

            await getNoteByEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Note not found' });
        });

        it('nên trả về ghi chú khi tìm thấy', async () => {
            const req = { userId: 'user1', params: { eventId: '507f1f77bcf86cd799439011' } };
            const res = makeRes();
            const note = { _id: 'n1' };
            Note.findOne.mockResolvedValue(note);

            await getNoteByEvent(req, res);

            expect(res.json).toHaveBeenCalledWith(note);
        });
    });

    describe('Tạo/Cập nhật ghi chú', () => {
        it('nên kiểm tra sự kiện id', async () => {
            const req = { userId: 'user1', body: { eventId: 'bad' } };
            const res = makeRes();

            await upsertNote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid event id' });
        });

        it('nên yêu cầu reminderAt khi nhắc nhở bật', async () => {
            const req = { userId: 'user1', body: { eventId: '507f1f77bcf86cd799439011', reminderEnabled: true } };
            const res = makeRes();

            await upsertNote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Reminder time is required' });
        });

        it('nên kiểm tra reminderAt không ở trong quá khứ', async () => {
            const past = new Date(Date.now() - 60 * 1000).toISOString();
            const req = {
                userId: 'user1',
                body: { eventId: '507f1f77bcf86cd799439011', reminderEnabled: true, reminderAt: past }
            };
            const res = makeRes();

            await upsertNote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Reminder time cannot be in the past' });
        });

        it('nên upsert ghi chú và lên lịch thông báo', async () => {
            const future = new Date(Date.now() + 60 * 60 * 1000);
            const req = {
                userId: 'user1',
                body: { eventId: '507f1f77bcf86cd799439011', content: '  Study math  ', reminderEnabled: true, reminderAt: future.toISOString() }
            };
            const res = makeRes();
            const note = { _id: 'n1', content: 'Study math', reminderAt: future };

            Note.findOneAndUpdate.mockResolvedValue(note);
            Event.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue({ title: 'Math' })
            });

            await upsertNote(req, res);

            expect(upsertNotification).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'user1',
                targetId: 'n1',
                targetType: 'NOTE',
                channel: 'EMAIL',
                sendAt: future,
                title: expect.stringContaining('Math'),
                remindBefore: 0,
                dueDate: future
            }));
            expect(res.json).toHaveBeenCalledWith(note);
        });

        it('nên hủy thông báo khi nhắc nhở tắt', async () => {
            const req = {
                userId: 'user1',
                body: { eventId: '507f1f77bcf86cd799439011', content: 'Note', reminderEnabled: false }
            };
            const res = makeRes();
            const note = { _id: 'n1' };

            Note.findOneAndUpdate.mockResolvedValue(note);

            await upsertNote(req, res);

            expect(cancelNotification).toHaveBeenCalledWith({ userId: 'user1', targetId: 'n1', channel: 'EMAIL' });
        });
    });

    describe('Tắt nhắc nhở', () => {
        it('nên kiểm tra ghi chú id', async () => {
            const req = { userId: 'user1', params: { id: 'bad' } };
            const res = makeRes();

            await disableReminder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid note id' });
        });

        it('nên trả về 404 khi ghi chú không tìm thấy', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' } };
            const res = makeRes();

            Note.findOneAndUpdate.mockResolvedValue(null);
            await disableReminder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Note not found' });
        });

        it('nên tắt nhắc nhở và hủy thông báo', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' } };
            const res = makeRes();

            Note.findOneAndUpdate.mockResolvedValue({ _id: req.params.id });
            await disableReminder(req, res);

            expect(cancelNotification).toHaveBeenCalledWith({ userId: 'user1', targetId: req.params.id, channel: 'EMAIL' });
        });
    });

    describe('Xóa ghi chú', () => {
        it('nên kiểm tra ghi chú id', async () => {
            const req = { userId: 'user1', params: { id: 'bad' } };
            const res = makeRes();

            await deleteNote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid note id' });
        });

        it('nên trả về 404 khi ghi chú không tìm thấy', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' } };
            const res = makeRes();

            Note.findOneAndDelete.mockResolvedValue(null);
            await deleteNote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Note not found' });
        });

        it('nên xóa ghi chú và hủy thông báo', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' } };
            const res = makeRes();

            Note.findOneAndDelete.mockResolvedValue({ _id: req.params.id });
            await deleteNote(req, res);

            expect(cancelNotification).toHaveBeenCalledWith({ userId: 'user1', targetId: req.params.id, channel: 'EMAIL' });
            expect(res.json).toHaveBeenCalledWith({ message: 'Note deleted' });
        });
    });
});
