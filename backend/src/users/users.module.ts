import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Role]),
        forwardRef(() => OrganizationsModule), // Avoid circular dependency
    ],
    controllers: [UsersController],
    providers: [
        UsersService,
        UsersRepository,
        RolesService,
        RolesRepository,
    ],
    exports: [
        UsersService,
        UsersRepository,
        RolesService,
        RolesRepository,
    ],
})
export class UsersModule { }