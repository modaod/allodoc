import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { RedisSessionService } from './services/redis-session.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuthorizationService } from '../common/services/authorization.service';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../users/entities/user-organization.entity';
import { RoleName } from '../users/entities/role.entity';
import * as bcrypt from 'bcryptjs';
import { 
    createMockUser, 
    createMockOrganization, 
    createMockUserWithOrganization,
    createMockRole
} from '../../test/helpers/test-data.helper';
import { createMockRepository } from '../../test/helpers/mock-repository.helper';
import { createMockTokenResponse, mockBcrypt } from '../../test/helpers/auth.helper';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

describe('AuthService', () => {
    let authService: AuthService;
    let usersService: UsersService;
    let tokenService: TokenService;
    let redisSessionService: RedisSessionService;
    let organizationsService: OrganizationsService;
    let authorizationService: AuthorizationService;
    let userRepository: any;
    let organizationRepository: any;
    let userOrganizationRepository: any;

    beforeEach(async () => {
        // Create mock repositories
        userRepository = createMockRepository<User>();
        organizationRepository = createMockRepository<Organization>();
        userOrganizationRepository = createMockRepository<UserOrganization>();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        create: jest.fn(),
                        findByEmail: jest.fn(),
                        findById: jest.fn(),
                        updateLastLogin: jest.fn(),
                        changePassword: jest.fn(),
                    },
                },
                {
                    provide: TokenService,
                    useValue: {
                        generateTokens: jest.fn(),
                        verifyToken: jest.fn(),
                        refreshAccessToken: jest.fn(),
                        revokeRefreshToken: jest.fn(),
                        revokeAllUserTokens: jest.fn(),
                        blacklistToken: jest.fn(),
                        blacklistUserTokens: jest.fn(),
                    },
                },
                {
                    provide: RedisSessionService,
                    useValue: {
                        createSession: jest.fn(),
                        getSession: jest.fn(),
                        invalidateSession: jest.fn(),
                        invalidateAllUserSessions: jest.fn(),
                        extendSession: jest.fn(),
                    },
                },
                {
                    provide: OrganizationsService,
                    useValue: {
                        findById: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: AuthorizationService,
                    useValue: {
                        checkPermission: jest.fn(),
                        getUserPermissions: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: userRepository,
                },
                {
                    provide: getRepositoryToken(Organization),
                    useValue: organizationRepository,
                },
                {
                    provide: getRepositoryToken(UserOrganization),
                    useValue: userOrganizationRepository,
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        tokenService = module.get<TokenService>(TokenService);
        redisSessionService = module.get<RedisSessionService>(RedisSessionService);
        organizationsService = module.get<OrganizationsService>(OrganizationsService);
        authorizationService = module.get<AuthorizationService>(AuthorizationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validateUser', () => {
        it('should validate user with correct credentials', async () => {
            const mockUser = createMockUser();

            userRepository.findOne.mockResolvedValueOnce({
                ...mockUser,
            });

            // Mock the second call with organization
            userRepository.findOne.mockResolvedValueOnce({
                ...mockUser,
                organization: createMockOrganization(),
            });

            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await authService.validateUser('test@medical.com', 'password123');

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { email: 'test@medical.com' },
                relations: ['roles'],
            });
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
            expect(result).toBeDefined();
            expect(result?.email).toBe('test@medical.com');
        });

        it('should return null for invalid email', async () => {
            userRepository.findOne.mockResolvedValue(null);

            const result = await authService.validateUser('invalid@medical.com', 'password123');

            expect(result).toBeNull();
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it('should return null for invalid password', async () => {
            const mockUser = createMockUser();
            userRepository.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await authService.validateUser('test@medical.com', 'wrongpassword');

            expect(result).toBeNull();
        });

        it('should return null for inactive user', async () => {
            const mockUser = createMockUser({ isActive: false });
            userRepository.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await authService.validateUser('test@medical.com', 'password123');

            expect(result).toBeNull();
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
        });
    });

    describe('login', () => {
        it('should successfully login user with valid credentials', async () => {
            const mockUser = createMockUser();
            mockUser.organizationId = 'org-123';
            const mockOrganizations = [createMockOrganization()];

            jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
            jest.spyOn(authService, 'getUserOrganizations').mockResolvedValue(mockOrganizations);
            tokenService.generateTokens = jest.fn().mockResolvedValue(createMockTokenResponse());
            usersService.updateLastLogin = jest.fn().mockResolvedValue(undefined);

            const result = await authService.login({
                email: 'test@medical.com',
                password: 'password123',
            });

            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(tokenService.generateTokens).toHaveBeenCalled();
            expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
        });

        it('should throw UnauthorizedException for invalid credentials', async () => {
            jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

            await expect(
                authService.login({
                    email: 'test@medical.com',
                    password: 'wrongpassword',
                }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const registerDto = {
                email: 'newuser@medical.com',
                password: 'Password123!',
                firstName: 'New',
                lastName: 'User',
                phone: '+1234567890',
                organizationId: 'org-123',
            };

            const mockUser = createMockUser({ email: registerDto.email });
            
            jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
            jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);
            tokenService.generateTokens = jest.fn().mockResolvedValue(createMockTokenResponse());
            redisSessionService.createSession = jest.fn().mockResolvedValue('session-id');

            const result = await authService.register(registerDto);

            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(usersService.create).toHaveBeenCalled();
        });

        it('should throw ConflictException if email already exists', async () => {
            const registerDto = {
                email: 'existing@medical.com',
                password: 'Password123!',
                firstName: 'Existing',
                lastName: 'User',
                phone: '+1234567890',
                organizationId: 'org-123',
            };

            jest.spyOn(usersService, 'findByEmail').mockResolvedValue(createMockUser());

            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
            expect(usersService.create).not.toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('should successfully logout user', async () => {
            const refreshToken = 'refresh-token';
            const sessionId = 'session-123';
            const jti = 'jti-123';
            const userId = 'user-123';

            tokenService.revokeRefreshToken = jest.fn().mockResolvedValue(undefined);
            tokenService.blacklistToken = jest.fn().mockResolvedValue(undefined);
            jest.spyOn(redisSessionService, 'invalidateSession').mockResolvedValue(undefined);

            await authService.logout(refreshToken, jti, userId, sessionId);

            expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(refreshToken);
            expect(redisSessionService.invalidateSession).toHaveBeenCalledWith(sessionId);
            expect(tokenService.blacklistToken).toHaveBeenCalled();
        });

        it('should handle logout without sessionId', async () => {
            const refreshToken = 'refresh-token';

            tokenService.revokeRefreshToken = jest.fn().mockResolvedValue(undefined);

            await authService.logout(refreshToken);

            expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(refreshToken);
        });
    });

    describe('refreshToken', () => {
        it('should successfully refresh tokens', async () => {
            const refreshToken = 'valid-refresh-token';
            const mockUser = createMockUser();
            const mockTokenResponse = createMockTokenResponse();
            const payload = {
                sub: mockUser.id,
                email: mockUser.email,
            };
            const mockOrganizations = [createMockOrganization()];

            jest.spyOn(tokenService, 'refreshAccessToken').mockResolvedValue(mockTokenResponse);
            jest.spyOn(tokenService, 'verifyToken').mockReturnValue(payload);
            jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
            jest.spyOn(authService, 'getUserOrganizations').mockResolvedValue(mockOrganizations);

            const result = await authService.refreshToken(refreshToken);

            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(tokenService.refreshAccessToken).toHaveBeenCalledWith(refreshToken, undefined);
            expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
        });

        it('should throw UnauthorizedException for invalid refresh token', async () => {
            jest.spyOn(tokenService, 'refreshAccessToken').mockImplementation(() => { throw new Error('Invalid token'); });

            await expect(authService.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            const refreshToken = 'valid-refresh-token';
            const payload = { sub: 'user-123', email: 'test@medical.com' };

            jest.spyOn(tokenService, 'verifyToken').mockReturnValue(payload);
            jest.spyOn(usersService, 'findById').mockResolvedValue(null as any);

            await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('changePassword', () => {
        it('should successfully change password', async () => {
            const userId = 'user-123';
            const currentPassword = 'oldPassword123';
            const newPassword = 'newPassword123!';
            const mockUser = createMockUser();

            jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jest.spyOn(usersService, 'changePassword').mockResolvedValue(undefined);
            jest.spyOn(tokenService, 'revokeAllUserTokens').mockResolvedValue(undefined);
            jest.spyOn(tokenService, 'blacklistUserTokens').mockResolvedValue(undefined);

            await authService.changePassword(userId, currentPassword, newPassword);

            expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password);
            expect(usersService.changePassword).toHaveBeenCalledWith(userId, currentPassword, newPassword);
            expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith(userId);
            expect(tokenService.blacklistUserTokens).toHaveBeenCalledWith(userId, 'password_change');
        });

        it('should throw BadRequestException for incorrect current password', async () => {
            const userId = 'user-123';
            const mockUser = createMockUser();

            jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                authService.changePassword(userId, 'wrongPassword', 'newPassword123!')
            ).rejects.toThrow(BadRequestException);
        });
    });
});