// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/uniflow-test';
process.env.APP_BASE_URL = 'http://localhost:3000';
process.env.RESET_TOKEN_TTL_MINUTES = '15';
process.env.EMAIL_FROM = 'test@uniflow.com';

// Suppress console logs during tests (optional)
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
};

// Mock mailer globally to avoid network calls or async verifier logs
jest.mock('../src/config/mailer', () => require('./__mocks__/mailer'));
