import { CreateDateColumn, UpdateDateColumn, ManyToOne, Column } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export abstract class AuditableEntity {
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    createdBy: User;

    @Column({ nullable: true })
    createdById: string;

    @ManyToOne(() => User, { nullable: true })
    updatedBy: User;

    @Column({ nullable: true })
    updatedById: string;

    // Utility methods for auditing
    setCreatedBy(user: User): void {
        this.createdBy = user;
        this.createdById = user.id;
    }

    setUpdatedBy(user: User): void {
        this.updatedBy = user;
        this.updatedById = user.id;
    }

    getCreatedByName(): string {
        return this.createdBy ? this.createdBy.fullName : 'Système';
    }

    getUpdatedByName(): string {
        return this.updatedBy ? this.updatedBy.fullName : 'Système';
    }
}
