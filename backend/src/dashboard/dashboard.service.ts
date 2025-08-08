import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { Prescription } from '../prescriptions/entities/prescription.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { RecentActivityDto, ActivityItemDto } from './dto/recent-activity.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        @InjectRepository(Consultation)
        private readonly consultationRepository: Repository<Consultation>,
        @InjectRepository(Prescription)
        private readonly prescriptionRepository: Repository<Prescription>,
    ) {}

    async getDashboardStats(userId: string, organizationId: string): Promise<DashboardStatsDto> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        // Get statistics in parallel
        const [
            totalPatients,
            todayConsultations,
            thisWeekConsultations,
            totalConsultations,
        ] = await Promise.all([
            this.patientRepository.count({
                where: { organizationId },
            }),
            this.consultationRepository.count({
                where: {
                    organizationId,
                    consultationDate: MoreThanOrEqual(today),
                },
            }),
            this.consultationRepository.count({
                where: {
                    organizationId,
                    consultationDate: MoreThanOrEqual(startOfWeek),
                },
            }),
            this.consultationRepository.count({
                where: { organizationId },
            }),
        ]);

        return {
            totalPatients,
            todayConsultations,
            thisWeekConsultations,
            totalConsultations,
        };
    }

    async getRecentActivity(userId: string, organizationId: string): Promise<RecentActivityDto> {
        // Get recent consultations (last 10)
        const recentConsultations = await this.consultationRepository.find({
            where: { organizationId },
            relations: ['patient'],
            order: { consultationDate: 'DESC' },
            take: 5,
        });

        // Get recent patients (last 5)
        const recentPatients = await this.patientRepository.find({
            where: { organizationId },
            order: { createdAt: 'DESC' },
            take: 5,
        });

        // Convert to activity items
        const activities: ActivityItemDto[] = [];

        // Add consultations
        recentConsultations.forEach(consultation => {
            activities.push({
                type: 'consultation',
                title: `Consultation with ${consultation.patient?.firstName} ${consultation.patient?.lastName}`,
                description: consultation.reason || 'Medical consultation',
                timestamp: consultation.consultationDate,
                icon: 'medical_services',
            });
        });

        // Add recent patients
        recentPatients.forEach(patient => {
            activities.push({
                type: 'patient',
                title: `New patient: ${patient.firstName} ${patient.lastName}`,
                description: 'Patient registered',
                timestamp: patient.createdAt,
                icon: 'person_add',
            });
        });

        // Sort by timestamp and take latest 10
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return {
            activities: activities.slice(0, 10),
        };
    }
}