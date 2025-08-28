import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
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
        const { sub: userId, email, organizationId } = payload;

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
