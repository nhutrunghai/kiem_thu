const { listEvents, createEvent, updateEvent, deleteEvent } = require('../../src/controllers/eventController');
const Event = require('../../src/models/Event');

jest.mock('../../src/models/Event', () => {
    const model = jest.fn();
    model.find = jest.fn();
    model.findOneAndUpdate = jest.fn();
    model.findOneAndDelete = jest.fn();
    return model;
});

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
});

describe('Bộ điều khiển Sự kiện', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Liệt kê sự kiện nên trả về events cho người dùng', async () => {
        const req = { userId: 'user1' };
        const res = makeRes();
        const events = [{ _id: 'e1' }, { _id: 'e2' }];
        Event.find.mockResolvedValue(events);

        await listEvents(req, res);

        expect(Event.find).toHaveBeenCalledWith({ userId: 'user1' });
        expect(res.json).toHaveBeenCalledWith(events);
    });

    describe('Tạo sự kiện', () => {
        it('nên trả về 400 cho thiếu các trường bắt buộc', async () => {
            const req = { userId: 'user1', body: { title: 'Test' } };
            const res = makeRes();

            await createEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
        });

        it('nên trả về 400 cho không hợp lệ sự kiện type', async () => {
            const req = {
                userId: 'user1',
                body: { title: 'Test', startDate: '2026-02-01', startTime: '09:00', endTime: '10:00', type: 'BAD' }
            };
            const res = makeRes();

            await createEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid event type' });
        });

        it('nên trả về 400 cho không hợp lệ startDate', async () => {
            const req = {
                userId: 'user1',
                body: { title: 'Test', startDate: 'bad-date', startTime: '09:00', endTime: '10:00' }
            };
            const res = makeRes();

            await createEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid startDate' });
        });

        it('nên trả về 400 cho không hợp lệ time range', async () => {
            const req = {
                userId: 'user1',
                body: { title: 'Test', startDate: '2026-02-01', startTime: '10:00', endTime: '09:00' }
            };
            const res = makeRes();

            await createEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid time range' });
        });

        it('nên trả về 409 khi time slot bị trùng', async () => {
            const req = {
                userId: 'user1',
                body: { title: 'Test', startDate: '2026-02-01', startTime: '09:00', endTime: '10:00' }
            };
            const res = makeRes();
            Event.find.mockResolvedValue([
                { startTime: '09:30', endTime: '10:30' }
            ]);

            await createEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: 'Time slot already booked' });
        });

        it('nên tạo sự kiện thành công', async () => {
            const req = {
                userId: 'user1',
                body: { title: '  Math  ', startDate: '2026-02-01', startTime: '09:00', endTime: '10:00', type: 'REGULAR' }
            };
            const res = makeRes();
            const computedDay = new Date('2026-02-01').getDay();

            Event.find.mockResolvedValue([]);
            const savedEvent = {
                _id: 'e1',
                title: 'Math',
                startDate: '2026-02-01',
                startTime: '09:00',
                endTime: '10:00',
                type: 'REGULAR',
                userId: 'user1',
                dayOfWeek: computedDay,
                save: jest.fn().mockResolvedValue(true)
            };

            Event.mockImplementation((data) => {
                expect(data.title).toBe('Math');
                expect(data.userId).toBe('user1');
                expect(data.dayOfWeek).toBe(computedDay);
                return savedEvent;
            });

            await createEvent(req, res);

            expect(savedEvent.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(savedEvent);
        });
    });

    describe('Cập nhật sự kiện', () => {
        it('nên trả về 400 cho không hợp lệ sự kiện id', async () => {
            const req = { userId: 'user1', params: { id: 'bad' }, body: {} };
            const res = makeRes();

            await updateEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid event id' });
        });

        it('nên trả về 400 cho thiếu các trường bắt buộc', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' }, body: { title: '' } };
            const res = makeRes();

            await updateEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
        });

        it('nên trả về 409 cho overlapping time slot', async () => {
            const req = {
                userId: 'user1',
                params: { id: '507f1f77bcf86cd799439011' },
                body: { title: 'Test', startDate: '2026-02-01', startTime: '09:00', endTime: '10:00' }
            };
            const res = makeRes();
            Event.find.mockResolvedValue([{ startTime: '09:30', endTime: '10:30' }]);

            await updateEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: 'Time slot already booked' });
        });

        it('nên trả về 404 khi sự kiện không tìm thấy', async () => {
            const req = {
                userId: 'user1',
                params: { id: '507f1f77bcf86cd799439011' },
                body: { title: 'Test', startDate: '2026-02-01', startTime: '09:00', endTime: '10:00' }
            };
            const res = makeRes();
            Event.find.mockResolvedValue([]);
            Event.findOneAndUpdate.mockResolvedValue(null);

            await updateEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Event not found' });
        });

        it('nên cập nhật sự kiện thành công', async () => {
            const req = {
                userId: 'user1',
                params: { id: '507f1f77bcf86cd799439011' },
                body: { title: '  Updated  ', startDate: '2026-02-02', startTime: '09:00', endTime: '10:00' }
            };
            const res = makeRes();
            const computedDay = new Date('2026-02-02').getDay();

            Event.find.mockResolvedValue([]);
            const updated = { _id: req.params.id, title: 'Updated' };
            Event.findOneAndUpdate.mockResolvedValue(updated);

            await updateEvent(req, res);

            expect(Event.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: req.params.id, userId: 'user1' },
                expect.objectContaining({ title: 'Updated', dayOfWeek: computedDay }),
                { new: true }
            );
            expect(res.json).toHaveBeenCalledWith(updated);
        });
    });

    describe('Xóa sự kiện', () => {
        it('nên trả về 400 cho không hợp lệ sự kiện id', async () => {
            const req = { userId: 'user1', params: { id: 'bad' } };
            const res = makeRes();

            await deleteEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid event id' });
        });

        it('nên trả về 404 khi sự kiện không tìm thấy', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' } };
            const res = makeRes();

            Event.findOneAndDelete.mockResolvedValue(null);
            await deleteEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Event not found' });
        });

        it('nên xóa sự kiện thành công', async () => {
            const req = { userId: 'user1', params: { id: '507f1f77bcf86cd799439011' } };
            const res = makeRes();

            Event.findOneAndDelete.mockResolvedValue({ _id: req.params.id });
            await deleteEvent(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Event deleted' });
        });
    });
});
