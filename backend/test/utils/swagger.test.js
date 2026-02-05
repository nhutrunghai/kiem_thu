const fs = require('fs');
const { loadSwaggerSpec } = require('../../src/utils/swagger');

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn()
}));

describe('Tiện ích Swagger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('nên trả về null khi thiếu tệp swagger', () => {
        fs.existsSync.mockReturnValue(false);
        expect(loadSwaggerSpec()).toBeNull();
    });

    it('nên tải swagger spec khi tệp tồn tại', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('openapi: 3.0.0\ninfo:\n  title: Test\n  version: 1.0.0');

        const spec = loadSwaggerSpec();
        expect(spec).toBeTruthy();
        expect(spec.openapi).toBe('3.0.0');
    });

    it('nên trả về null khi đọc hoặc phân tích tệp lỗi', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation(() => {
            throw new Error('read error');
        });

        const spec = loadSwaggerSpec();
        expect(spec).toBeNull();
    });
});
