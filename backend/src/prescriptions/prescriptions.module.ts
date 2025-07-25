import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './entities/prescription.entity';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsRepository } from './prescriptions.repository';
import { ConsultationsModule } from '../consultations/consultations.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Prescription]),
        forwardRef(() => ConsultationsModule),
        forwardRef(() => OrganizationsModule),
    ],
    controllers: [PrescriptionsController],
    providers: [
        PrescriptionsService,
        PrescriptionsRepository,
    ],
    exports: [
        PrescriptionsService,
        PrescriptionsRepository,
    ],
})
export class PrescriptionsModule { }