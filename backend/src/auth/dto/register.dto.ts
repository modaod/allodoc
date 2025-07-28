import { IsEmail, IsString, MinLength, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'john.doe@clinic.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePassword123!' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    @Length(2, 50)
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @Length(2, 50)
    lastName: string;

    @ApiProperty({ example: 'uuid-org-123' })
    @IsUUID()
    organizationId: string;
}
