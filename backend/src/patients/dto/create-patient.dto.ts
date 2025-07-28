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
    Max,
} from 'class-validator';

export class CreatePatientDto {
    @IsString()
    @Length(2, 50)
    firstName: string;

    @IsString()
    @Length(2, 50)
    lastName: string;

    @IsDateString()
    dateOfBirth: string;

    @IsEnum(['M', 'F'])
    gender: 'M' | 'F';

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
    @IsString()
    notes?: string;
}
