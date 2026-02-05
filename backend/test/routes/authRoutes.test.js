const request = require('supertest');
const express = require('express');
const authRoutes = require('../../src/routes/authRoutes');
const { register, login, me } = require('../../src/controllers/authController');
const auth = require('../../src/middleware/auth');

// Mock the controllers and middleware
jest.mock('../../src/controllers/authController');
jest.mock('../../src/middleware/auth');

describe('Kiểm thử tích hợp tuyến Auth', () => {
    let app;

    beforeEach(() => {
        // Create a fresh Express app for each test
        app = express();
        app.use(express.json());
        app.use(authRoutes);

        // Clear all mocks
        jest.clearAllMocks();

        // Mock auth middleware to call next()
        auth.mockImplementation((req, res, next) => {
            req.user = { _id: 'user123', email: 'test@example.com' };
            next();
        });
    });

    describe('POST /api/auth/register', () => {
        it('nên gọi bộ điều khiển đăng ký', async () => {
            register.mockImplementation((req, res) => {
                res.status(201).json({ message: 'User registered' });
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    fullName: 'Test User'
                });

            expect(register).toHaveBeenCalled();
            expect(response.status).toBe(201);
        });

        it('nên chấp nhận body JSON', async () => {
            register.mockImplementation((req, res) => {
                expect(req.body.email).toBe('test@example.com');
                res.status(201).json({ success: true });
            });

            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    fullName: 'Test User'
                });

            expect(register).toHaveBeenCalled();
        });
    });

    describe('POST /api/auth/login', () => {
        it('nên gọi bộ điều khiển đăng nhập', async () => {
            login.mockImplementation((req, res) => {
                res.status(200).json({ token: 'jwt-token' });
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(login).toHaveBeenCalled();
            expect(response.status).toBe(200);
        });

        it('nên truyền thông tin đăng nhập cho bộ điều khiển', async () => {
            login.mockImplementation((req, res) => {
                expect(req.body.email).toBe('test@example.com');
                expect(req.body.password).toBe('password123');
                res.json({ success: true });
            });

            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(login).toHaveBeenCalled();
        });
    });


    describe('GET /api/auth/me', () => {
        it('nên gọi bộ điều khiển me với middleware auth', async () => {
            me.mockImplementation((req, res) => {
                res.status(200).json({ user: req.user });
            });

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer valid-token');

            expect(auth).toHaveBeenCalled();
            expect(me).toHaveBeenCalled();
            expect(response.status).toBe(200);
        });

        it('nên yêu cầu xác thực', async () => {
            // Mock auth to deny access
            auth.mockImplementation((req, res) => {
                res.status(401).json({ message: 'Unauthorized' });
            });

            me.mockImplementation((req, res) => {
                res.json({ user: req.user });
            });

            const response = await request(app)
                .get('/api/auth/me');

            expect(auth).toHaveBeenCalled();
            expect(response.status).toBe(401);
        });

        it('nên truyền người dùng đã xác thực cho bộ điều khiển', async () => {
            const mockUser = { _id: 'user123', email: 'test@example.com' };

            auth.mockImplementation((req, res, next) => {
                req.user = mockUser;
                next();
            });

            me.mockImplementation((req, res) => {
                expect(req.user).toEqual(mockUser);
                res.json({ user: req.user });
            });

            await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer valid-token');

            expect(me).toHaveBeenCalled();
        });
    });

    describe('Tuyến không tồn tại', () => {
        it('nên trả về 404 cho tuyến không tồn tại', async () => {
            const response = await request(app)
                .get('/api/auth/nonexistent');

            expect(response.status).toBe(404);
        });

        it('nên trả về 404 cho sai phương thức HTTP', async () => {
            const response = await request(app)
                .get('/api/auth/register'); // Should be POST

            expect(response.status).toBe(404);
        });
    });

    describe('Xử lý Content-Type', () => {
        it('nên chấp nhận application/json', async () => {
            register.mockImplementation((req, res) => {
                res.status(201).json({ success: true });
            });

            const response = await request(app)
                .post('/api/auth/register')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123',
                    fullName: 'Test User'
                }));

            expect(response.status).toBe(201);
        });
    });
});
