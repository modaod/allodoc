import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    Index,
    BeforeInsert,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { AuditableEntity } from 'src/common/entities/auditable.entity';

@Entity('patients')
@Index(['patientNumber', 'organizationId'], { unique: true })
@Index(['email', 'organizationId'])
@Index(['phone', 'organizationId'])
export class Patient extends AuditableEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 20, unique: true })
    patientNumber: string;

    @Column({ length: 50 })
    firstName: string;

    @Column({ length: 50 })
    lastName: string;

    @Column({ type: 'date' })
    dateOfBirth: Date;

    @Column({
        type: 'enum',
        enum: ['M', 'F'],
    })
    gender: 'M' | 'F';

    @Column({ length: 100, nullable: true })
    email: string;

    @Column({ length: 20 })
    phone: string;

    @Column({ length: 20, nullable: true })
    alternatePhone: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ type: 'json', nullable: true })
    medicalHistory: {
        allergies?: string[];
        chronicDiseases?: string[];
        surgeries?: Array<{
            procedure: string;
            date: string;
            hospital?: string;
            notes?: string;
        }>;
        medications?: Array<{
            name: string;
            dosage: string;
            frequency: string;
            startDate?: string;
            endDate?: string;
        }>;
        familyHistory?: {
            diseases?: string[];
            notes?: string;
        };
    };

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    lastVisit: Date;

    // =============================
    // RELATIONS
    // =============================
    @ManyToOne(() => Organization, (organization) => organization.patients)
    organization: Organization;

    @Column()
    organizationId: string;

    @OneToMany(() => Appointment, (appointment) => appointment.patient)
    appointments: Appointment[];

    @OneToMany(() => Consultation, (consultation) => consultation.patient)
    consultations: Consultation[];

    // =============================
    // UTILITY METHODS
    // =============================
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    get age(): number {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    hasAllergy(allergen: string): boolean {
        return this.medicalHistory?.allergies?.includes(allergen) || false;
    }

    isOnMedication(medicationName: string): boolean {
        return (
            this.medicalHistory?.medications?.some((med) =>
                med.name.toLowerCase().includes(medicationName.toLowerCase()),
            ) || false
        );
    }

    @BeforeInsert()
    async generatePatientNumber() {
        if (!this.patientNumber) {
            this.patientNumber = 'TEMP-' + Date.now();
        }
    }
}
