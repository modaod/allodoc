import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RolesService } from '../../users/roles.service';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private rolesService: RolesService,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
    ) { }

    async generateTokens(user: User, ipAddress?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        // Get user permissions
        const permissions = await this.rolesService.getPermissionsForUser(user.roles);

        // Create JWT payload
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            organizationId: user.organizationId,
            roles: user.roles.map(role => role.name),
            permissions,
        };

        // Generate access token (short-lived)
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('jwt.accessSecret'),
            expiresIn: this.configService.get<string>('jwt.accessExpiration'),
        });

        // Generate refresh token (long-lived)
        const refreshTokenString = this.generateRefreshToken();
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

        // Save refresh token to database
        const refreshToken = this.refreshTokenRepository.create({
            token: refreshTokenString,
            userId: user.id,
            expiresAt: refreshTokenExpiry,
            ipAddress,
            userAgent,
        });

        await this.refreshTokenRepository.save(refreshToken);

        // Calculate expires in seconds
        const expiresIn = this.parseExpiration(this.configService.get<string>('jwt.accessExpiration') ?? '15m');

        return {
            accessToken,
            refreshToken: refreshTokenString,
            expiresIn,
        };
    }

    async refreshAccessToken(refreshTokenString: string, ipAddress?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        // Find and validate refresh token
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
        await this.refreshTokenRepository.update(
            { userId, isRevoked: false },
            { isRevoked: true },
        );
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
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 24 * 60 * 60;
            default: return 900; // 15 minutes default
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
}