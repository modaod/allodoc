import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { PrescriptionStatus } from "../entities/prescription.entity";

export class UpdatePrescriptionDto {
    @IsOptional()
    @IsEnum(PrescriptionStatus)
    status?: PrescriptionStatus; // ACTIVE -> CANCELLED/EXPIRED

    @IsOptional()
    @IsString()
    notes?: string; // Administrative notes

    @IsOptional()
    @IsBoolean()
    isDispensed?: boolean;

    // ❌ NO: medications, validUntil, prescribedDate
    // ❌ Create new prescription instead
}