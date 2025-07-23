import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.headers['x-organization-id'] || request.params.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('Organization ID requis');
    }

   // Check that the user belongs to this organization
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException('Denied access to this organization');
    }

   // Add the organizationId to the request for later use
    request.organizationId = organizationId;

    return true;
  }
}
