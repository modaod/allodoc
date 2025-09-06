import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Configuration
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { appConfig } from './config/app.config';

// Feature Modules
import { CommonModule } from './common/common.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { SuperAdminModule } from './super-admin/super-admin.module';

// Global Guards, Interceptors, Filters
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
    imports: [
        // Global Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig, jwtConfig, appConfig],
            envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
        }),

        // Database Configuration
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const isProduction = configService.get('app.nodeEnv') === 'production';
                const isDevelopment = configService.get('app.nodeEnv') === 'development';

                return {
                    type: 'postgres',
                    host: configService.get('database.host'),
                    port: configService.get('database.port'),
                    username: configService.get('database.username'),
                    password: configService.get('database.password'),
                    database: configService.get('database.name'),
                    
                    // Entity loading
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    autoLoadEntities: configService.get('database.autoLoadEntities'),
                    
                    // CRITICAL: Synchronization settings
                    synchronize: configService.get('database.synchronize'),
                    
                    // Logging configuration
                    logging: configService.get('database.logging'),
                    maxQueryExecutionTime: configService.get('database.maxQueryExecutionTime'),
                    
                    // Migration settings
                    migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
                    migrationsTableName: configService.get('database.migrationsTableName'),
                    migrationsRun: configService.get('database.migrationsRun'),
                    
                    // SSL Configuration for production
                    ssl: isProduction && configService.get('database.ssl')
                        ? { rejectUnauthorized: configService.get('database.sslRejectUnauthorized') }
                        : false,
                    
                    // Connection pool configuration
                    extra: {
                        max: configService.get('database.poolSize'),
                        connectionTimeoutMillis: configService.get('database.connectionTimeout'),
                        idleTimeoutMillis: configService.get('database.idleTimeout'),
                        statement_timeout: configService.get('database.statementTimeout'),
                    },
                    
                    // Retry configuration
                    retryAttempts: configService.get('database.retryAttempts'),
                    retryDelay: configService.get('database.retryDelay'),
                    keepConnectionAlive: configService.get('database.keepConnectionAlive'),
                };
            },
        }),

        // Rate Limiting
        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                ttl: Number(configService.get('app.rateLimitTtl') ?? 60) * 1000,
                limit: Number(configService.get('app.rateLimitLimit') ?? 10),
                throttlers: [], // Add this line if your version requires it
            }),
        }),

        // Common Module (Global utilities)
        CommonModule,
        RedisModule,
        HealthModule,

        // Feature Modules
        AuthModule,
        OrganizationsModule,
        UsersModule,
        PatientsModule,
        AppointmentsModule,
        ConsultationsModule,
        PrescriptionsModule,
        DashboardModule,
        AuditModule,
        SuperAdminModule,
    ],
    providers: [
        // Global Guards
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },

        // Global Interceptors
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditInterceptor,
        },

        // Global Exception Filters
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule {}
