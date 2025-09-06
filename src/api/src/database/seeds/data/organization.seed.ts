import { INestApplicationContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization, OrganizationType } from '../../../organizations/entities/organization.entity';

const organizationData = {
    name: 'AlloCare Medical Center',
    type: OrganizationType.HOSPITAL,
    address: '123 Healthcare Avenue, Medical District',
    phone: '+1 (555) 123-4567',
    email: 'info@allocare.med',
    registrationNumber: 'MED-2025-001',
    description: 'Premier healthcare facility providing comprehensive medical services',
    isActive: true,
};

export async function seedOrganization(app: INestApplicationContext): Promise<Organization> {
    const organizationRepository = app.get<Repository<Organization>>(
        getRepositoryToken(Organization),
    );

    // Check if any organization exists
    const existingOrg = await organizationRepository.findOne({
        where: { name: organizationData.name },
    });

    if (!existingOrg) {
        const organization = organizationRepository.create(organizationData);
        const savedOrg = await organizationRepository.save(organization);
        console.log(`  ✅ Created organization: ${organizationData.name}`);
        return savedOrg;
    } else {
        console.log(`  ⏭️  Organization already exists: ${organizationData.name}`);
        return existingOrg;
    }
}