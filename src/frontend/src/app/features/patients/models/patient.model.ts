export interface Patient {
  id?: string;
  patientNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'M' | 'F';
  email?: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  medicalHistory?: MedicalHistory;
  notes?: string;
  isActive?: boolean;
  lastVisit?: Date;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MedicalHistory {
  allergies?: string[];
  chronicDiseases?: string[];
  surgeries?: Surgery[];
  medications?: Medication[];
  familyHistory?: FamilyHistory;
}

export interface Surgery {
  procedure: string;
  date: string;
  hospital?: string;
  notes?: string;
}

export interface Medication {  
  name: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
}

export interface FamilyHistory {
  diseases?: string[];
  notes?: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'M' | 'F';
  email?: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  medicalHistory?: MedicalHistory;
  notes?: string;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
  id: string;
}

export interface PatientSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface PatientsResponse {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}