import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { RolesService } from '../../users/roles.service';
import { AuthorizationService } from '../services/authorization.service';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private rolesService: RolesService,
        private authorizationService: AuthorizationService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // SUPER_ADMIN bypasses all permission checks - using centralized check
        if (this.authorizationService.isSuperAdmin(user)) {
            return true;
        }

        // Check each required permission
        for (const permission of requiredPermissions) {
            const hasPermission = await this.rolesService.hasPermission(user.roles, permission);
            if (!hasPermission) {
                throw new ForbiddenException(`Missing permission: ${permission}`);
            }
        }

        return true;
    }
}
