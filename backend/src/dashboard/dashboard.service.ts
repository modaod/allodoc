import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, Between, IsNull } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { Prescription } from '../prescriptions/entities/prescription.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { RecentActivityDto, ActivityItemDto } from './dto/recent-activity.dto';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        @InjectRepository(Consultation)
        private readonly consultationRepository: Repository<Consultation>,
        @InjectRepository(Prescription)
        private readonly prescriptionRepository: Repository<Prescription>,
    ) {}

    async getDashboardStats(userId: string, organizationId: string): Promise<DashboardStatsDto> {
        try {
            this.logger.log(`Getting dashboard stats for userId: ${userId}, organizationId: ${organizationId}`);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Week starts on Sunday, ends on Saturday
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            this.logger.debug(`Date ranges - today: ${today.toISOString()}, tomorrow: ${tomorrow.toISOString()}, startOfWeek: ${startOfWeek.toISOString()}, endOfWeek: ${endOfWeek.toISOString()}`);

            // Get statistics in parallel
            const [
                totalPatients,
                todayConsultations,
                thisWeekConsultations,
                totalConsultations,
            ] = await Promise.all([
                this.patientRepository.count({
                    where: { organizationId },
                }).catch(err => {
                    this.logger.error('Error counting patients:', err);
                    throw err;
                }),
                this.consultationRepository.count({
                    where: {
                        organizationId,
                        consultationDate: Between(today, tomorrow),
                    },
                }).catch(err => {
                    this.logger.error('Error counting today consultations:', err);
                    throw err;
                }),
                this.consultationRepository.count({
                    where: {
                        organizationId,
                        consultationDate: Between(startOfWeek, endOfWeek),
                    },
                }).catch(err => {
                    this.logger.error('Error counting week consultations:', err);
                    throw err;
                }),
                this.consultationRepository.count({
                    where: { organizationId },
                }).catch(err => {
                    this.logger.error('Error counting total consultations:', err);
                    throw err;
                }),
            ]);

            const stats = {
                totalPatients,
                todayConsultations,
                thisWeekConsultations,
                totalConsultations,
            };

            this.logger.log(`Dashboard stats retrieved successfully: ${JSON.stringify(stats)}`);
            return stats;
        } catch (error) {
            this.logger.error(`Error getting dashboard stats: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getRecentActivity(userId: string, organizationId: string): Promise<RecentActivityDto> {
        try {
            this.logger.log(`Getting recent activity for userId: ${userId}, organizationId: ${organizationId}`);
            
            // Get recent consultations (last 5)
            const recentConsultations = await this.consultationRepository.find({
                where: { organizationId },
                relations: ['patient'],
                order: { consultationDate: 'DESC' },
                take: 5,
            }).catch(err => {
                this.logger.error('Error fetching recent consultations:', err);
                throw err;
            });

            this.logger.debug(`Found ${recentConsultations.length} recent consultations`);

            // Get recent patients (last 5)
            const recentPatients = await this.patientRepository.find({
                where: { organizationId },
                order: { createdAt: 'DESC' },
                take: 5,
            }).catch(err => {
                this.logger.error('Error fetching recent patients:', err);
                throw err;
            });

            this.logger.debug(`Found ${recentPatients.length} recent patients`);

            // Get recent standalone prescriptions (last 5)
            const recentPrescriptions = await this.prescriptionRepository.find({
                where: { 
                    organizationId,
                    consultationId: IsNull()  // Only standalone prescriptions (quick prescriptions)
                },
                relations: ['patient'],
                order: { prescribedDate: 'DESC' },
                take: 5,
            }).catch(err => {
                this.logger.error('Error fetching recent prescriptions:', err);
                throw err;
            });

            this.logger.debug(`Found ${recentPrescriptions.length} recent standalone prescriptions`);

            // Convert to activity items
            const activities: ActivityItemDto[] = [];

            // Add consultations
            recentConsultations.forEach(consultation => {
                try {
                    activities.push({
                        type: 'consultation',
                        title: `Consultation with ${consultation.patient?.firstName || 'Unknown'} ${consultation.patient?.lastName || 'Patient'}`,
                        description: consultation.reason || (consultation as any).chiefComplaint || 'Medical consultation',
                        timestamp: consultation.consultationDate,
                        icon: 'medical_services',
                        entityId: consultation.id,
                    });
                } catch (err) {
                    this.logger.warn(`Error processing consultation ${consultation.id}:`, err);
                }
            });

            // Add recent patients
            recentPatients.forEach(patient => {
                try {
                    activities.push({
                        type: 'patient',
                        title: `New patient: ${patient.firstName || 'Unknown'} ${patient.lastName || 'Patient'}`,
                        description: 'Patient registered',
                        timestamp: patient.createdAt,
                        icon: 'person_add',
                        entityId: patient.id,
                    });
                } catch (err) {
                    this.logger.warn(`Error processing patient ${patient.id}:`, err);
                }
            });

            // Add recent standalone prescriptions
            recentPrescriptions.forEach(prescription => {
                try {
                    const medicationCount = prescription.medications?.length || 0;
                    const medicationNames = prescription.medications?.slice(0, 2).map(m => m.name).join(', ') || 'No medications';
                    const description = medicationCount > 2 
                        ? `${medicationNames} and ${medicationCount - 2} more`
                        : medicationNames;
                    
                    activities.push({
                        type: 'prescription',
                        title: `Prescription for ${prescription.patient?.firstName || 'Unknown'} ${prescription.patient?.lastName || 'Patient'}`,
                        description: description,
                        timestamp: prescription.prescribedDate,
                        icon: 'medication',
                        entityId: prescription.id,
                    });
                } catch (err) {
                    this.logger.warn(`Error processing prescription ${prescription.id}:`, err);
                }
            });

            // Sort by timestamp and take latest 10
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            const result = {
                activities: activities.slice(0, 10),
            };

            this.logger.log(`Recent activity retrieved successfully: ${activities.length} activities`);
            return result;
        } catch (error) {
            this.logger.error(`Error getting recent activity: ${error.message}`, error.stack);
            throw error;
        }
    }
}