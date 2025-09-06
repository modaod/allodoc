import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
    private readonly logger = new Logger(OrganizationAccessGuard.name);

    constructor(
        private reflector: Reflector,
        private authorizationService: AuthorizationService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        this.logger.debug(`OrganizationAccessGuard: user object keys: ${Object.keys(user || {})}`);
        this.logger.debug(`OrganizationAccessGuard: user roles: ${JSON.stringify(user?.roles)}`);

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Super admins can access all organizations - using centralized check
        if (this.authorizationService.isSuperAdmin(user)) {
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
