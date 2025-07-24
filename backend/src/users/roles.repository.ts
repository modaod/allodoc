import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from './entities/role.entity';

@Injectable()
export class RolesRepository {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
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
    return await this.roleRepository.save(role);
  }

  async update(id: string, updateData: Partial<Role>): Promise<Role> {
    await this.roleRepository.update(id, updateData);
    return this.findById(id);
  }
}