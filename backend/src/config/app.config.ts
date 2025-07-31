import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT ?? '100', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    corsCredentials: process.env.CORS_CREDENTIALS === 'true',
}));
