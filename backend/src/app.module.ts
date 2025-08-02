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
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';

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
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('database.host'),
                port: configService.get('database.port'),
                username: configService.get('database.username'),
                password: configService.get('database.password'),
                database: configService.get('database.name'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: configService.get('app.nodeEnv') === 'development',
                logging: configService.get('app.nodeEnv') === 'development',
                migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
                migrationsRun: false,
            }),
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
