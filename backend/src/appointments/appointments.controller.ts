import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { SearchDto } from '../common/dto/search.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/organization.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async create(
        @Body() createAppointmentDto: CreateAppointmentDto,
        @CurrentOrganization() organizationId: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.create(createAppointmentDto, organizationId, currentUser);
    }

    @Get()
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async search(
        @Query() searchDto: SearchDto,
        @CurrentOrganization() organizationId: string,
    ) {
        return this.appointmentsService.search(searchDto, organizationId);
    }

    @Get('today')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async getToday(@CurrentOrganization() organizationId: string) {
        return this.appointmentsService.findTodayAppointments(organizationId);
    }

    @Get('upcoming')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async getUpcoming(
        @CurrentOrganization() organizationId: string,
        @Query('limit') limit?: number,
    ) {
        return this.appointmentsService.findUpcoming(organizationId, limit);
    }

    @Get('doctor/:doctorId/schedule')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async getDoctorSchedule(
        @Param('doctorId', ParseUUIDPipe) doctorId: string,
        @Query('date') date: string,
    ) {
        return this.appointmentsService.getDoctorSchedule(doctorId, new Date(date));
    }

    @Get('stats')
    @Roles(RoleName.ADMIN)
    async getStats(@CurrentOrganization() organizationId: string) {
        return this.appointmentsService.getStats(organizationId);
    }

    @Get(':id')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.appointmentsService.findById(id);
    }

    @Patch(':id')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAppointmentDto: UpdateAppointmentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.update(id, updateAppointmentDto, currentUser);
    }

    @Patch(':id/cancel')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('reason') reason: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.cancel(id, reason, currentUser);
    }

    @Patch(':id/confirm')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async confirm(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.confirm(id, currentUser);
    }

    @Patch(':id/check-in')
    @Roles(RoleName.SECRETARY, RoleName.DOCTOR)
    async checkIn(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.checkIn(id, currentUser);
    }

    @Patch(':id/complete')
    @Roles(RoleName.DOCTOR)
    async complete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.complete(id, currentUser);
    }

    @Patch(':id/no-show')
    @Roles(RoleName.SECRETARY, RoleName.DOCTOR)
    async markNoShow(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.markNoShow(id, currentUser);
    }
}
