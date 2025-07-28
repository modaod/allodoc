import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
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

        // TypeORM for refresh tokens
        TypeOrmModule.forFeature([RefreshToken]),

        // Forward reference to avoid circular dependency
        forwardRef(() => UsersModule),
    ],
    controllers: [AuthController],
    providers: [AuthService, TokenService, JwtStrategy, LocalStrategy],
    exports: [AuthService, TokenService, JwtModule, PassportModule],
})
export class AuthModule {}
