import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { AppointmentType } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsDateString()
  appointmentDate: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  duration?: number;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    room?: string;
    equipment?: string[];
    preparation?: string;
    followUpDate?: string;
  };
}
