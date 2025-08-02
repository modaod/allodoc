import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany,
    JoinTable,
    OneToMany,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Organization } from '../../organizations/entities/organization.entity';
import { Role, RoleName } from './role.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { AuditableEntity } from '../../common/entities/auditable.entity';

@Entity('users')
@Index(['email', 'organizationId'], { unique: true })
export class User extends AuditableEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    email: string;

    @Column()
    @Exclude()
    password: string; // test

    @Column({ length: 50 })
    firstName: string;

    @Column({ length: 50 })
    lastName: string;

    @Column({ length: 20, nullable: true })
    phone: string;

    @Column({ type: 'date', nullable: true })
    dateOfBirth: Date;

    @Column({
        type: 'enum',
        enum: ['M', 'F'],
        nullable: true,
    })
    gender: 'M' | 'F' | 'OTHER';

    // =============================
    // DOCTOR-SPECIFIC FIELDS
    // =============================
    @Column({ length: 50, nullable: true, unique: true })
    licenseNumber: string; // License number (if doctor)

    @Column({ length: 100, nullable: true })
    specialty: string; // Specialty (free text)

    // =============================
    // COMMON FIELDS
    // =============================
    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ nullable: true })
    lastLogin: Date;

    // =============================
    // RELATIONS
    // =============================
    @ManyToOne(() => Organization, (organization) => organization.users)
    organization: Organization;

    @Column()
    organizationId: string;

    @ManyToMany(() => Role, (role) => role.users, { eager: true })
    @JoinTable({
        name: 'user_roles',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    })
    roles: Role[];

    @OneToMany(() => Appointment, (appointment) => appointment.doctor)
    doctorAppointments: Appointment[];

    @OneToMany(() => Appointment, (appointment) => appointment.createdBy)
    createdAppointments: Appointment[];

    @OneToMany(() => Consultation, (consultation) => consultation.doctor)
    consultations: Consultation[];

    // =============================
    // UTILITY METHODS
    // =============================
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    hasRole(roleName: RoleName): boolean {
        return this.roles?.some((role) => role.name === roleName) || false;
    }

    hasPermission(permission: string): boolean {
        return this.roles?.some((role) => role.permissions?.includes(permission)) || false;
    }

    isDoctor(): boolean {
        return this.hasRole(RoleName.DOCTOR);
    }

    isAdmin(): boolean {
        return this.hasRole(RoleName.ADMIN) || this.hasRole(RoleName.SUPER_ADMIN);
    }

    hasLicense(): boolean {
        return !!this.licenseNumber;
    }
}
