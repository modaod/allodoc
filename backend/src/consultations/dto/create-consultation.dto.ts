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
} from 'class-validator';
import { Type } from 'class-transformer';

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
    consultationDate: string;

    @IsEnum(ConsultationType)
    type: ConsultationType;

    // Support both reason and chiefComplaint for compatibility
    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsString()
    chiefComplaint?: string;

    @IsOptional()
    @IsString()
    symptoms?: string;

    @IsOptional()
    @IsString()
    historyOfPresentIllness?: string;

    @IsOptional()
    @IsString()
    physicalExamination?: string;

    @IsOptional()
    @IsObject()
    vitalSigns?: {
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
        bmi: number;
    };

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

    @IsUUID()
    doctorId: string;

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
