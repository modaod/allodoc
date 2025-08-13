import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../common/repositories/base.repository';
import { Consultation } from './entities/consultation.entity';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class ConsultationsRepository extends BaseRepository<Consultation> {
    constructor(
        @InjectRepository(Consultation)
        private readonly consultationRepository: Repository<Consultation>,
    ) {
        super(consultationRepository);
    }

    async findByPatient(patientId: string, limit?: number): Promise<Consultation[]> {
        const query = this.consultationRepository
            .createQueryBuilder('consultation')
            .leftJoinAndSelect('consultation.doctor', 'doctor')
            .leftJoinAndSelect('consultation.prescriptions', 'prescriptions')
            .where('consultation.patientId = :patientId', { patientId })
            .orderBy('consultation.consultationDate', 'DESC');

        if (limit) {
            query.take(limit);
        }

        return await query.getMany();
    }

    async findByDoctor(
        doctorId: string,
        startDate?: Date,
        endDate?: Date,
    ): Promise<Consultation[]> {
        const query = this.consultationRepository
            .createQueryBuilder('consultation')
            .leftJoinAndSelect('consultation.patient', 'patient')
            .where('consultation.doctorId = :doctorId', { doctorId });

        if (startDate && endDate) {
            query.andWhere('consultation.consultationDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }

        return await query.orderBy('consultation.consultationDate', 'DESC').getMany();
    }

    async findByDateRange(
        organizationId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<Consultation[]> {
        return await this.consultationRepository
            .createQueryBuilder('consultation')
            .leftJoinAndSelect('consultation.patient', 'patient')
            .leftJoinAndSelect('consultation.doctor', 'doctor')
            .where('consultation.organizationId = :organizationId', { organizationId })
            .andWhere('consultation.consultationDate >= :startDate', { startDate })
            .andWhere('consultation.consultationDate < :endDate', { endDate })
            .orderBy('consultation.consultationDate', 'DESC')
            .getMany();
    }

    async findRecentConsultations(
        organizationId: string,
        limit: number = 10,
    ): Promise<Consultation[]> {
        return await this.consultationRepository
            .createQueryBuilder('consultation')
            .leftJoinAndSelect('consultation.patient', 'patient')
            .leftJoinAndSelect('consultation.doctor', 'doctor')
            .where('consultation.organizationId = :organizationId', { organizationId })
            .orderBy('consultation.consultationDate', 'DESC')
            .take(limit)
            .getMany();
    }

    async search(
        searchDto: SearchDto,
        organizationId: string,
    ): Promise<PaginatedResult<Consultation>> {
        const qb = this.createSearchQuery(searchDto, organizationId);
        return await this.paginate(searchDto, qb);
    }

    async getStats(organizationId: string): Promise<{
        total: number;
        thisMonth: number;
    }> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const consultations = await this.consultationRepository.find({
            where: { organizationId },
            select: ['id', 'consultationDate'],
        });

        const thisMonthConsultations = consultations.filter(
            (c) => new Date(c.consultationDate) >= startOfMonth,
        );

        return {
            total: consultations.length,
            thisMonth: thisMonthConsultations.length,
        };
    }

    private createSearchQuery(
        searchDto: SearchDto,
        organizationId: string,
    ): SelectQueryBuilder<Consultation> {
        const qb = this.consultationRepository
            .createQueryBuilder('consultation')
            .leftJoinAndSelect('consultation.patient', 'patient')
            .leftJoinAndSelect('consultation.doctor', 'doctor')
            .where('consultation.organizationId = :organizationId', { organizationId });

        // Recherche générale
        if (searchDto.search) {
            qb.andWhere(
                '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR ' +
                    'doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search OR ' +
                    'consultation.reason ILIKE :search OR consultation.diagnosis ILIKE :search)',
                { search: `%${searchDto.search}%` },
            );
        }

        // Filtrage par dates
        this.addDateRangeToQuery(
            qb,
            searchDto.startDate,
            searchDto.endDate,
            'consultation.consultationDate',
        );

        // Tri
        const sortBy = searchDto.sortBy || 'consultationDate';
        const sortOrder = searchDto.sortOrder || 'DESC';
        qb.orderBy(`consultation.${sortBy}`, sortOrder);

        return qb;
    }
}
