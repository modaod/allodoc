import { ApiProperty } from '@nestjs/swagger';

export class ActivityItemDto {
    @ApiProperty({ description: 'Type of activity' })
    type: 'consultation' | 'patient' | 'prescription';

    @ApiProperty({ description: 'Activity title' })
    title: string;

    @ApiProperty({ description: 'Activity description' })
    description: string;

    @ApiProperty({ description: 'Activity timestamp' })
    timestamp: Date;

    @ApiProperty({ description: 'Material icon name for UI' })
    icon: string;

    @ApiProperty({ description: 'ID of the related entity', required: false })
    entityId?: string;
}

export class RecentActivityDto {
    @ApiProperty({ 
        description: 'List of recent activities',
        type: [ActivityItemDto]
    })
    activities: ActivityItemDto[];
}