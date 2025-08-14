import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';

@Entity('prescriptions')
@Index(['consultationId'])
@Index(['patientId'])
@Index(['doctorId'])
@Index(['prescriptionNumber'])
export class Prescription extends AuditableEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    prescriptionNumber: string;

    @Column({ type: 'json' })
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string;
        quantity?: number;
    }>;

    @Column({ type: 'text', nullable: true })
    generalInstructions: string;

    @Column({ type: 'date' })
    prescribedDate: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'json', nullable: true })
    warnings: Array<{
        type: 'allergy' | 'interaction' | 'contraindication' | 'warning';
        message: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }>;

    // Patient relation (required for standalone prescriptions)
    @ManyToOne(() => Patient)
    patient: Patient;

    @Column()
    patientId: string;

    // Doctor relation (prescriber)
    @ManyToOne(() => User)
    doctor: User;

    @Column()
    @Exclude() // Hide doctorId from API responses for security
    doctorId: string;

    // Consultation relation (optional - for consultation-linked prescriptions)
    @ManyToOne(() => Consultation, (consultation) => consultation.prescriptions, { nullable: true })
    consultation: Consultation;

    @Column({ nullable: true })
    consultationId: string;

    @ManyToOne(() => Organization)
    organization: Organization;

    @Column()
    organizationId: string;

    getTotalMedications(): number {
        return this.medications?.length || 0;
    }

    hasCriticalWarnings(): boolean {
        return this.warnings?.some((warning) => warning.severity === 'critical') || false;
    }

    getMedicationNames(): string[] {
        return this.medications?.map((med) => med.name) || [];
    }
}
