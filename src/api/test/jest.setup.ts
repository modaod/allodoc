// Jest Setup File
// This file runs before all tests

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_NAME = 'test_db';
process.env.DATABASE_USERNAME = 'test_user';
process.env.DATABASE_PASSWORD = 'test_password';

// Mock console methods to reduce noise in test output
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error for debugging failed tests
    error: console.error,
};

// Increase timeout for slow tests
jest.setTimeout(10000);

// Mock Date.now() for consistent timestamps in tests
const mockDate = new Date('2024-01-15T10:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

// Clear all mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});

// Restore all mocks after all tests
afterAll(() => {
    jest.restoreAllMocks();
});
