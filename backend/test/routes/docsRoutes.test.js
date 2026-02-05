const request = require('supertest');
const express = require('express');
const docsRoutes = require('../../src/routes/docsRoutes');
const { getRawDocs } = require('../../src/controllers/docsController');

jest.mock('../../src/controllers/docsController');

describe('Tuyến Tài liệu', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(docsRoutes);
        jest.clearAllMocks();
    });

    it('GET /api/docs nên gọi Lấy tài liệu', async () => {
        getRawDocs.mockImplementation((req, res) => res.json({ ok: true }));

        const response = await request(app).get('/api/docs');

        expect(getRawDocs).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });
});
