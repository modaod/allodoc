import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from './entities/role.entity';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class RolesRepository {
    private readonly logger = new Logger(RolesRepository.name);

    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        private readonly cacheService: CacheService,
    ) {}

    async findAll(): Promise<Role[]> {
        return await this.roleRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    async findById(id: string): Promise<Role> {
        const role = await this.roleRepository.findOne({ where: { id } });

        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }

        return role;
    }

    async findByName(name: RoleName): Promise<Role> {
        const role = await this.roleRepository.findOne({ where: { name } });

        if (!role) {
            throw new NotFoundException(`Role ${name} not found`);
        }

        return role;
    }

    async findByIds(ids: string[]): Promise<Role[]> {
        return await this.roleRepository.findByIds(ids);
    }

    async create(roleData: Partial<Role>): Promise<Role> {
        const role = this.roleRepository.create(roleData);
        const savedRole = await this.roleRepository.save(role);
        
        // Clear all permissions cache since a new role was created
        await this.clearPermissionsCache();
        
        return savedRole;
    }

    async update(id: string, updateData: Partial<Role>): Promise<Role> {
        await this.roleRepository.update(id, updateData);
        const updatedRole = await this.findById(id);
        
        // Clear all permissions cache since role was updated
        await this.clearPermissionsCache();
        
        return updatedRole;
    }

    /**
     * Clear all permissions cache
     * Called when roles are created, updated, or deleted
     */
    private async clearPermissionsCache(): Promise<void> {
        await this.cacheService.clearAllPermissionsCache();
        this.logger.debug('Cleared all permissions cache due to role change');
    }
}
