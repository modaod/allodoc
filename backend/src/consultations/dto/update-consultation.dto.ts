import { IsBoolean, IsDateString, IsObject, IsOptional, IsString } from "class-validator";


export class UpdateConsultationDto {
    @IsOptional()
    @IsBoolean()
    isPaid?: boolean;

    @IsOptional()
    @IsString()
    notes?: string; // Private doctor notes only

    // Allow vital signs updates for administrative corrections
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
        bmi?: number;
    };

    // ❌ NO: diagnosis, symptoms, vitalSigns, treatmentPlan
    // ❌ These should be immutable for legal reasons
}