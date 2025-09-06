import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token for generating new access token (optional - can be sent via cookie)',
        required: false,
    })
    @IsString()
    @IsOptional()
    refreshToken?: string;
}
