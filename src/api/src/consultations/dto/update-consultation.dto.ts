import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VitalSignsDto } from './vital-signs.dto';

export class UpdateConsultationDto {
    @IsOptional()
    @IsString()
    notes?: string;

    // Allow vital signs updates for administrative corrections
    @IsOptional()
    @ValidateNested()
    @Type(() => VitalSignsDto)
    vitalSigns?: VitalSignsDto;
}
