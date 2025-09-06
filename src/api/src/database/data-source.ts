import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables based on NODE_ENV
const environment = process.env.NODE_ENV || 'development';
const envFile = `.env.${environment}`;

config({ path: envFile });

// Log which environment is being used
console.log(`Loading configuration from: ${envFile}`);
console.log(`Database: ${process.env.DATABASE_NAME}`);

const isProduction = environment === 'production';
const isDevelopment = environment === 'development';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USERNAME || 'dev_user',
    password: process.env.DATABASE_PASSWORD || 'dev_password_123',
    database: process.env.DATABASE_NAME || 'dev_db',

    // Entity and migration paths
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],

    // NEVER synchronize in production
    synchronize: false, // Always use migrations for schema changes

    // Logging
    logging: isDevelopment,

    // SSL for production
    ssl:
        isProduction && process.env.DATABASE_SSL === 'true'
            ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
            : false,

    // Migration settings
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all', // Run all migrations in a single transaction

    // Additional options
    connectTimeoutMS: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT ?? '5000', 10),
    maxQueryExecutionTime: isProduction ? 10000 : undefined,

    // Pool configuration
    extra: {
        max: parseInt(process.env.DATABASE_POOL_SIZE ?? '10', 10),
        connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT ?? '5000', 10),
        idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT ?? '10000', 10),
        statement_timeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT ?? '30000', 10),
    },
});
