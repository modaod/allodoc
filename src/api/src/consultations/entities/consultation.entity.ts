import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Prescription } from '../../prescriptions/entities/prescription.entity';

@Entity('consultations')
@Index(['patientId', 'consultationDate'])
@Index(['doctorId', 'consultationDate'])
@Index(['organizationId', 'consultationDate'])
export class Consultation extends AuditableEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    consultationNumber: string;

    @Column({ type: 'timestamp' })
    consultationDate: Date;

    @Column({ type: 'text' })
    reason: string;

    @Column({ type: 'text', nullable: true })
    symptoms: string;

    @Column({ type: 'text', nullable: true })
    physicalExamination: string;

    @Column({ type: 'text', nullable: true })
    investigation: string;

    @Column({ type: 'json', nullable: true })
    vitalSigns: {
        bloodPressure?: {
            systolic: number;
            diastolic: number;
        };
        heartRate?: number;
        temperature?: number;
        respiratoryRate?: number;
        oxygenSaturation?: number;
        weight?: number;
        height?: number;
        bmi?: number;
    };

    @Column({ type: 'text', nullable: true })
    diagnosis: string;

    @Column({ type: 'text', nullable: true })
    treatmentPlan: string;

    @Column({ type: 'text', nullable: true })
    recommendations: string;

    @Column({ type: 'json', nullable: true })
    attachments: Array<{
        type: 'image' | 'document' | 'lab_result' | 'xray';
        filename: string;
        url: string;
        description?: string;
        uploadedAt: string;
    }>;

    @Column({ type: 'text', nullable: true })
    followUpInstructions: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({
        type: 'enum',
        enum: [
            'INITIAL',
            'FOLLOW_UP',
            'EMERGENCY',
            'ROUTINE_CHECKUP',
            'SPECIALIST',
            'TELEMEDICINE',
        ],
        default: 'ROUTINE_CHECKUP',
    })
    type: string;

    @Column({
        type: 'enum',
        enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
        default: 'COMPLETED',
    })
    status: string;

    @Column({ type: 'json', nullable: true })
    metadata: {
        consultationType?: 'first_visit' | 'follow_up' | 'emergency';
        referredBy?: string;
        referralReason?: string;
        complications?: string[];
    };

    // Relations
    @ManyToOne(() => Patient, (patient) => patient.consultations)
    patient: Patient;

    @Column()
    patientId: string;

    @ManyToOne(() => User, (user) => user.consultations)
    doctor: User;

    @Column()
    @Exclude() // Hide doctorId from API responses for security
    doctorId: string;

    @ManyToOne(() => Organization)
    organization: Organization;

    @Column()
    organizationId: string;

    @OneToOne(() => Appointment, (appointment) => appointment.consultation, { nullable: true })
    @JoinColumn()
    appointment: Appointment;

    @Column({ nullable: true })
    appointmentId: string;

    @OneToMany(() => Prescription, (prescription) => prescription.consultation, { nullable: true })
    prescriptions: Prescription[];

    // Utility methods
    hasPrescriptions(): boolean {
        return this.prescriptions && this.prescriptions.length > 0;
    }

    isEmergency(): boolean {
        return this.metadata?.consultationType === 'emergency';
    }

    isFirstVisit(): boolean {
        return this.metadata?.consultationType === 'first_visit';
    }
}
