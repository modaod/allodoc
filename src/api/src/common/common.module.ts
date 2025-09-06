import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { AuditService } from './services/audit.service';
import { AuthorizationService } from './services/authorization.service';
import { CacheService } from './services/cache.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OrganizationAccessGuard } from './guards/organization.guard';

@Global()
@Module({
    imports: [
        // Redis Cache configuration
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                store: await redisStore({
                    socket: {
                        host: process.env.REDIS_HOST || '172.18.0.3',
                        port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    },
                    ttl: 5 * 60 * 1000, // 5 minutes default TTL in milliseconds
                }),
            }),
        }),
    ],
    providers: [
        // Services
        AuditService,
        AuthorizationService,
        CacheService,

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
        CacheService,
        CacheModule, // Export CacheModule so CACHE_MANAGER is available
        AuditInterceptor,
        HttpExceptionFilter,
        JwtAuthGuard,
        RolesGuard,
        OrganizationAccessGuard,
    ],
})
export class CommonModule {}
