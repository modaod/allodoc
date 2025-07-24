import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';

export enum OrganizationType {
  CLINIC = 'CLINIC',
  HOSPITAL = 'HOSPITAL',
  MEDICAL_CENTER = 'MEDICAL_CENTER',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: OrganizationType })
  type: OrganizationType;

  @Column({ length: 200 })
  address: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 20, nullable: true })
  registrationNumber: string; // Numéro d'enregistrement officiel

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  settings: {
    timezone?: string;
    language?: string;
    currency?: string;
    workingHours?: {
      start: string;
      end: string;
      days: string[];
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Patient, (patient) => patient.organization)
  patients: Patient[];
}