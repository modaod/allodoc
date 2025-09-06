import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { SystemStatsDto } from './dto/system-stats.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { MoveUserDto } from './dto/move-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateOrganizationDto } from '../organizations/dto/create-organization.dto';
import { UpdateOrganizationDto } from '../organizations/dto/update-organization.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Organization } from '../organizations/entities/organization.entity';
import { Patient } from '../patients/entities/patient.entity';

@ApiTags('super-admin')
@ApiBearerAuth('JWT-auth')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN)
export class SuperAdminController {
    constructor(private readonly superAdminService: SuperAdminService) {}

    // =============================
    // SYSTEM STATISTICS
    // =============================
    @Get('system-stats')
    @ApiOperation({ summary: 'Get system-wide statistics' })
    @ApiResponse({
        status: 200,
        description: 'System statistics retrieved successfully',
        type: SystemStatsDto,
    })
    async getSystemStats(): Promise<SystemStatsDto> {
        return await this.superAdminService.getSystemStats();
    }

    // =============================
    // USER MANAGEMENT
    // =============================
    @Get('users')
    @ApiOperation({ summary: 'Get all users across all organizations' })
    @ApiResponse({
        status: 200,
        description: 'Users retrieved successfully',
    })
    async getAllUsers(@Query() paginationDto: PaginationDto) {
        return await this.superAdminService.getAllUsers(paginationDto);
    }

    @Post('users')
    @ApiOperation({ summary: 'Create a user in any organization' })
    @ApiResponse({
        status: 201,
        description: 'User created successfully',
        type: User,
    })
    async createUser(
        @Body() createUserDto: CreateUserDto & { organizationId: string },
        @CurrentUser() currentUser: User,
    ): Promise<User> {
        return await this.superAdminService.createUserInAnyOrganization(createUserDto, currentUser);
    }

    @Post('users/:userId/roles')
    @ApiOperation({ summary: 'Assign roles to a user' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({
        status: 200,
        description: 'Roles assigned successfully',
        type: User,
    })
    async assignRoles(
        @Param('userId') userId: string,
        @Body() assignRoleDto: AssignRoleDto,
    ): Promise<User> {
        return await this.superAdminService.assignRoles(userId, assignRoleDto);
    }

    @Post('users/:userId/move-organization')
    @ApiOperation({ summary: 'Move a user to a different organization' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({
        status: 200,
        description: 'User moved successfully',
        type: User,
    })
    async moveUserToOrganization(
        @Param('userId') userId: string,
        @Body() moveUserDto: MoveUserDto,
    ): Promise<User> {
        return await this.superAdminService.moveUserToOrganization(userId, moveUserDto);
    }

    @Patch('users/:userId/toggle-status')
    @ApiOperation({ summary: 'Toggle user active status' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({
        status: 200,
        description: 'User status toggled successfully',
        type: User,
    })
    async toggleUserStatus(@Param('userId') userId: string): Promise<User> {
        return await this.superAdminService.toggleUserStatus(userId);
    }

    @Delete('users/:userId')
    @ApiOperation({ summary: 'Deactivate a user (soft delete)' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({
        status: 200,
        description: 'User deactivated successfully',
    })
    async deleteUser(@Param('userId') userId: string): Promise<void> {
        return await this.superAdminService.deleteUser(userId);
    }

    // =============================
    // ORGANIZATION MANAGEMENT
    // =============================
    @Get('organizations')
    @ApiOperation({ summary: 'Get all organizations with statistics' })
    @ApiResponse({
        status: 200,
        description: 'Organizations retrieved successfully',
    })
    async getAllOrganizations(@Query() paginationDto: PaginationDto) {
        return await this.superAdminService.getAllOrganizations(paginationDto);
    }

    @Post('organizations')
    @ApiOperation({ summary: 'Create a new organization' })
    @ApiResponse({
        status: 201,
        description: 'Organization created successfully',
        type: Organization,
    })
    async createOrganization(
        @Body() createOrganizationDto: CreateOrganizationDto,
        @CurrentUser() currentUser: User,
    ): Promise<Organization> {
        return await this.superAdminService.createOrganization(createOrganizationDto, currentUser);
    }

    @Put('organizations/:organizationId')
    @ApiOperation({ summary: 'Update an organization' })
    @ApiParam({ name: 'organizationId', description: 'Organization ID' })
    @ApiResponse({
        status: 200,
        description: 'Organization updated successfully',
        type: Organization,
    })
    async updateOrganization(
        @Param('organizationId') organizationId: string,
        @Body() updateOrganizationDto: UpdateOrganizationDto,
        @CurrentUser() currentUser: User,
    ): Promise<Organization> {
        return await this.superAdminService.updateOrganization(
            organizationId,
            updateOrganizationDto,
            currentUser,
        );
    }

    @Delete('organizations/:organizationId')
    @ApiOperation({ summary: 'Delete (deactivate) an organization' })
    @ApiParam({ name: 'organizationId', description: 'Organization ID' })
    @ApiResponse({
        status: 200,
        description: 'Organization deleted successfully',
    })
    async deleteOrganization(@Param('organizationId') organizationId: string): Promise<void> {
        return await this.superAdminService.deleteOrganization(organizationId);
    }

    // =============================
    // PATIENT MANAGEMENT
    // =============================
    @Get('patients')
    @ApiOperation({ summary: 'Get all patients across all organizations' })
    @ApiResponse({
        status: 200,
        description: 'Patients retrieved successfully',
    })
    async getAllPatients(@Query() paginationDto: PaginationDto) {
        return await this.superAdminService.getAllPatients(paginationDto);
    }
}
