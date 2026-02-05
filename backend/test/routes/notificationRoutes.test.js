const request = require('supertest');
const express = require('express');
const notificationRoutes = require('../../src/routes/notificationRoutes');
const { listNotifications, updateNotification } = require('../../src/controllers/notificationController');
const auth = require('../../src/middleware/auth');

jest.mock('../../src/controllers/notificationController');
jest.mock('../../src/middleware/auth');

describe('Tuyến Thông báo', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(notificationRoutes);

        jest.clearAllMocks();
        auth.mockImplementation((req, res, next) => {
            req.userId = 'user1';
            next();
        });
    });

    it('GET /api/notifications nên gọi Liệt kê thông báo', async () => {
        listNotifications.mockImplementation((req, res) => res.json([]));

        const response = await request(app).get('/api/notifications');

        expect(listNotifications).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('PUT /api/notifications/:id nên gọi Cập nhật thông báo', async () => {
        updateNotification.mockImplementation((req, res) => res.json({}));

        const response = await request(app)
            .put('/api/notifications/507f1f77bcf86cd799439011')
            .send({ title: 'Updated' });

        expect(updateNotification).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });
});
