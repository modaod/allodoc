import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                const { createClient } = require('redis');
                const client = createClient({
                    socket: {
                        host: process.env.REDIS_HOST || '172.18.0.3',
                        port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    },
                    // Retry strategy
                    retryStrategy: (times: number) => {
                        if (times > 3) {
                            console.error('Redis connection failed after 3 attempts');
                            return null;
                        }
                        return Math.min(times * 100, 3000);
                    },
                });

                client.on('error', (err: any) => {
                    console.error('Redis Client Error:', err);
                });

                client.on('connect', () => {
                    console.log('Redis client connected');
                });

                client.on('ready', () => {
                    console.log('Redis client ready');
                });

                await client.connect();
                return client;
            },
            inject: [ConfigService],
        },
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}