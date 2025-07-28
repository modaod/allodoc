import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { User } from '../users/entities/user.entity';
import { RoleName } from '../users/entities/role.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private tokenService: TokenService,
    ) {}

    // Validate user credentials (used by LocalStrategy)
    async validateUser(
        email: string,
        password: string,
        organizationId?: string,
    ): Promise<User | null> {
        try {
            // If no organizationId provided, try to find user by email
            let user: User | null = null;

            if (organizationId) {
                user = await this.usersService.findByEmail(email, organizationId);
            } else {
                // For super admin, allow login without specific organization
                // This is a simplified approach - in production you might want more complex logic
                const users = await this.usersService.findAll(); // You'd need to implement this method
                user =
                    users.find((u) => u.email === email && u.hasRole(RoleName.SUPER_ADMIN)) || null;
            }

            if (!user) {
                return null;
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return null;
            }

            return user;
        } catch (error) {
            return null;
        }
    }

    // Login user and generate tokens
    async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
        const user = await this.validateUser(
            loginDto.email,
            loginDto.password,
            loginDto.organizationId,
        );

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Update last login
        await this.usersService.updateLastLogin(user.id);

        // Generate tokens
        const tokens = await this.tokenService.generateTokens(user, ipAddress, userAgent);

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
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    // Logout user (revoke refresh token)
    async logout(refreshToken: string): Promise<void> {
        await this.tokenService.revokeRefreshToken(refreshToken);
    }

    // Logout from all devices (revoke all user tokens)
    async logoutAll(userId: string): Promise<void> {
        await this.tokenService.revokeAllUserTokens(userId);
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
}
