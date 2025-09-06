import { Injectable, ConflictException } from '@nestjs/common';
import { OrganizationsRepository } from './organizations.repository';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization, OrganizationType } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
    constructor(private readonly organizationsRepository: OrganizationsRepository) {}

    async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
        // Check that the name doesn't already exist
        const nameExists = await this.organizationsRepository.checkNameExists(
            createOrganizationDto.name,
        );

        if (nameExists) {
            throw new ConflictException('An organization with this name already exists');
        }

        return await this.organizationsRepository.create(createOrganizationDto);
    }

    async findAll(): Promise<Organization[]> {
        return await this.organizationsRepository.findAll();
    }

    async findById(id: string): Promise<Organization> {
        return await this.organizationsRepository.findById(id);
    }

    async findByType(type: OrganizationType): Promise<Organization[]> {
        return await this.organizationsRepository.findByType(type);
    }

    async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
        // Check that the name doesn't already exist (if changed)
        if (updateOrganizationDto.name) {
            const nameExists = await this.organizationsRepository.checkNameExists(
                updateOrganizationDto.name,
                id,
            );

            if (nameExists) {
                throw new ConflictException('An organization with this name already exists');
            }
        }

        return await this.organizationsRepository.update(id, updateOrganizationDto);
    }

    async deactivate(id: string): Promise<Organization> {
        return await this.organizationsRepository.deactivate(id);
    }

    async getStats(id: string): Promise<{
        totalUsers: number;
        totalPatients: number;
        totalDoctors: number;
        totalSecretaries: number;
    }> {
        const organization = await this.organizationsRepository.findById(id);

        // These statistics will be completed when other services are created
        return {
            totalUsers: organization.users?.length || 0,
            totalPatients: 0, // To implement with PatientsService
            totalDoctors: 0, // To implement with UsersService
            totalSecretaries: 0, // To implement with UsersService
        };
    }
}
