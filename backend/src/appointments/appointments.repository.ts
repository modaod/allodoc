import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import { BaseRepository } from '../common/repositories/base.repository';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class AppointmentsRepository extends BaseRepository<Appointment> {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
    ) {
        super(appointmentRepository);
    }

    async findByDoctor(doctorId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
        const query = this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .where('appointment.doctorId = :doctorId', { doctorId });

        if (startDate && endDate) {
            query.andWhere('appointment.appointmentDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }

        return await query
            .orderBy('appointment.appointmentDate', 'ASC')
            .getMany();
    }

    async findByPatient(patientId: string, limit?: number): Promise<Appointment[]> {
        const query = this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('appointment.patientId = :patientId', { patientId })
            .orderBy('appointment.appointmentDate', 'DESC');

        if (limit) {
            query.take(limit);
        }

        return await query.getMany();
    }

    async findUpcoming(organizationId: string, limit?: number): Promise<Appointment[]> {
        const now = new Date();

        const query = this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('appointment.organizationId = :organizationId', { organizationId })
            .andWhere('appointment.appointmentDate > :now', { now })
            .andWhere('appointment.status IN (:...statuses)', {
                statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
            })
            .orderBy('appointment.appointmentDate', 'ASC');

        if (limit) {
            query.take(limit);
        }

        return await query.getMany();
    }

    async findTodayAppointments(organizationId: string): Promise<Appointment[]> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return await this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('appointment.organizationId = :organizationId', { organizationId })
            .andWhere('appointment.appointmentDate BETWEEN :startOfDay AND :endOfDay', {
                startOfDay,
                endOfDay,
            })
            .orderBy('appointment.appointmentDate', 'ASC')
            .getMany();
    }

    async checkDoctorAvailability(
        doctorId: string,
        appointmentDate: Date,
        duration: number,
        excludeAppointmentId?: string,
    ): Promise<boolean> {
        const appointmentStart = new Date(appointmentDate);
        const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000);

        const query = this.appointmentRepository
            .createQueryBuilder('appointment')
            .where('appointment.doctorId = :doctorId', { doctorId })
            .andWhere('appointment.status IN (:...statuses)', {
                statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS],
            })
            .andWhere(
                '(appointment.appointmentDate < :appointmentEnd AND ' +
                'appointment.appointmentDate + (appointment.duration || \' minutes\')::INTERVAL > :appointmentStart)',
                { appointmentStart, appointmentEnd },
            );

        if (excludeAppointmentId) {
            query.andWhere('appointment.id != :excludeAppointmentId', { excludeAppointmentId });
        }

        const conflictingAppointments = await query.getCount();
        return conflictingAppointments === 0;
    }

    async search(searchDto: SearchDto, organizationId: string): Promise<PaginatedResult<Appointment>> {
        const qb = this.createSearchQuery(searchDto, organizationId);
        return await this.paginate(searchDto, qb);
    }

    async getStats(organizationId: string): Promise<{
        total: number;
        today: number;
        upcoming: number;
        completed: number;
        cancelled: number;
        noShow: number;
    }> {
        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const [total, today, upcoming, completed, cancelled, noShow] = await Promise.all([
            this.appointmentRepository.count({ where: { organizationId } }),
            this.appointmentRepository.count({
                where: {
                    organizationId,
                    appointmentDate: Between(startOfDay, endOfDay),
                },
            }),
            this.appointmentRepository.count({
                where: {
                    organizationId,
                    appointmentDate: { $gt: now } as any,
                    status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] } as any,
                },
            }),
            this.appointmentRepository.count({
                where: { organizationId, status: AppointmentStatus.COMPLETED },
            }),
            this.appointmentRepository.count({
                where: { organizationId, status: AppointmentStatus.CANCELLED },
            }),
            this.appointmentRepository.count({
                where: { organizationId, status: AppointmentStatus.NO_SHOW },
            }),
        ]);

        return { total, today, upcoming, completed, cancelled, noShow };
    }

    private createSearchQuery(searchDto: SearchDto, organizationId: string): SelectQueryBuilder<Appointment> {
        const qb = this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('appointment.organizationId = :organizationId', { organizationId });

        // Recherche générale
        if (searchDto.search) {
            qb.andWhere(
                '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR ' +
                'doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search OR ' +
                'appointment.reason ILIKE :search)',
                { search: `%${searchDto.search}%` },
            );
        }

        // Filtrage par statut
        if (searchDto.status) {
            qb.andWhere('appointment.status = :status', { status: searchDto.status });
        }

        // Filtrage par dates
        this.addDateRangeToQuery(qb, searchDto.startDate, searchDto.endDate, 'appointment.appointmentDate');

        // Tri
        const sortBy = searchDto.sortBy || 'appointmentDate';
        const sortOrder = searchDto.sortOrder || 'ASC';
        qb.orderBy(`appointment.${sortBy}`, sortOrder);

        return qb;
    }
}