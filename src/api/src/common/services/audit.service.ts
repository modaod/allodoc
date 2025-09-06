import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { AuditableEntity } from '../entities/auditable.entity';

@Injectable()
export class AuditService {
    /**
     * Prepares audit data for entity creation
     */
    prepareForCreation<T extends AuditableEntity>(
        entity: Partial<T>,
        currentUser?: User,
    ): Partial<T> {
        if (currentUser) {
            entity.createdById = currentUser.id;
            entity.updatedById = currentUser.id;
        }
        return entity;
    }

    /**
     * Prepares audit data for entity update
     */
    prepareForUpdate<T extends AuditableEntity>(
        updateData: Partial<T>,
        currentUser?: User,
    ): Partial<T> {
        if (currentUser) {
            updateData.updatedById = currentUser.id;
        }
        return updateData;
    }

    /**
     * Generates an audit report for an entity
     */
    generateAuditReport(entity: AuditableEntity): {
        createdAt: Date;
        createdBy: string;
        updatedAt: Date;
        updatedBy: string;
        lastModified: string;
    } {
        const now = new Date();
        const lastModified = this.getTimeDifference(entity.updatedAt, now);

        return {
            createdAt: entity.createdAt,
            createdBy: entity.getCreatedByName(),
            updatedAt: entity.updatedAt,
            updatedBy: entity.getUpdatedByName(),
            lastModified,
        };
    }

    /**
     * Checks who can modify an entity according to audit rules
     */
    canModify(entity: AuditableEntity, currentUser: User): boolean {
        // Basic authorization rules
        // Super admins can modify everything
        if (currentUser.hasRole('SUPER_ADMIN' as any)) {
            return true;
        }

        // Admins can modify within their organization
        if (currentUser.hasRole('ADMIN' as any)) {
            return (entity as any).organizationId === currentUser.organizationId;
        }

        // Users can modify their own recent creations
        if (entity.createdById === currentUser.id) {
            const hoursSinceCreation = this.getHoursDifference(entity.createdAt, new Date());
            return hoursSinceCreation <= 24; // Modifiable for 24 hours
        }

        return false;
    }

    /**
     * Detects changes between two versions of an entity
     */
    detectChanges<T>(
        oldEntity: T,
        newEntity: Partial<T>,
    ): Array<{
        field: string;
        oldValue: any;
        newValue: any;
    }> {
        const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

        Object.keys(newEntity).forEach((key) => {
            const oldValue = (oldEntity as any)[key];
            const newValue = (newEntity as any)[key];

            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes.push({
                    field: key,
                    oldValue,
                    newValue,
                });
            }
        });

        return changes;
    }

    // =============================
    // PRIVATE UTILITY METHODS
    // =============================
    private getTimeDifference(date1: Date, date2: Date): string {
        const diffInMinutes = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }

    private getHoursDifference(date1: Date, date2: Date): number {
        return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60));
    }
}
