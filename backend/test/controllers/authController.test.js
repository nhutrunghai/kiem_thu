const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { register, login, forgotPassword, resetPassword, me } = require('../../src/controllers/authController');
const User = require('../../src/models/User');
const { mockUser, validRegistrationData, validLoginData } = require('../helpers/mockData');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
// Mocking mailer and crypto just in case they are used in imports or other functions
jest.mock('../../src/config/mailer', () => ({
    transporter: { sendMail: jest.fn() },
    isMailerReady: jest.fn().mockReturnValue(true)
}));
jest.mock('crypto', () => ({
    randomBytes: jest.fn().mockReturnValue({ toString: jest.fn().mockReturnValue('mocked-token') }),
    createHash: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mocked-hash')
    })
}));

describe('Bộ điều khiển Auth - Đăng ký', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('Đăng ký thành công', () => {
        it('nên đăng ký một người dùng mới thành công', async () => {
            req.body = { ...validRegistrationData };

            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashedPassword123');

            const savedUser = {
                _id: 'user123',
                email: validRegistrationData.email.toLowerCase(),
                fullName: validRegistrationData.fullName,
                avatar: validRegistrationData.avatar,
                notificationChannels: ['EMAIL'],
                save: jest.fn().mockResolvedValue(true)
            };

            User.mockImplementation(() => savedUser);
            jwt.sign.mockReturnValue('mock-jwt-token');

            await register(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: validRegistrationData.email.toLowerCase() });
            expect(bcrypt.hash).toHaveBeenCalledWith(validRegistrationData.password, 10);
            expect(savedUser.save).toHaveBeenCalled();
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: savedUser._id },
                expect.any(String),
                { expiresIn: '7d' }
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-jwt-token',
                user: {
                    id: savedUser._id,
                    email: savedUser.email,
                    fullName: savedUser.fullName,
                    avatar: savedUser.avatar,
                    notificationChannels: savedUser.notificationChannels
                }
            });
        });

        it('nên chuẩn hóa email thành chữ thường', async () => {
            req.body = {
                email: 'TEST@EXAMPLE.COM',
                password: 'SecurePass123',
                fullName: 'Test User'
            };

            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashedPassword');

            const savedUser = {
                _id: 'user123',
                email: 'test@example.com',
                fullName: 'Test User',
                notificationChannels: ['EMAIL'],
                save: jest.fn().mockResolvedValue(true)
            };

            User.mockImplementation(() => savedUser);
            jwt.sign.mockReturnValue('token');

            await register(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        });

        it('nên cắt khoảng trắng fullName', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'SecurePass123',
                fullName: '  Test User  '
            };

            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashedPassword');

            const savedUser = {
                _id: 'user123',
                email: 'test@example.com',
                fullName: 'Test User',
                notificationChannels: ['EMAIL'],
                save: jest.fn().mockResolvedValue(true)
            };

            User.mockImplementation((data) => {
                expect(data.fullName).toBe('Test User');
                return savedUser;
            });
            jwt.sign.mockReturnValue('token');

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('Lỗi kiểm tra dữ liệu', () => {
        it('nên trả về 400 nếu email không hợp lệ', async () => {
            req.body = {
                email: 'invalid-email',
                password: 'SecurePass123',
                fullName: 'Test User'
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email' });
        });

        it('nên trả về 400 nếu mật khẩu quá ngắn', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'short',
                fullName: 'Test User'
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Password must be at least 8 characters'
            });
        });

        it('nên trả về 400 nếu thiếu fullName', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'SecurePass123'
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Full name is required' });
        });
    });

    describe('Người dùng đã tồn tại', () => {
        it('nên trả về 400 nếu người dùng đã tồn tại', async () => {
            req.body = { ...validRegistrationData };

            User.findOne.mockResolvedValue(mockUser);

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
        });
    });

    describe('Lỗi máy chủ', () => {
        it('nên trả về 500 khi cơ sở dữ liệu lỗi', async () => {
            req.body = { ...validRegistrationData };

            User.findOne.mockRejectedValue(new Error('Database error'));

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
        });
    });
});

