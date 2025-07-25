import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SeedService } from './seed.service';
import { Role } from '../../users/entities/role.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Role, Organization, User]),
    ],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule { }
