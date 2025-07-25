import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../common/repositories/base.repository';
import { Prescription, PrescriptionStatus } from './entities/prescription.entity';
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
            .innerJoin('prescription.consultation', 'consultation')
            .where('consultation.patientId = :patientId', { patientId })
            .orderBy('prescription.prescribedDate', 'DESC')
            .getMany();
    }

    async findActiveByPatient(patientId: string): Promise<Prescription[]> {
        const today = new Date();

        return await this.prescriptionRepository
            .createQueryBuilder('prescription')
            .innerJoin('prescription.consultation', 'consultation')
            .where('consultation.patientId = :patientId', { patientId })
            .andWhere('prescription.status = :status', { status: PrescriptionStatus.ACTIVE })
            .andWhere('prescription.validUntil >= :today', { today })
            .orderBy('prescription.prescribedDate', 'DESC')
            .getMany();
    }

    async findExpiringPrescriptions(organizationId: string, daysAhead: number = 7): Promise<Prescription[]> {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        return await this.prescriptionRepository
            .createQueryBuilder('prescription')
            .innerJoin('prescription.consultation', 'consultation')
            .innerJoin('consultation.patient', 'patient')
            .where('prescription.organizationId = :organizationId', { organizationId })
            .andWhere('prescription.status = :status', { status: PrescriptionStatus.ACTIVE })
            .andWhere('prescription.validUntil BETWEEN :today AND :futureDate', { today, futureDate })
            .orderBy('prescription.validUntil', 'ASC')
            .getMany();
    }

    async findByMedication(medicationName: string, organizationId: string): Promise<Prescription[]> {
        return await this.prescriptionRepository
            .createQueryBuilder('prescription')
            .where('prescription.organizationId = :organizationId', { organizationId })
            .andWhere("prescription.medications::text ILIKE :medicationName", {
                medicationName: `%${medicationName}%`
            })
            .orderBy('prescription.prescribedDate', 'DESC')
            .getMany();
    }

    async search(searchDto: SearchDto, organizationId: string): Promise<PaginatedResult<Prescription>> {
        const qb = this.createSearchQuery(searchDto, organizationId);
        return await this.paginate(searchDto, qb);
    }

    async getStats(organizationId: string): Promise<{
        total: number;
        active: number;
        expired: number;
        dispensed: number;
        withWarnings: number;
    }> {
        const today = new Date();

        const [total, active, expired, dispensed, withWarnings] = await Promise.all([
            this.prescriptionRepository.count({ where: { organizationId } }),
            this.prescriptionRepository.count({
                where: {
                    organizationId,
                    status: PrescriptionStatus.ACTIVE,
                    validUntil: { $gte: today } as any
                },
            }),
            this.prescriptionRepository.count({
                where: {
                    organizationId,
                    validUntil: { $lt: today } as any
                },
            }),
            this.prescriptionRepository.count({
                where: { organizationId, isDispensed: true },
            }),
            this.prescriptionRepository
                .createQueryBuilder('prescription')
                .where('prescription.organizationId = :organizationId', { organizationId })
                .andWhere("prescription.warnings IS NOT NULL")
                .andWhere("jsonb_array_length(prescription.warnings) > 0")
                .getCount(),
        ]);

        return { total, active, expired, dispensed, withWarnings };
    }

    private createSearchQuery(searchDto: SearchDto, organizationId: string): SelectQueryBuilder<Prescription> {
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
        this.addDateRangeToQuery(qb, searchDto.startDate, searchDto.endDate, 'prescription.prescribedDate');

        // Tri
        const sortBy = searchDto.sortBy || 'prescribedDate';
        const sortOrder = searchDto.sortOrder || 'DESC';
        qb.orderBy(`prescription.${sortBy}`, sortOrder);

        return qb;
    }
}
