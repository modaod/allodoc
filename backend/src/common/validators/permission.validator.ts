import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Permission Validator
 * 
 * Validates permission strings follow the correct format and conventions
 */
@Injectable()
export class PermissionValidator {
    // Valid resources that can be accessed
    private readonly validResources = [
        'system',
        'organizations',
        'organization',
        'users',
        'roles',
        'audit',
        'settings',
        'patients',
        'appointments',
        'consultations',
        'prescriptions',
        'reports',
        'medical_history',
        'vital_signs',
        'dashboard',
        'analytics',
    ];

    // Valid actions that can be performed
    private readonly validActions = [
        'read',    // View/list resources
        'write',   // Create/update/delete resources
        'create',  // Create new resources (specific)
        'update',  // Update existing resources (specific)
        'delete',  // Delete resources (specific)
        'manage',  // Full control (deprecated, use write)
        'execute', // Execute specific operations
        'export',  // Export data
        'import',  // Import data
    ];

    // Permission format regex: resource:action or *
    private readonly permissionRegex = /^(\*|[a-z_]+:[a-z_]+|\*:[a-z_]+|[a-z_]+:\*)$/;

    /**
     * Validate a single permission string
     */
    validatePermission(permission: string): boolean {
        if (!permission || typeof permission !== 'string') {
            throw new BadRequestException('Permission must be a non-empty string');
        }

        // Check for wildcard permission
        if (permission === '*') {
            return true;
        }

        // Check format
        if (!this.permissionRegex.test(permission)) {
            throw new BadRequestException(
                `Invalid permission format: ${permission}. Expected format: resource:action or *`
            );
        }

        // Parse and validate components
        const [resource, action] = permission.split(':');

        // Allow wildcard resource or action
        if (resource === '*' || action === '*') {
            return true;
        }

        // Validate resource
        if (!this.validResources.includes(resource)) {
            throw new BadRequestException(
                `Invalid resource in permission: ${resource}. Valid resources: ${this.validResources.join(', ')}`
            );
        }

        // Validate action
        if (!this.validActions.includes(action)) {
            throw new BadRequestException(
                `Invalid action in permission: ${action}. Valid actions: ${this.validActions.join(', ')}`
            );
        }

        return true;
    }

    /**
     * Validate an array of permissions
     */
    validatePermissions(permissions: string[]): boolean {
        if (!Array.isArray(permissions)) {
            throw new BadRequestException('Permissions must be an array');
        }

        // Validate each permission
        permissions.forEach(permission => this.validatePermission(permission));

        // Check for duplicates
        const uniquePermissions = new Set(permissions);
        if (uniquePermissions.size !== permissions.length) {
            throw new BadRequestException('Duplicate permissions found');
        }

        return true;
    }

    /**
     * Normalize permission format
     * Converts deprecated formats to current standard
     */
    normalizePermission(permission: string): string {
        if (!permission || permission === '*') {
            return permission;
        }

        const [resource, action] = permission.split(':');
        
        // Convert 'manage' to 'write' for consistency
        if (action === 'manage') {
            return `${resource}:write`;
        }

        // Convert 'view' to 'read' if it exists
        if (action === 'view') {
            return `${resource}:read`;
        }

        return permission;
    }

    /**
     * Normalize an array of permissions
     */
    normalizePermissions(permissions: string[]): string[] {
        return permissions.map(p => this.normalizePermission(p));
    }

    /**
     * Check if a permission is a wildcard
     */
    isWildcardPermission(permission: string): boolean {
        return permission === '*' || 
               permission.endsWith(':*') || 
               permission.startsWith('*:');
    }

    /**
     * Check if a permission grants access to a specific action
     */
    grantsAccess(grantedPermission: string, requiredPermission: string): boolean {
        // Full wildcard grants everything
        if (grantedPermission === '*') {
            return true;
        }

        // Exact match
        if (grantedPermission === requiredPermission) {
            return true;
        }

        // Parse permissions
        const [grantedResource, grantedAction] = grantedPermission.split(':');
        const [requiredResource, requiredAction] = requiredPermission.split(':');

        // Resource wildcard
        if (grantedResource === '*' && grantedAction === requiredAction) {
            return true;
        }

        // Action wildcard
        if (grantedResource === requiredResource && grantedAction === '*') {
            return true;
        }

        // Write permission includes read for same resource
        if (grantedResource === requiredResource && 
            grantedAction === 'write' && 
            requiredAction === 'read') {
            return true;
        }

        return false;
    }

    /**
     * Get all resources
     */
    getValidResources(): string[] {
        return [...this.validResources];
    }

    /**
     * Get all actions
     */
    getValidActions(): string[] {
        return [...this.validActions];
    }

    /**
     * Add custom resource (for extensibility)
     */
    addResource(resource: string): void {
        if (!resource || !/^[a-z_]+$/.test(resource)) {
            throw new BadRequestException('Resource must be lowercase with underscores only');
        }
        if (!this.validResources.includes(resource)) {
            this.validResources.push(resource);
        }
    }

    /**
     * Add custom action (for extensibility)
     */
    addAction(action: string): void {
        if (!action || !/^[a-z_]+$/.test(action)) {
            throw new BadRequestException('Action must be lowercase with underscores only');
        }
        if (!this.validActions.includes(action)) {
            this.validActions.push(action);
        }
    }
}