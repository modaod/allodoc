import { RoleName } from '../../users/entities/role.entity';

export const DEFAULT_ROLES = [
    { name: RoleName.SUPER_ADMIN, description: 'Super administrator' },
    { name: RoleName.ADMIN, description: 'Administrator' },
    { name: RoleName.DOCTOR, description: 'Doctor' },
];
