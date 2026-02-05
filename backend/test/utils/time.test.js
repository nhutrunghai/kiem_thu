const { toMinutes, computeReminderAt, formatDateTime } = require('../../src/utils/time');

describe('Tiện ích thời gian', () => {
    it('toMinutes nên phân tích thời gian hợp lệ', () => {
        expect(toMinutes('09:30')).toBe(570);
        expect(toMinutes('00:00')).toBe(0);
    });

    it('toMinutes nên trả về null cho thời gian không hợp lệ', () => {
        expect(toMinutes('bad')).toBeNull();
        expect(toMinutes('10:aa')).toBeNull();
    });

    it('computeReminderAt nên trả về null cho đầu vào không hợp lệ', () => {
        expect(computeReminderAt(null, 10)).toBeNull();
        expect(computeReminderAt('bad', 10)).toBeNull();
        expect(computeReminderAt('2026-02-05T10:00:00.000Z', -1)).toBeNull();
    });

    it('computeReminderAt nên tính toán thời gian nhắc nhở', () => {
        const due = '2026-02-05T10:00:00.000Z';
        const reminderAt = computeReminderAt(due, 30);
        expect(reminderAt).toBeInstanceOf(Date);
        expect(reminderAt.toISOString()).toBe('2026-02-05T09:30:00.000Z');
    });

    it('formatDateTime nên trả về chuỗi trống cho ngày không hợp lệ', () => {
        expect(formatDateTime('bad')).toBe('');
    });

    it('formatDateTime nên trả về chuỗi đã định dạng cho ngày hợp lệ', () => {
        const value = formatDateTime('2026-02-05T10:00:00.000Z');
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
    });
});
