import {
    IsString,
    IsDateString,
    IsOptional,
    IsUUID,
    IsNumber,
    IsObject,
    IsArray,
    ValidateNested,
    IsEnum,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VitalSignsDto } from './vital-signs.dto';

// Embedded prescription DTO for integrated prescription creation
export class EmbeddedPrescriptionDto {
    @IsString()
    medicationName: string;

    @IsString()
    dosage: string;

    @IsString()
    frequency: string;

    @IsString()
    duration: string;

    @IsOptional()
    @IsString()
    instructions?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(999, { message: 'Quantity cannot exceed 999' })
    quantity?: number;
}

// Consultation types enum
export enum ConsultationType {
    INITIAL = 'INITIAL',
    FOLLOW_UP = 'FOLLOW_UP',
    EMERGENCY = 'EMERGENCY',
    ROUTINE_CHECKUP = 'ROUTINE_CHECKUP',
    SPECIALIST = 'SPECIALIST',
    TELEMEDICINE = 'TELEMEDICINE'
}

export class CreateConsultationDto {
    @IsDateString()
    consultationDate: string; // Will be validated in service to prevent future dates

    @IsEnum(ConsultationType)
    type: ConsultationType;

    @IsString()
    reason: string;

    @IsOptional()
    @IsString()
    symptoms?: string;

    @IsOptional()
    @IsString()
    physicalExamination?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => VitalSignsDto)
    vitalSigns?: VitalSignsDto;

    @IsOptional()
    @IsString()
    diagnosis?: string;

    @IsOptional()
    @IsString()
    treatmentPlan?: string;

    @IsOptional()
    @IsString()
    recommendations?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    investigations?: string[];

    @IsOptional()
    @IsString()
    followUpInstructions?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsUUID()
    patientId: string;

    // doctorId removed - always set from authenticated user context for security

    @IsOptional()
    @IsUUID()
    appointmentId?: string;

    @IsOptional()
    @IsObject()
    metadata?: {
        consultationType?: 'first_visit' | 'follow_up' | 'emergency';
        referredBy?: string;
        referralReason?: string;
        complications?: string[];
    };

    // Integrated prescriptions for simplified workflow
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EmbeddedPrescriptionDto)
    prescriptions?: EmbeddedPrescriptionDto[];
}
