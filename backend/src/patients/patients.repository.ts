import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, MoreThanOrEqual } from 'typeorm';
import { BaseRepository } from '../common/repositories/base.repository';
import { Patient } from './entities/patient.entity';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class PatientsRepository extends BaseRepository<Patient> {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
    ) {
        super(patientRepository);
    }

    async findByPatientNumber(patientNumber: string): Promise<Patient | null> {
        return await this.patientRepository.findOne({
            where: { patientNumber },
            relations: ['organization'],
        });
    }

    async findByEmail(email: string, organizationId: string): Promise<Patient | null> {
        return await this.patientRepository.findOne({
            where: { email, organizationId },
        });
    }

    async findByPhone(phone: string, organizationId: string): Promise<Patient | null> {
        return await this.patientRepository.findOne({
            where: { phone, organizationId },
        });
    }

    async search(searchDto: SearchDto, organizationId: string): Promise<PaginatedResult<Patient>> {
        const qb = this.createSearchQuery(searchDto, organizationId);
        return await this.paginate(searchDto, qb);
    }


    async generatePatientNumber(organizationId: string): Promise<string> {
        // Retrieve the organization code
        const organization = await this.patientRepository.manager
            .createQueryBuilder()
            .select('org.name')
            .from('organizations', 'org')
            .where('org.id = :organizationId', { organizationId })
            .getRawOne();

        if (!organization) {
            throw new Error('Organisation non trouvée');
        }

        // Generate organization code (first 3 letters)
        const orgName = organization.org_name || organization.name || 'Medical';
        const orgCode =
            orgName
                .replace(/[^A-Za-z]/g, '')
                .substring(0, 3)
                .toUpperCase() || 'MED';

        // Count existing patients for this organization
        const count = await this.patientRepository.count({
            where: { organizationId },
        });

        // Generate the number with padding
        const nextNumber = count + 1;
        const paddedNumber = nextNumber.toString().padStart(6, '0');

        return `${orgCode}-${paddedNumber}`;
    }

    async checkPatientNumberExists(patientNumber: string): Promise<boolean> {
        const count = await this.patientRepository.count({
            where: { patientNumber },
        });
        return count > 0;
    }

    async checkEmailExists(
        email: string,
        organizationId: string,
        excludeId?: string,
    ): Promise<boolean> {
        const query = this.patientRepository
            .createQueryBuilder('patient')
            .where('patient.email = :email', { email })
            .andWhere('patient.organizationId = :organizationId', { organizationId });

        if (excludeId) {
            query.andWhere('patient.id != :excludeId', { excludeId });
        }

        const count = await query.getCount();
        return count > 0;
    }

    async findRecentPatients(organizationId: string, limit: number = 10): Promise<Patient[]> {
        return await this.patientRepository.find({
            where: { organizationId, isActive: true },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async findPatientsWithUpcomingAppointments(organizationId: string): Promise<Patient[]> {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        return await this.patientRepository
            .createQueryBuilder('patient')
            .innerJoinAndSelect('patient.appointments', 'appointment')
            .where('patient.organizationId = :organizationId', { organizationId })
            .andWhere('patient.isActive = true')
            .andWhere('appointment.appointmentDate <= :tomorrow', { tomorrow })
            .andWhere('appointment.status IN (:...statuses)', {
                statuses: ['SCHEDULED', 'CONFIRMED'],
            })
            .getMany();
    }

    async updateLastVisit(id: string): Promise<void> {
        await this.patientRepository.update(id, { lastVisit: new Date() });
    }

    async getPatientStats(organizationId: string): Promise<{
        total: number;
        active: number;
        newThisMonth: number;
        withAllergies: number;
    }> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [total, active, newThisMonth, withAllergies] = await Promise.all([
            this.patientRepository.count({ where: { organizationId } }),
            this.patientRepository.count({ where: { organizationId, isActive: true } }),
            this.patientRepository.count({
                where: {
                    organizationId,
                    createdAt: MoreThanOrEqual(startOfMonth),
                },
            }),
            this.patientRepository
                .createQueryBuilder('patient')
                .where('patient.organizationId = :organizationId', { organizationId })
            .andWhere('patient.isActive = true')
                .andWhere("patient.medicalHistory->>'allergies' IS NOT NULL")
                .andWhere("jsonb_array_length(patient.medicalHistory->'allergies') > 0")
                .getCount(),
        ]);

        return { total, active, newThisMonth, withAllergies };
    }

    private createSearchQuery(
        searchDto: SearchDto,
        organizationId: string,
    ): SelectQueryBuilder<Patient> {
        const qb = this.patientRepository
            .createQueryBuilder('patient')
            .where('patient.organizationId = :organizationId', { organizationId })
            .andWhere('patient.isActive = true');

        // General search
        if (searchDto.search) {
            this.addSearchToQuery(qb, searchDto.search, [
                'patient.firstName',
                'patient.lastName',
                'patient.email',
                'patient.phone',
                'patient.patientNumber',
            ]);
        }

        // Date filterings - filter by last visit date
        if (searchDto.startDate || searchDto.endDate) {
            this.addDateRangeToQuery(qb, searchDto.startDate, searchDto.endDate, 'patient.lastVisit');
        }

        // Sorting
        const sortBy = searchDto.sortBy || 'lastName';
        const sortOrder = searchDto.sortOrder || 'ASC';
        qb.orderBy(`patient.${sortBy}`, sortOrder);

        return qb;
    }
}
