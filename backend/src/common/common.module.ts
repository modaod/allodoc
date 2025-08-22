import { Module, Global } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { AuthorizationService } from './services/authorization.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OrganizationAccessGuard } from './guards/organization.guard';

@Global()
@Module({
    providers: [
        // Services
        AuditService,
        AuthorizationService,

        // Interceptors
        AuditInterceptor,

        // Filters
        HttpExceptionFilter,

        // Guards
        JwtAuthGuard,
        RolesGuard,
        OrganizationAccessGuard,
    ],
    exports: [
        AuditService,
        AuthorizationService,
        AuditInterceptor,
        HttpExceptionFilter,
        JwtAuthGuard,
        RolesGuard,
        OrganizationAccessGuard,
    ],
})
export class CommonModule {}
