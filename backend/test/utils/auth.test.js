const crypto = require('crypto');
const { MIN_PASSWORD_LENGTH, trimTrailingSlash, buildResetUrl, hashToken } = require('../../src/utils/auth');

describe('Tiện ích Auth - MIN_PASSWORD_LENGTH', () => {
    it('nên được định nghĩa là 8', () => {
        expect(MIN_PASSWORD_LENGTH).toBe(8);
    });
});

describe('Tiện ích Auth - trimTrailingSlash', () => {
    it('nên loại bỏ dấu gạch chéo cuối cùng', () => {
        expect(trimTrailingSlash('http://localhost:3000/')).toBe('http://localhost:3000');
        expect(trimTrailingSlash('http://localhost:3000///')).toBe('http://localhost:3000');
    });

    it('nên giữ nguyên nếu không có dấu gạch chéo cuối cùng', () => {
        expect(trimTrailingSlash('http://localhost:3000')).toBe('http://localhost:3000');
    });
});

describe('Tiện ích Auth - buildResetUrl', () => {
    it('nên tạo URL reset với token được mã hóa', () => {
        const url = buildResetUrl('token with space');
        expect(url).toContain('/reset?token=');
        expect(url).toContain('token%20with%20space');
    });
});

describe('Tiện ích Auth - hashToken', () => {
    it('nên băm token sử dụng sha256', () => {
        const value = 'abc123';
        const expected = crypto.createHash('sha256').update(value).digest('hex');
        expect(hashToken(value)).toBe(expected);
    });
});
