#!/usr/bin/env node

const { DataSource } = require('typeorm');
require('dotenv').config();

async function testConnection() {
    console.log('Testing database connection...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Database:', process.env.DATABASE_NAME);
    console.log('Host:', process.env.DATABASE_HOST);
    console.log('User:', process.env.DATABASE_USERNAME);

    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USERNAME || 'dev_user',
        password: process.env.DATABASE_PASSWORD || 'dev_password_123',
        database: process.env.DATABASE_NAME || 'dev_db',
        synchronize: false,
        logging: true,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected successfully!');
        
        // Test query
        const result = await dataSource.query('SELECT current_database(), current_user, version()');
        console.log('Database info:', result[0]);
        
        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();