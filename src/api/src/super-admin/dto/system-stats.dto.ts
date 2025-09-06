import { ApiProperty } from '@nestjs/swagger';

export class SystemStatsDto {
    @ApiProperty({ description: 'Total number of organizations in the system' })
    totalOrganizations: number;

    @ApiProperty({ description: 'Total number of users across all organizations' })
    totalUsers: number;

    @ApiProperty({ description: 'Total number of patients across all organizations' })
    totalPatients: number;

    @ApiProperty({ description: 'Total number of consultations across all organizations' })
    totalConsultations: number;

    @ApiProperty({ description: 'Total number of prescriptions across all organizations' })
    totalPrescriptions: number;

    @ApiProperty({ description: 'Total number of appointments across all organizations' })
    totalAppointments: number;

    @ApiProperty({ description: 'Number of active users (logged in within last 30 days)' })
    activeUsers: number;

    @ApiProperty({ description: 'User breakdown by role' })
    usersByRole: {
        [key: string]: number;
    };

    @ApiProperty({ description: 'Top 5 organizations by user count' })
    topOrganizations: Array<{
        id: string;
        name: string;
        userCount: number;
        patientCount: number;
    }>;
}
