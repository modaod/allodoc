export interface Consultation {
  id?: string;
  consultationNumber?: string;
  patientId: string;
  patientName?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  doctorId?: string;
  doctorName?: string;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    specialty?: string;
  };
  consultationDate: Date;
  status: ConsultationStatus;
  type: ConsultationType;
  reason?: string; // Backend field
  chiefComplaint?: string; // Frontend field - both supported for compatibility
  historyOfPresentIllness?: string;
  symptoms?: string;
  physicalExamination?: PhysicalExamination | string; // Support both complex and simple
  vitalSigns?: VitalSigns;
  diagnosis?: Diagnosis[] | string; // Support both complex and simple
  treatmentPlan?: string;
  followUpInstructions?: string;
  notes?: string;
  prescriptionIds?: string[];
  prescriptions?: EmbeddedPrescription[]; // For integrated prescriptions
  attachments?: ConsultationAttachment[];
  duration?: number; // in minutes - to be deprecated
  fee?: number; // to be deprecated
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmbeddedPrescription {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export interface PhysicalExamination {
  general?: string;
  cardiovascular?: string;
  respiratory?: string;
  gastrointestinal?: string;
  neurological?: string;
  musculoskeletal?: string;
  dermatological?: string;
  other?: string;
}

export interface VitalSigns {
  temperature?: number; // Celsius
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number; // BPM
  respiratoryRate?: number; // per minute
  oxygenSaturation?: number; // percentage
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
}

export interface Diagnosis {
  id?: string;
  code?: string; // ICD-10 code
  description: string;
  type: DiagnosisType;
  severity?: DiagnosisSeverity;
  notes?: string;
}

export interface ConsultationAttachment {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  description?: string;
  url?: string;
}

export enum ConsultationStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum ConsultationType {
  INITIAL = 'INITIAL',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  ROUTINE_CHECKUP = 'ROUTINE_CHECKUP',
  SPECIALIST = 'SPECIALIST',
  TELEMEDICINE = 'TELEMEDICINE'
}

export enum DiagnosisType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  DIFFERENTIAL = 'DIFFERENTIAL',
  RULE_OUT = 'RULE_OUT'
}

export enum DiagnosisSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CRITICAL = 'CRITICAL'
}

// Request/Response interfaces
export interface CreateConsultationRequest {
  patientId: string;
  consultationDate: string; // ISO string for API
  type: ConsultationType;
  chiefComplaint?: string;
  reason?: string; // Backend compatibility
  historyOfPresentIllness?: string;
  symptoms?: string;
  physicalExamination?: string; // Simplified to string
  vitalSigns?: VitalSigns;
  diagnosis?: string; // Simplified to string
  treatmentPlan?: string;
  followUpInstructions?: string;
  notes?: string;
  prescriptions?: EmbeddedPrescription[]; // Integrated prescriptions
  // Deprecated fields - kept for compatibility
  duration?: number;
  fee?: number;
}

export interface UpdateConsultationRequest extends Partial<CreateConsultationRequest> {
  id: string;
  status?: ConsultationStatus;
}

export interface ConsultationSearchParams {
  patientId?: string;
  doctorId?: string;
  status?: ConsultationStatus;
  type?: ConsultationType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ConsultationsResponse {
  data: Consultation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}