import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveUserDto {
    @ApiProperty({
        description: 'The new organization ID to move the user to',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    organizationId: string;
}
