// Fix for crypto module in Node.js 18 with TypeORM
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as any;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { seedRoles } from './data/roles.seed';
import { seedOrganization } from './data/organization.seed';
import { seedUsers } from './data/users.seed';

async function runSeeds() {
    console.log('🌱 Starting database seeding...');

    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        // Seed roles first (required for users)
        console.log('📋 Seeding roles...');
        await seedRoles(app);

        // Seed organization (required for users)
        console.log('🏢 Seeding organization...');
        await seedOrganization(app);

        // Seed users (depends on roles and organization)
        console.log('👥 Seeding users...');
        await seedUsers(app);

        console.log('✅ Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

// Run the seeding
runSeeds().catch((error) => {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
});
