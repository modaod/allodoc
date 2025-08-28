import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
        // Basic connection
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
        username: process.env.DATABASE_USERNAME || 'dev_user',
        password: process.env.DATABASE_PASSWORD || 'dev_password_123',
        name: process.env.DATABASE_NAME || 'dev_db',

        // SSL Configuration
        ssl: process.env.DATABASE_SSL === 'true',
        sslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',

        // Synchronization - NEVER in production
        synchronize: isDevelopment && process.env.DATABASE_SYNCHRONIZE === 'true',
        
        // Logging
        logging: isDevelopment 
            ? process.env.DATABASE_LOGGING === 'true'
            : process.env.DATABASE_LOGGING || 'error',

        // Connection Pool
        poolSize: parseInt(process.env.DATABASE_POOL_SIZE ?? '10', 10),
        connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT ?? '5000', 10),
        idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT ?? '10000', 10),
        statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT ?? '30000', 10),

        // Migrations
        migrationsRun: isProduction, // Auto-run migrations in production
        migrationsTableName: 'migrations',

        // Additional options
        retryAttempts: isProduction ? 10 : 3,
        retryDelay: 3000,
        autoLoadEntities: true,
        keepConnectionAlive: isDevelopment,
        
        // Query runner options
        maxQueryExecutionTime: isProduction ? 10000 : undefined, // Log slow queries in production
    };
});
