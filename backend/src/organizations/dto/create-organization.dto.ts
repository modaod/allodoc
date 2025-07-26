import { IsString, IsEmail, IsEnum, IsOptional, Length, IsObject } from 'class-validator';
import { OrganizationType } from '../entities/organization.entity';

export class CreateOrganizationDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsEnum(OrganizationType)
  type: OrganizationType;

  @IsString()
  @Length(10, 200)
  address: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  phone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(5, 20)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;
}