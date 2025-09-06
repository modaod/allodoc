import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../users/entities/user.entity';
import { Role, RoleName } from '../../../users/entities/role.entity';
import { Organization } from '../../../organizations/entities/organization.entity';
import { UserOrganization } from '../../../users/entities/user-organization.entity';

export async function seedUsers(app: INestApplicationContext): Promise<void> {
    const configService = app.get(ConfigService);
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));
    const organizationRepository = app.get<Repository<Organization>>(
        getRepositoryToken(Organization),
    );
    const userOrgRepository = app.get<Repository<UserOrganization>>(
        getRepositoryToken(UserOrganization),
    );

    // Get seed admin credentials from environment
    const adminEmail = configService.get<string>('SEED_ADMIN_EMAIL') || 'admin@allodoc.dev';
    const adminPassword = configService.get<string>('SEED_ADMIN_PASSWORD') || 'Admin123!';

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
        where: { email: adminEmail },
    });

    if (!existingAdmin) {
        // Get SUPER_ADMIN role
        const superAdminRole = await roleRepository.findOne({
            where: { name: RoleName.SUPER_ADMIN },
        });

        if (!superAdminRole) {
            throw new Error('SUPER_ADMIN role not found. Please run roles seed first.');
        }

        // Get default organization
        const organization = await organizationRepository.findOne({
            where: { name: 'AlloCare Medical Center' },
        });

        if (!organization) {
            throw new Error('Default organization not found. Please run organization seed first.');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        // Create admin user
        const adminUser = userRepository.create({
            email: adminEmail,
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            phone: '+1 (555) 000-0001',
            specialty: 'System Administration',
            licenseNumber: 'ADMIN001',
            isActive: true,
            organizationId: organization.id,
            organization: organization,
            roles: [superAdminRole],
            lastLogin: new Date(),
        });

        const savedUser = await userRepository.save(adminUser);

        // Create user-organization relationship
        const userOrg = userOrgRepository.create({
            userId: savedUser.id,
            organizationId: organization.id,
            joinedAt: new Date(),
            lastAccessedAt: new Date(),
        });
        await userOrgRepository.save(userOrg);

        console.log(`  ✅ Created Super Admin user: ${adminEmail}`);
        console.log(`     📧 Email: ${adminEmail}`);
        console.log(`     🔑 Password: ${adminPassword}`);

        // Also create sample doctor and receptionist users
        await createSampleUsers(
            userRepository,
            roleRepository,
            organizationRepository,
            userOrgRepository,
            organization,
        );
    } else {
        console.log(`  ⏭️  Admin user already exists: ${adminEmail}`);
    }
}

async function createSampleUsers(
    userRepository: Repository<User>,
    roleRepository: Repository<Role>,
    organizationRepository: Repository<Organization>,
    userOrgRepository: Repository<UserOrganization>,
    organization: Organization,
): Promise<void> {
    // Create a doctor user
    const doctorEmail = 'doctor@allodoc.dev';
    const existingDoctor = await userRepository.findOne({
        where: { email: doctorEmail },
    });

    if (!existingDoctor) {
        const doctorRole = await roleRepository.findOne({
            where: { name: RoleName.DOCTOR },
        });

        if (doctorRole) {
            const hashedPassword = await bcrypt.hash('Doctor123!', 12);
            const doctor = userRepository.create({
                email: doctorEmail,
                password: hashedPassword,
                firstName: 'John',
                lastName: 'Smith',
                phone: '+1 (555) 000-0002',
                specialty: 'General Medicine',
                licenseNumber: 'MD-2025-001',
                isActive: true,
                organizationId: organization.id,
                organization: organization,
                roles: [doctorRole],
            });

            const savedDoctor = await userRepository.save(doctor);

            // Create user-organization relationship
            const doctorOrg = userOrgRepository.create({
                userId: savedDoctor.id,
                organizationId: organization.id,
                joinedAt: new Date(),
                lastAccessedAt: new Date(),
            });
            await userOrgRepository.save(doctorOrg);

            console.log(`  ✅ Created Doctor user: ${doctorEmail} (Password: Doctor123!)`);
        }
    }

    // Create a secretary user
    const secretaryEmail = 'secretary@allodoc.dev';
    const existingSecretary = await userRepository.findOne({
        where: { email: secretaryEmail },
    });

    if (!existingSecretary) {
        const secretaryRole = await roleRepository.findOne({
            where: { name: RoleName.SECRETARY },
        });

        if (secretaryRole) {
            const hashedPassword = await bcrypt.hash('Secretary123!', 12);
            const secretary = userRepository.create({
                email: secretaryEmail,
                password: hashedPassword,
                firstName: 'Jane',
                lastName: 'Doe',
                phone: '+1 (555) 000-0003',
                isActive: true,
                organizationId: organization.id,
                organization: organization,
                roles: [secretaryRole],
            });

            const savedSecretary = await userRepository.save(secretary);

            // Create user-organization relationship
            const secretaryOrg = userOrgRepository.create({
                userId: savedSecretary.id,
                organizationId: organization.id,
                joinedAt: new Date(),
                lastAccessedAt: new Date(),
            });
            await userOrgRepository.save(secretaryOrg);

            console.log(`  ✅ Created Secretary user: ${secretaryEmail} (Password: Secretary123!)`);
        }
    }
}
