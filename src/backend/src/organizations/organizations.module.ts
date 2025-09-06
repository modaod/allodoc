import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationsRepository } from './organizations.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Organization])],
    controllers: [OrganizationsController],
    providers: [OrganizationsService, OrganizationsRepository],
    exports: [OrganizationsService, OrganizationsRepository],
})
export class OrganizationsModule {}
