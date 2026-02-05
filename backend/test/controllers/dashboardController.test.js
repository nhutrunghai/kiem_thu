const { getStats } = require('../../src/controllers/dashboardController');
const Event = require('../../src/models/Event');
const Task = require('../../src/models/Task');

jest.mock('../../src/models/Event', () => ({
    find: jest.fn()
}));

jest.mock('../../src/models/Task', () => ({
    find: jest.fn()
}));

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
});

describe('Bộ điều khiển Bảng điều khiển', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('nên trả về dashboard stats', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-02-05T10:00:00.000Z'));
        const req = { userId: 'user1' };
        const res = makeRes();

        const events = [
            { dayOfWeek: 4, startTime: '09:00', endTime: '11:00' },
            { dayOfWeek: 4, startTime: '13:30', endTime: '15:00' },
            { dayOfWeek: 1, startTime: '10:00', endTime: '10:30' }
        ];
        const tasks = [
            { status: 'COMPLETED' },
            { status: 'TODO' },
            { status: 'IN_PROGRESS' }
        ];

        Event.find.mockReturnValue({
            select: jest.fn().mockResolvedValue(events)
        });
        Task.find.mockReturnValue({
            select: jest.fn().mockResolvedValue(tasks)
        });

        await getStats(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            classesToday: 2,
            completedTasks: 1,
            activeTasks: 2
        }));

        const payload = res.json.mock.calls[0][0];
        const day4 = payload.studyHoursData.find(item => item.day === 4);
        const day1 = payload.studyHoursData.find(item => item.day === 1);

        expect(day4.hours).toBe(3.5);
        expect(day1.hours).toBe(0.5);

        jest.useRealTimers();
    });

    it('nên trả về 500 khi có lỗi', async () => {
        const req = { userId: 'user1' };
        const res = makeRes();

        Event.find.mockImplementation(() => {
            throw new Error('db error');
        });

        await getStats(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching dashboard stats' });
    });
});
