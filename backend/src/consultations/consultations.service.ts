import { Injectable, BadRequestException } from '@nestjs/common';
import { ConsultationsRepository } from './consultations.repository';
import { AppointmentsService } from '../appointments/appointments.service';
import { PatientsService } from '../patients/patients.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { SearchDto } from '../common/dto/search.dto';
import { Consultation } from './entities/consultation.entity';
import { User } from '../users/entities/user.entity';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class ConsultationsService {
    constructor(
        private readonly consultationsRepository: ConsultationsRepository,
        private readonly appointmentsService: AppointmentsService,
        private readonly patientsService: PatientsService,
    ) { }

    async create(createConsultationDto: CreateConsultationDto, organizationId: string, currentUser?: User): Promise<Consultation> {
        // Validation des données
        await this.validateConsultationCreation(createConsultationDto, organizationId);

        // Calcul automatique de l'IMC si height et weight fournis
        if (createConsultationDto.vitalSigns?.height && createConsultationDto.vitalSigns?.weight) {
            const height = createConsultationDto.vitalSigns.height / 100; // en mètres
            const weight = createConsultationDto.vitalSigns.weight;
            const bmi = Number((weight / (height * height)).toFixed(2));
            createConsultationDto.vitalSigns.bmi = bmi;
        }

        const consultationData = {
            ...createConsultationDto,
            consultationDate: new Date(createConsultationDto.consultationDate),
            organizationId,
        };

        const consultation = await this.consultationsRepository.create(consultationData, currentUser);

        // Mettre à jour la dernière visite du patient
        await this.patientsService.updateLastVisit(createConsultationDto.patientId);

        // Si lié à un rendez-vous, marquer le rendez-vous comme terminé
        if (createConsultationDto.appointmentId) {
            await this.appointmentsService.complete(createConsultationDto.appointmentId, currentUser);
        }

        return consultation;
    }

    async findById(id: string): Promise<Consultation> {
        return await this.consultationsRepository.findById(id, [
            'patient',
            'doctor',
            'appointment',
            'prescriptions',
        ]);
    }

    async update(id: string, updateConsultationDto: UpdateConsultationDto, currentUser?: User): Promise<Consultation> {
        // Automatically calculate BMI if height and weight are provided
        if (updateConsultationDto.vitalSigns?.height && updateConsultationDto.vitalSigns?.weight) {
            const height = updateConsultationDto.vitalSigns.height / 100;
            const weight = updateConsultationDto.vitalSigns.weight;
            const bmi = Number((weight / (height * height)).toFixed(2));
            updateConsultationDto.vitalSigns.bmi = bmi;
        }

        return await this.consultationsRepository.update(id, updateConsultationDto, currentUser);
    }

    async search(searchDto: SearchDto, organizationId: string): Promise<PaginatedResult<Consultation>> {
        return await this.consultationsRepository.search(searchDto, organizationId);
    }

    async findByPatient(patientId: string, limit?: number): Promise<Consultation[]> {
        return await this.consultationsRepository.findByPatient(patientId, limit);
    }

    async findByDoctor(doctorId: string, startDate?: Date, endDate?: Date): Promise<Consultation[]> {
        return await this.consultationsRepository.findByDoctor(doctorId, startDate, endDate);
    }

    async findRecentConsultations(organizationId: string, limit: number = 10): Promise<Consultation[]> {
        return await this.consultationsRepository.findRecentConsultations(organizationId, limit);
    }

    async markAsPaid(id: string, currentUser?: User): Promise<Consultation> {
        return await this.consultationsRepository.update(
            id,
            {
                isPaid: true,
                paymentDate: new Date(),
            },
            currentUser,
        );
    }

    async addAttachment(id: string, attachment: any, currentUser?: User): Promise<Consultation> {
        const consultation = await this.findById(id);

        const currentAttachments = consultation.attachments || [];
        currentAttachments.push({
            ...attachment,
            uploadedAt: new Date().toISOString(),
        });

        return await this.consultationsRepository.update(
            id,
            { attachments: currentAttachments },
            currentUser,
        );
    }

    async getStats(organizationId: string): Promise<any> {
        return await this.consultationsRepository.getStats(organizationId);
    }

    async getPatientMedicalHistory(patientId: string): Promise<{
        consultations: Consultation[];
        allergies: string[];
        chronicDiseases: string[];
        medications: any[];
        lastConsultation?: Consultation;
    }> {
        const consultations = await this.findByPatient(patientId);
        const patient = await this.patientsService.findById(patientId);

        return {
            consultations,
            allergies: patient.medicalHistory?.allergies || [],
            chronicDiseases: patient.medicalHistory?.chronicDiseases || [],
            medications: patient.medicalHistory?.medications || [],
            lastConsultation: consultations[0],
        };
    }

    private async validateConsultationCreation(createConsultationDto: CreateConsultationDto, organizationId: string): Promise<void> {
        // Vérifier que le patient existe et appartient à l'organisation
        const patient = await this.patientsService.findById(createConsultationDto.patientId);
        if (patient.organizationId !== organizationId) {
            throw new BadRequestException('Le patient n\'appartient pas à cette organisation');
        }

        // Vérifier que le médecin existe et appartient à l'organisation
        // Cette validation sera ajoutée quand UsersService sera injecté

        // Vérifier que le rendez-vous existe (si fourni)
        if (createConsultationDto.appointmentId) {
            const appointment = await this.appointmentsService.findById(createConsultationDto.appointmentId);
            if (appointment.patientId !== createConsultationDto.patientId) {
                throw new BadRequestException('Le rendez-vous ne correspond pas au patient');
            }
            if (appointment.doctorId !== createConsultationDto.doctorId) {
                throw new BadRequestException('Le rendez-vous ne correspond pas au médecin');
            }
        }

        // Valider les signes vitaux
        if (createConsultationDto.vitalSigns) {
            this.validateVitalSigns(createConsultationDto.vitalSigns);
        }
    }

    private validateVitalSigns(vitalSigns: any): void {
        if (vitalSigns.temperature && (vitalSigns.temperature < 30 || vitalSigns.temperature > 45)) {
            throw new BadRequestException('Température invalide');
        }

        if (vitalSigns.heartRate && (vitalSigns.heartRate < 30 || vitalSigns.heartRate > 250)) {
            throw new BadRequestException('Fréquence cardiaque invalide');
        }

        if (vitalSigns.bloodPressure) {
            const { systolic, diastolic } = vitalSigns.bloodPressure;
            if (systolic < 60 || systolic > 250 || diastolic < 30 || diastolic > 150) {
                throw new BadRequestException('Tension artérielle invalide');
            }
        }

        if (vitalSigns.oxygenSaturation && (vitalSigns.oxygenSaturation < 50 || vitalSigns.oxygenSaturation > 100)) {
            throw new BadRequestException('Saturation en oxygène invalide');
        }

        if (vitalSigns.weight && (vitalSigns.weight < 0.5 || vitalSigns.weight > 500)) {
            throw new BadRequestException('Poids invalide');
        }

        if (vitalSigns.height && (vitalSigns.height < 30 || vitalSigns.height > 250)) {
            throw new BadRequestException('Taille invalide');
        }
    }
}