import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { UsersService } from '../users/users.service';
import { PatientsService } from '../patients/patients.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { SearchDto } from '../common/dto/search.dto';
import { Appointment, AppointmentStatus, AppointmentType } from './entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class AppointmentsService {
    constructor(
        private readonly appointmentsRepository: AppointmentsRepository,
        private readonly usersService: UsersService,
        private readonly patientsService: PatientsService,
    ) {}

    async create(
        createAppointmentDto: CreateAppointmentDto,
        organizationId: string,
        currentUser?: User,
    ): Promise<Appointment> {
        // Data validation
        await this.validateAppointmentCreation(createAppointmentDto, organizationId);

        // Check doctor availability
        const appointmentDate = new Date(createAppointmentDto.appointmentDate);
        const duration = createAppointmentDto.duration || 30;

        const isAvailable = await this.appointmentsRepository.checkDoctorAvailability(
            createAppointmentDto.doctorId,
            appointmentDate,
            duration,
        );

        if (!isAvailable) {
            throw new ConflictException('The doctor is not available at this time');
        }

        // Check doctor's schedule
        const doctor = await this.usersService.findById(createAppointmentDto.doctorId);

        const appointmentData = {
            ...createAppointmentDto,
            appointmentDate,
            duration,
            organizationId,
            status: AppointmentStatus.SCHEDULED,
        };

        return await this.appointmentsRepository.create(appointmentData, currentUser);
    }

    async findById(id: string): Promise<Appointment> {
        return await this.appointmentsRepository.findById(id, [
            'patient',
            'doctor',
            'consultation',
        ]);
    }

    async update(
        id: string,
        updateAppointmentDto: UpdateAppointmentDto,
        currentUser?: User,
    ): Promise<Appointment> {
        const existingAppointment = await this.findById(id);

        // Check if the appointment can be modified
        if (!this.canBeModified(existingAppointment)) {
            throw new BadRequestException('This appointment can no longer be modified');
        }

        // If date/time changes, check availability
        let updateData: Partial<Appointment> = {
            ...updateAppointmentDto,
            appointmentDate: updateAppointmentDto.appointmentDate
                ? new Date(updateAppointmentDto.appointmentDate)
                : undefined,
            reminderSentAt: updateAppointmentDto.reminderSentAt
                ? new Date(updateAppointmentDto.reminderSentAt)
                : undefined,
            checkedInAt: updateAppointmentDto.checkedInAt
                ? new Date(updateAppointmentDto.checkedInAt)
                : undefined,
            completedAt: updateAppointmentDto.completedAt
                ? new Date(updateAppointmentDto.completedAt)
                : undefined,
        };

        // Ensure appointmentDate is a Date object if present
        if (updateAppointmentDto.appointmentDate) {
            updateData.appointmentDate = new Date(updateAppointmentDto.appointmentDate);
        }
        if (updateAppointmentDto.appointmentDate || updateAppointmentDto.duration) {
            const newDate = updateAppointmentDto.appointmentDate
                ? new Date(updateAppointmentDto.appointmentDate)
                : existingAppointment.appointmentDate;
            const newDuration = updateAppointmentDto.duration || existingAppointment.duration;

            const isAvailable = await this.appointmentsRepository.checkDoctorAvailability(
                existingAppointment.doctorId,
                newDate,
                newDuration,
                id,
            );

            if (!isAvailable) {
                throw new ConflictException(
                    "Le médecin n'est pas disponible à cette nouvelle heure",
                );
            }

            // Ensure appointmentDate is a Date object
            if (updateAppointmentDto.appointmentDate) {
                updateData.appointmentDate = newDate;
            }
        }

        return await this.appointmentsRepository.update(id, updateData, currentUser);
    }

    async cancel(id: string, reason: string, currentUser?: User): Promise<Appointment> {
        const appointment = await this.findById(id);

        if (!this.canBeCancelled(appointment)) {
            throw new BadRequestException('This appointment can no longer be cancelled');
        }

        return await this.appointmentsRepository.update(
            id,
            {
                status: AppointmentStatus.CANCELLED,
                cancelReason: reason,
            },
            currentUser,
        );
    }

    async confirm(id: string, currentUser?: User): Promise<Appointment> {
        return await this.appointmentsRepository.update(
            id,
            { status: AppointmentStatus.CONFIRMED },
            currentUser,
        );
    }

    async checkIn(id: string, currentUser?: User): Promise<Appointment> {
        const appointment = await this.findById(id);

        if (!this.isToday(appointment)) {
            throw new BadRequestException(
                'Le patient ne peut être enregistré que le jour du rendez-vous',
            );
        }

        return await this.appointmentsRepository.update(
            id,
            {
                status: AppointmentStatus.IN_PROGRESS,
                checkedInAt: new Date(),
            },
            currentUser,
        );
    }

    async complete(id: string, currentUser?: User): Promise<Appointment> {
        return await this.appointmentsRepository.update(
            id,
            {
                status: AppointmentStatus.COMPLETED,
                completedAt: new Date(),
            },
            currentUser,
        );
    }

    async markNoShow(id: string, currentUser?: User): Promise<Appointment> {
        return await this.appointmentsRepository.update(
            id,
            { status: AppointmentStatus.NO_SHOW },
            currentUser,
        );
    }

    // =============================
    // SEARCH METHODS
    // =============================
    async search(
        searchDto: SearchDto,
        organizationId: string,
    ): Promise<PaginatedResult<Appointment>> {
        return await this.appointmentsRepository.search(searchDto, organizationId);
    }

    async findByDoctor(doctorId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
        return await this.appointmentsRepository.findByDoctor(doctorId, startDate, endDate);
    }

    async findByPatient(patientId: string, limit?: number): Promise<Appointment[]> {
        return await this.appointmentsRepository.findByPatient(patientId, limit);
    }

    async findUpcoming(organizationId: string, limit?: number): Promise<Appointment[]> {
        return await this.appointmentsRepository.findUpcoming(organizationId, limit);
    }

    async findTodayAppointments(organizationId: string): Promise<Appointment[]> {
        return await this.appointmentsRepository.findTodayAppointments(organizationId);
    }

    async getDoctorSchedule(
        doctorId: string,
        date: Date,
    ): Promise<{
        appointments: Appointment[];
    }> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const appointments = await this.findByDoctor(doctorId, startOfDay, endOfDay);

        // Générer les créneaux disponibles
        const doctor = await this.usersService.findById(doctorId);

        return { appointments };
    }

    // =============================
    // STATISTICS AND REPORTS
    // =============================
    async getStats(organizationId: string): Promise<any> {
        return await this.appointmentsRepository.getStats(organizationId);
    }

    async getDoctorStats(
        doctorId: string,
        startDate?: Date,
        endDate?: Date,
    ): Promise<{
        total: number;
        completed: number;
        cancelled: number;
        noShow: number;
        averageDuration: number;
    }> {
        const appointments = await this.findByDoctor(doctorId, startDate, endDate);

        const stats = appointments.reduce(
            (acc, appointment) => {
                acc.total++;
                switch (appointment.status) {
                    case AppointmentStatus.COMPLETED:
                        acc.completed++;
                        acc.totalDuration += appointment.duration;
                        break;
                    case AppointmentStatus.CANCELLED:
                        acc.cancelled++;
                        break;
                    case AppointmentStatus.NO_SHOW:
                        acc.noShow++;
                        break;
                }
                return acc;
            },
            { total: 0, completed: 0, cancelled: 0, noShow: 0, totalDuration: 0 },
        );

        return {
            total: stats.total,
            completed: stats.completed,
            cancelled: stats.cancelled,
            noShow: stats.noShow,
            averageDuration:
                stats.completed > 0 ? Math.round(stats.totalDuration / stats.completed) : 0,
        };
    }

    // =============================
    // PRIVATE METHODS
    // =============================
    private async validateAppointmentCreation(
        createAppointmentDto: CreateAppointmentDto,
        organizationId: string,
    ): Promise<void> {
        // Check that the patient exists and belongs to the organization
        const patient = await this.patientsService.findById(createAppointmentDto.patientId);
        if (patient.organizationId !== organizationId) {
            throw new BadRequestException('The patient does not belong to this organization');
        }

        // Check that the doctor exists, is active, and belongs to the organization
        const doctor = await this.usersService.findById(createAppointmentDto.doctorId);
        if (!doctor.isDoctor()) {
            throw new BadRequestException('The specified user is not a doctor');
        }
        if (doctor.organizationId !== organizationId) {
            throw new BadRequestException('The doctor does not belong to this organization');
        }
        if (!doctor.isActive) {
            throw new BadRequestException('The doctor is not active');
        }

        // Check that the date is not in the past
        const appointmentDate = new Date(createAppointmentDto.appointmentDate);
        if (appointmentDate < new Date()) {
            throw new BadRequestException('The appointment date cannot be in the past');
        }

        // Validate duration
        const duration = createAppointmentDto.duration || 30;
        if (duration < 15 || duration > 240) {
            throw new BadRequestException(
                'The appointment duration must be between 15 and 240 minutes',
            );
        }
    }

    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    private minutesToTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    private canBeModified(appointment: Appointment): boolean {
        // Cannot modify if appointment is completed, cancelled, or no-show
        if (
            [
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELLED,
                AppointmentStatus.NO_SHOW,
            ].includes(appointment.status)
        ) {
            return false;
        }

        // Cannot modify if appointment is in the past (with some buffer time)
        const now = new Date();
        const appointmentTime = new Date(appointment.appointmentDate);
        const bufferMinutes = 30; // Allow modifications up to 30 minutes before appointment
        const cutoffTime = new Date(appointmentTime.getTime() - bufferMinutes * 60 * 1000);

        if (now > cutoffTime) {
            return false;
        }

        return true;
    }

    private canBeCancelled(appointment: Appointment): boolean {
        // Cannot cancel if already completed, cancelled, or no-show
        if (
            [
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELLED,
                AppointmentStatus.NO_SHOW,
            ].includes(appointment.status)
        ) {
            return false;
        }

        // Cannot cancel if appointment is currently in progress
        if (appointment.status === AppointmentStatus.IN_PROGRESS) {
            return false;
        }

        // Allow cancellation if appointment hasn't started yet
        return true;
    }

    private isToday(appointment: Appointment): boolean {
        const today = new Date();
        const appointmentDate = new Date(appointment.appointmentDate);

        return (
            today.getFullYear() === appointmentDate.getFullYear() &&
            today.getMonth() === appointmentDate.getMonth() &&
            today.getDate() === appointmentDate.getDate()
        );
    }
}
