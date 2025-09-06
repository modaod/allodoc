import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { TokenBlacklist } from '../entities/token-blacklist.entity';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RolesService } from '../../users/roles.service';
import { RedisSessionService } from './redis-session.service';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private rolesService: RolesService,
        private redisSessionService: RedisSessionService,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        @InjectRepository(TokenBlacklist)
        private tokenBlacklistRepository: Repository<TokenBlacklist>,
    ) {}

    async generateTokens(
        user: User,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        // Get user permissions (with caching)
        const permissions = await this.rolesService.getPermissionsForUser(user.roles, user.id);

        // Create session in Redis
        const { sessionId, refreshToken } = await this.redisSessionService.createSession(
            user,
            permissions,
            ipAddress,
            userAgent,
        );

        // Create JWT payload with session ID and unique JTI for tracking
        const jti = uuidv4();
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            organizationId: user.organizationId,
            roles: user.roles.map((role) => role.name),
            permissions,
            jti,
            sessionId, // Add session ID to JWT
        };

        // Generate access token (short-lived)
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('jwt.accessSecret'),
            expiresIn: this.configService.get<string>('jwt.accessExpiration'),
        });

        // Also save to database for audit trail (optional)
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

        const refreshTokenEntity = this.refreshTokenRepository.create({
            token: refreshToken,
            userId: user.id,
            expiresAt: refreshTokenExpiry,
            ipAddress,
            userAgent,
        });

        await this.refreshTokenRepository.save(refreshTokenEntity);

        // Calculate expires in seconds
        const expiresIn = this.parseExpiration(
            this.configService.get<string>('jwt.accessExpiration') ?? '15m',
        );

        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }

    async refreshAccessToken(
        refreshTokenString: string,
        ipAddress?: string,
    ): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        // Try Redis first
        const redisRefresh = await this.redisSessionService.refreshSession(refreshTokenString);

        if (redisRefresh) {
            // Get session data for new token
            const session = await this.redisSessionService.getSession(redisRefresh.sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Create new JWT with existing session
            const jti = uuidv4();
            const payload: JwtPayload = {
                sub: session.userId,
                email: session.email,
                organizationId: session.organizationId,
                roles: session.roles,
                permissions: session.permissions,
                jti,
                sessionId: redisRefresh.sessionId,
            };

            const accessToken = this.jwtService.sign(payload, {
                secret: this.configService.get<string>('jwt.accessSecret'),
                expiresIn: this.configService.get<string>('jwt.accessExpiration'),
            });

            const expiresIn = this.parseExpiration(
                this.configService.get<string>('jwt.accessExpiration') ?? '15m',
            );

            return {
                accessToken,
                refreshToken: redisRefresh.newRefreshToken,
                expiresIn,
            };
        }

        // Fallback to database (for backward compatibility)
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: { token: refreshTokenString },
            relations: ['user', 'user.roles'],
        });

        if (!refreshToken || !refreshToken.isActive()) {
            throw new Error('Invalid or expired refresh token');
        }

        // Revoke old refresh token
        refreshToken.isRevoked = true;
        await this.refreshTokenRepository.save(refreshToken);

        // Generate new tokens
        return await this.generateTokens(refreshToken.user, ipAddress);
    }

    async revokeRefreshToken(refreshTokenString: string): Promise<void> {
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: { token: refreshTokenString },
        });

        if (refreshToken) {
            refreshToken.isRevoked = true;
            await this.refreshTokenRepository.save(refreshToken);
        }
    }

    async revokeAllUserTokens(userId: string): Promise<void> {
        await this.refreshTokenRepository.update({ userId, isRevoked: false }, { isRevoked: true });
    }

    async cleanupExpiredTokens(): Promise<void> {
        const now = new Date();
        await this.refreshTokenRepository.delete({
            expiresAt: { $lt: now } as any,
        });
    }

    private generateRefreshToken(): string {
        return crypto.randomBytes(64).toString('hex');
    }

    private parseExpiration(expiration: string): number {
        // Parse expiration string like '15m', '1h', '7d' to seconds
        const unit = expiration.slice(-1);
        const value = parseInt(expiration.slice(0, -1));

        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 24 * 60 * 60;
            default:
                return 900; // 15 minutes default
        }
    }

    verifyToken(token: string): any {
        try {
            return this.jwtService.verify(token, {
                secret: this.configService.get<string>('jwt.accessSecret'),
            });
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async isTokenBlacklisted(jti: string): Promise<boolean> {
        // Check Redis first (faster)
        const redisBlacklisted = await this.redisSessionService.isTokenBlacklisted(jti);
        if (redisBlacklisted) {
            return true;
        }

        // Fallback to database
        const blacklistedToken = await this.tokenBlacklistRepository.findOne({
            where: { jti },
        });
        return !!blacklistedToken;
    }

    async blacklistToken(
        jti: string,
        userId: string,
        expiresAt: Date,
        reason?: string,
    ): Promise<void> {
        // Add to Redis blacklist for fast checking
        await this.redisSessionService.blacklistToken(jti, expiresAt);

        // Also save to database for audit
        const existing = await this.tokenBlacklistRepository.findOne({
            where: { jti },
        });

        if (!existing) {
            const blacklistEntry = this.tokenBlacklistRepository.create({
                jti,
                userId,
                expiresAt,
                reason,
            });
            await this.tokenBlacklistRepository.save(blacklistEntry);
        }
    }

    async blacklistUserTokens(userId: string, reason: string = 'logout'): Promise<void> {
        // This would require storing JTIs with refresh tokens
        // For now, we'll revoke all refresh tokens
        await this.revokeAllUserTokens(userId);
    }

    async cleanupExpiredBlacklistEntries(): Promise<void> {
        const now = new Date();
        await this.tokenBlacklistRepository.delete({
            expiresAt: MoreThan(now) as any,
        });
    }
}
