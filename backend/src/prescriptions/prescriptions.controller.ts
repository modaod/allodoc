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
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { SearchDto } from '../common/dto/search.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/organization.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    @Post()
    @Roles(RoleName.DOCTOR)
    async create(
        @Body() createPrescriptionDto: CreatePrescriptionDto,
        @CurrentOrganization() organizationId: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.prescriptionsService.create(createPrescriptionDto, organizationId, currentUser);
    }

    @Get()
    @Roles(RoleName.ADMIN, RoleName.DOCTOR, RoleName.SECRETARY)
    async search(
        @Query() searchDto: SearchDto,
        @CurrentOrganization() organizationId: string,
    ) {
        return this.prescriptionsService.search(searchDto, organizationId);
    }

    @Get('expiring')
    @Roles(RoleName.ADMIN, RoleName.DOCTOR, RoleName.SECRETARY)
    async getExpiring(
        @CurrentOrganization() organizationId: string,
        @Query('days') days?: number,
    ) {
        return this.prescriptionsService.findExpiringPrescriptions(organizationId, days);
    }

    @Get('patient/:patientId')
    @Roles(RoleName.DOCTOR, RoleName.ADMIN, RoleName.SECRETARY)
    async getPatientPrescriptions(
        @Param('patientId', ParseUUIDPipe) patientId: string,
        @Query('activeOnly') activeOnly?: boolean,
    ) {
        if (activeOnly) {
            return this.prescriptionsService.findActiveByPatient(patientId);
        }
        return this.prescriptionsService.findByPatient(patientId);
    }

    @Get('stats')
    @Roles(RoleName.ADMIN)
    async getStats(@CurrentOrganization() organizationId: string) {
        return this.prescriptionsService.getStats(organizationId);
    }

    @Get(':id')
    @Roles(RoleName.DOCTOR, RoleName.ADMIN, RoleName.SECRETARY)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.prescriptionsService.findById(id);
    }

    @Patch(':id')
    @Roles(RoleName.DOCTOR, RoleName.ADMIN)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updatePrescriptionDto: UpdatePrescriptionDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.prescriptionsService.update(id, updatePrescriptionDto, currentUser);
    }

    @Patch(':id/cancel')
    @Roles(RoleName.DOCTOR, RoleName.ADMIN)
    async cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('reason') reason: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.prescriptionsService.cancel(id, reason, currentUser);
    }

    @Patch(':id/mark-dispensed')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY)
    async markAsDispensed(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('pharmacyName') pharmacyName: string,
        @Body('pharmacistNotes') pharmacistNotes: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.prescriptionsService.markAsDispensed(id, pharmacyName, pharmacistNotes, currentUser);
    }
}