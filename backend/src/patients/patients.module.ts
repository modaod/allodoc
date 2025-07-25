import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './patients.repository';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Patient]),
        forwardRef(() => OrganizationsModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [PatientsController],
    providers: [
        PatientsService,
        PatientsRepository,
    ],
    exports: [
        PatientsService,
        PatientsRepository,
    ],
})
export class PatientsModule { }