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
    ) { }

    async create(createAppointmentDto: CreateAppointmentDto, organizationId: string, currentUser?: User): Promise<Appointment> {
        // Validation des données
        await this.validateAppointmentCreation(createAppointmentDto, organizationId);

        // Vérifier la disponibilité du médecin
        const appointmentDate = new Date(createAppointmentDto.appointmentDate);
        const duration = createAppointmentDto.duration || 30;

        const isAvailable = await this.appointmentsRepository.checkDoctorAvailability(
            createAppointmentDto.doctorId,
            appointmentDate,
            duration,
        );

        if (!isAvailable) {
            throw new ConflictException('Le médecin n\'est pas disponible à cette heure');
        }

        // Vérifier les horaires du médecin
        const doctor = await this.usersService.findById(createAppointmentDto.doctorId);
        if (!this.isDoctorAvailableAtTime(doctor, appointmentDate)) {
            throw new BadRequestException('Le médecin ne travaille pas à cette heure');
        }

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
        return await this.appointmentsRepository.findById(id, ['patient', 'doctor', 'consultation']);
    }

    async update(id: string, updateAppointmentDto: UpdateAppointmentDto, currentUser?: User): Promise<Appointment> {
        const existingAppointment = await this.findById(id);

        // Vérifier si le rendez-vous peut être modifié
        if (!existingAppointment.canBeModified()) {
            throw new BadRequestException('Ce rendez-vous ne peut plus être modifié');
        }

        // Si la date/heure change, vérifier la disponibilité
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
                throw new ConflictException('Le médecin n\'est pas disponible à cette nouvelle heure');
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

        if (!appointment.canBeCancelled()) {
            throw new BadRequestException('Ce rendez-vous ne peut plus être annulé');
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

        if (!appointment.isToday()) {
            throw new BadRequestException('Le patient ne peut être enregistré que le jour du rendez-vous');
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
    // MÉTHODES DE RECHERCHE
    // =============================
    async search(searchDto: SearchDto, organizationId: string): Promise<PaginatedResult<Appointment>> {
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

    async getDoctorSchedule(doctorId: string, date: Date): Promise<{
        appointments: Appointment[];
        availableSlots: string[];
    }> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const appointments = await this.findByDoctor(doctorId, startOfDay, endOfDay);

        // Générer les créneaux disponibles
        const doctor = await this.usersService.findById(doctorId);
        const availableSlots = this.generateAvailableSlots(doctor, date, appointments);

        return { appointments, availableSlots };
    }

    // =============================
    // STATISTIQUES ET RAPPORTS
    // =============================
    async getStats(organizationId: string): Promise<any> {
        return await this.appointmentsRepository.getStats(organizationId);
    }

    async getDoctorStats(doctorId: string, startDate?: Date, endDate?: Date): Promise<{
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
            averageDuration: stats.completed > 0 ? Math.round(stats.totalDuration / stats.completed) : 0,
        };
    }

    // =============================
    // MÉTHODES PRIVÉES
    // =============================
    private async validateAppointmentCreation(createAppointmentDto: CreateAppointmentDto, organizationId: string): Promise<void> {
        // Vérifier que le patient existe et appartient à l'organisation
        const patient = await this.patientsService.findById(createAppointmentDto.patientId);
        if (patient.organizationId !== organizationId) {
            throw new BadRequestException('Le patient n\'appartient pas à cette organisation');
        }

        // Vérifier que le médecin existe, est actif et appartient à l'organisation
        const doctor = await this.usersService.findById(createAppointmentDto.doctorId);
        if (!doctor.isDoctor()) {
            throw new BadRequestException('L\'utilisateur spécifié n\'est pas un médecin');
        }
        if (doctor.organizationId !== organizationId) {
            throw new BadRequestException('Le médecin n\'appartient pas à cette organisation');
        }
        if (!doctor.isActive) {
            throw new BadRequestException('Le médecin n\'est pas actif');
        }

        // Vérifier que la date n'est pas dans le passé
        const appointmentDate = new Date(createAppointmentDto.appointmentDate);
        if (appointmentDate < new Date()) {
            throw new BadRequestException('La date du rendez-vous ne peut pas être dans le passé');
        }

        // Valider la durée
        const duration = createAppointmentDto.duration || 30;
        if (duration < 15 || duration > 240) {
            throw new BadRequestException('La durée du rendez-vous doit être entre 15 et 240 minutes');
        }
    }

    private isDoctorAvailableAtTime(doctor: User, appointmentDate: Date): boolean {
        if (!doctor.availableHours) {
            return true; // Pas de restrictions d'horaires
        }

        const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const daySchedule = doctor.availableHours[dayOfWeek];

        if (!daySchedule) {
            return false; // Médecin ne travaille pas ce jour
        }

        const appointmentTime = appointmentDate.toTimeString().substring(0, 5); // HH:MM
        const startTime = daySchedule.start;
        const endTime = daySchedule.end;

        // Vérifier si l'heure est dans la plage de travail
        if (appointmentTime < startTime || appointmentTime > endTime) {
            return false;
        }

        // Vérifier les pauses
        if (daySchedule.breaks) {
            for (const breakPeriod of daySchedule.breaks) {
                if (appointmentTime >= breakPeriod.start && appointmentTime <= breakPeriod.end) {
                    return false;
                }
            }
        }

        return true;
    }

    private generateAvailableSlots(doctor: User, date: Date, existingAppointments: Appointment[]): string[] {
        const slots: string[] = [];

        if (!doctor.availableHours) {
            return slots;
        }

        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const daySchedule = doctor.availableHours[dayOfWeek];

        if (!daySchedule) {
            return slots;
        }

        const duration = doctor.defaultAppointmentDuration || 30;
        const startTime = this.timeToMinutes(daySchedule.start);
        const endTime = this.timeToMinutes(daySchedule.end);

        // Générer les créneaux possibles
        for (let time = startTime; time < endTime; time += duration) {
            const slotTime = this.minutesToTime(time);
            const slotDate = new Date(date);
            const [hours, minutes] = slotTime.split(':').map(Number);
            slotDate.setHours(hours, minutes, 0, 0);

            // Vérifier si le créneau est libre
            const isSlotFree = !existingAppointments.some(appointment => {
                const appointmentStart = new Date(appointment.appointmentDate);
                const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
                return slotDate >= appointmentStart && slotDate < appointmentEnd;
            });

            // Vérifier les pauses
            const isDuringBreak = daySchedule.breaks?.some(breakPeriod => {
                const breakStart = this.timeToMinutes(breakPeriod.start);
                const breakEnd = this.timeToMinutes(breakPeriod.end);
                return time >= breakStart && time < breakEnd;
            });

            if (isSlotFree && !isDuringBreak && slotDate > new Date()) {
                slots.push(slotTime);
            }
        }

        return slots;
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
}
