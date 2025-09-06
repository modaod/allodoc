import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from '../common/guards/organization.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/organization.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { RecentActivityDto } from './dto/recent-activity.dto';

@ApiTags('dashboard')
@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
    private readonly logger = new Logger(DashboardController.name);

    constructor(private readonly dashboardService: DashboardService) {}

    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    @ApiResponse({
        status: 200,
        description: 'Dashboard statistics retrieved successfully',
        type: DashboardStatsDto,
    })
    async getStats(@CurrentUser() user: any): Promise<DashboardStatsDto> {
        try {
            this.logger.log(
                `Controller: getStats called with user: ${user?.id} and orgId: ${user?.organizationId}`,
            );
            const result = await this.dashboardService.getDashboardStats(
                user.id,
                user.organizationId,
            );
            this.logger.log(`Controller: getStats completed successfully`);
            return result;
        } catch (error) {
            this.logger.error(`Controller: getStats error: ${error.message}`, error.stack);
            throw error;
        }
    }

    @Get('recent-activity')
    @ApiOperation({ summary: 'Get recent activity' })
    @ApiResponse({
        status: 200,
        description: 'Recent activity retrieved successfully',
        type: RecentActivityDto,
    })
    async getRecentActivity(@CurrentUser() user: any): Promise<RecentActivityDto> {
        return this.dashboardService.getRecentActivity(user.id, user.organizationId);
    }
}
