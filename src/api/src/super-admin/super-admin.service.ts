import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { Prescription } from '../prescriptions/entities/prescription.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Role, RoleName } from '../users/entities/role.entity';
import { SystemStatsDto } from './dto/system-stats.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { MoveUserDto } from './dto/move-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { CreateOrganizationDto } from '../organizations/dto/create-organization.dto';
import { UpdateOrganizationDto } from '../organizations/dto/update-organization.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserOrganization } from '../users/entities/user-organization.entity';
import { AuthorizationService } from '../common/services/authorization.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SuperAdminService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        @InjectRepository(Consultation)
        private readonly consultationRepository: Repository<Consultation>,
        @InjectRepository(Prescription)
        private readonly prescriptionRepository: Repository<Prescription>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(UserOrganization)
        private readonly userOrganizationRepository: Repository<UserOrganization>,
        private readonly authorizationService: AuthorizationService,
    ) {}

    // =============================
    // SYSTEM STATISTICS
    // =============================
    async getSystemStats(): Promise<SystemStatsDto> {
        const [
            totalOrganizations,
            totalUsers,
            totalPatients,
            totalConsultations,
            totalPrescriptions,
            totalAppointments,
        ] = await Promise.all([
            this.organizationRepository.count(),
            this.userRepository.count(),
            this.patientRepository.count(),
            this.consultationRepository.count(),
            this.prescriptionRepository.count(),
            this.appointmentRepository.count(),
        ]);

        // Active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await this.userRepository
            .createQueryBuilder('user')
            .where('user.lastLogin > :date', { date: thirtyDaysAgo })
            .getCount();

        // Users by role
        const usersByRoleQuery = await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.roles', 'role')
            .select('role.name', 'roleName')
            .addSelect('COUNT(DISTINCT user.id)', 'count')
            .groupBy('role.name')
            .getRawMany();

        const usersByRole = usersByRoleQuery.reduce((acc, curr) => {
            acc[curr.roleName] = parseInt(curr.count);
            return acc;
        }, {});

        // Top 5 organizations
        const topOrganizations = await this.organizationRepository
            .createQueryBuilder('org')
            .leftJoin('org.users', 'user')
            .leftJoin('org.patients', 'patient')
            .select('org.id', 'id')
            .addSelect('org.name', 'name')
            .addSelect('COUNT(DISTINCT user.id)', 'userCount')
            .addSelect('COUNT(DISTINCT patient.id)', 'patientCount')
            .groupBy('org.id')
            .addGroupBy('org.name')
            .orderBy('COUNT(DISTINCT user.id)', 'DESC')
            .limit(5)
            .getRawMany();

        return {
            totalOrganizations,
            totalUsers,
            totalPatients,
            totalConsultations,
            totalPrescriptions,
            totalAppointments,
            activeUsers,
            usersByRole,
            topOrganizations: topOrganizations.map((org) => ({
                ...org,
                userCount: parseInt(org.userCount),
                patientCount: parseInt(org.patientCount),
            })),
        };
    }

    // =============================
    // USER MANAGEMENT
    // =============================
    async getAllUsers(paginationDto: PaginationDto): Promise<PaginatedResult<User>> {
        const { page = 1, limit = 10, search } = paginationDto;
        const skip = (page - 1) * limit;

        const qb = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.organization', 'organization')
            .leftJoinAndSelect('user.roles', 'roles');

        if (search) {
            qb.where(
                '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        const [data, total] = await qb
            .skip(skip)
            .take(limit)
            .orderBy('user.createdAt', 'DESC')
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async createUserInAnyOrganization(
        createUserDto: CreateUserDto & { organizationId: string },
        currentUser: User,
    ): Promise<User> {
        // Verify organization exists
        const organization = await this.organizationRepository.findOne({
            where: { id: createUserDto.organizationId },
        });

        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        // Check if email already exists in that organization
        const existingUser = await this.userRepository.findOne({
            where: {
                email: createUserDto.email,
                organizationId: createUserDto.organizationId,
            },
        });

        if (existingUser) {
            throw new BadRequestException(
                'User with this email already exists in the organization',
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

        // Get roles
        const roles = await this.roleRepository.findByIds(createUserDto.roleIds);

        // Create user
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            roles,
            organization,
            createdById: currentUser.id,
            updatedById: currentUser.id,
        });

        return await this.userRepository.save(user);
    }

    async assignRoles(userId: string, assignRoleDto: AssignRoleDto): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Get the new roles
        const roles = await this.roleRepository
            .createQueryBuilder('role')
            .where('role.name IN (:...roleNames)', { roleNames: assignRoleDto.roles })
            .getMany();

        if (roles.length !== assignRoleDto.roles.length) {
            throw new BadRequestException('One or more roles are invalid');
        }

        // Update user roles
        user.roles = roles;
        return await this.userRepository.save(user);
    }

    async moveUserToOrganization(userId: string, moveUserDto: MoveUserDto): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['organization'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const newOrganization = await this.organizationRepository.findOne({
            where: { id: moveUserDto.organizationId },
        });

        if (!newOrganization) {
            throw new NotFoundException('Target organization not found');
        }

        // Check if a user with the same email already exists in the target organization
        const existingUser = await this.userRepository.findOne({
            where: {
                email: user.email,
                organizationId: moveUserDto.organizationId,
            },
        });

        if (existingUser) {
            throw new BadRequestException(
                'A user with this email already exists in the target organization',
            );
        }

        // Update user's organization
        user.organization = newOrganization;
        user.organizationId = newOrganization.id;

        return await this.userRepository.save(user);
    }

    async toggleUserStatus(userId: string): Promise<User> {
        // First get the current user with relations
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles', 'organization'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Update ONLY the isActive field to avoid corrupting password
        // Using update() method to prevent @Exclude() decorator issues
        await this.userRepository.update({ id: userId }, { isActive: !user.isActive });

        // Return the updated user object
        user.isActive = !user.isActive;
        return user;
    }

    async deleteUser(userId: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Soft delete by deactivating - using update() to avoid password corruption
        await this.userRepository.update({ id: userId }, { isActive: false });
    }

    // =============================
    // ORGANIZATION MANAGEMENT
    // =============================
    async getAllOrganizations(
        paginationDto: PaginationDto,
    ): Promise<PaginatedResult<Organization>> {
        const { page = 1, limit = 10, search } = paginationDto;
        const skip = (page - 1) * limit;

        const qb = this.organizationRepository
            .createQueryBuilder('org')
            .leftJoin('org.users', 'user')
            .leftJoin('org.patients', 'patient')
            .select('org')
            .addSelect('COUNT(DISTINCT user.id)', 'userCount')
            .addSelect('COUNT(DISTINCT patient.id)', 'patientCount')
            .groupBy('org.id');

        if (search) {
            qb.where('org.name ILIKE :search', { search: `%${search}%` });
        }

        const [rawData, total] = await Promise.all([
            qb.clone().skip(skip).take(limit).orderBy('org.createdAt', 'DESC').getRawAndEntities(),
            qb.clone().getCount(),
        ]);

        // Combine entity data with counts
        const data = rawData.entities.map((org, index) => ({
            ...org,
            userCount: parseInt(rawData.raw[index].userCount),
            patientCount: parseInt(rawData.raw[index].patientCount),
        }));

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async createOrganization(
        createOrganizationDto: CreateOrganizationDto,
        currentUser: User,
    ): Promise<Organization> {
        // Check if organization with same name exists
        const existingOrg = await this.organizationRepository.findOne({
            where: { name: createOrganizationDto.name },
        });

        if (existingOrg) {
            throw new BadRequestException('Organization with this name already exists');
        }

        const organization = this.organizationRepository.create({
            ...createOrganizationDto,
        });

        const savedOrganization = await this.organizationRepository.save(organization);

        // Auto-assign the new organization to all Super Admin users
        const superAdmins = await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.roles', 'role')
            .where('role.name = :roleName', { roleName: RoleName.SUPER_ADMIN })
            .getMany();

        for (const superAdmin of superAdmins) {
            await this.assignOrganizationToUser(superAdmin.id, savedOrganization.id);
        }

        return savedOrganization;
    }

    // Helper method to assign organization to user
    private async assignOrganizationToUser(userId: string, organizationId: string): Promise<void> {
        // Check if the relationship already exists
        const existing = await this.userOrganizationRepository.findOne({
            where: { userId, organizationId },
        });

        if (!existing) {
            const userOrganization = this.userOrganizationRepository.create({
                userId,
                organizationId,
                joinedAt: new Date(),
            });
            await this.userOrganizationRepository.save(userOrganization);
        }
    }

    // Get all organizations for a user (including Super Admins who get all orgs)
    async getUserOrganizations(userId: string): Promise<Organization[]> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user is Super Admin
        const isSuperAdmin = this.authorizationService.isSuperAdmin(user);

        if (isSuperAdmin) {
            // Return all active organizations for Super Admin
            return await this.organizationRepository.find({
                where: { isActive: true },
                order: { name: 'ASC' },
            });
        } else {
            // Return organizations associated with the user
            const userOrgs = await this.userOrganizationRepository.find({
                where: { userId },
                relations: ['organization'],
            });

            return userOrgs.map((uo) => uo.organization).filter((org) => org && org.isActive);
        }
    }

    async updateOrganization(
        organizationId: string,
        updateOrganizationDto: UpdateOrganizationDto,
        currentUser: User,
    ): Promise<Organization> {
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
        });

        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        Object.assign(organization, updateOrganizationDto);

        return await this.organizationRepository.save(organization);
    }

    async deleteOrganization(organizationId: string): Promise<void> {
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
        });

        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        // Check if organization has users
        const userCount = await this.userRepository.count({
            where: { organizationId },
        });

        if (userCount > 0) {
            throw new BadRequestException(
                'Cannot delete organization with existing users. Please reassign or delete users first.',
            );
        }

        // Soft delete
        organization.isActive = false;
        await this.organizationRepository.save(organization);
    }

    // =============================
    // PATIENT MANAGEMENT
    // =============================
    async getAllPatients(paginationDto: PaginationDto): Promise<PaginatedResult<Patient>> {
        const { page = 1, limit = 10, search } = paginationDto;
        const skip = (page - 1) * limit;

        const qb = this.patientRepository
            .createQueryBuilder('patient')
            .leftJoinAndSelect('patient.organization', 'organization');

        if (search) {
            qb.where(
                '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR patient.email ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        const [data, total] = await qb
            .skip(skip)
            .take(limit)
            .orderBy('patient.createdAt', 'DESC')
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }
}
