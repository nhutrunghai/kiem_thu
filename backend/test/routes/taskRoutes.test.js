const request = require('supertest');
const express = require('express');
const taskRoutes = require('../../src/routes/taskRoutes');
const { listTasks, createTask, updateTask, deleteTask } = require('../../src/controllers/taskController');
const auth = require('../../src/middleware/auth');

jest.mock('../../src/controllers/taskController');
jest.mock('../../src/middleware/auth');

describe('Tuyến Công việc', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(taskRoutes);

        jest.clearAllMocks();
        auth.mockImplementation((req, res, next) => {
            req.userId = 'user1';
            next();
        });
    });

    it('GET /api/tasks nên gọi Liệt kê công việc', async () => {
        listTasks.mockImplementation((req, res) => res.json([]));

        const response = await request(app).get('/api/tasks');

        expect(listTasks).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('POST /api/tasks nên gọi Tạo công việc', async () => {
        createTask.mockImplementation((req, res) => res.json({}));

        const response = await request(app)
            .post('/api/tasks')
            .send({ title: 'Test', dueDate: '2026-02-01' });

        expect(createTask).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('PUT /api/tasks/:id nên gọi Cập nhật công việc', async () => {
        updateTask.mockImplementation((req, res) => res.json({}));

        const response = await request(app)
            .put('/api/tasks/507f1f77bcf86cd799439011')
            .send({ title: 'Updated' });

        expect(updateTask).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });

    it('DELETE /api/tasks/:id nên gọi Xóa công việc', async () => {
        deleteTask.mockImplementation((req, res) => res.json({ message: 'Task deleted' }));

        const response = await request(app)
            .delete('/api/tasks/507f1f77bcf86cd799439011');

        expect(deleteTask).toHaveBeenCalled();
        expect(response.status).toBe(200);
    });
});
