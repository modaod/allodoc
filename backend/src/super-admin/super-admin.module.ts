import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { Prescription } from '../prescriptions/entities/prescription.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Role } from '../users/entities/role.entity';
import { UserOrganization } from '../users/entities/user-organization.entity';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Organization,
            Patient,
            Consultation,
            Prescription,
            Appointment,
            Role,
            UserOrganization,
        ]),
        UsersModule,
        OrganizationsModule,
    ],
    controllers: [SuperAdminController],
    providers: [SuperAdminService],
    exports: [SuperAdminService],
})
export class SuperAdminModule {}