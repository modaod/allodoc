import {
    IsString,
    IsDateString,
    IsOptional,
    IsUUID,
    IsNumber,
    IsBoolean,
    IsObject,
    IsArray,
    Min,
} from 'class-validator';

export class CreateConsultationDto {
    @IsDateString()
    consultationDate: string;

    @IsString()
    reason: string;

    @IsOptional()
    @IsString()
    symptoms?: string;

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
}
