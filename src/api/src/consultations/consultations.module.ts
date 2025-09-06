import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './entities/consultation.entity';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { ConsultationsRepository } from './consultations.repository';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PatientsModule } from '../patients/patients.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Consultation]),
        forwardRef(() => AppointmentsModule),
        forwardRef(() => PatientsModule),
        forwardRef(() => PrescriptionsModule),
        forwardRef(() => UsersModule),
        forwardRef(() => OrganizationsModule),
    ],
    controllers: [ConsultationsController],
    providers: [ConsultationsService, ConsultationsRepository],
    exports: [ConsultationsService, ConsultationsRepository],
})
export class ConsultationsModule {}
