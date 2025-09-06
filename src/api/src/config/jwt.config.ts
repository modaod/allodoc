import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    // In production, secrets must be provided via environment variables
    if (process.env.NODE_ENV === 'production') {
        if (!accessSecret || !refreshSecret) {
            throw new Error('JWT secrets must be provided in production environment');
        }
        if (accessSecret.length < 32 || refreshSecret.length < 32) {
            throw new Error('JWT secrets must be at least 32 characters long');
        }
    }

    // For development only - still require proper secrets
    const devAccessSecret = accessSecret || 'dev-only-access-secret-change-in-production';
    const devRefreshSecret = refreshSecret || 'dev-only-refresh-secret-change-in-production';

    if (process.env.NODE_ENV !== 'production' && (!accessSecret || !refreshSecret)) {
        console.warn(
            '⚠️  WARNING: Using development JWT secrets. Set proper secrets in .env file!',
        );
    }

    return {
        accessSecret: devAccessSecret,
        refreshSecret: devRefreshSecret,
        accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    };
});
