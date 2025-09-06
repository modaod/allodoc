import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, OrganizationType } from './entities/organization.entity';

@Injectable()
export class OrganizationsRepository {
    constructor(
        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,
    ) {}

    async create(organizationData: Partial<Organization>): Promise<Organization> {
        const organization = this.organizationRepository.create(organizationData);
        return await this.organizationRepository.save(organization);
    }

    async findById(id: string): Promise<Organization> {
        const organization = await this.organizationRepository.findOne({
            where: { id },
            relations: ['users'],
        });

        if (!organization) {
            throw new NotFoundException(`Organization with ID ${id} not found`);
        }

        return organization;
    }

    async findAll(): Promise<Organization[]> {
        return await this.organizationRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    async findByType(type: OrganizationType): Promise<Organization[]> {
        return await this.organizationRepository.find({
            where: { type, isActive: true },
            order: { name: 'ASC' },
        });
    }

    async update(id: string, updateData: Partial<Organization>): Promise<Organization> {
        await this.organizationRepository.update(id, updateData);
        return this.findById(id);
    }

    async deactivate(id: string): Promise<Organization> {
        await this.organizationRepository.update(id, { isActive: false });
        return this.findById(id);
    }

    async findByName(name: string): Promise<Organization | null> {
        return await this.organizationRepository.findOne({
            where: { name },
        });
    }

    async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
        const query = this.organizationRepository
            .createQueryBuilder('org')
            .where('org.name = :name', { name });

        if (excludeId) {
            query.andWhere('org.id != :excludeId', { excludeId });
        }

        const count = await query.getCount();
        return count > 0;
    }
}
