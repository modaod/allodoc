import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from './services/token.service';
import { TokenCleanupService } from './services/token-cleanup.service';
import { RedisSessionService } from './services/redis-session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../users/entities/user-organization.entity';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { CommonModule } from '../common/common.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [
        // Common module for shared services (includes CacheModule)
        CommonModule,
        
        // Redis module for session management
        RedisModule,

        // Schedule module for cleanup jobs
        ScheduleModule.forRoot(),

        // Passport configuration
        PassportModule.register({ defaultStrategy: 'jwt' }),

        // JWT configuration
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.accessSecret'),
                signOptions: {
                    expiresIn: configService.get<string>('jwt.accessExpiration'),
                },
            }),
        }),

        // TypeORM for auth-related entities
        TypeOrmModule.forFeature([RefreshToken, TokenBlacklist, User, Organization, UserOrganization]),

        // Forward reference to avoid circular dependency
        forwardRef(() => UsersModule),
        
        // Organizations module for fetching organizations list
        OrganizationsModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService, 
        TokenService, 
        TokenCleanupService, 
        RedisSessionService,
        JwtStrategy, 
        LocalStrategy
    ],
    exports: [AuthService, TokenService, RedisSessionService, JwtModule, PassportModule],
})
export class AuthModule {}
