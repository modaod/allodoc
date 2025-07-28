import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'email', // Use email instead of username
            passwordField: 'password',
            passReqToCallback: true, // Pass request to validate method
        });
    }

    async validate(req: any, email: string, password: string): Promise<User> {
        const organizationId = req.body.organizationId;

        const user = await this.authService.validateUser(email, password, organizationId);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials or organization');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        return user;
    }
}
