import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../../redis/redis.service';

export interface SessionData {
    userId: string;
    email: string;
    organizationId: string;
    roles: string[];
    permissions: string[];
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    lastActivity: Date;
    deviceId?: string;
    deviceName?: string;
}

export interface RefreshTokenData {
    sessionId: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
}

@Injectable()
export class RedisSessionService {
    private readonly logger = new Logger(RedisSessionService.name);
    private readonly SESSION_PREFIX = 'session:';
    private readonly REFRESH_TOKEN_PREFIX = 'refresh:';
    private readonly BLACKLIST_PREFIX = 'blacklist:';
    private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
    private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds
    private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

    constructor(private readonly redisService: RedisService) {}

    /**
     * Create a new session for user
     */
    async createSession(
        user: User,
        permissions: string[],
        ipAddress?: string,
        userAgent?: string,
        deviceName?: string,
    ): Promise<{ sessionId: string; refreshToken: string }> {
        const sessionId = uuidv4();
        const refreshToken = this.generateRefreshToken();

        const sessionData: SessionData = {
            userId: user.id,
            email: user.email,
            organizationId: user.organizationId,
            roles: user.roles.map((role) => role.name),
            permissions,
            ipAddress,
            userAgent,
            createdAt: new Date(),
            lastActivity: new Date(),
            deviceId: sessionId,
            deviceName: deviceName || this.parseDeviceName(userAgent),
        };

        // Store session
        await this.redisService.set(
            `${this.SESSION_PREFIX}${sessionId}`,
            sessionData,
            this.SESSION_TTL * 1000, // Convert to milliseconds
        );

        // Store refresh token
        const refreshTokenData: RefreshTokenData = {
            sessionId,
            userId: user.id,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_TTL * 1000),
        };

        await this.redisService.set(
            `${this.REFRESH_TOKEN_PREFIX}${refreshToken}`,
            refreshTokenData,
            this.REFRESH_TOKEN_TTL * 1000, // Convert to milliseconds
        );

        // Add session to user's session list
        await this.addUserSession(user.id, sessionId);

        this.logger.log(`Created session ${sessionId} for user ${user.email}`);

