import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../common/repositories/base.repository';
import { User } from './entities/user.entity';
import { DoctorSearchDto } from './dto/doctor-search.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { RoleName } from './entities/role.entity';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(userRepository);
    }

    async findByEmail(email: string, organizationId: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { email, organizationId },
            relations: ['roles', 'organization'],
        });
    }

    async findByLicenseNumber(licenseNumber: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { licenseNumber },
            relations: ['roles', 'organization'],
        });
    }

    async checkEmailExists(
        email: string,
        organizationId: string,
        excludeId?: string,
    ): Promise<boolean> {
        const query = this.userRepository
            .createQueryBuilder('user')
            .where('user.email = :email', { email })
            .andWhere('user.organizationId = :organizationId', { organizationId });

        if (excludeId) {
            query.andWhere('user.id != :excludeId', { excludeId });
        }

        const count = await query.getCount();
        return count > 0;
    }

    async checkLicenseExists(licenseNumber: string, excludeId?: string): Promise<boolean> {
        const query = this.userRepository
            .createQueryBuilder('user')
            .where('user.licenseNumber = :licenseNumber', { licenseNumber });

        if (excludeId) {
            query.andWhere('user.id != :excludeId', { excludeId });
        }

        const count = await query.getCount();
        return count > 0;
    }

    async findDoctors(organizationId: string): Promise<User[]> {
        return await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.roles', 'role')
            .where('user.organizationId = :organizationId', { organizationId })
            .andWhere('role.name = :roleName', { roleName: RoleName.DOCTOR })
            .andWhere('user.isActive = true')
            .getMany();
    }

    async searchDoctors(
        searchDto: DoctorSearchDto,
        organizationId: string,
    ): Promise<PaginatedResult<User>> {
        const qb = this.createDoctorSearchQuery(searchDto, organizationId);
        return await this.paginate(searchDto, qb);
    }

    async findAvailableDoctors(organizationId: string, date?: Date): Promise<User[]> {
        const qb = this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.roles', 'role')
            .where('user.organizationId = :organizationId', { organizationId })
            .andWhere('role.name = :roleName', { roleName: RoleName.DOCTOR })
            .andWhere('user.isActive = true')
            .andWhere('user.acceptsNewPatients = true');

        if (date) {
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            qb.andWhere(`user.availableHours ? :dayOfWeek`, { dayOfWeek });
        }

        return await qb.getMany();
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.userRepository.update(id, { lastLogin: new Date() });
    }

    async countByRole(organizationId: string, roleName: RoleName): Promise<number> {
        return await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.roles', 'role')
            .where('user.organizationId = :organizationId', { organizationId })
            .andWhere('role.name = :roleName', { roleName })
            .andWhere('user.isActive = true')
            .getCount();
    }

    private createDoctorSearchQuery(
        searchDto: DoctorSearchDto,
        organizationId: string,
    ): SelectQueryBuilder<User> {
        const qb = this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.roles', 'role')
            .where('user.organizationId = :organizationId', { organizationId })
            .andWhere('role.name = :roleName', { roleName: RoleName.DOCTOR })
            .andWhere('user.isActive = true');

        // General search
        if (searchDto.search) {
            this.addSearchToQuery(qb, searchDto.search, [
                'user.firstName',
                'user.lastName',
                'user.email',
                'user.specialty',
            ]);
        }

        // Specific filters
        if (searchDto.specialty) {
            qb.andWhere('user.specialty ILIKE :specialty', {
                specialty: `%${searchDto.specialty}%`,
            });
        }

        if (searchDto.licenseNumber) {
            qb.andWhere('user.licenseNumber = :licenseNumber', {
                licenseNumber: searchDto.licenseNumber,
            });
        }

        // Sorting
        const sortBy = searchDto.sortBy || 'lastName';
        const sortOrder = searchDto.sortOrder || 'ASC';
        qb.orderBy(`user.${sortBy}`, sortOrder);

        return qb;
    }
}
