import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { RoleName } from '../../users/entities/role.entity';

/**
 * Centralized Authorization Service
 * 
 * Provides consistent authorization checks across the application.
 * Handles Super Admin special cases and organization access validation.
 */
@Injectable()
export class AuthorizationService {
    private readonly logger = new Logger(AuthorizationService.name);

    /**
     * Check if user is a Super Admin
     * 
     * Handles multiple user object formats:
     * - User entity with hasRole method
     * - JWT payload with roles array
     * - Plain object with roles array
     */
    isSuperAdmin(user: User | any): boolean {
        if (!user) {
            return false;
        }

        // Handle User entity with hasRole method
        if (typeof user.hasRole === 'function') {
            return user.hasRole(RoleName.SUPER_ADMIN);
        }

        // Handle JWT payload or plain object with roles array
        if (user.roles && Array.isArray(user.roles)) {
            return user.roles.some((role: any) => {
                // Handle both string roles and role objects
                if (typeof role === 'string') {
                    return role === 'SUPER_ADMIN' || role === RoleName.SUPER_ADMIN;
                }
                if (role && typeof role === 'object') {
                    return role.name === RoleName.SUPER_ADMIN;
                }
                return false;
            });
        }

        return false;
    }

    /**
     * Check if user is an Admin (including Super Admin)
     */
    isAdmin(user: User | any): boolean {
        if (!user) {
            return false;
        }

        // Super Admins are also Admins
        if (this.isSuperAdmin(user)) {
            return true;
        }

        // Check for Admin role
        if (typeof user.hasRole === 'function') {
            return user.hasRole(RoleName.ADMIN);
        }

        if (user.roles && Array.isArray(user.roles)) {
            return user.roles.some((role: any) => {
                if (typeof role === 'string') {
                    return role === 'ADMIN' || role === RoleName.ADMIN;
                }
                if (role && typeof role === 'object') {
                    return role.name === RoleName.ADMIN;
                }
                return false;
            });
        }

        return false;
    }

    /**
     * Check if user has a specific role
     */
    hasRole(user: User | any, roleName: RoleName | string): boolean {
        if (!user) {
            return false;
        }

        // Handle User entity with hasRole method
        if (typeof user.hasRole === 'function') {
            return user.hasRole(roleName as RoleName);
        }

        // Handle JWT payload or plain object with roles array
        if (user.roles && Array.isArray(user.roles)) {
            return user.roles.some((role: any) => {
                if (typeof role === 'string') {
                    return role === roleName;
                }
                if (role && typeof role === 'object') {
                    return role.name === roleName;
                }
                return false;
            });
        }

        return false;
    }

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(user: User | any, roleNames: (RoleName | string)[]): boolean {
        return roleNames.some(roleName => this.hasRole(user, roleName));
    }

    /**
     * Check if user can access a specific organization
     * 
     * Super Admins can access all organizations
     * Regular users can only access their assigned organizations
     */
    canAccessOrganization(user: User | any, organizationId: string): boolean {
        if (!user || !organizationId) {
            return false;
        }

        // Super Admins can access all organizations
        if (this.isSuperAdmin(user)) {
            this.logSuperAdminAccess(user, organizationId, 'ORGANIZATION_ACCESS');
            return true;
        }

        // Check if user's current organization matches
        if (user.organizationId === organizationId) {
            return true;
        }

        // Check if user has this organization in their list
        if (user.organizations && Array.isArray(user.organizations)) {
            return user.organizations.some((org: any) => {
                if (typeof org === 'string') {
                    return org === organizationId;
                }
                if (org && typeof org === 'object') {
                    return org.id === organizationId;
                }
                return false;
            });
        }

        // Check userOrganizations relation (for User entity)
        if (user.userOrganizations && Array.isArray(user.userOrganizations)) {
            return user.userOrganizations.some((userOrg: any) => 
                userOrg.organizationId === organizationId
            );
        }

        return false;
    }

    /**
     * Check if user can manage users in an organization
     * 
     * Super Admins can manage all users
     * Admins can manage users in their organization
     */
    canManageUsers(user: User | any, targetOrganizationId?: string): boolean {
        // Super Admins can manage all users
        if (this.isSuperAdmin(user)) {
            if (targetOrganizationId) {
                this.logSuperAdminAccess(user, targetOrganizationId, 'USER_MANAGEMENT');
            }
            return true;
        }

        // Admins can manage users in their organization
        if (this.hasRole(user, RoleName.ADMIN)) {
            // If no target organization specified, they can manage their own
            if (!targetOrganizationId) {
                return true;
            }
            // Check if target organization is their organization
            return user.organizationId === targetOrganizationId;
        }

        return false;
    }

    /**
     * Check if user can manage organizations
     * 
     * Only Super Admins can manage organizations
     */
    canManageOrganizations(user: User | any): boolean {
        const canManage = this.isSuperAdmin(user);
        if (canManage) {
            this.logSuperAdminAccess(user, null, 'ORGANIZATION_MANAGEMENT');
        }
        return canManage;
    }

    /**
     * Log Super Admin access for audit purposes
     */
    private logSuperAdminAccess(
        user: User | any, 
        organizationId: string | null, 
        action: string
    ): void {
        const userId = user.id || user.sub || 'unknown';
        const userEmail = user.email || 'unknown';
        
        this.logger.log(
            `SUPER_ADMIN_ACCESS: User ${userEmail} (${userId}) performed ${action}` +
            (organizationId ? ` on organization ${organizationId}` : '')
        );
    }

    /**
     * Get user display name for audit logs
     */
    getUserDisplayName(user: User | any): string {
        if (!user) {
            return 'Unknown User';
        }

        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }

        if (user.email) {
            return user.email;
        }

        if (user.id) {
            return `User ${user.id}`;
        }

        return 'Unknown User';
    }

    /**
     * Get user's primary role for display
     */
    getUserPrimaryRole(user: User | any): string {
        if (this.isSuperAdmin(user)) {
            return 'Super Admin';
        }
        if (this.hasRole(user, RoleName.ADMIN)) {
            return 'Admin';
        }
        if (this.hasRole(user, RoleName.DOCTOR)) {
            return 'Doctor';
        }
        if (this.hasRole(user, RoleName.SECRETARY)) {
            return 'Secretary';
        }
        return 'User';
    }
}