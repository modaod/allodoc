import {
    IsString,
    IsEmail,
    IsOptional,
    IsEnum,
    IsDateString,
    IsObject,
    IsArray,
    Length,
    IsNumber,
    Min,
    Max
} from 'class-validator';
import { BloodType, MaritalStatus } from '../entities/patient.entity';

export class CreatePatientDto {
    @IsString()
    @Length(2, 50)
    firstName: string;

    @IsString()
    @Length(2, 50)
    lastName: string;

    @IsDateString()
    dateOfBirth: string;

    @IsEnum(['M', 'F', 'OTHER'])
    gender: 'M' | 'F' | 'OTHER';

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsString()
    @Length(8, 20)
    phone: string;

    @IsOptional()
    @IsString()
    @Length(8, 20)
    alternatePhone?: string;

    @IsString()
    @Length(10, 200)
    address: string;

    @IsOptional()
    @IsString()
    @Length(2, 100)
    city?: string;

    @IsOptional()
    @IsString()
    @Length(3, 20)
    postalCode?: string;

    @IsOptional()
    @IsString()
    @Length(2, 100)
    country?: string;

    @IsOptional()
    @IsString()
    @Length(2, 50)
    nationality?: string;

    @IsOptional()
    @IsEnum(MaritalStatus)
    maritalStatus?: MaritalStatus;

    @IsOptional()
    @IsString()
    @Length(2, 100)
    occupation?: string;

    @IsOptional()
    @IsEnum(BloodType)
    bloodType?: BloodType;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(50)
    @Max(250)
    height?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(500)
    weight?: number;

    @IsOptional()
    @IsObject()
    emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
        email?: string;
        address?: string;
    };

    @IsOptional()
    @IsObject()
    medicalHistory?: {
        allergies?: string[];
        chronicDiseases?: string[];
        surgeries?: Array<{
            procedure: string;
            date: string;
            hospital?: string;
            notes?: string;
        }>;
        medications?: Array<{
            name: string;
            dosage: string;
            frequency: string;
            startDate?: string;
            endDate?: string;
        }>;
        familyHistory?: {
            diseases?: string[];
            notes?: string;
        };
    };

    @IsOptional()
    @IsObject()
    insurance?: {
        provider?: string;
        policyNumber?: string;
        groupNumber?: string;
        validUntil?: string;
    };

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsObject()
    preferences?: {
        language?: string;
        preferredContactMethod?: 'phone' | 'email' | 'sms';
        appointmentReminders?: boolean;
        marketingConsent?: boolean;
    };
}
