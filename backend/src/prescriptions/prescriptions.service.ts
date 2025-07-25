import { Injectable, BadRequestException } from '@nestjs/common';
import { PrescriptionsRepository } from './prescriptions.repository';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { SearchDto } from '../common/dto/search.dto';
import { Prescription, PrescriptionStatus } from './entities/prescription.entity';
import { User } from '../users/entities/user.entity';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class PrescriptionsService {
    constructor(
        private readonly prescriptionsRepository: PrescriptionsRepository,
    ) { }

    async create(createPrescriptionDto: CreatePrescriptionDto, organizationId: string, currentUser?: User): Promise<Prescription> {
        // Validation des données
        this.validatePrescriptionData(createPrescriptionDto);

        // Analyser les médicaments pour détecter les interactions
        const warnings = await this.analyzeInteractions(createPrescriptionDto.medications);

        const prescriptionData = {
            ...createPrescriptionDto,
            prescribedDate: new Date(createPrescriptionDto.prescribedDate),
            validUntil: new Date(createPrescriptionDto.validUntil),
            organizationId,
            warnings,
        };

        return await this.prescriptionsRepository.create(prescriptionData, currentUser);
    }

    async findById(id: string): Promise<Prescription> {
        return await this.prescriptionsRepository.findById(id, ['consultation', 'consultation.patient']);
    }

    async update(id: string, updatePrescriptionDto: UpdatePrescriptionDto, currentUser?: User): Promise<Prescription> {
        // You can add validation here if needed
        return await this.prescriptionsRepository.update(id, updatePrescriptionDto, currentUser);
    }

    async search(searchDto: SearchDto, organizationId: string): Promise<PaginatedResult<Prescription>> {
        return await this.prescriptionsRepository.search(searchDto, organizationId);
    }

    async findByConsultation(consultationId: string): Promise<Prescription[]> {
        return await this.prescriptionsRepository.findByConsultation(consultationId);
    }

    async findByPatient(patientId: string): Promise<Prescription[]> {
        return await this.prescriptionsRepository.findByPatient(patientId);
    }

    async findActiveByPatient(patientId: string): Promise<Prescription[]> {
        return await this.prescriptionsRepository.findActiveByPatient(patientId);
    }

    async cancel(id: string, reason: string, currentUser?: User): Promise<Prescription> {
        return await this.prescriptionsRepository.update(
            id,
            {
                status: PrescriptionStatus.CANCELLED,
                notes: reason,
            },
            currentUser,
        );
    }

    async markAsDispensed(id: string, pharmacyName: string, pharmacistNotes?: string, currentUser?: User): Promise<Prescription> {
        return await this.prescriptionsRepository.update(
            id,
            {
                isDispensed: true,
                dispensedDate: new Date(),
                pharmacyName,
                pharmacistNotes,
            },
            currentUser,
        );
    }

    async expire(id: string, currentUser?: User): Promise<Prescription> {
        return await this.prescriptionsRepository.update(
            id,
            { status: PrescriptionStatus.EXPIRED },
            currentUser,
        );
    }

    // =============================
    // MÉTHODES D'ANALYSE
    // =============================
    async findExpiringPrescriptions(organizationId: string, daysAhead: number = 7): Promise<Prescription[]> {
        return await this.prescriptionsRepository.findExpiringPrescriptions(organizationId, daysAhead);
    }

    async findByMedication(medicationName: string, organizationId: string): Promise<Prescription[]> {
        return await this.prescriptionsRepository.findByMedication(medicationName, organizationId);
    }

    async checkPatientAllergies(patientId: string, medications: any[]): Promise<string[]> {
        // Cette méthode nécessiterait l'injection de PatientsService
        // Pour l'instant, on retourne un array vide
        // TODO: Implémenter la vérification des allergies
        return [];
    }

    async analyzeInteractions(medications: any[]): Promise<any[]> {
        const warnings: any[] = [];

        // Analyse simple des interactions courantes
        const medicationNames = medications.map(med => med.name.toLowerCase());

        // Exemples d'interactions connues (base de données simplifiée)
        const interactions = [
            {
                drugs: ['warfarine', 'aspirine'],
                message: 'Risque de saignement accru',
                severity: 'high' as const,
            },
            {
                drugs: ['metformine', 'contraste iodé'],
                message: 'Risque d\'acidose lactique',
                severity: 'critical' as const,
            },
            {
                drugs: ['digoxine', 'furosémide'],
                message: 'Surveillance de la kaliémie recommandée',
                severity: 'medium' as const,
            },
        ];

        // Vérifier les interactions
        interactions.forEach(interaction => {
            const foundDrugs = interaction.drugs.filter(drug =>
                medicationNames.some(med => med.includes(drug))
            );

            if (foundDrugs.length >= 2) {
                warnings.push({
                    type: 'interaction',
                    message: `Interaction ${foundDrugs.join(' + ')}: ${interaction.message}`,
                    severity: interaction.severity,
                });
            }
        });

        return warnings;
    }

    // =============================
    // STATISTIQUES ET RAPPORTS
    // =============================
    async getStats(organizationId: string): Promise<any> {
        return await this.prescriptionsRepository.getStats(organizationId);
    }

    async getDoctorPrescriptionStats(doctorId: string, startDate?: Date, endDate?: Date): Promise<{
        total: number;
        active: number;
        mostPrescribedMedications: Array<{ name: string; count: number }>;
    }> {
        // Cette méthode nécessiterait une requête plus complexe
        // Pour l'instant, on retourne des données basiques
        return {
            total: 0,
            active: 0,
            mostPrescribedMedications: [],
        };
    }

    async getPatientMedicationHistory(patientId: string): Promise<{
        currentMedications: Prescription[];
        pastMedications: Prescription[];
        allergies: string[];
    }> {
        const activePrescriptions = await this.findActiveByPatient(patientId);
        const allPrescriptions = await this.findByPatient(patientId);
        const pastMedications = allPrescriptions.filter(p => !p.isActive());

        return {
            currentMedications: activePrescriptions,
            pastMedications,
            allergies: [], // TODO: Récupérer depuis le patient
        };
    }

    // =============================
    // MÉTHODES PRIVÉES DE VALIDATION
    // =============================
    private validatePrescriptionData(createPrescriptionDto: CreatePrescriptionDto): void {
        // Valider les dates
        const prescribedDate = new Date(createPrescriptionDto.prescribedDate);
        const validUntil = new Date(createPrescriptionDto.validUntil);

        if (validUntil <= prescribedDate) {
            throw new BadRequestException('La date d\'expiration doit être postérieure à la date de prescription');
        }
    }
}