describe('Bộ điều khiển Auth - Đăng nhập', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('Đăng nhập thành công', () => {
        it('nên đăng nhập người dùng với thông tin hợp lệ', async () => {
            req.body = { ...validLoginData };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-jwt-token');

            await login(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: validLoginData.email.toLowerCase() });
            expect(bcrypt.compare).toHaveBeenCalledWith(validLoginData.password, mockUser.password);
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-jwt-token',
                user: {
                    id: mockUser._id,
                    email: mockUser.email,
                    fullName: mockUser.fullName,
                    avatar: mockUser.avatar,
                    notificationChannels: mockUser.notificationChannels
                }
            });
        });
    });

    describe('Xác thực thất bại', () => {
        it('nên trả về 400 nếu thiếu trường bắt buộc', async () => {
            req.body = {
                email: validLoginData.email
            };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
        });

        it('nên trả về 400 nếu email không hợp lệ', async () => {
            req.body = {
                email: 'invalid-email',
                password: validLoginData.password
            };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email' });
        });

        it('nên trả về 401 nếu người dùng không tồn tại', async () => {
            req.body = {
                email: 'missing@example.com',
                password: validLoginData.password
            };

            User.findOne.mockResolvedValue(null);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        it('nên trả về 401 nếu mật khẩu không chính xác', async () => {
            req.body = { ...validLoginData };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });
    });
});

describe('Bộ điều khiển Auth - Thông tin cá nhân', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: null
        };
        res = {
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('nên trả về thông tin người dùng hiện tại', async () => {
        req.user = mockUser;

        await me(req, res);

        expect(res.json).toHaveBeenCalledWith({
            id: mockUser._id,
            email: mockUser.email,
            fullName: mockUser.fullName,
            avatar: mockUser.avatar,
            notificationChannels: mockUser.notificationChannels
        });
    });
});

describe('Bộ điều khiển Auth - Quên mật khẩu', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
        crypto.randomBytes.mockReturnValue({ toString: jest.fn().mockReturnValue('mocked-token') });
        crypto.createHash.mockReturnValue({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('mocked-hash')
        });
    });

    it('nên trả về thông báo chung cho email không hợp lệ', async () => {
        req.body = { email: 'invalid-email' };

        await forgotPassword(req, res);

        expect(res.json).toHaveBeenCalledWith({
            message: 'If the email exists, you will receive a reset link shortly.'
        });
        expect(User.findOne).not.toHaveBeenCalled();
    });

    it('nên trả về thông báo chung khi người dùng không tìm thấy', async () => {
        req.body = { email: 'missing@example.com' };
        User.findOne.mockResolvedValue(null);

        await forgotPassword(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'missing@example.com' });
        expect(res.json).toHaveBeenCalledWith({
            message: 'If the email exists, you will receive a reset link shortly.'
        });
    });

    it('nên thiết lập reset token khi người dùng tồn tại', async () => {
        req.body = { email: 'test@example.com' };
        const user = {
            _id: 'user123',
            email: 'test@example.com',
            fullName: 'Test User',
            save: jest.fn().mockResolvedValue(true)
        };
        User.findOne.mockResolvedValue(user);

        await forgotPassword(req, res);

        expect(user.resetTokenHash).toBe('mocked-hash');
        expect(user.resetTokenExpiresAt).toBeInstanceOf(Date);
        expect(user.resetRequestedAt).toBeInstanceOf(Date);
        expect(user.resetUsedAt).toBeNull();
        expect(user.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            message: 'If the email exists, you will receive a reset link shortly.'
        });
    });
});

describe('Bộ điều khiển Auth - Đặt lại mật khẩu', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
        crypto.createHash.mockReturnValue({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('mocked-hash')
        });
    });

    it('nên trả về 400 khi thiếu token', async () => {
        req.body = { password: 'NewPass123' };

        await resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired reset token' });
    });

    it('nên trả về 400 cho mật khẩu quá ngắn', async () => {
        req.body = { token: 'token', password: 'short' };

        await resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 8 characters' });
    });

    it('nên trả về 400 khi không tìm thấy token', async () => {
        req.body = { token: 'token', password: 'NewPass123' };
        User.findOne.mockResolvedValue(null);

        await resetPassword(req, res);

        expect(User.findOne).toHaveBeenCalledWith({
            resetTokenHash: 'mocked-hash',
            resetTokenExpiresAt: { $gt: expect.any(Date) }
        });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired reset token' });
    });

    it('nên đặt lại mật khẩu thành công', async () => {
        req.body = { token: 'token', password: 'NewPass123' };
        const user = {
            _id: 'user123',
            password: 'old',
            resetTokenHash: 'mocked-hash',
            resetTokenExpiresAt: new Date(Date.now() + 1000),
            resetRequestedAt: new Date(),
            resetUsedAt: null,
            save: jest.fn().mockResolvedValue(true)
        };
        User.findOne.mockResolvedValue(user);
        bcrypt.hash.mockResolvedValue('hashed-new-password');

        await resetPassword(req, res);

        expect(user.password).toBe('hashed-new-password');
        expect(user.resetTokenHash).toBeNull();
        expect(user.resetTokenExpiresAt).toBeNull();
        expect(user.resetRequestedAt).toBeNull();
        expect(user.resetUsedAt).toBeInstanceOf(Date);
        expect(user.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successful' });
    });
});
