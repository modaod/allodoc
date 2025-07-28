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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchDto } from '../common/dto/search.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/organization.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) {}

    @Post()
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async create(
        @Body() createPatientDto: CreatePatientDto,
        @CurrentOrganization() organizationId: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.patientsService.create(createPatientDto, organizationId, currentUser);
    }

    @Get()
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async search(@Query() searchDto: SearchDto, @CurrentOrganization() organizationId: string) {
        return this.patientsService.search(searchDto, organizationId);
    }

    @Get('recent')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async getRecent(@CurrentOrganization() organizationId: string, @Query('limit') limit?: number) {
        return this.patientsService.findRecentPatients(organizationId, limit);
    }

    @Get('stats')
    @Roles(RoleName.ADMIN)
    async getStats(@CurrentOrganization() organizationId: string) {
        return this.patientsService.getStats(organizationId);
    }

    @Get('search/by-allergy/:allergen')
    @Roles(RoleName.DOCTOR, RoleName.ADMIN)
    async searchByAllergy(
        @Param('allergen') allergen: string,
        @CurrentOrganization() organizationId: string,
    ) {
        return this.patientsService.searchByAllergy(allergen, organizationId);
    }

    @Get(':id')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.patientsService.findById(id);
    }

    @Patch(':id')
    @Roles(RoleName.ADMIN, RoleName.SECRETARY, RoleName.DOCTOR)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updatePatientDto: UpdatePatientDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.patientsService.update(id, updatePatientDto, currentUser);
    }

    @Delete(':id')
    @Roles(RoleName.ADMIN)
    async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
        return this.patientsService.deactivate(id, currentUser);
    }

    @Post(':id/allergies')
    @Roles(RoleName.DOCTOR, RoleName.ADMIN)
    async addAllergy(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('allergy') allergy: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.patientsService.addAllergy(id, allergy, currentUser);
    }

    @Delete(':id/allergies/:allergy')
    @Roles(RoleName.DOCTOR, RoleName.ADMIN)
    async removeAllergy(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('allergy') allergy: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.patientsService.removeAllergy(id, allergy, currentUser);
    }
}
