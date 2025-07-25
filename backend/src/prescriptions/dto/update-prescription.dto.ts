import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class UpdatePrescriptionDto {
    @IsOptional()
    @IsString()
    notes?: string;
}