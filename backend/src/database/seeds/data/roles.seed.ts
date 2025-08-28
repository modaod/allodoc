import { INestApplicationContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role, RoleName } from '../../../users/entities/role.entity';

const roleData = [
    {
        name: RoleName.SUPER_ADMIN,
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: [
            'system.manage',
            'organizations.manage',
            'users.manage',
            'roles.manage',
            'audit.view',
            'settings.manage',
        ],
    },
    {
        name: RoleName.ADMIN,
        displayName: 'Administrator',
        description: 'Organization-level administrator',
        permissions: [
            'users.manage',
            'patients.manage',
            'appointments.manage',
            'consultations.manage',
            'prescriptions.manage',
            'reports.view',
            'settings.view',
        ],
    },
    {
        name: RoleName.DOCTOR,
        displayName: 'Doctor',
        description: 'Medical practitioner with clinical access',
        permissions: [
            'patients.view',
            'patients.create',
            'patients.update',
            'appointments.view',
            'appointments.update',
            'consultations.create',
            'consultations.view',
            'consultations.update',
            'prescriptions.create',
            'prescriptions.view',
            'prescriptions.update',
            'medical_history.view',
            'medical_history.update',
        ],
    },
    {
        name: RoleName.SECRETARY,
        displayName: 'Secretary',
        description: 'Front desk staff with administrative and basic clinical access',
        permissions: [
            'patients.view',
            'patients.create',
            'patients.update',
            'appointments.view',
            'appointments.create',
            'appointments.update',
            'appointments.cancel',
            'consultations.view',
            'prescriptions.view',
            'vital_signs.create',
            'medical_history.view',
        ],
    },
];

export async function seedRoles(app: INestApplicationContext): Promise<void> {
    const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));

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
            console.log(`  ⏭️  Role already exists: ${data.displayName}`);
        }
    }
}