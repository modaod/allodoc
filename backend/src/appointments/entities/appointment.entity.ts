import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, Index } from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  ROUTINE_CHECKUP = 'ROUTINE_CHECKUP',
  PROCEDURE = 'PROCEDURE',
  VACCINATION = 'VACCINATION',
  TELECONSULTATION = 'TELECONSULTATION',
}

@Entity('appointments')
@Index(['doctorId', 'appointmentDate'])
@Index(['patientId', 'appointmentDate'])
@Index(['organizationId', 'appointmentDate'])
export class Appointment extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  appointmentDate: Date;

  @Column({ default: 30 })
  duration: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: AppointmentType,
    default: AppointmentType.CONSULTATION,
  })
  type: AppointmentType;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  cancelReason: string;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ default: false })
  reminderSent: boolean;

  @Column({ nullable: true })
  reminderSentAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: {
    room?: string;
    equipment?: string[];
    preparation?: string;
    followUpDate?: string;
  };

  @Column({ nullable: true })
  checkedInAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  // Relations
  @ManyToOne(() => Patient, (patient) => patient.appointments)
  patient: Patient;

  @Column()
  patientId: string;

  @ManyToOne(() => User, (user) => user.doctorAppointments)
  doctor: User;

  @Column()
  doctorId: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organizationId: string;

  @OneToOne(() => Consultation, (consultation) => consultation.appointment)
  consultation: Consultation;
}