        return { sessionId, refreshToken };
    }

    /**
     * Get session by ID
     */
    async getSession(sessionId: string): Promise<SessionData | null> {
        const session = await this.redisService.get<SessionData>(
            `${this.SESSION_PREFIX}${sessionId}`,
        );

        if (session) {
            // Update last activity
            session.lastActivity = new Date();
            await this.redisService.set(
                `${this.SESSION_PREFIX}${sessionId}`,
                session,
                this.SESSION_TTL * 1000, // Convert to milliseconds
            );
            return session;
        }

        return null;
    }

    /**
     * Validate and get session from JWT session ID
     */
    async validateSession(sessionId: string): Promise<SessionData | null> {
        const session = await this.getSession(sessionId);
        
        if (!session) {
            this.logger.debug(`Session ${sessionId} not found`);
            return null;
        }

        // Check if session is still valid
        const now = new Date();
        const lastActivity = new Date(session.lastActivity);
        const timeSinceActivity = now.getTime() - lastActivity.getTime();
        
        // If inactive for more than TTL, invalidate
        if (timeSinceActivity > this.SESSION_TTL * 1000) {
            await this.invalidateSession(sessionId);
            return null;
        }

        return session;
    }

    /**
     * Refresh session with new token
     */
    async refreshSession(refreshToken: string): Promise<{ sessionId: string; newRefreshToken: string } | null> {
        const refreshData = await this.redisService.get<RefreshTokenData>(
            `${this.REFRESH_TOKEN_PREFIX}${refreshToken}`,
        );

        if (!refreshData) {
            this.logger.debug('Refresh token not found');
            return null;
        }

        // Check if refresh token is expired
        if (new Date() > new Date(refreshData.expiresAt)) {
            await this.redisService.del(`${this.REFRESH_TOKEN_PREFIX}${refreshToken}`);
            return null;
        }

        // Get existing session
        const session = await this.getSession(refreshData.sessionId);
        if (!session) {
            return null;
        }

        // Delete old refresh token
        await this.redisService.del(`${this.REFRESH_TOKEN_PREFIX}${refreshToken}`);

        // Create new refresh token
        const newRefreshToken = this.generateRefreshToken();
        const newRefreshData: RefreshTokenData = {
            ...refreshData,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_TTL * 1000),
        };

        await this.redisService.set(
            `${this.REFRESH_TOKEN_PREFIX}${newRefreshToken}`,
            newRefreshData,
            this.REFRESH_TOKEN_TTL * 1000, // Convert to milliseconds
        );

        // Extend session TTL
        session.lastActivity = new Date();
        await this.redisService.set(
            `${this.SESSION_PREFIX}${refreshData.sessionId}`,
            session,
            this.SESSION_TTL * 1000, // Convert to milliseconds
        );

        return { sessionId: refreshData.sessionId, newRefreshToken };
    }

    /**
     * Invalidate session
     */
    async invalidateSession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);
        if (session) {
            // Remove from user's session list
            await this.removeUserSession(session.userId, sessionId);
        }

        await this.redisService.del(`${this.SESSION_PREFIX}${sessionId}`);
        this.logger.log(`Invalidated session ${sessionId}`);
    }

    /**
     * Invalidate all sessions for a user
     */
    async invalidateAllUserSessions(userId: string): Promise<void> {
        const sessionIds = await this.getUserSessions(userId);
        
        for (const sessionId of sessionIds) {
            await this.redisService.del(`${this.SESSION_PREFIX}${sessionId}`);
        }

        // Clear user's session list
        await this.redisService.del(`${this.USER_SESSIONS_PREFIX}${userId}`);
        
        this.logger.log(`Invalidated all sessions for user ${userId}`);
    }

    /**
     * Blacklist a JWT by JTI
     */
    async blacklistToken(jti: string, expiresAt: Date): Promise<void> {
        const ttl = Math.max(0, expiresAt.getTime() - Date.now());
        if (ttl > 0) {
            await this.redisService.set(
                `${this.BLACKLIST_PREFIX}${jti}`,
                { blacklisted: true, at: new Date() },
                ttl, // In milliseconds
            );
            this.logger.debug(`Blacklisted token ${jti} for ${ttl}ms`);
        }
    }

    /**
     * Check if a JWT is blacklisted
     */
    async isTokenBlacklisted(jti: string): Promise<boolean> {
        const blacklisted = await this.redisService.get(`${this.BLACKLIST_PREFIX}${jti}`);
        return !!blacklisted;
    }

    /**
     * Get all active sessions for a user
     */
    async getUserSessions(userId: string): Promise<string[]> {
        const sessions = await this.redisService.get<string[]>(
            `${this.USER_SESSIONS_PREFIX}${userId}`,
        );
        return sessions || [];
    }

    /**
     * Get detailed session information for a user
     */
    async getUserSessionDetails(userId: string): Promise<SessionData[]> {
        const sessionIds = await this.getUserSessions(userId);
        const sessions: SessionData[] = [];

        for (const sessionId of sessionIds) {
            const session = await this.getSession(sessionId);
            if (session) {
                sessions.push(session);
            }
        }

        return sessions;
    }

    /**
     * Add session to user's session list
     */
    private async addUserSession(userId: string, sessionId: string): Promise<void> {
        const sessions = await this.getUserSessions(userId);
        if (!sessions.includes(sessionId)) {
            sessions.push(sessionId);
            await this.redisService.set(
                `${this.USER_SESSIONS_PREFIX}${userId}`,
                sessions,
                this.SESSION_TTL * 1000, // Convert to milliseconds
            );
        }
    }

    /**
     * Remove session from user's session list
     */
    private async removeUserSession(userId: string, sessionId: string): Promise<void> {
        const sessions = await this.getUserSessions(userId);
        const filtered = sessions.filter((id) => id !== sessionId);
        
        if (filtered.length > 0) {
            await this.redisService.set(
                `${this.USER_SESSIONS_PREFIX}${userId}`,
                filtered,
                this.SESSION_TTL * 1000, // Convert to milliseconds
            );
        } else {
            await this.redisService.del(`${this.USER_SESSIONS_PREFIX}${userId}`);
        }
    }

    /**
     * Generate a secure refresh token
     */
    private generateRefreshToken(): string {
        return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
    }

    /**
     * Parse device name from user agent
     */
    private parseDeviceName(userAgent?: string): string {
        if (!userAgent) return 'Unknown Device';

        // Simple parsing - can be enhanced with a proper user-agent parser
        if (userAgent.includes('Mobile')) return 'Mobile Device';
        if (userAgent.includes('Tablet')) return 'Tablet';
        if (userAgent.includes('Chrome')) return 'Chrome Browser';
        if (userAgent.includes('Firefox')) return 'Firefox Browser';
        if (userAgent.includes('Safari')) return 'Safari Browser';
        if (userAgent.includes('Edge')) return 'Edge Browser';
        
        return 'Web Browser';
    }

    /**
     * Update session organization (for org switching)
     */
    async updateSessionOrganization(sessionId: string, organizationId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        
        if (!session) {
            return false;
        }

        session.organizationId = organizationId;
        session.lastActivity = new Date();
        
        await this.redisService.set(
            `${this.SESSION_PREFIX}${sessionId}`,
            session,
            this.SESSION_TTL * 1000, // Convert to milliseconds
        );

        this.logger.log(`Updated session ${sessionId} organization to ${organizationId}`);
        return true;
    }
}