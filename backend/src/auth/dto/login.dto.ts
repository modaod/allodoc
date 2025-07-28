import { IsEmail, IsString, MinLength, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        example: 'admin@demo-medical.com',
        description: 'User email address',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'Admin123!',
        description: 'User password (minimum 8 characters)',
    })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({
        example: 'uuid-org-123',
        description: 'Organization ID for multi-tenant login',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    organizationId?: string;
}
