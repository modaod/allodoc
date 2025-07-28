import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from '../../users/entities/role.entity';
import { Organization, OrganizationType } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { DEFAULT_ROLES } from './default-data';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async run(): Promise<void> {
        console.log('🌱 Starting database seeding...');

        await this.seedRoles();
        await this.seedDefaultOrganization();
        await this.seedSuperAdmin();

        console.log('✅ Database seeding completed!');
    }

    private async seedRoles(): Promise<void> {
        console.log('📝 Seeding roles...');

        for (const roleData of DEFAULT_ROLES) {
            const existingRole = await this.roleRepository.findOne({
                where: { name: roleData.name },
            });

            if (!existingRole) {
                const role = this.roleRepository.create(roleData);
                await this.roleRepository.save(role);
                console.log(`✅ Created role: ${roleData.name}`);
            } else {
                console.log(`⏭️  Role already exists: ${roleData.name}`);
            }
        }
    }

    private async seedDefaultOrganization(): Promise<void> {
        console.log('🏥 Seeding default organization...');

        const existingOrg = await this.organizationRepository.findOne({
            where: { name: 'Demo Medical Center' },
        });

        if (!existingOrg) {
            const organization = this.organizationRepository.create({
                name: 'Demo Medical Center',
                type: OrganizationType.MEDICAL_CENTER,
                address: '123 Healthcare Street, Medical District',
                phone: '+1-234-567-8900',
                email: 'contact@demo-medical.com',
                description: 'Demo organization for development and testing',
            });

            await this.organizationRepository.save(organization);
            console.log('✅ Created default organization');
        } else {
            console.log('⏭️  Default organization already exists');
        }
    }

    private async seedSuperAdmin(): Promise<void> {
        console.log('👑 Seeding super admin user...');

        const existingAdmin = await this.userRepository.findOne({
            where: { email: 'admin@demo-medical.com' },
        });

        if (!existingAdmin) {
            const organization = await this.organizationRepository.findOne({
                where: { name: 'Demo Medical Center' },
            });

            const superAdminRole = await this.roleRepository.findOne({
                where: { name: RoleName.SUPER_ADMIN },
            });

            if (organization && superAdminRole) {
                const hashedPassword = await bcrypt.hash(
                    process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
                    12,
                );

                const admin = this.userRepository.create({
                    email: process.env.SEED_ADMIN_EMAIL,
                    password: process.env.SEED_ADMIN_PASSWORD,
                    firstName: 'Super',
                    lastName: 'Admin',
                    phone: '+1-234-567-8901',
                    organizationId: organization.id,
                    roles: [superAdminRole],
                    isActive: true,
                    emailVerified: true,
                });

                await this.userRepository.save(admin);
                console.log('✅ Created super admin user');
                console.log(`📧 Email: ${admin.email}`);
                console.log(`🔑 Password: ${admin.password}`);
            }
        } else {
            console.log('⏭️  Super admin user already exists');
        }
    }
}
