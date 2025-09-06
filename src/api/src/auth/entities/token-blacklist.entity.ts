import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('token_blacklist')
@Index(['jti'])
@Index(['expiresAt'])
export class TokenBlacklist {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    jti: string; // JWT ID

    @Column()
    userId: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ nullable: true })
    reason?: string; // logout, password_change, security_breach, etc.

    @CreateDateColumn()
    createdAt: Date;

    /**
     * Check if the token is still valid to be in blacklist
     * Tokens past their expiry can be removed from blacklist
     */
    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }
}
