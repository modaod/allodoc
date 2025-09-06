import { User } from '../../src/users/entities/user.entity';
import {
    Organization,
    OrganizationType,
} from '../../src/organizations/entities/organization.entity';
import { Patient } from '../../src/patients/entities/patient.entity';
import { Consultation } from '../../src/consultations/entities/consultation.entity';
import { Prescription } from '../../src/prescriptions/entities/prescription.entity';
import { Role, RoleName } from '../../src/users/entities/role.entity';
import { UserOrganization } from '../../src/users/entities/user-organization.entity';

/**
 * Factory functions for creating test entities
 */

export const createMockOrganization = (overrides?: Partial<Organization>): Organization => {
    const org = new Organization();
    org.id = overrides?.id || 'org-123';
    org.name = overrides?.name || 'Test Hospital';
    org.type = overrides?.type || OrganizationType.HOSPITAL;
    org.address = overrides?.address || '123 Medical St';
    org.phone = overrides?.phone || '+1234567890';
    org.email = overrides?.email || 'contact@testhospital.com';
    org.registrationNumber = overrides?.registrationNumber || 'REG123456';
    org.description = overrides?.description || 'A test hospital for medical care';
    org.isActive = overrides?.isActive !== undefined ? overrides.isActive : true;
    org.createdAt = overrides?.createdAt || new Date('2024-01-01');
    org.updatedAt = overrides?.updatedAt || new Date('2024-01-01');
    return org;
};

export const createMockRole = (roleName: RoleName = RoleName.DOCTOR): Role => {
    const role = new Role();
    role.id = `role-${roleName}`;
    role.name = roleName;
    role.description = `${roleName} role`;
    role.isActive = true;
    role.createdAt = new Date('2024-01-01');
    role.updatedAt = new Date('2024-01-01');
    return role;
};

export const createMockUser = (overrides?: Partial<User>): User => {
    const user = new User();
    user.id = overrides?.id || 'user-123';
    user.email = overrides?.email || 'test@medical.com';
    user.password = overrides?.password || '$2a$10$hashedpassword';
    user.firstName = overrides?.firstName || 'John';
    user.lastName = overrides?.lastName || 'Doe';
    user.phone = overrides?.phone || '+1234567890';
    user.isActive = overrides?.isActive !== undefined ? overrides.isActive : true;
    user.lastLogin = overrides?.lastLogin || new Date('2024-01-01');
    user.organizationId = overrides?.organizationId || 'org-123';
    user.roles = overrides?.roles || [];
    user.createdAt = overrides?.createdAt || new Date('2024-01-01');
    user.updatedAt = overrides?.updatedAt || new Date('2024-01-01');
    return user;
};

export const createMockUserOrganization = (
    user: User,
    organization: Organization,
    overrides?: Partial<UserOrganization>,
): UserOrganization => {
    const userOrg = new UserOrganization();
    userOrg.userId = overrides?.userId || user.id;
    userOrg.user = user;
    userOrg.organizationId = overrides?.organizationId || organization.id;
    userOrg.organization = organization;
    userOrg.joinedAt = overrides?.joinedAt || new Date('2024-01-01');
    userOrg.lastAccessedAt = overrides?.lastAccessedAt || new Date('2024-01-01');
    return userOrg;
};

export const createMockPatient = (overrides?: Partial<Patient>): Patient => {
    const patient = new Patient();
    patient.id = overrides?.id || 'patient-123';
    patient.patientNumber = overrides?.patientNumber || 'P-2024-0001';
    patient.firstName = overrides?.firstName || 'Jane';
    patient.lastName = overrides?.lastName || 'Smith';
    patient.email = overrides?.email || 'jane.smith@email.com';
    patient.phone = overrides?.phone || '+1234567890';
    patient.dateOfBirth = overrides?.dateOfBirth || new Date('1990-01-01');
    patient.gender = overrides?.gender || 'F';
    patient.address = overrides?.address || '456 Patient Ave';
    patient.alternatePhone = overrides?.alternatePhone || '+1234567891';
    patient.medicalHistory = overrides?.medicalHistory || {
        allergies: ['Penicillin'],
        chronicDiseases: ['Diabetes'],
        medications: [
            {
                name: 'Metformin',
                dosage: '500mg',
                frequency: 'Twice daily',
                startDate: '2024-01-01',
            },
        ],
    };
    patient.notes = overrides?.notes || 'Regular patient';
    patient.organizationId = overrides?.organizationId || 'org-123';
    patient.isActive = overrides?.isActive !== undefined ? overrides.isActive : true;
    patient.createdAt = overrides?.createdAt || new Date('2024-01-01');
    patient.updatedAt = overrides?.updatedAt || new Date('2024-01-01');
    return patient;
};

