import { Injectable, BadRequestException } from '@nestjs/common';
import { Between } from 'typeorm';
import { PrescriptionsRepository } from './prescriptions.repository';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { SearchDto } from '../common/dto/search.dto';
import { Prescription } from './entities/prescription.entity';
import { User } from '../users/entities/user.entity';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class PrescriptionsService {
    constructor(private readonly prescriptionsRepository: PrescriptionsRepository) {}

    async create(
        createPrescriptionDto: CreatePrescriptionDto,
        organizationId: string,
        currentUser?: User,
    ): Promise<Prescription> {
        // Data validation (prescribedDate validation removed as it's system-generated)
        this.validatePrescriptionData(createPrescriptionDto);

        // Generate prescription number
        const prescriptionNumber = await this.generatePrescriptionNumber(organizationId);

        // Always use authenticated user as doctor for security
        if (!currentUser || !currentUser.id) {
            throw new BadRequestException('Authentication required to create prescription');
        }
        const doctorId = currentUser.id;

        // Analyze medications to detect interactions
        const warnings = await this.analyzeInteractions(createPrescriptionDto.medications);

        // Always use current system timestamp for prescribedDate
        const prescribedDate = new Date();

        const prescriptionData = {
            ...createPrescriptionDto,
            prescriptionNumber,
            doctorId,
            prescribedDate,
            organizationId,
            warnings,
        };

        return await this.prescriptionsRepository.create(prescriptionData, currentUser);
    }

    async findById(id: string): Promise<Prescription> {
        return await this.prescriptionsRepository.findById(id, [
            'patient',
            'doctor',
            'consultation',
            'consultation.patient',
            'consultation.doctor',
        ]);
    }

    async update(
        id: string,
        updatePrescriptionDto: UpdatePrescriptionDto,
        currentUser?: User,
    ): Promise<Prescription> {
        // You can add validation here if needed
        return await this.prescriptionsRepository.update(id, updatePrescriptionDto, currentUser);
    }

    async search(
        searchDto: SearchDto,
        organizationId: string,
    ): Promise<PaginatedResult<Prescription>> {
        return await this.prescriptionsRepository.search(searchDto, organizationId);
    }

    async findByConsultation(consultationId: string): Promise<Prescription[]> {
        return await this.prescriptionsRepository.findByConsultation(consultationId);
    }

    async findByPatient(patientId: string): Promise<Prescription[]> {
        return await this.prescriptionsRepository.findByPatient(patientId);
    }

    // =============================
    // ANALYSIS METHODS
    // =============================
    async findByMedication(
        medicationName: string,
        organizationId: string,
    ): Promise<Prescription[]> {
        return await this.prescriptionsRepository.findByMedication(medicationName, organizationId);
    }

    async checkPatientAllergies(patientId: string, medications: any[]): Promise<string[]> {
        // This method would require injecting the PatientsService
        // For now, we return an empty array
        // TODO: Implement allergy checking
        return [];
    }

    async analyzeInteractions(medications: any[]): Promise<any[]> {
        const warnings: any[] = [];

        // Simple analysis of common interactions
        const medicationNames = medications.map((med) => med.name.toLowerCase());

        // Examples of known interactions (simplified database)
        const interactions = [
            {
                drugs: ['warfarine', 'aspirine'],
                message: 'Risque de saignement accru',
                severity: 'high' as const,
            },
            {
                drugs: ['metformine', 'contraste iodé'],
                message: "Risque d'acidose lactique",
                severity: 'critical' as const,
            },
            {
                drugs: ['digoxine', 'furosémide'],
                message: 'Surveillance de la kaliémie recommandée',
                severity: 'medium' as const,
            },
        ];

        // Check for interactions
        interactions.forEach((interaction) => {
            const foundDrugs = interaction.drugs.filter((drug) =>
                medicationNames.some((med) => med.includes(drug)),
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
    // STATISTICS AND REPORTS
    // =============================
    async getStats(organizationId: string): Promise<any> {
        return await this.prescriptionsRepository.getStats(organizationId);
    }

    async getPatientMedicationHistory(patientId: string): Promise<{
        allPrescriptions: Prescription[];
        allergies: string[];
    }> {
        const allPrescriptions = await this.findByPatient(patientId);

        return {
            allPrescriptions: allPrescriptions,
            allergies: [], // TODO: Retriever allergies from PatientsService
        };
    }

    // =============================
    // PRIVATE VALIDATION METHODS
    // =============================
    private validatePrescriptionData(createPrescriptionDto: CreatePrescriptionDto): void {
        // Currently no additional validation needed
        // prescribedDate is now system-generated
        // Future validations can be added here
    }

    private async generatePrescriptionNumber(organizationId: string): Promise<string> {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // Get the count of prescriptions for this organization this month
        const startOfMonth = new Date(year, date.getMonth(), 1);
        const endOfMonth = new Date(year, date.getMonth() + 1, 0);
        
        const count = await this.prescriptionsRepository.count({
            organizationId,
            prescribedDate: Between(startOfMonth, endOfMonth) as any,
        });
        
        const sequence = String(count + 1).padStart(4, '0');
        return `RX-${year}${month}-${sequence}`;
    }
}
