import { IsNumber, IsOptional, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class BloodPressureDto {
  @IsNumber()
  @Min(40, { message: 'Systolic blood pressure must be at least 40 mmHg' })
  @Max(300, { message: 'Systolic blood pressure must not exceed 300 mmHg' })
  systolic: number;

  @IsNumber()
  @Min(20, { message: 'Diastolic blood pressure must be at least 20 mmHg' })
  @Max(200, { message: 'Diastolic blood pressure must not exceed 200 mmHg' })
  diastolic: number;
}

export class VitalSignsDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BloodPressureDto)
  bloodPressure?: BloodPressureDto;

  @IsOptional()
  @IsNumber()
  @Min(20, { message: 'Heart rate must be at least 20 bpm' })
  @Max(300, { message: 'Heart rate must not exceed 300 bpm' })
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(25, { message: 'Temperature must be at least 25°C (hypothermia limit)' })
  @Max(45, { message: 'Temperature must not exceed 45°C (hyperthermia limit)' })
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(5, { message: 'Respiratory rate must be at least 5 breaths/min' })
  @Max(60, { message: 'Respiratory rate must not exceed 60 breaths/min' })
  respiratoryRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(50, { message: 'Oxygen saturation must be at least 50%' })
  @Max(100, { message: 'Oxygen saturation must not exceed 100%' })
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.5, { message: 'Weight must be at least 0.5 kg' })
  @Max(700, { message: 'Weight must not exceed 700 kg' })
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(20, { message: 'Height must be at least 20 cm' })
  @Max(300, { message: 'Height must not exceed 300 cm' })
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(10, { message: 'BMI must be at least 10' })
  @Max(100, { message: 'BMI must not exceed 100' })
  bmi?: number;
}