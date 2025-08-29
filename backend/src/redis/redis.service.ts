import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);

    constructor(@Inject('REDIS_CLIENT') private readonly client: RedisClientType) {}

    async onModuleDestroy() {
        await this.client.quit();
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, stringValue);
            } else {
                await this.client.set(key, stringValue);
            }
            
            this.logger.debug(`Set key ${key} with TTL ${ttlSeconds}s`);
        } catch (error) {
            this.logger.error(`Failed to set key ${key}:`, error);
            throw error;
        }
    }

    async get<T = any>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            
            if (!value) {
                return null;
            }

            try {
                return JSON.parse(value) as T;
            } catch {
                return value as T;
            }
        } catch (error) {
            this.logger.error(`Failed to get key ${key}:`, error);
            throw error;
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
            this.logger.debug(`Deleted key ${key}`);
        } catch (error) {
            this.logger.error(`Failed to delete key ${key}:`, error);
            throw error;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result >= 1;
        } catch (error) {
            this.logger.error(`Failed to check existence of key ${key}:`, error);
            throw error;
        }
    }

    async keys(pattern: string): Promise<string[]> {
        try {
            return await this.client.keys(pattern);
        } catch (error) {
            this.logger.error(`Failed to get keys with pattern ${pattern}:`, error);
            throw error;
        }
    }

    async expire(key: string, ttlSeconds: number): Promise<boolean> {
        try {
            const result = await this.client.expire(key, ttlSeconds);
            return result as boolean;
        } catch (error) {
            this.logger.error(`Failed to set expiration for key ${key}:`, error);
            throw error;
        }
    }

    async ttl(key: string): Promise<number> {
        try {
            return await this.client.ttl(key);
        } catch (error) {
            this.logger.error(`Failed to get TTL for key ${key}:`, error);
            throw error;
        }
    }

    async flushAll(): Promise<void> {
        try {
            await this.client.flushAll();
            this.logger.warn('Flushed all Redis keys');
        } catch (error) {
            this.logger.error('Failed to flush Redis:', error);
            throw error;
        }
    }

    // Utility method for atomic operations
    async incrBy(key: string, increment: number): Promise<number> {
        try {
            return await this.client.incrBy(key, increment);
        } catch (error) {
            this.logger.error(`Failed to increment key ${key}:`, error);
            throw error;
        }
    }

    // List operations for session management
    async lPush(key: string, value: string): Promise<number> {
        try {
            return await this.client.lPush(key, value);
        } catch (error) {
            this.logger.error(`Failed to push to list ${key}:`, error);
            throw error;
        }
    }

    async lRange(key: string, start: number, stop: number): Promise<string[]> {
        try {
            return await this.client.lRange(key, start, stop);
        } catch (error) {
            this.logger.error(`Failed to get list range for ${key}:`, error);
            throw error;
        }
    }

    async lRem(key: string, count: number, value: string): Promise<number> {
        try {
            return await this.client.lRem(key, count, value);
        } catch (error) {
            this.logger.error(`Failed to remove from list ${key}:`, error);
            throw error;
        }
    }
}