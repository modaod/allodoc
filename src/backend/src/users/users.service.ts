import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { RolesRepository } from './roles.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DoctorSearchDto } from './dto/doctor-search.dto';
import { User } from './entities/user.entity';
import { RoleName } from './entities/role.entity';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import * as bcrypt from 'bcryptjs';
import { RolesService } from './roles.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly rolesRepository: RolesRepository,
        private readonly rolesService: RolesService,
    ) {}

    async create(createUserDto: CreateUserDto, currentUser?: User): Promise<User> {
        // Security checks
        await this.validateUserCreation(createUserDto);

        // Password hashing
        const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

        // Retrieve roles
        const roles = await this.rolesRepository.findByIds(createUserDto.roleIds);
        if (roles.length !== createUserDto.roleIds.length) {
            throw new BadRequestException('One or more roles are invalid');
        }

        // Prepare user data
        const userData = {
            ...createUserDto,
            password: hashedPassword,
            roles,
        };

        // If it's a doctor, validate specific fields
        if (this.isCreatingDoctor(roles)) {
            this.validateDoctorFields(createUserDto);
        }

        return await this.usersRepository.create(userData, currentUser);
    }

    async findById(id: string): Promise<User> {
        return await this.usersRepository.findById(id, ['roles', 'organization']);
    }

    async findByEmail(email: string, organizationId: string): Promise<User | null> {
        return await this.usersRepository.findByEmail(email, organizationId);
    }

    async update(id: string, updateUserDto: UpdateUserDto, currentUser?: User): Promise<User> {
        const existingUser = await this.findById(id);

        // Security checks for modifications
        await this.validateUserUpdate(updateUserDto, existingUser);

        // Password management
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
        }

        // Role management
        if (updateUserDto.roleIds) {
            const roles = await this.rolesRepository.findByIds(updateUserDto.roleIds);
            (updateUserDto as any).roles = roles;
        }

        return await this.usersRepository.update(id, updateUserDto, currentUser);
    }

    async deactivate(id: string, currentUser?: User): Promise<User> {
        return await this.usersRepository.update(id, { isActive: false }, currentUser);
    }

    async activate(id: string, currentUser?: User): Promise<User> {
        return await this.usersRepository.update(id, { isActive: true }, currentUser);
    }

    // =============================
    // DOCTOR-SPECIFIC METHODS
    // =============================
    async findDoctors(organizationId: string): Promise<User[]> {
        return await this.usersRepository.findDoctors(organizationId);
    }

    async searchDoctors(
        searchDto: DoctorSearchDto,
        organizationId: string,
    ): Promise<PaginatedResult<User>> {
        return await this.usersRepository.searchDoctors(searchDto, organizationId);
    }

    async findAvailableDoctors(organizationId: string, date?: Date): Promise<User[]> {
        return await this.usersRepository.findAvailableDoctors(organizationId, date);
    }

    // =============================
    // AUTHENTICATION METHODS
    // =============================
    async validateCredentials(
        email: string,
        password: string,
        organizationId: string,
    ): Promise<User | null> {
        const user = await this.findByEmail(email, organizationId);

        if (!user || !user.isActive) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        // Update last login
        await this.usersRepository.updateLastLogin(user.id);

        return user;
    }

    async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
        const user = await this.findById(id);

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw new BadRequestException('Incorrect old password');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await this.usersRepository.update(id, { password: hashedNewPassword });
    }

    // =============================
    // STATISTICS
    // =============================
    async getOrganizationStats(organizationId: string): Promise<{
        totalUsers: number;
        totalDoctors: number;
        totalSecretaries: number;
        totalAdmins: number;
    }> {
        const [totalUsers, totalDoctors, totalSecretaries, totalAdmins] = await Promise.all([
            this.usersRepository.count({ organizationId, isActive: true }),
            this.usersRepository.countByRole(organizationId, RoleName.DOCTOR),
            this.usersRepository.countByRole(organizationId, RoleName.SECRETARY),
            this.usersRepository.countByRole(organizationId, RoleName.ADMIN),
        ]);

        const doctors = await this.usersRepository.findDoctors(organizationId);

        return {
            totalUsers,
            totalDoctors,
            totalSecretaries,
            totalAdmins,
        };
    }

    // =============================
    // PRIVATE VALIDATION METHODS
    // =============================
    private async validateUserCreation(createUserDto: CreateUserDto): Promise<void> {
        // Check that the email does not already exist in the organization
        const emailExists = await this.usersRepository.checkEmailExists(
            createUserDto.email,
            createUserDto.organizationId,
        );

        if (emailExists) {
            throw new ConflictException(
                'A user with this email already exists in this organization',
            );
        }

        // Check that the license number does not already exist (if provided)
        if (createUserDto.licenseNumber) {
            const licenseExists = await this.usersRepository.checkLicenseExists(
                createUserDto.licenseNumber,
            );

            if (licenseExists) {
                throw new ConflictException('A doctor with this license number already exists');
            }
        }
    }

    private async validateUserUpdate(
        updateUserDto: UpdateUserDto,
        existingUser: User,
    ): Promise<void> {
        // Check email (if changed)
        if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
            const emailExists = await this.usersRepository.checkEmailExists(
                updateUserDto.email,
                existingUser.organizationId,
                existingUser.id,
            );

            if (emailExists) {
                throw new ConflictException(
                    'A user with this email already exists in this organization',
                );
            }
        }

        // Check license number (if changed)
        if (
            updateUserDto.licenseNumber &&
            updateUserDto.licenseNumber !== existingUser.licenseNumber
        ) {
            const licenseExists = await this.usersRepository.checkLicenseExists(
                updateUserDto.licenseNumber,
                existingUser.id,
            );

            if (licenseExists) {
                throw new ConflictException('A doctor with this license number already exists');
            }
        }
    }

    private isCreatingDoctor(roles: any[]): boolean {
        return roles.some((role) => role.name === RoleName.DOCTOR);
    }

    private validateDoctorFields(createUserDto: CreateUserDto): void {
        if (!createUserDto.specialty) {
            throw new BadRequestException('Specialty is required for a doctor');
        }
    }

    async findAll(): Promise<User[]> {
        // Simple implementation - in production you'd want pagination and filtering
        return await this.usersRepository.findAll();
    }

    async updateLastLogin(userId: string): Promise<void> {
        await this.usersRepository.updateLastLogin(userId);
    }

    async getUserPermissions(roles: any[]): Promise<string[]> {
        return await this.rolesService.getPermissionsForUser(roles);
    }
}
