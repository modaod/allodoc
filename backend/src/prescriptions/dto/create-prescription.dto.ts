import {
    IsArray,
    IsString,
    IsDateString,
    IsOptional,
    IsEnum,
    IsUUID,
    ValidateNested,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class MedicationDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    genericName?: string;

    @IsString()
    dosage: string;

    @IsString()
    frequency: string;

    @IsString()
    duration: string;

    @IsString()
    instructions: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(999, { message: 'Quantity cannot exceed 999' })
    quantity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(12, { message: 'Refills cannot exceed 12' })
    refills?: number;
}

class WarningDto {
    @IsEnum(['allergy', 'interaction', 'contraindication', 'warning'])
    type: 'allergy' | 'interaction' | 'contraindication' | 'warning';

    @IsString()
    message: string;

    @IsEnum(['low', 'medium', 'high', 'critical'])
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export class CreatePrescriptionDto {
    @IsUUID()
    patientId: string;

    // doctorId removed - always set from authenticated user context for security

    @IsOptional()
    @IsUUID()
    consultationId?: string; // Now optional for standalone prescriptions

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MedicationDto)
    medications: MedicationDto[];

    @IsOptional()
    @IsString()
    generalInstructions?: string;

    // prescribedDate removed - always set by system to current timestamp

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WarningDto)
    warnings?: WarningDto[];
}
