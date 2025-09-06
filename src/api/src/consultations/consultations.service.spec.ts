import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { ConsultationsRepository } from './consultations.repository';
import { AppointmentsService } from '../appointments/appointments.service';
import { PatientsService } from '../patients/patients.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { Consultation } from './entities/consultation.entity';
import { ConsultationType } from './dto/create-consultation.dto';
import {
    createMockConsultation,
    createMockPatient,
    createMockUser,
} from '../../test/helpers/test-data.helper';

describe('ConsultationsService', () => {
    let service: ConsultationsService;
    let repository: jest.Mocked<ConsultationsRepository>;
    let appointmentsService: jest.Mocked<AppointmentsService>;
    let patientsService: jest.Mocked<PatientsService>;
    let prescriptionsService: jest.Mocked<PrescriptionsService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConsultationsService,
                {
                    provide: ConsultationsRepository,
                    useValue: {
                        create: jest.fn(),
                        findById: jest.fn(),
                        search: jest.fn(),
                        update: jest.fn(),
                        softDelete: jest.fn(),
                        findByPatient: jest.fn(),
                        findByDoctor: jest.fn(),
                        findByDateRange: jest.fn(),
                        findRecentConsultations: jest.fn(),
                        getNextConsultationNumber: jest.fn(),
                        getStats: jest.fn(),
                    },
                },
                {
                    provide: AppointmentsService,
                    useValue: {
                        findById: jest.fn(),
                        complete: jest.fn(),
                    },
                },
                {
                    provide: PatientsService,
                    useValue: {
                        findById: jest.fn(),
                        updateLastVisit: jest.fn(),
                    },
                },
                {
                    provide: PrescriptionsService,
                    useValue: {
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ConsultationsService>(ConsultationsService);
        repository = module.get(ConsultationsRepository);
        appointmentsService = module.get(AppointmentsService);
        patientsService = module.get(PatientsService);
        prescriptionsService = module.get(PrescriptionsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new consultation successfully', async () => {
            const createDto = {
                patientId: 'patient-123',
                consultationDate: '2024-01-15T10:00:00.000Z',
                type: ConsultationType.ROUTINE_CHECKUP,
                reason: 'Headache and fever',
                symptoms: 'Patient reports severe headache for 2 days',
                physicalExamination: 'Alert and oriented',
                vitalSigns: {
                    bloodPressure: {
                        systolic: 120,
                        diastolic: 80,
                    },
                    heartRate: 72,
                    temperature: 37.0,
                    weight: 70,
                    height: 170,
                },
                diagnosis: 'Migraine, Viral infection',
                treatmentPlan: 'Rest and medication',
                notes: 'Follow up in 1 week',
                followUpInstructions: 'Return in 1 week if symptoms persist',
            };

            const mockPatient = createMockPatient({ organizationId: 'org-123' });
            const mockDoctor = createMockUser({ id: 'doctor-123' });
            const mockConsultation = createMockConsultation({
                ...createDto,
                consultationDate: new Date(createDto.consultationDate),
                consultationNumber: 'CONS-2024-0001',
                doctorId: 'doctor-123',
                organizationId: 'org-123',
            });

            // Mock the validation to return patient
            patientsService.findById.mockResolvedValue(mockPatient);
            patientsService.updateLastVisit.mockResolvedValue();

            // Mock repository methods
            repository.getNextConsultationNumber.mockResolvedValue('CONS-2024-0001');
            repository.create.mockResolvedValue(mockConsultation);
            repository.findById.mockResolvedValue(mockConsultation);

            const result = await service.create(createDto, 'org-123', mockDoctor);

            expect(result).toEqual(mockConsultation);
            expect(patientsService.findById).toHaveBeenCalledWith('patient-123');
            expect(repository.getNextConsultationNumber).toHaveBeenCalled();
            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    patientId: 'patient-123',
                    doctorId: 'doctor-123',
                    organizationId: 'org-123',
                    consultationNumber: 'CONS-2024-0001',
                    reason: 'Headache and fever',
                }),
                mockDoctor,
            );
            expect(patientsService.updateLastVisit).toHaveBeenCalledWith('patient-123');
        });

        it('should throw NotFoundException if patient not found', async () => {
            const createDto = {
                patientId: 'non-existent',
                consultationDate: '2024-01-15T10:00:00.000Z',
                type: ConsultationType.ROUTINE_CHECKUP,
                reason: 'Headache',
                diagnosis: 'Migraine',
                treatmentPlan: 'Rest',
            };

            patientsService.findById.mockRejectedValue(new NotFoundException('Patient not found'));

            await expect(service.create(createDto, 'org-123', createMockUser())).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException for invalid vital signs', async () => {
            const createDto = {
                patientId: 'patient-123',
                consultationDate: '2024-01-15T10:00:00.000Z',
                type: ConsultationType.ROUTINE_CHECKUP,
                reason: 'Headache',
                vitalSigns: {
                    bloodPressure: {
                        systolic: -10, // Invalid negative value
                        diastolic: 300, // Invalid high value
                    },
                    heartRate: -10, // Invalid negative value
                    temperature: 200, // Invalid high temperature
                },
                diagnosis: 'Migraine',
                treatmentPlan: 'Rest',
            };

            const mockPatient = createMockPatient({ organizationId: 'org-123' });
            const mockDoctor = createMockUser({ id: 'doctor-123' });

            patientsService.findById.mockResolvedValue(mockPatient);

            await expect(service.create(createDto, 'org-123', mockDoctor)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('search', () => {
        it('should return paginated consultations', async () => {
            const searchDto = {
                search: 'headache',
                page: 1,
                limit: 10,
                sortBy: 'consultationDate',
                sortOrder: 'DESC' as const,
                get skip() {
                    return (this.page - 1) * this.limit;
                },
            };
            const mockConsultations = [
                createMockConsultation(),
                createMockConsultation({ id: 'cons-456' }),
            ];
            const mockResult = {
                data: mockConsultations,
                meta: {
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            };

            repository.search.mockResolvedValue(mockResult);

            const result = await service.search(searchDto, 'org-123');

            expect(result).toEqual(mockResult);
            expect(repository.search).toHaveBeenCalledWith(searchDto, 'org-123');
        });
    });

    describe('findById', () => {
        it('should return consultation by id', async () => {
            const mockConsultation = createMockConsultation();
            repository.findById.mockResolvedValue(mockConsultation);

            const result = await service.findById('cons-123');

            expect(result).toEqual(mockConsultation);
            expect(repository.findById).toHaveBeenCalledWith('cons-123', [
                'patient',
                'doctor',
                'appointment',
                'prescriptions',
                'organization',
            ]);
        });

        it('should throw NotFoundException if consultation not found', async () => {
            repository.findById.mockRejectedValue(new NotFoundException());

            await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update consultation successfully', async () => {
            const updateDto = {
                notes: 'Updated notes',
                vitalSigns: {
                    bloodPressure: {
                        systolic: 130,
                        diastolic: 85,
                    },
                    heartRate: 75,
                    temperature: 98.7,
                    weight: 70,
                    height: 170,
                },
            };
            const mockConsultation = createMockConsultation();
            const updatedConsultation = createMockConsultation({
                ...updateDto,
                vitalSigns: {
                    ...updateDto.vitalSigns,
                    bmi: 24.22, // Expected BMI calculation from height/weight
                },
            });

            repository.update.mockResolvedValue(updatedConsultation);

            const mockUser = createMockUser();
            const result = await service.update('cons-123', updateDto, mockUser);

            expect(result).toEqual(updatedConsultation);
            expect(repository.update).toHaveBeenCalledWith(
                'cons-123',
                expect.objectContaining({
                    notes: 'Updated notes',
                    vitalSigns: expect.objectContaining({
                        bloodPressure: { systolic: 130, diastolic: 85 },
                        heartRate: 75,
                        temperature: 98.7,
                        bmi: expect.any(Number), // BMI calculated from height/weight
                    }),
                }),
                mockUser,
            );
        });
    });

    describe('findByPatient', () => {
        it('should return consultations for a patient', async () => {
            const mockConsultations = [
                createMockConsultation({ patientId: 'patient-123' }),
                createMockConsultation({ patientId: 'patient-123', id: 'cons-456' }),
            ];

            repository.findByPatient.mockResolvedValue(mockConsultations);

            const result = await service.findByPatient('patient-123', 5);

            expect(result).toEqual(mockConsultations);
            expect(repository.findByPatient).toHaveBeenCalledWith('patient-123', 5);
        });
    });

    describe('findByDoctor', () => {
        it('should return consultations for a doctor within date range', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const mockConsultations = [createMockConsultation({ doctorId: 'doctor-123' })];

            repository.findByDoctor.mockResolvedValue(mockConsultations);

            const result = await service.findByDoctor('doctor-123', startDate, endDate);

            expect(result).toEqual(mockConsultations);
            expect(repository.findByDoctor).toHaveBeenCalledWith('doctor-123', startDate, endDate);
        });
    });

    describe('getStats', () => {
        it('should return consultation statistics', async () => {
            const mockStats = {
                total: 150,
                thisMonth: 25,
            };

            repository.getStats.mockResolvedValue(mockStats);

            const result = await service.getStats('org-123');

            expect(result).toEqual(mockStats);
            expect(repository.getStats).toHaveBeenCalledWith('org-123');
        });
    });

    describe('addAttachment', () => {
        it('should add attachment to consultation', async () => {
            const mockConsultation = createMockConsultation({ attachments: [] });
            const updatedConsultation = createMockConsultation({
                attachments: [
                    {
                        type: 'image',
                        filename: 'test.jpg',
                        url: '/uploads/test.jpg',
                        description: 'Test image',
                        uploadedAt: expect.any(String),
                    },
                ],
            });

            const attachment = {
                type: 'image',
                filename: 'test.jpg',
                url: '/uploads/test.jpg',
                description: 'Test image',
            };

            repository.findById.mockResolvedValue(mockConsultation);
            repository.update.mockResolvedValue(updatedConsultation);

            const mockUser = createMockUser();
            const result = await service.addAttachment('cons-123', attachment, mockUser);

            expect(result).toEqual(updatedConsultation);
            expect(repository.update).toHaveBeenCalledWith(
                'cons-123',
                {
                    attachments: expect.arrayContaining([
                        expect.objectContaining({
                            type: 'image',
                            filename: 'test.jpg',
                            uploadedAt: expect.any(String),
                        }),
                    ]),
                },
                mockUser,
            );
        });
    });
});
