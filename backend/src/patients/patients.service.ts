import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PatientsRepository } from './patients.repository';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchDto } from '../common/dto/search.dto';
import { Patient } from './entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class PatientsService {
    constructor(
        private readonly patientsRepository: PatientsRepository,
    ) { }

    async create(createPatientDto: CreatePatientDto, organizationId: string, currentUser?: User): Promise<Patient> {
        // Validate data
        await this.validatePatientCreation(createPatientDto, organizationId);

        // Generate patient number
        const patientNumber = await this.generateUniquePatientNumber(organizationId);

        // Calculate age for validation
        const age = this.calculateAge(new Date(createPatientDto.dateOfBirth));
        if (age < 0 || age > 150) {
            throw new BadRequestException('Date de naissance invalide');
        }

        // Prepare data
        const patientData = {
            ...createPatientDto,
            patientNumber,
            organizationId,
            dateOfBirth: new Date(createPatientDto.dateOfBirth),
        };

        return await this.patientsRepository.create(patientData, currentUser);
    }

    async findById(id: string): Promise<Patient> {
        return await this.patientsRepository.findById(id, ['organization']);
    }

    async findByPatientNumber(patientNumber: string): Promise<Patient | null> {
        return await this.patientsRepository.findByPatientNumber(patientNumber);
    }

    async update(id: string, updatePatientDto: UpdatePatientDto, currentUser?: User): Promise<Patient> {
        const existingPatient = await this.findById(id);

        // Validate changes
        await this.validatePatientUpdate(updatePatientDto, existingPatient);

        // Conversion de la date si nécessaire
        let updateData: Partial<Patient> = {
            ...updatePatientDto,
            dateOfBirth: updatePatientDto.dateOfBirth
                ? new Date(updatePatientDto.dateOfBirth)
                : undefined,
            lastVisit: updatePatientDto.lastVisit
                ? new Date(updatePatientDto.lastVisit)
                : undefined,
        };
        if (updatePatientDto.dateOfBirth) {
            const age = this.calculateAge(new Date(updatePatientDto.dateOfBirth));
            if (age < 0 || age > 150) {
                throw new BadRequestException('Date de naissance invalide');
            }
        }

        return await this.patientsRepository.update(id, updateData, currentUser);
    }

    async search(searchDto: SearchDto, organizationId: string): Promise<PaginatedResult<Patient>> {
        return await this.patientsRepository.search(searchDto, organizationId);
    }

    async deactivate(id: string, currentUser?: User): Promise<Patient> {
        return await this.patientsRepository.update(id, { isActive: false }, currentUser);
    }

    async activate(id: string, currentUser?: User): Promise<Patient> {
        return await this.patientsRepository.update(id, { isActive: true }, currentUser);
    }

    async updateLastVisit(id: string): Promise<void> {
        await this.patientsRepository.updateLastVisit(id);
    }

    // =============================
    // ADVANCED SEARCH METHODS
    // =============================
    async findRecentPatients(organizationId: string, limit: number = 10): Promise<Patient[]> {
        return await this.patientsRepository.findRecentPatients(organizationId, limit);
    }

    async findPatientsWithUpcomingAppointments(organizationId: string): Promise<Patient[]> {
        return await this.patientsRepository.findPatientsWithUpcomingAppointments(organizationId);
    }

    async searchByAllergy(allergen: string, organizationId: string): Promise<Patient[]> {
        const allPatients = await this.patientsRepository.findByOrganization(organizationId);
        return allPatients.filter(patient => patient.hasAllergy(allergen));
    }

    async searchByMedication(medicationName: string, organizationId: string): Promise<Patient[]> {
        const allPatients = await this.patientsRepository.findByOrganization(organizationId);
        return allPatients.filter(patient => patient.isOnMedication(medicationName));
    }

    // =============================
    // MEDICAL HISTORY MANAGEMENT
    // =============================
    async addAllergy(id: string, allergy: string, currentUser?: User): Promise<Patient> {
        const patient = await this.findById(id);

        const currentAllergies = patient.medicalHistory?.allergies || [];
        if (!currentAllergies.includes(allergy)) {
            currentAllergies.push(allergy);

            const updatedMedicalHistory = {
                ...patient.medicalHistory,
                allergies: currentAllergies,
            };

            return await this.patientsRepository.update(
                id,
                { medicalHistory: updatedMedicalHistory },
                currentUser
            );
        }

        return patient;
    }

    async removeAllergy(id: string, allergy: string, currentUser?: User): Promise<Patient> {
        const patient = await this.findById(id);

        const currentAllergies = patient.medicalHistory?.allergies || [];
        const updatedAllergies = currentAllergies.filter(a => a !== allergy);

        const updatedMedicalHistory = {
            ...patient.medicalHistory,
            allergies: updatedAllergies,
        };

        return await this.patientsRepository.update(
            id,
            { medicalHistory: updatedMedicalHistory },
            currentUser
        );
    }

    async addChronicDisease(id: string, disease: string, currentUser?: User): Promise<Patient> {
        const patient = await this.findById(id);

        const currentDiseases = patient.medicalHistory?.chronicDiseases || [];
        if (!currentDiseases.includes(disease)) {
            currentDiseases.push(disease);

            const updatedMedicalHistory = {
                ...patient.medicalHistory,
                chronicDiseases: currentDiseases,
            };

            return await this.patientsRepository.update(
                id,
                { medicalHistory: updatedMedicalHistory },
                currentUser
            );
        }

        return patient;
    }

    async updateTags(id: string, tags: string[], currentUser?: User): Promise<Patient> {
        return await this.patientsRepository.update(id, { tags }, currentUser);
    }

    // =============================
    // STATISTICS
    // =============================
    async getStats(organizationId: string): Promise<{
        total: number;
        active: number;
        newThisMonth: number;
        withAllergies: number;
        averageAge: number;
        genderDistribution: { male: number; female: number; other: number };
    }> {
        const baseStats = await this.patientsRepository.getPatientStats(organizationId);

        // Retrieve all patients for additional calculations
        const allPatients = await this.patientsRepository.findByOrganization(organizationId);

        // Calculate average age
        const ages = allPatients.map(patient => patient.age);
        const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

        // Gender distribution
        const genderDistribution = allPatients.reduce(
            (acc, patient) => {
                switch (patient.gender) {
                    case 'M': acc.male++; break;
                    case 'F': acc.female++; break;
                    default: acc.other++; break;
                }
                return acc;
            },
            { male: 0, female: 0, other: 0 }
        );

        return {
            ...baseStats,
            averageAge,
            genderDistribution,
        };
    }

    // =============================
    // PRIVATE METHODS
    // =============================
    private async generateUniquePatientNumber(organizationId: string): Promise<string> {
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const patientNumber = await this.patientsRepository.generatePatientNumber(organizationId);

            const exists = await this.patientsRepository.checkPatientNumberExists(patientNumber);
            if (!exists) {
                return patientNumber;
            }

            attempts++;
        }

        throw new Error('Impossible de générer un numéro patient unique');
    }

    private async validatePatientCreation(createPatientDto: CreatePatientDto, organizationId: string): Promise<void> {
        // Check for unique email (if provided)
        if (createPatientDto.email) {
            const emailExists = await this.patientsRepository.checkEmailExists(
                createPatientDto.email,
                organizationId,
            );

            if (emailExists) {
                throw new ConflictException('Un patient avec cet email existe déjà dans cette organisation');
            }
        }

        // Check for unique phone number
        const phoneExists = await this.patientsRepository.findByPhone(
            createPatientDto.phone,
            organizationId,
        );

        if (phoneExists) {
            throw new ConflictException('Un patient avec ce numéro de téléphone existe déjà dans cette organisation');
        }
    }

    private async validatePatientUpdate(updatePatientDto: UpdatePatientDto, existingPatient: Patient): Promise<void> {
        // Check email (if changed)
        if (updatePatientDto.email && updatePatientDto.email !== existingPatient.email) {
            const emailExists = await this.patientsRepository.checkEmailExists(
                updatePatientDto.email,
                existingPatient.organizationId,
                existingPatient.id,
            );

            if (emailExists) {
                throw new ConflictException('Un patient avec cet email existe déjà dans cette organisation');
            }
        }

        // Check phone (if changed)
        if (updatePatientDto.phone && updatePatientDto.phone !== existingPatient.phone) {
            const phoneExists = await this.patientsRepository.findByPhone(
                updatePatientDto.phone,
                existingPatient.organizationId,
            );

            if (phoneExists && phoneExists.id !== existingPatient.id) {
                throw new ConflictException('Un patient avec ce numéro de téléphone existe déjà dans cette organisation');
            }
        }
    }

    private calculateAge(dateOfBirth: Date): number {
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }

        return age;
    }
}