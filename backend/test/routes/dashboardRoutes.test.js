const request = require('supertest');
const express = require('express');
const dashboardRoutes = require('../../src/routes/dashboardRoutes');
const { getStats } = require('../../src/controllers/dashboardController');
const auth = require('../../src/middleware/auth');

jest.mock('../../src/controllers/dashboardController');
jest.mock('../../src/middleware/auth');

describe('Tuyến Bảng điều khiển', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(dashboardRoutes);

        jest.clearAllMocks();
        auth.mockImplementation((req, res, next) => {
            req.userId = 'user1';
            next();
        });
    });

    it('GET /api/dashboard/stats nên gọi Lấy thống kê', async () => {
        getStats.mockImplementation((req, res) => res.json({}));

        const response = await request(app).get('/api/dashboard/stats');

        expect(getStats).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });
});