export const createMockConsultation = (overrides?: Partial<Consultation>): Consultation => {
    const consultation = new Consultation();
    consultation.id = overrides?.id || 'consultation-123';
    consultation.consultationNumber = overrides?.consultationNumber || 'CONS-2024-0001';
    consultation.consultationDate = overrides?.consultationDate || new Date('2024-01-15');
    consultation.reason = overrides?.reason || 'Headache and fever';
    consultation.symptoms = overrides?.symptoms || 'Patient reports severe headache for 2 days';
    consultation.physicalExamination = overrides?.physicalExamination || 'Alert and oriented';
    consultation.investigation = overrides?.investigation || 'Blood pressure check';
    consultation.vitalSigns = overrides?.vitalSigns || {
        bloodPressure: {
            systolic: 120,
            diastolic: 80,
        },
        heartRate: 72,
        temperature: 98.6,
        weight: 70,
        height: 170,
    };
    consultation.diagnosis = overrides?.diagnosis || 'Migraine, Viral infection';
    consultation.treatmentPlan = overrides?.treatmentPlan || 'Rest and medication';
    consultation.recommendations = overrides?.recommendations || 'Drink plenty of fluids';
    consultation.followUpInstructions = overrides?.followUpInstructions || 'Follow up in 1 week';
    consultation.notes = overrides?.notes || 'Patient responsive to treatment';
    consultation.attachments = overrides?.attachments || [];
    consultation.type = overrides?.type || 'ROUTINE_CHECKUP';
    consultation.status = overrides?.status || 'COMPLETED';
    consultation.metadata = overrides?.metadata || { consultationType: 'first_visit' };
    consultation.patientId = overrides?.patientId || 'patient-123';
    consultation.doctorId = overrides?.doctorId || 'user-123';
    consultation.organizationId = overrides?.organizationId || 'org-123';
    consultation.createdAt = overrides?.createdAt || new Date('2024-01-15');
    consultation.updatedAt = overrides?.updatedAt || new Date('2024-01-15');
    return consultation;
};

/**
 * Create a complete mock user with organization and role
 */
export const createMockUserWithOrganization = (
    roleName: RoleName = RoleName.DOCTOR,
    overrides?: {
        user?: Partial<User>;
        organization?: Partial<Organization>;
    },
): {
    user: User;
    organization: Organization;
    role: Role;
    userOrganization: UserOrganization;
} => {
    const organization = createMockOrganization(overrides?.organization);
    const role = createMockRole(roleName);
    const user = createMockUser(overrides?.user);
    const userOrganization = createMockUserOrganization(user, organization);

    user.userOrganizations = [userOrganization];

    return {
        user,
        organization,
        role,
        userOrganization,
    };
};

/**
 * Create mock JWT payload
 */
export const createMockJwtPayload = (
    userId: string = 'user-123',
    organizationId: string = 'org-123',
) => ({
    sub: userId,
    email: 'test@medical.com',
    organizationId,
    roles: [RoleName.DOCTOR],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
});

/**
 * Create mock pagination DTO
 */
export const createMockPaginationDto = (overrides?: any) => ({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    ...overrides,
});

/**
 * Create mock medication data
 */
export const createMockMedication = (overrides?: any) => ({
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    dosage: '500mg',
    frequency: '3 times daily',
    duration: '7 days',
    instructions: 'Take with food',
    quantity: 21,
    refills: 0,
    ...overrides,
});

/**
 * Create mock medication list
 */
export const createMockMedications = (count: number = 2) => {
    const medications = [
        createMockMedication({
            name: 'Amoxicillin',
            dosage: '500mg',
            frequency: '3 times daily',
            duration: '7 days',
            instructions: 'Take with food',
        }),
        createMockMedication({
            name: 'Ibuprofen',
            dosage: '400mg',
            frequency: '2 times daily',
            duration: '5 days',
            instructions: 'Take after meals',
        }),
        createMockMedication({
            name: 'Warfarin',
            dosage: '5mg',
            frequency: '1 time daily',
            duration: '30 days',
            instructions: 'Take at same time each day',
        }),
    ];
    return medications.slice(0, count);
};

/**
 * Create mock warning data
 */
export const createMockWarning = (overrides?: any) => ({
    type: 'interaction' as const,
    message: 'Potential drug interaction detected',
    severity: 'medium' as const,
    ...overrides,
});

/**
 * Create mock prescription
 */
export const createMockPrescription = (overrides?: any) => ({
    id: 'prescription-123',
    prescriptionNumber: 'RX-202409-0001',
    patientId: 'patient-123',
    doctorId: 'doctor-123',
    consultationId: 'consultation-123',
    organizationId: 'org-123',
    medications: createMockMedications(2),
    generalInstructions: 'Complete the full course of medication',
    prescribedDate: new Date('2024-09-01'),
    notes: 'Patient allergic to penicillin',
    warnings: [createMockWarning()],
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date('2024-09-01'),
    createdById: 'doctor-123',
    updatedById: 'doctor-123',
    // Relations
    patient: undefined,
    doctor: undefined,
    consultation: undefined,
    organization: undefined,
    // Computed fields
    status: 'ACTIVE' as const,
    validUntil: new Date('2024-09-08'),
    // Helper methods
    getTotalMedications: () => 2,
    hasCriticalWarnings: () => false,
    getMedicationNames: () => ['Amoxicillin', 'Ibuprofen'],
    calculateStatus: () => 'ACTIVE' as const,
    calculateValidUntil: () => new Date('2024-09-08'),
    parseDurationToDays: (duration: string) => {
        const match = duration.match(/(\d+)\s*day/);
        return match ? parseInt(match[1]) : 0;
    },
    ...overrides,
});

/**
 * Create mock prescription with relations
 */
export const createMockPrescriptionWithRelations = (overrides?: any) => {
    const prescription = createMockPrescription(overrides);
    return {
        ...prescription,
        patient: createMockPatient({ id: prescription.patientId }),
        doctor: createMockUser({ id: prescription.doctorId }),
        consultation: createMockConsultation({ id: prescription.consultationId }),
        organization: createMockOrganization({ id: prescription.organizationId }),
    };
};
