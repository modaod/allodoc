import { Injectable, Logger } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { Role, RoleName } from './entities/role.entity';
import { CacheService } from '../common/services/cache.service';
import { PermissionValidator } from '../common/validators/permission.validator';

@Injectable()
export class RolesService {
    private readonly logger = new Logger(RolesService.name);
    private readonly permissionValidator: PermissionValidator;

    constructor(
        private readonly rolesRepository: RolesRepository,
        private readonly cacheService: CacheService,
    ) {
        this.permissionValidator = new PermissionValidator();
    }

    async findAll(): Promise<Role[]> {
        return await this.rolesRepository.findAll();
    }

    async findById(id: string): Promise<Role> {
        return await this.rolesRepository.findById(id);
    }

    async findByName(name: RoleName): Promise<Role> {
        // Try to get from cache first
        const cacheKey = this.cacheService.getRolePermissionsCacheKey(name);
        const cachedRole = await this.cacheService.get<Role>(cacheKey);
        
        if (cachedRole) {
            return cachedRole;
        }

        // Fetch from database and cache
        const role = await this.rolesRepository.findByName(name);
        if (role) {
            await this.cacheService.set(cacheKey, role, 3600); // Cache for 1 hour
        }
        
        return role;
    }

    async create(roleData: Partial<Role>): Promise<Role> {
        // Validate permissions before creating
        if (roleData.permissions) {
            this.permissionValidator.validatePermissions(roleData.permissions);
            // Normalize permissions (e.g., convert manage to write)
            roleData.permissions = this.permissionValidator.normalizePermissions(roleData.permissions);
        }

        const role = await this.rolesRepository.create(roleData);
        
        // Clear all permissions cache since role permissions have changed
        await this.cacheService.clearAllPermissionsCache();
        
        return role;
    }

    async update(id: string, updateData: Partial<Role>): Promise<Role> {
        // Validate permissions before updating
        if (updateData.permissions) {
            this.permissionValidator.validatePermissions(updateData.permissions);
            // Normalize permissions
            updateData.permissions = this.permissionValidator.normalizePermissions(updateData.permissions);
        }

        const role = await this.rolesRepository.update(id, updateData);
        
        // Clear all permissions cache since role permissions have changed
        await this.cacheService.clearAllPermissionsCache();
        
        return role;
    }

    async getPermissionsForUser(userRoles: Role[], userId?: string): Promise<string[]> {
        // Try to get from cache if userId is provided
        if (userId) {
            const cachedPermissions = await this.cacheService.getCachedUserPermissions(userId);
            if (cachedPermissions) {
                this.logger.debug(`Cache hit for user ${userId} permissions`);
                return cachedPermissions;
            }
        }

        const allPermissions = new Set<string>();

        userRoles.forEach((role) => {
            role.permissions.forEach((permission) => {
                allPermissions.add(permission);
            });
        });

        const permissions = Array.from(allPermissions);

        // Cache the permissions if userId is provided
        if (userId) {
            await this.cacheService.cacheUserPermissions(userId, permissions, 1800); // Cache for 30 minutes
            this.logger.debug(`Cached permissions for user ${userId}`);
        }

        return permissions;
    }

    async hasPermission(userRoles: Role[], requiredPermission: string): Promise<boolean> {
        // Validate the required permission format
        try {
            this.permissionValidator.validatePermission(requiredPermission);
        } catch (error) {
            this.logger.warn(`Invalid permission format: ${requiredPermission}`);
            return false;
        }

        const permissions = await this.getPermissionsForUser(userRoles);

        // Use the validator's grantsAccess method for consistent permission checking
        for (const userPermission of permissions) {
            if (this.permissionValidator.grantsAccess(userPermission, requiredPermission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Clear cache when user roles change
     */
    async clearUserPermissionsCache(userId: string): Promise<void> {
        await this.cacheService.clearUserPermissionsCache(userId);
        this.logger.debug(`Cleared permissions cache for user ${userId}`);
    }

    /**
     * Validate a set of permissions
     */
    validatePermissions(permissions: string[]): boolean {
        return this.permissionValidator.validatePermissions(permissions);
    }
}
