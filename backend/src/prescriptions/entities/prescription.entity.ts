import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('prescriptions')
@Index(['consultationId'])
export class Prescription extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  // Relations
  @ManyToOne(() => Consultation, (consultation) => consultation.prescriptions)
  consultation: Consultation;

  @Column()
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
