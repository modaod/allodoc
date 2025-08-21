import { IsUUID, IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../../users/entities/role.entity';

export class AssignRoleDto {
    @ApiProperty({
        description: 'Array of role names to assign to the user',
        enum: RoleName,
        isArray: true,
        example: [RoleName.DOCTOR, RoleName.ADMIN],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(RoleName, { each: true })
    roles: RoleName[];
}