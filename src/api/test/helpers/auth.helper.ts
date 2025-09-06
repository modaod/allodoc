import { JwtService } from '@nestjs/jwt';
import { User } from '../../src/users/entities/user.entity';
import { RoleName } from '../../src/users/entities/role.entity';

/**
 * Helper functions for authentication testing
 */

/**
 * Create a mock JWT service
 */
export const createMockJwtService = (): jest.Mocked<JwtService> => {
    return {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
        signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
        verify: jest.fn().mockReturnValue({ sub: 'user-123', email: 'test@medical.com' }),
        verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-123', email: 'test@medical.com' }),
        decode: jest.fn().mockReturnValue({ sub: 'user-123', email: 'test@medical.com' }),
    } as unknown as jest.Mocked<JwtService>;
};

/**
 * Create mock token response
 */
export const createMockTokenResponse = () => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
});

/**
 * Create mock auth response
 */
export const createMockAuthResponse = (user?: Partial<User>) => ({
    user: {
        id: user?.id || 'user-123',
        email: user?.email || 'test@medical.com',
        firstName: user?.firstName || 'John',
        lastName: user?.lastName || 'Doe',
        roles: [RoleName.DOCTOR],
        organizationId: 'org-123',
        organizationName: 'Test Hospital',
    },
    tokens: createMockTokenResponse(),
});

/**
 * Create mock request with user
 */
export const createMockRequestWithUser = (user?: Partial<User>) => ({
    user: {
        id: user?.id || 'user-123',
        email: user?.email || 'test@medical.com',
        firstName: user?.firstName || 'John',
        lastName: user?.lastName || 'Doe',
        organizationId: 'org-123',
    },
    headers: {
        authorization: 'Bearer mock-jwt-token',
    },
    organization: {
        id: 'org-123',
        name: 'Test Hospital',
    },
});

/**
 * Mock bcrypt functions
 */
export const mockBcrypt = {
    hash: jest.fn().mockResolvedValue('$2a$10$mockedHashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
    hashSync: jest.fn().mockReturnValue('$2a$10$mockedHashedPassword'),
    compareSync: jest.fn().mockReturnValue(true),
};

/**
 * Create mock Redis client for session testing
 */
export const createMockRedisClient = () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),
    scan: jest.fn().mockResolvedValue(['0', []]),
    mget: jest.fn().mockResolvedValue([]),
    mset: jest.fn().mockResolvedValue('OK'),
    flushdb: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
});

/**
 * Create mock session data
 */
export const createMockSessionData = (userId: string = 'user-123') => ({
    userId,
    email: 'test@medical.com',
    organizationId: 'org-123',
    roles: [RoleName.DOCTOR],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
});

/**
 * Mock guards for testing
 */
export const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
};

export const mockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
};

export const mockOrganizationGuard = {
    canActivate: jest.fn().mockReturnValue(true),
};
