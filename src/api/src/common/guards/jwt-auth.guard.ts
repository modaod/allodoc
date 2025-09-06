import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        // Handle specific JWT errors with clear messages
        if (err || !user) {
            if (info) {
                if (info.name === 'JsonWebTokenError') {
                    throw new UnauthorizedException('Invalid token format');
                }
                if (info.name === 'TokenExpiredError') {
                    throw new UnauthorizedException('Token has expired');
                }
                if (info.name === 'NotBeforeError') {
                    throw new UnauthorizedException('Token not yet active');
                }
            }

            // Default error
            throw err || new UnauthorizedException('Authentication required');
        }
        return user;
    }
}
