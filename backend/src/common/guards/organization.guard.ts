import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '../../users/entities/role.entity';

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Super admins can access all organizations
        if (user.hasRole(RoleName.SUPER_ADMIN)) {
            return true;
        }

        // Get organization ID from various sources
        const organizationId =
            request.headers['x-organization-id'] ||
            request.params.organizationId ||
            request.body.organizationId ||
            request.query.organizationId;

        // If no organization ID is specified, use user's organization
        if (!organizationId) {
            request.organizationId = user.organizationId;
            return true;
        }

        // Verify user belongs to the requested organization
        if (user.organizationId !== organizationId) {
            throw new ForbiddenException(
                'Access denied: User does not belong to this organization',
            );
        }

        // Add organization ID to request for easy access
        request.organizationId = organizationId;

        return true;
    }
}
