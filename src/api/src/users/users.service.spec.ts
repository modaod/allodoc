import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { RolesRepository } from './roles.repository';
import { RolesService } from './roles.service';
import { User } from './entities/user.entity';
import { RoleName } from './entities/role.entity';
import * as bcrypt from 'bcryptjs';
import {
    createMockUser,
    createMockOrganization,
    createMockRole,
    createMockUserWithOrganization,
    createMockPaginationDto,
} from '../../test/helpers/test-data.helper';

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('UsersService', () => {
    let service: UsersService;
    let usersRepository: jest.Mocked<UsersRepository>;
    let rolesRepository: jest.Mocked<RolesRepository>;
    let rolesService: jest.Mocked<RolesService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: UsersRepository,
                    useValue: {
                        create: jest.fn(),
                        findById: jest.fn(),
                        findByEmail: jest.fn(),
                        findAll: jest.fn(),
                        update: jest.fn(),
                        softDelete: jest.fn(),
                        findByOrganization: jest.fn(),
                        countByOrganization: jest.fn(),
                        assignRole: jest.fn(),
                        removeRole: jest.fn(),
                        getUserRoles: jest.fn(),
                        findWithOrganizations: jest.fn(),
                        checkEmailExists: jest.fn(),
                        updateLastLogin: jest.fn(),
                        findByLicenseNumber: jest.fn(),
                        checkLicenseExists: jest.fn(),
                        findDoctors: jest.fn(),
                        searchDoctors: jest.fn(),
                        findAvailableDoctors: jest.fn(),
                        countByRole: jest.fn(),
                    },
                },
                {
                    provide: RolesRepository,
                    useValue: {
                        findByIds: jest.fn(),
                        findById: jest.fn(),
                        findByName: jest.fn(),
                    },
                },
                {
                    provide: RolesService,
                    useValue: {
                        findByName: jest.fn(),
                        findById: jest.fn(),
                        create: jest.fn(),
                        findAll: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        usersRepository = module.get(UsersRepository);
        rolesRepository = module.get(RolesRepository);
        rolesService = module.get(RolesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new user successfully', async () => {
            const createUserDto = {
                email: 'newuser@medical.com',
                password: 'Password123!',
                firstName: 'New',
                lastName: 'User',
                phone: '+1234567890',
                roleIds: ['role-doctor'],
                organizationId: 'org-123',
                specialty: 'Cardiology',
            };

            const mockRole = createMockRole(RoleName.DOCTOR);
            const mockUser = createMockUser({
                email: createUserDto.email,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
            });

            usersRepository.checkEmailExists.mockResolvedValue(false);
            rolesRepository.findByIds.mockResolvedValue([mockRole]);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            usersRepository.create.mockResolvedValue(mockUser);

            const result = await service.create(createUserDto);

            expect(result).toEqual(mockUser);
            expect(rolesRepository.findByIds).toHaveBeenCalledWith(createUserDto.roleIds);
            expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
            expect(usersRepository.create).toHaveBeenCalled();
        });

        it('should throw BadRequestException if roles are invalid', async () => {
            const createUserDto = {
                email: 'existing@medical.com',
                password: 'Password123!',
                firstName: 'Existing',
                lastName: 'User',
                phone: '+1234567890',
                roleIds: ['invalid-role1', 'invalid-role2'],
                organizationId: 'org-123',
            };

            rolesRepository.findByIds.mockResolvedValue([]); // No roles found

            await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
            expect(usersRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all users', async () => {
            const mockUsers = [
                createMockUser(),
                createMockUser({ id: 'user-456', email: 'user2@medical.com' }),
            ];

            usersRepository.findAll.mockResolvedValue(mockUsers);

            const result = await service.findAll();

            expect(result).toEqual(mockUsers);
            expect(usersRepository.findAll).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return a user by id', async () => {
            const mockUser = createMockUser();
            usersRepository.findById.mockResolvedValue(mockUser);

            const result = await service.findById('user-123');

            expect(result).toEqual(mockUser);
            expect(usersRepository.findById).toHaveBeenCalledWith('user-123', [
                'roles',
                'organization',
            ]);
        });

        it('should throw NotFoundException if user not found', async () => {
            usersRepository.findById.mockRejectedValue(new NotFoundException());

            await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findByEmail', () => {
        it('should return a user by email', async () => {
            const mockUser = createMockUser();
            usersRepository.findByEmail.mockResolvedValue(mockUser);

            const result = await service.findByEmail('test@medical.com', 'org-123');

            expect(result).toEqual(mockUser);
            expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@medical.com', 'org-123');
        });

        it('should return null if user not found', async () => {
            usersRepository.findByEmail.mockResolvedValue(null);

            const result = await service.findByEmail('nonexistent@medical.com', 'org-123');

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update user successfully', async () => {
            const updateDto = {
                firstName: 'Updated',
                lastName: 'Name',
                phone: '+9876543210',
            };
            const mockUser = createMockUser();
            const updatedUser = { ...mockUser, ...updateDto };

            usersRepository.findById.mockResolvedValue(mockUser);
            usersRepository.update.mockResolvedValue(updatedUser as User);

            const result = await service.update('user-123', updateDto);

            expect(result).toEqual(updatedUser);
            expect(usersRepository.update).toHaveBeenCalledWith('user-123', updateDto, undefined);
        });

        it('should prevent email updates', async () => {
            const updateDto = {
                email: 'newemail@medical.com',
                firstName: 'Updated',
            };
            const existingUser = createMockUser({
                id: 'user-123',
                email: 'original@medical.com',
                organizationId: 'org-123',
            });

            usersRepository.findById.mockResolvedValue(existingUser);
            usersRepository.checkEmailExists.mockResolvedValue(false);
            usersRepository.update.mockResolvedValue(
                createMockUser({ ...existingUser, firstName: 'Updated' }),
            );

            const result = await service.update('user-123', updateDto);

            expect(usersRepository.update).toHaveBeenCalledWith(
                'user-123',
                expect.objectContaining({ firstName: 'Updated' }),
                undefined,
            );
        });

        it('should hash password if provided', async () => {
            const updateDto = {
                password: 'NewPassword123!',
            };
            const mockUser = createMockUser();

            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
            usersRepository.findById.mockResolvedValue(mockUser);
            usersRepository.checkEmailExists.mockResolvedValue(false);
            usersRepository.update.mockResolvedValue(mockUser);

            await service.update('user-123', updateDto);

            expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
            expect(usersRepository.update).toHaveBeenCalledWith(
                'user-123',
                { password: 'newHashedPassword' },
                undefined,
            );
        });
    });

    describe('updateLastLogin', () => {
        it('should update last login timestamp', async () => {
            usersRepository.updateLastLogin.mockResolvedValue();

            await service.updateLastLogin('user-123');

            expect(usersRepository.updateLastLogin).toHaveBeenCalledWith('user-123');
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const mockUser = createMockUser();

            usersRepository.findById.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
            usersRepository.update.mockResolvedValue(mockUser);

            await service.changePassword('user-123', 'oldPassword', 'newPassword123!');

            expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', mockUser.password);
            expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123!', 12);
            expect(usersRepository.update).toHaveBeenCalledWith('user-123', {
                password: 'newHashedPassword',
            });
        });

        it('should throw BadRequestException for incorrect current password', async () => {
            const mockUser = createMockUser();

            usersRepository.findById.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                service.changePassword('user-123', 'wrongPassword', 'newPassword123!'),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
