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
import { User } from '../../users/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  OTHER = 'OTHER',
}

@Entity('patients')
@Index(['patientNumber', 'organizationId'], { unique: true })
@Index(['email', 'organizationId'])
@Index(['phone', 'organizationId'])
export class Patient {
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
    enum: ['M', 'F', 'OTHER']
  })
  gender: 'M' | 'F' | 'OTHER';

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 20, nullable: true })
  alternatePhone: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 20, nullable: true })
  postalCode: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 50, nullable: true })
  nationality: string;

  @Column({ 
    type: 'enum', 
    enum: MaritalStatus, 
    nullable: true 
  })
  maritalStatus: MaritalStatus;

  @Column({ length: 100, nullable: true })
  occupation: string;

  @Column({ 
    type: 'enum', 
    enum: BloodType, 
    nullable: true 
  })
  bloodType: BloodType;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'json', nullable: true })
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
  };

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

  @Column({ type: 'json', nullable: true })
  insurance: {
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
    validUntil?: string;
  };

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ type: 'json', nullable: true })
  preferences: {
    language?: string;
    preferredContactMethod?: 'phone' | 'email' | 'sms';
    appointmentReminders?: boolean;
    marketingConsent?: boolean;
  };

  @Column({ nullable: true })
  lastVisit: Date;

  // =============================
  // SIMPLE AUDIT
  // =============================
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  updatedBy: User;

  @Column({ nullable: true })
  updatedById: string;

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

  get bmi(): number | null {
    if (!this.height || !this.weight) return null;
    const heightInMeters = this.height / 100;
    return Number((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
  }

  hasAllergy(allergen: string): boolean {
    return this.medicalHistory?.allergies?.includes(allergen) || false;
  }

  isOnMedication(medicationName: string): boolean {
    return this.medicalHistory?.medications?.some(med => 
      med.name.toLowerCase().includes(medicationName.toLowerCase())
    ) || false;
  }

  @BeforeInsert()
  async generatePatientNumber() {
    if (!this.patientNumber) {
      this.patientNumber = 'TEMP-' + Date.now();
    }
  }
}