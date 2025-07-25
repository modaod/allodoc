import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsOptional, IsEnum, IsString, IsDateString, IsBoolean } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @IsOptional()
    @IsString()
    cancelReason?: string;

    @IsOptional()
    @IsDateString()
    checkedInAt?: string;

    @IsOptional()
    @IsDateString()
    completedAt?: string;

    @IsOptional()
    @IsBoolean()
    reminderSent?: boolean;

    @IsOptional()
    @IsDateString()
    reminderSentAt?: string;
}