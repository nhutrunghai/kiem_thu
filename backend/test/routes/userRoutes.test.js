const request = require('supertest');
const express = require('express');
const userRoutes = require('../../src/routes/userRoutes');
const { getProfile, updateProfile } = require('../../src/controllers/userController');
const auth = require('../../src/middleware/auth');

jest.mock('../../src/controllers/userController');
jest.mock('../../src/middleware/auth');

describe('Tuyến Người dùng', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(userRoutes);

        jest.clearAllMocks();
        auth.mockImplementation((req, res, next) => {
            req.userId = 'user1';
            next();
        });
    });

    it('GET /api/user/profile nên gọi Lấy hồ sơ', async () => {
        getProfile.mockImplementation((req, res) => res.json({}));

        const response = await request(app).get('/api/user/profile');

        expect(getProfile).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('PUT /api/user/profile nên gọi Cập nhật hồ sơ', async () => {
        updateProfile.mockImplementation((req, res) => res.json({}));

        const response = await request(app)
            .put('/api/user/profile')
            .send({ fullName: 'New Name' });

        expect(updateProfile).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });
});
