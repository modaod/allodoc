import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsDateString()
    lastVisit?: string;
}
