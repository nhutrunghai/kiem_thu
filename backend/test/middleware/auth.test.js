const jwt = require('jsonwebtoken');
const auth = require('../../src/middleware/auth');
const User = require('../../src/models/User');
const { mockUser } = require('../helpers/mockData');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');

describe('Middleware xác thực', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            header: jest.fn()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('Xác thực thành công', () => {
        it('nên xác thực người dùng với token hợp lệ', async () => {
            const token = 'valid-jwt-token';
            req.header.mockReturnValue(`Bearer ${token}`);

            jwt.verify.mockReturnValue({ userId: mockUser._id });
            User.findById.mockResolvedValue(mockUser);

            await auth(req, res, next);

            expect(req.header).toHaveBeenCalledWith('Authorization');
            expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
            expect(User.findById).toHaveBeenCalledWith(mockUser._id);
            expect(req.userId).toBe(mockUser._id);
            expect(req.user).toBe(mockUser);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('nên xử lý token không có tiền tố Bearer', async () => {
            const token = 'valid-jwt-token';
            req.header.mockReturnValue(token);

            jwt.verify.mockReturnValue({ userId: mockUser._id });
            User.findById.mockResolvedValue(mockUser);

            await auth(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
            expect(next).toHaveBeenCalled();
        });
    });

    describe('Thiếu token', () => {
        it('nên trả về 401 nếu không cung cấp token', async () => {
            req.header.mockReturnValue(undefined);

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'No token, authorization denied'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('nên trả về 401 nếu tiêu đề Authorization trống', async () => {
            req.header.mockReturnValue('');

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'No token, authorization denied'
            });
        });

        it('nên trả về 401 nếu tiêu đề Authorization chỉ có "Bearer "', async () => {
            req.header.mockReturnValue('Bearer ');

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'No token, authorization denied'
            });
        });
    });

    describe('Token không hợp lệ', () => {
        it('nên trả về 401 nếu token không hợp lệ', async () => {
            req.header.mockReturnValue('Bearer invalid-token');

            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token is not valid'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('nên trả về 401 nếu token hết hạn', async () => {
            req.header.mockReturnValue('Bearer expired-token');

            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';
            jwt.verify.mockImplementation(() => {
                throw error;
            });

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token is not valid'
            });
        });

        it('nên trả về 401 nếu token sai định dạng', async () => {
            req.header.mockReturnValue('Bearer malformed.token');

            const error = new Error('Malformed token');
            error.name = 'JsonWebTokenError';
            jwt.verify.mockImplementation(() => {
                throw error;
            });

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token is not valid'
            });
        });
    });

    describe('Không tìm thấy người dùng', () => {
        it('nên trả về 401 nếu người dùng không tồn tại', async () => {
            req.header.mockReturnValue('Bearer valid-token');

            jwt.verify.mockReturnValue({ userId: 'nonexistent-user-id' });
            User.findById.mockResolvedValue(null);

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User not found'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('nên trả về 401 nếu người dùng bị xóa sau khi cấp token', async () => {
            req.header.mockReturnValue('Bearer valid-token');

            jwt.verify.mockReturnValue({ userId: mockUser._id });
            User.findById.mockResolvedValue(null);

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User not found'
            });
        });
    });

    describe('Lỗi cơ sở dữ liệu', () => {
        it('nên trả về 401 khi cơ sở dữ liệu lỗi', async () => {
            req.header.mockReturnValue('Bearer valid-token');

            jwt.verify.mockReturnValue({ userId: mockUser._id });
            User.findById.mockRejectedValue(new Error('Database error'));

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token is not valid'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Thay đổi đối tượng request', () => {
        it('nên thiết lập req.userId và req.user khi xác thực thành công', async () => {
            const token = 'valid-jwt-token';
            req.header.mockReturnValue(`Bearer ${token}`);

            jwt.verify.mockReturnValue({ userId: mockUser._id });
            User.findById.mockResolvedValue(mockUser);

            await auth(req, res, next);

            expect(req.userId).toBe(mockUser._id);
            expect(req.user).toEqual(mockUser);
        });

        it('không được thay đổi đối tượng req khi xác thực thất bại', async () => {
            req.header.mockReturnValue('Bearer invalid-token');

            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await auth(req, res, next);

            expect(req.userId).toBeUndefined();
            expect(req.user).toBeUndefined();
        });
    });
});
