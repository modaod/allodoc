import { CreateDateColumn, UpdateDateColumn, ManyToOne, Column } from 'typeorm';

export abstract class AuditableEntity {
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => require('../../users/entities/user.entity').User, { nullable: true })
    createdBy: any;

    @Column({ nullable: true })
    createdById: string;

    @ManyToOne(() => require('../../users/entities/user.entity').User, { nullable: true })
    updatedBy: any;

    @Column({ nullable: true })
    updatedById: string;

    // Utility methods for auditing
    setCreatedBy(user: any): void {
        this.createdBy = user;
        this.createdById = user.id;
    }

    setUpdatedBy(user: any): void {
        this.updatedBy = user;
        this.updatedById = user.id;
    }

    getCreatedByName(): string {
        return this.createdBy ? this.createdBy.fullName : 'System';
    }

    getUpdatedByName(): string {
        return this.updatedBy ? this.updatedBy.fullName : 'System';
    }
}
