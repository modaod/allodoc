import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
    @ApiProperty({ description: 'Total number of patients in the organization' })
    totalPatients: number;

    @ApiProperty({ description: 'Number of consultations today' })
    todayConsultations: number;

    @ApiProperty({ description: 'Number of consultations this week' })
    thisWeekConsultations: number;

    @ApiProperty({ description: 'Total number of consultations' })
    totalConsultations: number;
}
