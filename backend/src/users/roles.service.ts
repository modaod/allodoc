import { Injectable } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { Role, RoleName } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
  ) {}

  async findAll(): Promise<Role[]> {
    return await this.rolesRepository.findAll();
  }

  async findById(id: string): Promise<Role> {
    return await this.rolesRepository.findById(id);
  }

  async findByName(name: RoleName): Promise<Role> {
    return await this.rolesRepository.findByName(name);
  }

  async create(roleData: Partial<Role>): Promise<Role> {
    return await this.rolesRepository.create(roleData);
  }

  async update(id: string, updateData: Partial<Role>): Promise<Role> {
    return await this.rolesRepository.update(id, updateData);
  }

  async getPermissionsForUser(userRoles: Role[]): Promise<string[]> {
    const allPermissions = new Set<string>();
    
    userRoles.forEach(role => {
      role.permissions.forEach(permission => {
        allPermissions.add(permission);
      });
    });

    return Array.from(allPermissions);
  }

  async hasPermission(userRoles: Role[], requiredPermission: string): Promise<boolean> {
    const permissions = await this.getPermissionsForUser(userRoles);
    
    // Vérifier permission exacte
    if (permissions.includes(requiredPermission)) {
      return true;
    }

    // Vérifier permission wildcard (ex: "patients:*")
    const [resource, action] = requiredPermission.split(':');
    const wildcardPermission = `${resource}:*`;
    
    if (permissions.includes(wildcardPermission)) {
      return true;
    }

    // Vérifier permission globale
    if (permissions.includes('*')) {
      return true;
    }

    return false;
  }
}