import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './patients.repository';
import { Patient } from './entities/patient.entity';
import {
    createMockPatient,
    createMockUser,
    createMockPaginationDto,
} from '../../test/helpers/test-data.helper';

describe('PatientsService', () => {
    let service: PatientsService;
    let repository: jest.Mocked<PatientsRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PatientsService,
                {
                    provide: PatientsRepository,
                    useValue: {
                        create: jest.fn(),
                        findById: jest.fn(),
                        findAll: jest.fn(),
                        update: jest.fn(),
                        softDelete: jest.fn(),
                        findByEmail: jest.fn(),
                        findByPhone: jest.fn(),
                        findByPatientNumber: jest.fn(),
                        search: jest.fn(),
                        getNextPatientNumber: jest.fn(),
                        findByOrganization: jest.fn(),
                        checkEmailExists: jest.fn(),
                        generatePatientNumber: jest.fn(),
                        checkPatientNumberExists: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PatientsService>(PatientsService);
        repository = module.get(PatientsRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new patient successfully', async () => {
            const createDto = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@email.com',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01',
                gender: 'M' as 'M' | 'F',
                address: '123 Main St',
                city: 'Medical City',
                state: 'MC',
                postalCode: '12345',
                country: 'USA',
            };

            const mockPatient = createMockPatient({
                ...createDto,
                dateOfBirth: new Date(createDto.dateOfBirth),
                patientNumber: 'P-2024-0001',
            });

            // Mock the private methods by creating spies
            jest.spyOn(service as any, 'validatePatientCreation').mockResolvedValue(undefined);
            jest.spyOn(service as any, 'generateUniquePatientNumber').mockResolvedValue('P-2024-0001');
            jest.spyOn(service as any, 'calculateAge').mockReturnValue(34);
            
            repository.create.mockResolvedValue(mockPatient);

            const result = await service.create(createDto, 'org-123');

            expect(result).toEqual(mockPatient);
            expect(service['validatePatientCreation']).toHaveBeenCalledWith(createDto, 'org-123');
            expect(service['generateUniquePatientNumber']).toHaveBeenCalledWith('org-123');
            expect(repository.create).toHaveBeenCalled();
        });

        it('should throw BadRequestException for invalid age', async () => {
            const createDto = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@email.com',
                phone: '+1234567890',
                dateOfBirth: '1800-01-01', // Too old
                gender: 'M' as 'M' | 'F',
            };

            jest.spyOn(service as any, 'validatePatientCreation').mockResolvedValue(undefined);
            jest.spyOn(service as any, 'generateUniquePatientNumber').mockResolvedValue('P-2024-0001');
            jest.spyOn(service as any, 'calculateAge').mockReturnValue(220); // Mock invalid age

            await expect(service.create(createDto, 'org-123')).rejects.toThrow(BadRequestException);
            expect(repository.create).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException for invalid date of birth', async () => {
            const createDto = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@email.com',
                phone: '+1234567890',
                dateOfBirth: '2090-01-01', // Future date
                gender: 'M' as 'M' | 'F',
            };

            jest.spyOn(service as any, 'validatePatientCreation').mockResolvedValue(undefined);
            jest.spyOn(service as any, 'generateUniquePatientNumber').mockResolvedValue('P-2024-0001');
            jest.spyOn(service as any, 'calculateAge').mockReturnValue(-65); // Mock negative age

            await expect(service.create(createDto, 'org-123')).rejects.toThrow(BadRequestException);
            expect(repository.create).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException for future date of birth', async () => {
            const createDto = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@email.com',
                phone: '+1234567890',
                dateOfBirth: '2050-01-01', // Future date
                gender: 'M' as 'M' | 'F',
            };

            jest.spyOn(service as any, 'validatePatientCreation').mockResolvedValue(undefined);
            jest.spyOn(service as any, 'generateUniquePatientNumber').mockResolvedValue('P-2024-0001');
            jest.spyOn(service as any, 'calculateAge').mockReturnValue(-25); // Mock negative age

            await expect(service.create(createDto, 'org-123')).rejects.toThrow(BadRequestException);
            expect(repository.create).not.toHaveBeenCalled();
        });
    });


    describe('findById', () => {
        it('should return a patient by id', async () => {
            const mockPatient = createMockPatient();
            repository.findById.mockResolvedValue(mockPatient);

            const result = await service.findById('patient-123');

            expect(result).toEqual(mockPatient);
            expect(repository.findById).toHaveBeenCalledWith('patient-123', ['organization']);
        });

        it('should throw NotFoundException if patient not found', async () => {
            repository.findById.mockRejectedValue(new NotFoundException());

            await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update patient successfully', async () => {
            const updateDto = {
                firstName: 'Updated',
                lastName: 'Name',
                phone: '+9876543210',
            };
            const mockPatient = createMockPatient();
            const updatedPatient = { ...mockPatient, ...updateDto };

            repository.findById.mockResolvedValue(mockPatient);
            repository.update.mockResolvedValue(updatedPatient as Patient);

            const result = await service.update('patient-123', updateDto);

            expect(result).toEqual(updatedPatient);
            expect(repository.update).toHaveBeenCalledWith('patient-123', updateDto, undefined);
        });

        it('should validate updates correctly', async () => {
            const updateDto = {
                firstName: 'UpdatedName',
            };
            const mockPatient = createMockPatient();
            const updatedPatient = { ...mockPatient, firstName: 'UpdatedName' };

            repository.findById.mockResolvedValue(mockPatient);
            jest.spyOn(service as any, 'validatePatientUpdate').mockResolvedValue(undefined);
            repository.update.mockResolvedValue(updatedPatient as any);

            const result = await service.update('patient-123', updateDto);

            expect(result).toEqual(updatedPatient);
            expect(repository.update).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should soft delete patient successfully', async () => {
            const mockPatient = createMockPatient();

            repository.update.mockResolvedValue(mockPatient);

            await service.deactivate('patient-123');

            expect(repository.update).toHaveBeenCalledWith('patient-123', { isActive: false }, undefined);
        });
    });

    describe('search', () => {
        it('should search patients by query', async () => {
            const searchDto = {
                query: 'john',
                page: 1,
                limit: 10,
                skip: 0
            };
            const mockPatients = [createMockPatient({ firstName: 'John' })];
            const mockResult = {
                data: mockPatients,
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };

            repository.search.mockResolvedValue(mockResult);

            const result = await service.search(searchDto, 'org-123');

            expect(result).toEqual(mockResult);
            expect(repository.search).toHaveBeenCalledWith(searchDto, 'org-123');
        });
    });



    describe('findByPatientNumber', () => {
        it('should return patient by patient number', async () => {
            const mockPatient = createMockPatient({ patientNumber: 'P-2024-0001' });
            repository.findByPatientNumber.mockResolvedValue(mockPatient);

            const result = await service.findByPatientNumber('P-2024-0001');

            expect(result).toEqual(mockPatient);
            expect(repository.findByPatientNumber).toHaveBeenCalledWith('P-2024-0001');
        });

        it('should return null if patient not found', async () => {
            repository.findByPatientNumber.mockResolvedValue(null);

            const result = await service.findByPatientNumber('P-2024-9999');

            expect(result).toBeNull();
        });
    });
});