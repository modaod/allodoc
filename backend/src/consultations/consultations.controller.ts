import { Controller, Get, Post, Body, Patch, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { SearchDto } from '../common/dto/search.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/organization.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
export class ConsultationsController {
    constructor(private readonly consultationsService: ConsultationsService) {}

    @Post()
    @Roles(RoleName.DOCTOR)
    async create(
        @Body() createConsultationDto: CreateConsultationDto,
        @CurrentOrganization() organizationId: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.consultationsService.create(createConsultationDto, organizationId, currentUser);
    }

    @Get()
    @Roles(RoleName.ADMIN, RoleName.DOCTOR)
    async search(@Query() searchDto: SearchDto, @CurrentOrganization() organizationId: string) {
        return this.consultationsService.search(searchDto, organizationId);
    }

    @Get('today')
    @Roles(RoleName.ADMIN, RoleName.DOCTOR)
    async getTodayConsultations(@CurrentOrganization() organizationId: string) {
        return this.consultationsService.getTodayConsultations(organizationId);
    }

    @Get('this-week')
    @Roles(RoleName.ADMIN, RoleName.DOCTOR)
    async getThisWeekConsultations(@CurrentOrganization() organizationId: string) {
        return this.consultationsService.getThisWeekConsultations(organizationId);
    }

    @Get('recent')
    @Roles(RoleName.ADMIN, RoleName.DOCTOR)
    async getRecent(@CurrentOrganization() organizationId: string, @Query('limit') limit?: number) {
        return this.consultationsService.findRecentConsultations(organizationId, limit);
    }

    @Get('patient/:patientId/history')
    @Roles(RoleName.DOCTOR, RoleName.ADMIN)
    async getPatientHistory(@Param('patientId', ParseUUIDPipe) patientId: string) {
        return this.consultationsService.getPatientMedicalHistory(patientId);
    }

    @Get('stats')
    @Roles(RoleName.ADMIN)
    async getStats(@CurrentOrganization() organizationId: string) {
        return this.consultationsService.getStats(organizationId);
    }

    @Get(':id')
    @Roles(RoleName.DOCTOR, RoleName.ADMIN)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.consultationsService.findById(id);
    }

    @Patch(':id')
    @Roles(RoleName.DOCTOR)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateConsultationDto: UpdateConsultationDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.consultationsService.update(id, updateConsultationDto, currentUser);
    }

    @Post(':id/attachments')
    @Roles(RoleName.DOCTOR)
    async addAttachment(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() attachment: any,
        @CurrentUser() currentUser: User,
    ) {
        return this.consultationsService.addAttachment(id, attachment, currentUser);
    }
}
