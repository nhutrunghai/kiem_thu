const { hasEmailChannel } = require('../../src/utils/notification');

describe('Tiện ích thông báo', () => {
    it('nên mặc định là true khi thiếu người dùng hoặc channels undefined', () => {
        expect(hasEmailChannel(null)).toBe(true);
        expect(hasEmailChannel({})).toBe(true);
    });

    it('nên trả về true khi kênh email bật', () => {
        expect(hasEmailChannel({ notificationChannels: ['EMAIL'] })).toBe(true);
        expect(hasEmailChannel({ notificationChannels: ['EMAIL', 'PUSH'] })).toBe(true);
    });

    it('nên trả về false khi kênh email tắt', () => {
        expect(hasEmailChannel({ notificationChannels: ['PUSH'] })).toBe(false);
    });
});
