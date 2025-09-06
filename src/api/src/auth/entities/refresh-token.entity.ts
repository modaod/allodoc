import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
@Index(['token'])
@Index(['userId'])
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 500 })
    token: string;

    @Column()
    expiresAt: Date;

    @Column({ default: false })
    isRevoked: boolean;

    @Column({ length: 45, nullable: true })
    ipAddress: string;

    @Column({ length: 500, nullable: true })
    userAgent: string;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    userId: string;

    // Utility methods
    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    isActive(): boolean {
        return !this.isRevoked && !this.isExpired();
    }
}
