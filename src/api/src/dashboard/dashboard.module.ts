import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Patient } from '../patients/entities/patient.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { Prescription } from '../prescriptions/entities/prescription.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Patient, Consultation, Prescription])],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule {}
