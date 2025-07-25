import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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

        // Verify organization matches
        if (user.organizationId !== organizationId) {
            throw new UnauthorizedException('Organization mismatch');
        }

        // Add payload info to user object for guards
        (user as any).tokenPayload = payload;

        return user;
    }
}
