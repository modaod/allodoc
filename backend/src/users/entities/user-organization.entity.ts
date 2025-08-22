import {
    Entity,
    Column,
    ManyToOne,
    PrimaryColumn,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('user_organizations')
export class UserOrganization {
    @PrimaryColumn({ name: 'user_id' })
    userId: string;

    @PrimaryColumn({ name: 'organization_id' })
    organizationId: string;

    @CreateDateColumn({ name: 'joined_at' })
    joinedAt: Date;

    @Column({ name: 'last_accessed_at', type: 'timestamp', nullable: true })
    lastAccessedAt: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.userOrganizations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Organization, (organization) => organization.userOrganizations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;
}