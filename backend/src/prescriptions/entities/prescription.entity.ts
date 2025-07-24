import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum PrescriptionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Entity('prescriptions')
@Index(['consultationId'])
@Index(['validUntil'])
export class Prescription extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json' })
  medications: Array<{
    name: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity?: number;
    refills?: number;
  }>;

  @Column({ type: 'text', nullable: true })
  generalInstructions: string;

  @Column({ type: 'date' })
  prescribedDate: Date;

  @Column({ type: 'date' })
  validUntil: Date;

  @Column({ 
    type: 'enum', 
    enum: PrescriptionStatus,
    default: PrescriptionStatus.ACTIVE 
  })
  status: PrescriptionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  warnings: Array<{
    type: 'allergy' | 'interaction' | 'contraindication' | 'warning';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;

  @Column({ default: false })
  isDispensed: boolean;

  @Column({ nullable: true })
  dispensedDate: Date;

  @Column({ length: 100, nullable: true })
  pharmacyName: string;

  @Column({ type: 'text', nullable: true })
  pharmacistNotes: string;

  // Relations
  @ManyToOne(() => Consultation, (consultation) => consultation.prescriptions)
  consultation: Consultation;

  @Column()
  consultationId: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organizationId: string;

  // Méthodes utilitaires
  isExpired(): boolean {
    return new Date() > this.validUntil;
  }

  isActive(): boolean {
    return this.status === PrescriptionStatus.ACTIVE && !this.isExpired();
  }

  getTotalMedications(): number {
    return this.medications?.length || 0;
  }

  hasCriticalWarnings(): boolean {
    return this.warnings?.some(warning => warning.severity === 'critical') || false;
  }

  getMedicationNames(): string[] {
    return this.medications?.map(med => med.name) || [];
  }

  getDaysUntilExpiry(): number {
    const today = new Date();
    const expiry = new Date(this.validUntil);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}