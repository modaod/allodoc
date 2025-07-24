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
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Prescription } from '../../prescriptions/entities/prescription.entity';

@Entity('consultations')
@Index(['patientId', 'consultationDate'])
@Index(['doctorId', 'consultationDate'])
export class Consultation extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  consultationDate: Date;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ type: 'text', nullable: true })
  physicalExamination: string;

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

  @Column({ type: 'simple-array', nullable: true })
  differentialDiagnosis: string[];

  @Column({ type: 'text', nullable: true })
  treatmentPlan: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ type: 'simple-array', nullable: true })
  investigations: string[];

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

  @Column({ type: 'date', nullable: true })
  nextAppointmentDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 30 })
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee: number;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paymentDate: Date;

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

  @OneToMany(() => Prescription, (prescription) => prescription.consultation)
  prescriptions: Prescription[];

  // Méthodes utilitaires
  get patientAge(): number {
    if (!this.patient?.dateOfBirth) return 0;
    const consultationDate = new Date(this.consultationDate);
    const birthDate = new Date(this.patient.dateOfBirth);
    let age = consultationDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = consultationDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && consultationDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  hasPrescriptions(): boolean {
    return this.prescriptions && this.prescriptions.length > 0;
  }

  isEmergency(): boolean {
    return this.metadata?.consultationType === 'emergency';
  }

  isFirstVisit(): boolean {
    return this.metadata?.consultationType === 'first_visit';
  }

  calculateBMI(): number | null {
    const weight = this.vitalSigns?.weight;
    const height = this.vitalSigns?.height;
    
    if (!weight || !height) return null;
    
    const heightInMeters = height / 100;
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
  }

  hasAbnormalVitals(): boolean {
    const vitals = this.vitalSigns;
    if (!vitals) return false;

    const abnormal = 
      (vitals.bloodPressure && (
        vitals.bloodPressure.systolic > 140 || 
        vitals.bloodPressure.systolic < 90 ||
        vitals.bloodPressure.diastolic > 90 ||
        vitals.bloodPressure.diastolic < 60
      )) ||
      (vitals.heartRate && (vitals.heartRate > 100 || vitals.heartRate < 60)) ||
      (vitals.temperature && (vitals.temperature > 37.5 || vitals.temperature < 36)) ||
      (vitals.oxygenSaturation && vitals.oxygenSaturation < 95);

    return !!abnormal;
  }
}
