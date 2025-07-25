import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../users/entities/role.entity';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Post()
    @Roles(RoleName.SUPER_ADMIN)
    async create(@Body() createOrganizationDto: CreateOrganizationDto) {
        return this.organizationsService.create(createOrganizationDto);
    }

    @Get()
    @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
    async findAll() {
        return this.organizationsService.findAll();
    }

    @Get(':id')
    @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.organizationsService.findById(id);
    }

    @Patch(':id')
    @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateOrganizationDto: UpdateOrganizationDto,
    ) {
        return this.organizationsService.update(id, updateOrganizationDto);
    }

    @Delete(':id')
    @Roles(RoleName.SUPER_ADMIN)
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.organizationsService.deactivate(id);
    }

    @Get(':id/stats')
    @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
    async getStats(@Param('id', ParseUUIDPipe) id: string) {
        return this.organizationsService.getStats(id);
    }
}