import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateConsultationDto {
    @IsOptional()
    @IsString()
    notes?: string;

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
}
