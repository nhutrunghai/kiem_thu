const request = require('supertest');
const express = require('express');
const noteRoutes = require('../../src/routes/noteRoutes');
const { listNotes, getNoteByEvent, upsertNote, disableReminder, deleteNote } = require('../../src/controllers/noteController');
const auth = require('../../src/middleware/auth');

jest.mock('../../src/controllers/noteController');
jest.mock('../../src/middleware/auth');

describe('Tuyến Ghi chú', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(noteRoutes);

        jest.clearAllMocks();
        auth.mockImplementation((req, res, next) => {
            req.userId = 'user1';
            next();
        });
    });

    it('GET /api/notes nên gọi Liệt kê ghi chú', async () => {
        listNotes.mockImplementation((req, res) => res.json([]));

        const response = await request(app).get('/api/notes');

        expect(listNotes).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('GET /api/notes/:eventId nên gọi Lấy ghi chú theo sự kiện', async () => {
        getNoteByEvent.mockImplementation((req, res) => res.json({}));

        const response = await request(app).get('/api/notes/507f1f77bcf86cd799439011');

        expect(getNoteByEvent).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('POST /api/notes nên gọi Tạo/Cập nhật ghi chú', async () => {
        upsertNote.mockImplementation((req, res) => res.json({}));

        const response = await request(app)
            .post('/api/notes')
            .send({ eventId: '507f1f77bcf86cd799439011' });

        expect(upsertNote).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('PUT /api/notes/:id/reminder nên gọi Tắt nhắc nhở', async () => {
        disableReminder.mockImplementation((req, res) => res.json({}));

        const response = await request(app)
            .put('/api/notes/507f1f77bcf86cd799439011/reminder');

        expect(disableReminder).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('DELETE /api/notes/:id nên gọi Xóa ghi chú', async () => {
        deleteNote.mockImplementation((req, res) => res.json({}));

        const response = await request(app)
            .delete('/api/notes/507f1f77bcf86cd799439011');

        expect(deleteNote).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });
});
