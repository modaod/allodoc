import { Controller, Get, UseGuards } from '@nestjs/common';
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
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    @ApiResponse({
        status: 200,
        description: 'Dashboard statistics retrieved successfully',
        type: DashboardStatsDto,
    })
    async getStats(
        @CurrentUser('id') userId: string,
        @CurrentOrganization() organizationId: string,
    ): Promise<DashboardStatsDto> {
        return this.dashboardService.getDashboardStats(userId, organizationId);
    }

    @Get('recent-activity')
    @ApiOperation({ summary: 'Get recent activity' })
    @ApiResponse({
        status: 200,
        description: 'Recent activity retrieved successfully',
        type: RecentActivityDto,
    })
    async getRecentActivity(
        @CurrentUser('id') userId: string,
        @CurrentOrganization() organizationId: string,
    ): Promise<RecentActivityDto> {
        return this.dashboardService.getRecentActivity(userId, organizationId);
    }
}