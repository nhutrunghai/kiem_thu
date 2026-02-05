const { getRawDocs } = require('../../src/controllers/docsController');
const fs = require('fs');

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn()
}));

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    send: jest.fn()
});

describe('Bộ điều khiển Tài liệu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('nên trả về 404 khi swagger spec thiếu', () => {
        const req = {};
        const res = makeRes();
        fs.existsSync.mockReturnValue(false);

        getRawDocs(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Swagger spec not found' });
    });

    it('nên trả về raw yaml khi swagger spec tồn tại', () => {
        const req = {};
        const res = makeRes();
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('openapi: 3.0.0');

        getRawDocs(req, res);

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/yaml');
        expect(res.send).toHaveBeenCalledWith('openapi: 3.0.0');
    });
});
