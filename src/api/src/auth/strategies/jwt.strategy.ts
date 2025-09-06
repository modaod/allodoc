import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { TokenService } from '../services/token.service';
import { RedisSessionService } from '../services/redis-session.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
        private tokenService: TokenService,
        private redisSessionService: RedisSessionService,
    ) {
        super({
            // Extract JWT from either Authorization header or cookies
            jwtFromRequest: ExtractJwt.fromExtractors([
                // First try Authorization header (for backward compatibility)
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                // Then try cookie
                (request: Request) => {
                    let token = null;
                    if (request && request.cookies) {
                        token = request.cookies['access_token'];
                    }
                    return token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.accessSecret'),
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        // Extract user info from JWT payload
        const { sub: userId, email, organizationId, jti, sessionId } = payload;

        // Fast path: Check session in Redis if available
        if (sessionId) {
            const session = await this.redisSessionService.validateSession(sessionId);
            
            if (!session) {
                this.logger.debug(`Session ${sessionId} not found or expired`);
                throw new UnauthorizedException('Session expired or invalid');
            }

            // Check if token is blacklisted (Redis first, then DB)
            if (jti) {
                const isBlacklisted = await this.tokenService.isTokenBlacklisted(jti);
                if (isBlacklisted) {
                    throw new UnauthorizedException('Token has been revoked');
                }
            }

            // Create user object from session data (avoid DB hit)
            const user = new User();
            user.id = session.userId;
            user.email = session.email;
            user.organizationId = session.organizationId;
            user.isActive = true; // Session exists means user is active
            
            // Add roles and permissions from session
            (user as any).roles = session.roles.map(name => ({ name }));
            (user as any).permissions = session.permissions;
            (user as any).tokenPayload = payload;
            (user as any).sessionId = sessionId;

            return user;
        }

        // Fallback: Traditional validation (for backward compatibility)
        this.logger.debug('No session ID in token, using traditional validation');

        // Check if token is blacklisted
        if (jti) {
            const isBlacklisted = await this.tokenService.isTokenBlacklisted(jti);
            if (isBlacklisted) {
                throw new UnauthorizedException('Token has been revoked');
            }
        }

        // Verify user still exists and is active
        const user = await this.usersService.findById(userId);

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User account is inactive or deleted');
        }

        // For organization switching, we don't validate organizationId match
        // The switch-organization endpoint will handle proper validation
        // Set the organizationId from token to user for context
        user.organizationId = organizationId;

        // Add payload info to user object for guards
        (user as any).tokenPayload = payload;

        return user;
    }
}
