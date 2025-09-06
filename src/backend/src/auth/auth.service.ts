import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { RedisSessionService } from './services/redis-session.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuthorizationService } from '../common/services/authorization.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { User } from '../users/entities/user.entity';
import { RoleName } from '../users/entities/role.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../users/entities/user-organization.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private tokenService: TokenService,
        private redisSessionService: RedisSessionService,
        private organizationsService: OrganizationsService,
        private authorizationService: AuthorizationService,
        @InjectRepository(UserOrganization)
        private userOrganizationRepository: Repository<UserOrganization>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
    ) {}

    // Validate user credentials (used by LocalStrategy)
    async validateUser(
        email: string,
        password: string,
    ): Promise<User | null> {
        try {
            // Find user by email with roles (organization is optional)
            const user = await this.userRepository.findOne({
                where: { email },
                relations: ['roles'],
            });

            if (!user) {
                return null;
            }

            // Validate password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                return null;
            }

            if (!user.isActive) {
                return null;
            }

            // Try to load organization relation if user has organizationId
            if (user.organizationId) {
                const userWithOrg = await this.userRepository.findOne({
                    where: { id: user.id },
                    relations: ['roles', 'organization'],
                });
                return userWithOrg || user;
            }

            return user;
        } catch (error) {
            console.error('Error validating user:', error);
            return null;
        }
    }

    // Login user and generate tokens
    async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
        const user = await this.validateUser(
            loginDto.email,
            loginDto.password,
        );

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Update last login
        await this.usersService.updateLastLogin(user.id);

        // Get all organizations for the user
        const userOrganizations = await this.getUserOrganizations(user.id);
        
        // Determine the selected organization
        let selectedOrganization = user.organization;
        let selectedOrganizationId = user.organizationId;
        
        // If user has organizations from junction table, use the first or last accessed
        if (userOrganizations.length > 0) {
            selectedOrganization = userOrganizations[0];
            selectedOrganizationId = userOrganizations[0].id;
            
            // Update user's primary organization for token generation
            user.organizationId = selectedOrganizationId;
            user.organization = selectedOrganization;
        }

        // Generate tokens with organization context
        const tokens = await this.tokenService.generateTokens(user, ipAddress, userAgent);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: user.roles.map((role) => role.name),
                organizationId: selectedOrganizationId,
                organizations: userOrganizations, // Include all user organizations
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        };
    }

    // Register new user (limited registration)
    async register(registerDto: RegisterDto): Promise<AuthResponse> {
        try {
            // Check if email already exists in organization
            const existingUser = await this.usersService.findByEmail(
                registerDto.email,
                registerDto.organizationId,
            );

            if (existingUser) {
                throw new ConflictException('Email already exists in this organization');
            }

            // Create user with default SECRETARY role (or as configured)
            const createUserDto = {
                ...registerDto,
                roleIds: [], // Will be set by admin later, or default role
            };

            const user = await this.usersService.create(createUserDto);

            // Generate tokens for immediate login
            const tokens = await this.tokenService.generateTokens(user);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles: user.roles.map((role) => role.name),
                    organizationId: user.organizationId,
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException('Registration failed');
        }
    }

    // Refresh access token
    async refreshToken(refreshTokenString: string, ipAddress?: string): Promise<AuthResponse> {
        try {
            const tokens = await this.tokenService.refreshAccessToken(
                refreshTokenString,
                ipAddress,
            );

            // We need to get user info from the new token or database
            // For simplicity, let's decode the access token (in production, consider caching user data)
            const payload = this.tokenService.verifyToken(tokens.accessToken);
            const user = await this.usersService.findById(payload.sub);
            
            // Get all organizations for the user
            const userOrganizations = await this.getUserOrganizations(user.id);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles: user.roles.map((role) => role.name),
                    organizationId: user.organizationId,
                    organizations: userOrganizations,
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    // Logout user (revoke refresh token and blacklist access token)
    async logout(refreshToken: string, jti?: string, userId?: string, sessionId?: string): Promise<void> {
        // Revoke refresh token
        await this.tokenService.revokeRefreshToken(refreshToken);
        
        // Invalidate Redis session if sessionId is provided
        if (sessionId) {
            await this.redisSessionService.invalidateSession(sessionId);
        }
        
        // Blacklist current access token if JTI is provided
        if (jti && userId) {
            // Calculate token expiration (15 minutes from now as a safe default)
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15);
            
            await this.tokenService.blacklistToken(jti, userId, expiresAt, 'logout');
        }
    }

    // Logout from all devices (revoke all user tokens)
    async logoutAll(userId: string): Promise<void> {
        // Invalidate all Redis sessions
        await this.redisSessionService.invalidateAllUserSessions(userId);
        
        // Also revoke database tokens for consistency
        await this.tokenService.revokeAllUserTokens(userId);
        // Note: We could also blacklist all active JTIs for this user if we track them
    }

    // Change password
    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
        const user = await this.usersService.findById(userId);

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        await this.usersService.changePassword(userId, oldPassword, newPassword);

        // Revoke all tokens to force re-login with new password
        await this.tokenService.revokeAllUserTokens(userId);
        
        // Also blacklist all tokens for this user (security measure)
        await this.tokenService.blacklistUserTokens(userId, 'password_change');
    }

    // Get user profile from token
    async getProfile(user: User): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        roles: string[];
        permissions: string[];
        organizationId: string;
        lastLogin: Date;
    }> {
        const permissions = await this.usersService.getUserPermissions(user.roles);

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles.map((role) => role.name),
            permissions,
            organizationId: user.organizationId,
            lastLogin: user.lastLogin,
        };
    }

    // Get public list of organizations for registration
    async getPublicOrganizations(): Promise<Partial<Organization>[]> {
        const organizations = await this.organizationsService.findAll();
        // Return only public information
        return organizations.map(org => ({
            id: org.id,
            name: org.name,
        }));
    }

    // Switch user to a different organization
    async switchOrganization(
        userId: string,
        organizationId: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AuthResponse> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles'],
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Check if user is Super Admin - using centralized check
        const isSuperAdmin = this.authorizationService.isSuperAdmin(user);

        if (!isSuperAdmin) {
            // For non-Super Admin users, check if they have access to this organization
            const userOrg = await this.userOrganizationRepository.findOne({
                where: { userId, organizationId },
            });

            if (!userOrg) {
                throw new ForbiddenException('You do not have access to this organization');
            }
        }

        // Verify organization exists
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
        });

        if (!organization || !organization.isActive) {
            throw new BadRequestException('Organization not found or inactive');
        }

        // Update last accessed timestamp
        if (!isSuperAdmin) {
            await this.userOrganizationRepository.update(
                { userId, organizationId },
                { lastAccessedAt: new Date() },
            );
        } else {
            // For Super Admin, create or update the user-organization relationship
            const existingRelation = await this.userOrganizationRepository.findOne({
                where: { userId, organizationId },
            });

            if (existingRelation) {
                await this.userOrganizationRepository.update(
                    { userId, organizationId },
                    { lastAccessedAt: new Date() },
                );
            } else {
                const newRelation = this.userOrganizationRepository.create({
                    userId,
                    organizationId,
                    joinedAt: new Date(),
                    lastAccessedAt: new Date(),
                });
                await this.userOrganizationRepository.save(newRelation);
            }
        }

        // Update user's primary organization
        user.organizationId = organizationId;
        user.organization = organization;

        // Generate new tokens with updated organization context
        const tokens = await this.tokenService.generateTokens(user, ipAddress, userAgent);

        // Get all organizations for the user
        const organizations = await this.getUserOrganizations(user.id);
        
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: user.roles.map((role) => role.name),
                organizationId: organizationId, // Use the new organization ID
                organizations: organizations, // Include all user organizations
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        };
    }

    // Get all organizations for a user
    async getUserOrganizations(userId: string): Promise<Organization[]> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles'],
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Check if user is Super Admin - using centralized check
        const isSuperAdmin = this.authorizationService.isSuperAdmin(user);

        if (isSuperAdmin) {
            // Return all active organizations for Super Admin
            return await this.organizationRepository.find({
                where: { isActive: true },
                order: { name: 'ASC' },
            });
        } else {
            // Return organizations associated with the user
            const userOrgs = await this.userOrganizationRepository.find({
                where: { userId },
                relations: ['organization'],
            });

            // Also include the user's primary organization if not already in the list
            const primaryOrg = await this.organizationRepository.findOne({
                where: { id: user.organizationId },
            });

            const organizations = userOrgs
                .map(uo => uo.organization)
                .filter(org => org && org.isActive);

            // Add primary organization if not in the list
            if (primaryOrg && !organizations.find(org => org.id === primaryOrg.id)) {
                organizations.push(primaryOrg);
            }

            return organizations.sort((a, b) => a.name.localeCompare(b.name));
        }
    }

    // Get all active sessions for a user
    async getUserSessions(userId: string): Promise<any[]> {
        const sessions = await this.redisSessionService.getUserSessionDetails(userId);
        
        // Transform to a user-friendly format
        return sessions.map(session => ({
            id: session.deviceId,
            deviceName: session.deviceName,
            ipAddress: session.ipAddress,
            lastActivity: session.lastActivity,
            createdAt: session.createdAt,
            isCurrent: false, // Could be determined by comparing with current session
        }));
    }

    // Terminate a specific session
    async terminateSession(userId: string, sessionId: string): Promise<void> {
        // Check if session belongs to user
        const userSessions = await this.redisSessionService.getUserSessions(userId);
        
        if (!userSessions.includes(sessionId)) {
            throw new ForbiddenException('Session does not belong to this user');
        }
        
        // Invalidate the session
        await this.redisSessionService.invalidateSession(sessionId);
    }
}
