import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USERNAME || 'medical_user',
  password: process.env.DATABASE_PASSWORD || 'medical_password',
  name: process.env.DATABASE_NAME || 'medical_db',
}));
