import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../common/repositories/base.repository';
import { Prescription } from './entities/prescription.entity';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class PrescriptionsRepository extends BaseRepository<Prescription> {
    constructor(
        @InjectRepository(Prescription)
        private readonly prescriptionRepository: Repository<Prescription>,
    ) {
        super(prescriptionRepository);
    }

    async findByConsultation(consultationId: string): Promise<Prescription[]> {
        return await this.prescriptionRepository.find({
            where: { consultationId },
            order: { createdAt: 'DESC' },
        });
    }

    async findByPatient(patientId: string): Promise<Prescription[]> {
        return await this.prescriptionRepository
            .createQueryBuilder('prescription')
            .leftJoinAndSelect('prescription.patient', 'patient')
            .leftJoinAndSelect('prescription.doctor', 'doctor')
            .leftJoinAndSelect('prescription.consultation', 'consultation')
            .where('prescription.patientId = :patientId', { patientId })
            .orderBy('prescription.prescribedDate', 'DESC')
            .getMany();
    }

    async findByMedication(
        medicationName: string,
        organizationId: string,
    ): Promise<Prescription[]> {
        return await this.prescriptionRepository
            .createQueryBuilder('prescription')
            .where('prescription.organizationId = :organizationId', { organizationId })
            .andWhere('prescription.medications::text ILIKE :medicationName', {
                medicationName: `%${medicationName}%`,
            })
            .orderBy('prescription.prescribedDate', 'DESC')
            .getMany();
    }

    async search(
        searchDto: SearchDto,
        organizationId: string,
    ): Promise<PaginatedResult<Prescription>> {
        const qb = this.createSearchQuery(searchDto, organizationId);
        return await this.paginate(searchDto, qb);
    }

    async getStats(organizationId: string): Promise<{
        total: number;
        withWarnings: number;
    }> {
        const today = new Date();

        const [total, withWarnings] = await Promise.all([
            this.prescriptionRepository.count({ where: { organizationId } }),
            this.prescriptionRepository.count({
                where: {
                    organizationId,
                },
            }),
            this.prescriptionRepository.count({
                where: {
                    organizationId,
                },
            }),
            this.prescriptionRepository
                .createQueryBuilder('prescription')
                .where('prescription.organizationId = :organizationId', { organizationId })
                .andWhere('prescription.warnings IS NOT NULL')
                .andWhere('jsonb_array_length(prescription.warnings) > 0')
                .getCount(),
        ]);

        return { total, withWarnings };
    }

    async getNextPrescriptionNumber(): Promise<string> {
        const result = await this.prescriptionRepository.query(
            'SELECT get_next_prescription_number() as prescription_number'
        );
        return result[0].prescription_number;
    }

    private createSearchQuery(
        searchDto: SearchDto,
        organizationId: string,
    ): SelectQueryBuilder<Prescription> {
        const qb = this.prescriptionRepository
            .createQueryBuilder('prescription')
            .innerJoinAndSelect('prescription.consultation', 'consultation')
            .innerJoinAndSelect('consultation.patient', 'patient')
            .innerJoinAndSelect('consultation.doctor', 'doctor')
            .where('prescription.organizationId = :organizationId', { organizationId });

        // Recherche générale
        if (searchDto.search) {
            qb.andWhere(
                '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR ' +
                    'doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search OR ' +
                    'prescription.medications::text ILIKE :search)',
                { search: `%${searchDto.search}%` },
            );
        }

        // Filtrage par statut
        if (searchDto.status) {
            qb.andWhere('prescription.status = :status', { status: searchDto.status });
        }

        // Filtrage par dates
        this.addDateRangeToQuery(
            qb,
            searchDto.startDate,
            searchDto.endDate,
            'prescription.prescribedDate',
        );

        // Tri
        const sortBy = searchDto.sortBy || 'prescribedDate';
        const sortOrder = searchDto.sortOrder || 'DESC';
        qb.orderBy(`prescription.${sortBy}`, sortOrder);

        return qb;
    }
}
