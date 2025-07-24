import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchDto } from '../../common/dto/search.dto';

export class DoctorSearchDto extends SearchDto {
  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  acceptsNewPatients?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxFee?: number;

  @IsOptional()
  @IsString()
  availableDay?: string; // 'monday', 'tuesday', etc.
}
