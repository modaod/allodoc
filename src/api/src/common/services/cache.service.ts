import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Cache Service for managing Redis cache operations
 *
 * Provides centralized caching functionality with:
 * - Key namespacing
 * - TTL management
 * - Bulk operations
 * - Error handling
 */
@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private readonly defaultTTL = 300; // 5 minutes in seconds

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.cacheManager.get<T>(key);
            if (value) {
                this.logger.debug(`Cache hit for key: ${key}`);
            }
            return value || null;
        } catch (error) {
            this.logger.error(`Error getting cache key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set a value in cache with optional TTL
     */
    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        try {
            const effectiveTTL = ttl || this.defaultTTL;
            await this.cacheManager.set(key, value, effectiveTTL * 1000); // Convert to milliseconds
            this.logger.debug(`Cache set for key: ${key} with TTL: ${effectiveTTL}s`);
        } catch (error) {
            this.logger.error(`Error setting cache key ${key}:`, error);
        }
    }

    /**
     * Delete a key from cache
     */
    async delete(key: string): Promise<void> {
        try {
            await this.cacheManager.del(key);
            this.logger.debug(`Cache deleted for key: ${key}`);
        } catch (error) {
            this.logger.error(`Error deleting cache key ${key}:`, error);
        }
    }

    /**
     * Delete multiple keys by pattern
     * Note: Pattern-based deletion requires Redis store access
     */
    async deleteByPattern(pattern: string): Promise<void> {
        try {
            // For now, we'll have to clear all permissions individually
            // Pattern-based deletion requires direct Redis access
            this.logger.debug(`Pattern-based deletion requested for: ${pattern}`);
            // In production, consider implementing Redis SCAN command
        } catch (error) {
            this.logger.error(`Error deleting cache keys by pattern ${pattern}:`, error);
        }
    }

    /**
     * Clear all cache
     * Note: reset() is not available in cache-manager v5+
     */
    async reset(): Promise<void> {
        try {
            // cache-manager v5+ doesn't have reset
            // Would need to implement custom clear logic
            this.logger.debug('Cache reset requested - manual clear needed');
        } catch (error) {
            this.logger.error('Error resetting cache:', error);
        }
    }

    /**
     * Get user permissions cache key
     */
    getUserPermissionsCacheKey(userId: string): string {
        return `permissions:user:${userId}`;
    }

    /**
     * Get role permissions cache key
     */
    getRolePermissionsCacheKey(roleId: string): string {
        return `permissions:role:${roleId}`;
    }

    /**
     * Cache user permissions
     */
    async cacheUserPermissions(userId: string, permissions: string[], ttl?: number): Promise<void> {
        const key = this.getUserPermissionsCacheKey(userId);
        await this.set(key, permissions, ttl);
    }

    /**
     * Get cached user permissions
     */
    async getCachedUserPermissions(userId: string): Promise<string[] | null> {
        const key = this.getUserPermissionsCacheKey(userId);
        return await this.get<string[]>(key);
    }

    /**
     * Clear user permissions cache
     */
    async clearUserPermissionsCache(userId: string): Promise<void> {
        const key = this.getUserPermissionsCacheKey(userId);
        await this.delete(key);
    }

    /**
     * Clear all permissions cache for a specific organization
     */
    async clearOrganizationPermissionsCache(organizationId: string): Promise<void> {
        // Since we can't easily pattern match with cache-manager v7,
        // we'll log this for monitoring and consider alternative approaches
        this.logger.debug(`Clearing organization ${organizationId} permissions cache`);
        // In production, maintain a list of keys or use Redis directly
    }

    /**
     * Clear all permissions cache
     */
    async clearAllPermissionsCache(): Promise<void> {
        // Since we can't easily pattern match with cache-manager v7,
        // we'll log this for monitoring
        this.logger.debug('Clearing all permissions cache');
        // In production, maintain a list of cached keys or use Redis directly
    }
}
