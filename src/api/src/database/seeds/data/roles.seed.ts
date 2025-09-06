import { INestApplicationContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role, RoleName } from '../../../users/entities/role.entity';
import { PermissionValidator } from '../../../common/validators/permission.validator';

const roleData = [
    {
        name: RoleName.SUPER_ADMIN,
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: ['*'],
    },
    {
        name: RoleName.ADMIN,
        displayName: 'Administrator',
        description: 'Organization-level administrator',
        permissions: [
            'organization:read',
            'organization:write',
            'users:write',
            'patients:write',
            'appointments:write',
            'consultations:write',
            'prescriptions:write',
            'reports:read',
            'settings:read',
        ],
    },
    {
        name: RoleName.DOCTOR,
        displayName: 'Doctor',
        description: 'Medical practitioner with clinical access',
        permissions: [
            'patients:read',
            'patients:write',
            'appointments:read',
            'appointments:write',
            'consultations:read',
            'consultations:write',
            'prescriptions:read',
            'prescriptions:write',
            'medical_history:read',
            'medical_history:write',
        ],
    },
    {
        name: RoleName.SECRETARY,
        displayName: 'Secretary',
        description: 'Front desk staff with administrative and basic clinical access',
        permissions: [
            'patients:read',
            'patients:write',
            'appointments:read',
            'appointments:write',
            'consultations:read',
            'prescriptions:read',
            'vital_signs:write',
            'medical_history:read',
        ],
    },
];

export async function seedRoles(app: INestApplicationContext): Promise<void> {
    const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));
    const permissionValidator = new PermissionValidator();

    // Validate all permissions before seeding
    console.log('  🔍 Validating permissions...');
    for (const data of roleData) {
        try {
            permissionValidator.validatePermissions(data.permissions);
            // Normalize permissions (convert deprecated formats)
            data.permissions = permissionValidator.normalizePermissions(data.permissions);
            console.log(`    ✅ Validated permissions for ${data.displayName}`);
        } catch (error) {
            console.error(`    ❌ Invalid permissions for ${data.displayName}:`, error.message);
            throw error;
        }
    }

    // Seed roles with validated permissions
    for (const data of roleData) {
        const existingRole = await roleRepository.findOne({
            where: { name: data.name },
        });

        if (!existingRole) {
            const role = roleRepository.create({
                ...data,
                isActive: true,
            });
            await roleRepository.save(role);
            console.log(`  ✅ Created role: ${data.displayName}`);
        } else {
            // Update permissions if role exists but permissions changed
            if (JSON.stringify(existingRole.permissions) !== JSON.stringify(data.permissions)) {
                existingRole.permissions = data.permissions;
                await roleRepository.save(existingRole);
                console.log(`  🔄 Updated permissions for: ${data.displayName}`);
            } else {
                console.log(`  ⏭️  Role already exists: ${data.displayName}`);
            }
        }
    }
}
