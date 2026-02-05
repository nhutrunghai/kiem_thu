const request = require('supertest');
const express = require('express');
const eventRoutes = require('../../src/routes/eventRoutes');
const { listEvents, createEvent, updateEvent, deleteEvent } = require('../../src/controllers/eventController');
const auth = require('../../src/middleware/auth');

jest.mock('../../src/controllers/eventController');
jest.mock('../../src/middleware/auth');

describe('Tuyến Sự kiện', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(eventRoutes);

        jest.clearAllMocks();
        auth.mockImplementation((req, res, next) => {
            req.userId = 'user1';
            next();
        });
    });

    it('GET /api/events nên gọi Liệt kê sự kiện', async () => {
        listEvents.mockImplementation((req, res) => res.json([]));

        const response = await request(app).get('/api/events');

        expect(listEvents).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('POST /api/events nên gọi Tạo sự kiện', async () => {
        createEvent.mockImplementation((req, res) => res.status(201).json({}));

        const response = await request(app)
            .post('/api/events')
            .send({ title: 'Test', startDate: '2026-02-01', startTime: '09:00', endTime: '10:00' });

        expect(createEvent).toHaveBeenCalled();
        expect(response.status).toBe(201);
    });

    it('PUT /api/events/:id nên gọi Cập nhật sự kiện', async () => {
        updateEvent.mockImplementation((req, res) => res.json({}));

        const response = await request(app)
            .put('/api/events/507f1f77bcf86cd799439011')
            .send({ title: 'Test', startDate: '2026-02-01', startTime: '09:00', endTime: '10:00' });

        expect(updateEvent).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('DELETE /api/events/:id nên gọi Xóa sự kiện', async () => {
        deleteEvent.mockImplementation((req, res) => res.json({ message: 'Event deleted' }));

        const response = await request(app)
            .delete('/api/events/507f1f77bcf86cd799439011');

        expect(deleteEvent).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });
});
