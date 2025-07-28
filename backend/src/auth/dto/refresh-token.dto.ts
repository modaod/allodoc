import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token for generating new access token',
    })
    @IsString()
    refreshToken: string;
}
