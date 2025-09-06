import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

export interface HealthStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    services: {
        database: ServiceStatus;
        redis: ServiceStatus;
    };
}

export interface ServiceStatus {
    status: 'up' | 'down';
    responseTime?: number;
    error?: string;
}

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private redisService: RedisService,
    ) {}

    async check(): Promise<HealthStatus> {
        const [dbStatus, redisStatus] = await Promise.allSettled([
            this.checkDatabase(),
            this.checkRedis(),
        ]);

        const database =
            dbStatus.status === 'fulfilled'
                ? dbStatus.value
                : {
                      status: 'down' as const,
                      error: dbStatus.reason?.message || 'Database check failed',
                  };

        const redis =
            redisStatus.status === 'fulfilled'
                ? redisStatus.value
                : {
                      status: 'down' as const,
                      error: redisStatus.reason?.message || 'Redis check failed',
                  };

        const allHealthy = database.status === 'up' && redis.status === 'up';

        return {
            status: allHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                database,
                redis,
            },
        };
    }

    async checkReadiness(): Promise<{ ready: boolean; services: any }> {
        const health = await this.check();
        return {
            ready: health.status === 'healthy',
            services: health.services,
        };
    }

    private async checkDatabase(): Promise<ServiceStatus> {
        const start = Date.now();
        try {
            await this.dataSource.query('SELECT 1');
            return {
                status: 'up',
                responseTime: Date.now() - start,
            };
        } catch (error) {
            this.logger.error('Database health check failed:', error);
            return {
                status: 'down',
                error: error.message,
            };
        }
    }

    private async checkRedis(): Promise<ServiceStatus> {
        const start = Date.now();
        try {
            const testKey = `health:check:${Date.now()}`;
            await this.redisService.set(testKey, 'ok', 1);
            const value = await this.redisService.get(testKey);

            if (value !== 'ok') {
                throw new Error('Redis read/write test failed');
            }

            return {
                status: 'up',
                responseTime: Date.now() - start,
            };
        } catch (error) {
            this.logger.error('Redis health check failed:', error);
            return {
                status: 'down',
                error: error.message,
            };
        }
    }
}
