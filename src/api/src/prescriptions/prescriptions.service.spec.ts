import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsRepository } from './prescriptions.repository';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { SearchDto } from '../common/dto/search.dto';
import { Prescription } from './entities/prescription.entity';
import { RoleName } from '../users/entities/role.entity';
import { 
    createMockPrescription,
    createMockPrescriptionWithRelations,
    createMockMedication,
    createMockMedications,
    createMockWarning,
    createMockUser,
    createMockPatient,
    createMockConsultation,
    createMockPaginationDto
} from '../../test/helpers/test-data.helper';

describe('PrescriptionsService', () => {
    let service: PrescriptionsService;
    let repository: jest.Mocked<PrescriptionsRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PrescriptionsService,
                {
                    provide: PrescriptionsRepository,
                    useValue: {
                        create: jest.fn(),
                        findById: jest.fn(),
                        update: jest.fn(),
                        search: jest.fn(),
                        findByConsultation: jest.fn(),
                        findByPatient: jest.fn(),
                        findByMedication: jest.fn(),
                        getStats: jest.fn(),
                        getNextPrescriptionNumber: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PrescriptionsService>(PrescriptionsService);
        repository = module.get(PrescriptionsRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const createPrescriptionDto: CreatePrescriptionDto = {
            patientId: 'patient-123',
            consultationId: 'consultation-123',
            medications: createMockMedications(2),
            generalInstructions: 'Complete the full course',
            notes: 'Patient allergic to penicillin',
        };

        it('should create a prescription successfully', async () => {
            const mockUser = createMockUser({ id: 'doctor-123' });
            const mockPrescription = createMockPrescription();
            const mockPrescriptionWithRelations = createMockPrescriptionWithRelations();

            repository.getNextPrescriptionNumber.mockResolvedValue('RX-202409-0001');
            repository.create.mockResolvedValue(mockPrescription as Prescription);
            repository.findById.mockResolvedValue(mockPrescriptionWithRelations as Prescription);

            const result = await service.create(createPrescriptionDto, 'org-123', mockUser);

            expect(repository.getNextPrescriptionNumber).toHaveBeenCalled();
            expect(repository.create).toHaveBeenCalled();
            
            const createCall = repository.create.mock.calls[0][0] as any;
            expect(createCall.patientId).toBe('patient-123');
            expect(createCall.doctorId).toBe('doctor-123');
            expect(createCall.consultationId).toBe('consultation-123');
            expect(createCall.prescriptionNumber).toBe('RX-202409-0001');
            expect(createCall.organizationId).toBe('org-123');
            expect(createCall.generalInstructions).toBe('Complete the full course');
            expect(createCall.notes).toBe('Patient allergic to penicillin');
            expect(createCall.medications).toHaveLength(2);
            expect(typeof createCall.prescribedDate).toBe('object');
            expect(createCall.warnings).toBeDefined();
            
            expect(repository.create.mock.calls[0][1]).toBe(mockUser);
            expect(repository.findById).toHaveBeenCalledWith(mockPrescription.id, [
                'patient',
                'doctor',
                'consultation',
                'consultation.patient',
                'consultation.doctor',
            ]);
            expect(result).toEqual(mockPrescriptionWithRelations);
        });

        it('should throw BadRequestException if user is not authenticated', async () => {
            await expect(
                service.create(createPrescriptionDto, 'org-123', undefined)
            ).rejects.toThrow(BadRequestException);
            await expect(
                service.create(createPrescriptionDto, 'org-123', { id: undefined } as any)
            ).rejects.toThrow(BadRequestException);

            expect(repository.create).not.toHaveBeenCalled();
        });

        it('should set prescribedDate to current system timestamp', async () => {
            const mockUser = createMockUser();
            const mockPrescription = createMockPrescription();
            const mockPrescriptionWithRelations = createMockPrescriptionWithRelations();
            const beforeTime = new Date().getTime();

            repository.getNextPrescriptionNumber.mockResolvedValue('RX-202409-0001');
            repository.create.mockResolvedValue(mockPrescription as Prescription);
            repository.findById.mockResolvedValue(mockPrescriptionWithRelations as Prescription);

            await service.create(createPrescriptionDto, 'org-123', mockUser);

            const afterTime = new Date().getTime();
            const createCall = repository.create.mock.calls[0][0] as any;
            const prescribedDate = new Date(createCall.prescribedDate).getTime();

            expect(prescribedDate).toBeGreaterThanOrEqual(beforeTime);
            expect(prescribedDate).toBeLessThanOrEqual(afterTime);
        });

        it('should analyze drug interactions and add warnings', async () => {
            const mockUser = createMockUser();
            const mockPrescription = createMockPrescription();
            const mockPrescriptionWithRelations = createMockPrescriptionWithRelations();

            // Create prescription with interacting medications
            const prescriptionWithInteractions = {
                ...createPrescriptionDto,
                medications: [
                    createMockMedication({ name: 'Warfarine' }),
                    createMockMedication({ name: 'Aspirine' })
                ]
            };

            repository.getNextPrescriptionNumber.mockResolvedValue('RX-202409-0001');
            repository.create.mockResolvedValue(mockPrescription as Prescription);
            repository.findById.mockResolvedValue(mockPrescriptionWithRelations as Prescription);

            await service.create(prescriptionWithInteractions, 'org-123', mockUser);

            const createCall = repository.create.mock.calls[0][0];
            expect(createCall.warnings).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'interaction',
                        message: expect.stringContaining('warfarine + aspirine'),
                        severity: 'high',
                    })
                ])
            );
        });

        it('should handle optional consultationId for standalone prescriptions', async () => {
            const mockUser = createMockUser();
            const mockPrescription = createMockPrescription();
            const mockPrescriptionWithRelations = createMockPrescriptionWithRelations();
            
            const standalonePrescription = {
                ...createPrescriptionDto,
                consultationId: undefined,
            };

            repository.getNextPrescriptionNumber.mockResolvedValue('RX-202409-0001');
            repository.create.mockResolvedValue(mockPrescription as Prescription);
            repository.findById.mockResolvedValue(mockPrescriptionWithRelations as Prescription);

            await service.create(standalonePrescription, 'org-123', mockUser);

            const createCall = repository.create.mock.calls[0][0];
            expect(createCall.consultationId).toBeUndefined();
        });

        it('should generate unique prescription numbers', async () => {
            const mockUser = createMockUser();
            const mockPrescription = createMockPrescription();
            const mockPrescriptionWithRelations = createMockPrescriptionWithRelations();

            repository.getNextPrescriptionNumber.mockResolvedValue('RX-202409-0002');
            repository.create.mockResolvedValue(mockPrescription as Prescription);
            repository.findById.mockResolvedValue(mockPrescriptionWithRelations as Prescription);

            await service.create(createPrescriptionDto, 'org-123', mockUser);

            const createCall = repository.create.mock.calls[0][0];
            expect(createCall.prescriptionNumber).toBe('RX-202409-0002');
            expect(repository.getNextPrescriptionNumber).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return prescription with relations', async () => {
            const mockPrescription = createMockPrescriptionWithRelations();
            repository.findById.mockResolvedValue(mockPrescription as Prescription);

            const result = await service.findById('prescription-123');

            expect(repository.findById).toHaveBeenCalledWith('prescription-123', [
                'patient',
                'doctor',
                'consultation',
                'consultation.patient',
                'consultation.doctor',
            ]);
            expect(result).toEqual(mockPrescription);
        });

        it('should throw NotFoundException if prescription not found', async () => {
            repository.findById.mockRejectedValue(new NotFoundException());

            await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update prescription successfully', async () => {
            const updateDto: UpdatePrescriptionDto = {
                notes: 'Updated notes',
            };
            const mockUser = createMockUser();
            const mockPrescription = createMockPrescription(updateDto);

            repository.update.mockResolvedValue(mockPrescription as Prescription);

            const result = await service.update('prescription-123', updateDto, mockUser);

            expect(repository.update).toHaveBeenCalledWith('prescription-123', updateDto, mockUser);
            expect(result).toEqual(mockPrescription);
        });

        it('should update prescription without currentUser', async () => {
            const updateDto: UpdatePrescriptionDto = {
                notes: 'Updated notes',
            };
            const mockPrescription = createMockPrescription(updateDto);

            repository.update.mockResolvedValue(mockPrescription as Prescription);

            const result = await service.update('prescription-123', updateDto);

            expect(repository.update).toHaveBeenCalledWith('prescription-123', updateDto, undefined);
            expect(result).toEqual(mockPrescription);
        });
    });

    describe('search', () => {
        it('should return paginated prescription results', async () => {
            const searchDto: SearchDto = {
                ...createMockPaginationDto(),
                search: 'Amoxicillin',
            };
            const mockResults = {
                data: [createMockPrescription()],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            };

            repository.search.mockResolvedValue(mockResults);

            const result = await service.search(searchDto, 'org-123');

            expect(repository.search).toHaveBeenCalledWith(searchDto, 'org-123');
            expect(result).toEqual(mockResults);
        });
    });

    describe('findByConsultation', () => {
        it('should return prescriptions for a consultation', async () => {
            const mockPrescriptions = [
                createMockPrescription({ consultationId: 'consultation-123' }),
                createMockPrescription({ 
                    id: 'prescription-456',
                    consultationId: 'consultation-123',
                    prescriptionNumber: 'RX-202409-0002'
                }),
            ];

            repository.findByConsultation.mockResolvedValue(mockPrescriptions as Prescription[]);

            const result = await service.findByConsultation('consultation-123');

            expect(repository.findByConsultation).toHaveBeenCalledWith('consultation-123');
            expect(result).toEqual(mockPrescriptions);
        });
    });

    describe('findByPatient', () => {
        it('should return prescriptions for a patient', async () => {
            const mockPrescriptions = [
                createMockPrescription({ patientId: 'patient-123' }),
                createMockPrescription({ 
                    id: 'prescription-456',
                    patientId: 'patient-123',
                    prescriptionNumber: 'RX-202409-0002'
                }),
            ];

            repository.findByPatient.mockResolvedValue(mockPrescriptions as Prescription[]);

            const result = await service.findByPatient('patient-123');

            expect(repository.findByPatient).toHaveBeenCalledWith('patient-123');
            expect(result).toEqual(mockPrescriptions);
        });
    });

    describe('findByMedication', () => {
        it('should return prescriptions containing a specific medication', async () => {
            const mockPrescriptions = [createMockPrescription()];

            repository.findByMedication.mockResolvedValue(mockPrescriptions as Prescription[]);

            const result = await service.findByMedication('Amoxicillin', 'org-123');

            expect(repository.findByMedication).toHaveBeenCalledWith('Amoxicillin', 'org-123');
            expect(result).toEqual(mockPrescriptions);
        });
    });

    describe('analyzeInteractions', () => {
        it('should detect warfarin-aspirin interaction', async () => {
            const medications = [
                createMockMedication({ name: 'Warfarine' }),
                createMockMedication({ name: 'Aspirine' })
            ];

            const result = await service.analyzeInteractions(medications);

            expect(result).toEqual([
                expect.objectContaining({
                    type: 'interaction',
                    message: expect.stringContaining('warfarine + aspirine'),
                    severity: 'high',
                })
            ]);
        });

        it('should detect metformin-contrast interaction', async () => {
            const medications = [
                createMockMedication({ name: 'Metformin' }),
                createMockMedication({ name: 'Iodinated Contrast Agent' })
            ];

            const result = await service.analyzeInteractions(medications);

            expect(result).toEqual([
                expect.objectContaining({
                    type: 'interaction',
                    message: expect.stringContaining('metformin + iodinated contrast'),
                    severity: 'critical',
                })
            ]);
        });

        it('should detect digoxin-furosemide interaction', async () => {
            const medications = [
                createMockMedication({ name: 'Digoxin' }),
                createMockMedication({ name: 'Furosemide' })
            ];

            const result = await service.analyzeInteractions(medications);

            expect(result).toEqual([
                expect.objectContaining({
                    type: 'interaction',
                    message: expect.stringContaining('digoxin + furosemide'),
                    severity: 'medium',
                })
            ]);
        });

        it('should return empty array for non-interacting medications', async () => {
            const medications = [
                createMockMedication({ name: 'Vitamin C' }),
                createMockMedication({ name: 'Paracetamol' })
            ];

            const result = await service.analyzeInteractions(medications);

            expect(result).toEqual([]);
        });

        it('should handle case-insensitive medication names', async () => {
            const medications = [
                createMockMedication({ name: 'WARFARINE' }),
                createMockMedication({ name: 'aspirine' })
            ];

            const result = await service.analyzeInteractions(medications);

            expect(result).toHaveLength(1);
            expect(result[0].severity).toBe('high');
        });
    });

    describe('checkPatientAllergies', () => {
        it('should return empty array (TODO implementation)', async () => {
            const medications = createMockMedications();

            const result = await service.checkPatientAllergies('patient-123', medications);

            expect(result).toEqual([]);
        });
    });

    describe('getStats', () => {
        it('should return prescription statistics', async () => {
            const mockStats = {
                total: 150,
                withWarnings: 25,
            };

            repository.getStats.mockResolvedValue(mockStats);

            const result = await service.getStats('org-123');

            expect(repository.getStats).toHaveBeenCalledWith('org-123');
            expect(result).toEqual(mockStats);
        });
    });

    describe('getPatientMedicationHistory', () => {
        it('should return patient medication history', async () => {
            const mockPrescriptions = [
                createMockPrescription({ patientId: 'patient-123' }),
                createMockPrescription({ 
                    id: 'prescription-456',
                    patientId: 'patient-123',
                    prescriptionNumber: 'RX-202409-0002'
                }),
            ];

            repository.findByPatient.mockResolvedValue(mockPrescriptions as Prescription[]);

            const result = await service.getPatientMedicationHistory('patient-123');

            expect(repository.findByPatient).toHaveBeenCalledWith('patient-123');
            expect(result).toEqual({
                allPrescriptions: mockPrescriptions,
                allergies: [], // TODO: Will be implemented later
            });
        });
    });
});