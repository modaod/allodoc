import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, AfterLoad } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
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

    // Computed fields (not stored in database)
    @Expose()
    status?: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON';

    @Expose()
    validUntil?: Date | null;

    @AfterLoad()
    setComputedFields() {
        this.validUntil = this.calculateValidUntil();
        this.status = this.calculateStatus();
    }

    /**
     * Calculate the prescription status based on the longest medication duration
     */
    calculateStatus(): 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON' {
        const now = new Date();
        const validUntil = this.calculateValidUntil();

        if (!validUntil) {
            // No valid duration found, consider expired
            return 'EXPIRED';
        }

        const daysUntilExpiry = Math.ceil(
            (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntilExpiry < 0) {
            return 'EXPIRED';
        }
        if (daysUntilExpiry <= 3) {
            return 'EXPIRING_SOON'; // Warning period for prescriptions expiring soon
        }
        return 'ACTIVE';
    }

    /**
     * Calculate the valid until date based on the longest medication duration
     */
    calculateValidUntil(): Date | null {
        if (!this.medications || this.medications.length === 0) {
            return null;
        }

        if (!this.prescribedDate) {
            return null;
        }

        const prescribedDate = new Date(this.prescribedDate);
        let maxDuration = 0;

        // Find the medication with the longest duration
        for (const med of this.medications) {
            const days = this.parseDurationToDays(med.duration);
            if (days > maxDuration) {
                maxDuration = days;
            }
        }

        if (maxDuration === 0) {
            // No valid duration found
            return null;
        }

        // Cap maximum validity at 365 days (1 year)
        if (maxDuration > 365) {
            maxDuration = 365;
        }

        const validUntil = new Date(prescribedDate);
        validUntil.setDate(validUntil.getDate() + maxDuration);
        return validUntil;
    }

    /**
     * Parse duration string to days
     * Handles formats like "7 days", "2 weeks", "1 month", "3 months"
     */
    parseDurationToDays(duration: string): number {
        if (!duration) return 0;

        // Convert to lowercase and remove extra spaces
        const normalizedDuration = duration.toLowerCase().trim();

        // Match patterns like "7 days", "2 weeks", "1 month"
        const match = normalizedDuration.match(
            /(\d+)\s*(day|days|week|weeks|month|months|year|years)/,
        );
        if (!match) {
            return 0;
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        // Convert to days based on unit
        switch (unit) {
            case 'day':
            case 'days':
                return value;
            case 'week':
            case 'weeks':
                return value * 7;
            case 'month':
            case 'months':
                return value * 30; // Approximate month as 30 days
            case 'year':
            case 'years':
                return value * 365;
            default:
                return 0;
        }
    }
}
