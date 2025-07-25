import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { AuditableEntity } from '../entities/auditable.entity';

@Injectable()
export class AuditService {
    /**
     * Prépare les données d'audit pour une création d'entité
     */
    prepareForCreation<T extends AuditableEntity>(entity: Partial<T>, currentUser?: User): Partial<T> {
        if (currentUser) {
            entity.createdById = currentUser.id;
            entity.updatedById = currentUser.id;
        }
        return entity;
    }

    /**
     * Prépare les données d'audit pour une mise à jour d'entité
     */
    prepareForUpdate<T extends AuditableEntity>(updateData: Partial<T>, currentUser?: User): Partial<T> {
        if (currentUser) {
            updateData.updatedById = currentUser.id;
        }
        return updateData;
    }

    /**
     * Génère un rapport d'audit pour une entité
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
     * Vérifie qui peut modifier une entité selon les règles d'audit
     */
    canModify(entity: AuditableEntity, currentUser: User): boolean {
        // Règles d'autorisation basiques
        // Les super admins peuvent tout modifier
        if (currentUser.hasRole('SUPER_ADMIN' as any)) {
            return true;
        }

        // Les admins peuvent modifier dans leur organisation
        if (currentUser.hasRole('ADMIN' as any)) {
            return (entity as any).organizationId === currentUser.organizationId;
        }

        // Les utilisateurs peuvent modifier leurs propres créations récentes
        if (entity.createdById === currentUser.id) {
            const hoursSinceCreation = this.getHoursDifference(entity.createdAt, new Date());
            return hoursSinceCreation <= 24; // Modifiable pendant 24h
        }

        return false;
    }

    /**
     * Détecte les changements entre deux versions d'une entité
     */
    detectChanges<T>(oldEntity: T, newEntity: Partial<T>): Array<{
        field: string;
        oldValue: any;
        newValue: any;
    }> {
        const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

        Object.keys(newEntity).forEach(key => {
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
    // MÉTHODES UTILITAIRES PRIVÉES
    // =============================
    private getTimeDifference(date1: Date, date2: Date): string {
        const diffInMinutes = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'À l\'instant';
        } else if (diffInMinutes < 60) {
            return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        }
    }

    private getHoursDifference(date1: Date, date2: Date): number {
        return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60));
    }
}