import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { UsersModule } from '../users/users.module';
import { PatientsModule } from '../patients/patients.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment]),
        forwardRef(() => UsersModule),
        forwardRef(() => PatientsModule),
        forwardRef(() => OrganizationsModule),
    ],
    controllers: [AppointmentsController],
    providers: [AppointmentsService, AppointmentsRepository],
    exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
