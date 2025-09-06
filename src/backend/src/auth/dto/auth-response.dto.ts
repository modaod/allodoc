import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty({ type: [String] })
    roles: string[];

    @ApiProperty()
    organizationId: string;
}

export class AuthResponseDto {
    @ApiProperty({ type: UserInfoDto })
    user: UserInfoDto;

    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;

    @ApiProperty({
        description: 'Seconds until access token expires',
        example: 3600,
    })
    expiresIn: number;
}
