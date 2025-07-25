import { Transform } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsOptional,
  Length,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
  IsObject,
  MinLength,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @Length(2, 50)
  lastName: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  phone?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dateOfBirth?: Date;

  @IsOptional()
  @IsEnum(['M', 'F'])
  gender?: 'M' | 'F';

  @IsUUID()
  organizationId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];

  // =============================
  // DOCTOR-SPECIFIC FIELDS
  // =============================
  @IsOptional()
  @IsString()
  @Length(5, 50)
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  specialty?: string;
}
