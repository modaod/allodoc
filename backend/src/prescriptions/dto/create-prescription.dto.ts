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
    quantity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
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

    @IsOptional()
    @IsUUID()
    doctorId?: string; // Optional - will use current user if not provided

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

    @IsDateString()
    prescribedDate: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WarningDto)
    warnings?: WarningDto[];
}
