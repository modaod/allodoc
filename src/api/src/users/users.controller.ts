import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DoctorSearchDto } from './dto/doctor-search.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/organization.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from './entities/role.entity';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
    async create(@Body() createUserDto: CreateUserDto, @CurrentUser() currentUser: User) {
        return this.usersService.create(createUserDto, currentUser);
    }

    @Get('doctors/search')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async searchDoctors(
        @Query() searchDto: DoctorSearchDto,
        @CurrentOrganization() organizationId: string,
    ) {
        return this.usersService.searchDoctors(searchDto, organizationId);
    }

    @Get('doctors/available')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY)
    async getAvailableDoctors(
        @CurrentOrganization() organizationId: string,
        @Query('date') date?: string,
    ) {
        const checkDate = date ? new Date(date) : undefined;
        return this.usersService.findAvailableDoctors(organizationId, checkDate);
    }

    @Get('stats')
    @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
    async getStats(@CurrentOrganization() organizationId: string) {
        return this.usersService.getOrganizationStats(organizationId);
    }

    @Get('profile')
    async getProfile(@CurrentUser() user: User) {
        return this.usersService.findById(user.id);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.usersService.update(id, updateUserDto, currentUser);
    }

    @Delete(':id')
    @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
    async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
        return this.usersService.deactivate(id, currentUser);
    }
}
