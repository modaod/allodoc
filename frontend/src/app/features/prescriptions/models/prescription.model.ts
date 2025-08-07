export interface Prescription {
  id?: string;
  prescriptionNumber?: string;
  patientId?: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  consultationId?: string;
  consultation?: {
    patient?: {
      id: string;
      firstName: string;
      lastName: string;
    };
    doctor?: {
      id: string;
      firstName: string;
      lastName: string;
      specialty?: string;
    };
  };
  prescriptionDate?: Date;
  prescribedDate?: Date; // Backend uses this field name
  status?: PrescriptionStatus;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity?: number;
  }>;
  instructions?: string;
  generalInstructions?: string; // Backend uses this field name
  notes?: string;
  warnings?: Array<{
    type: 'allergy' | 'interaction' | 'contraindication' | 'warning';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  refillsAllowed?: number;
  validUntil?: Date;
  pharmacyInstructions?: string;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PrescriptionMedication {
  id?: string;
  medicationName: string;
  genericName?: string;
  strength: string;
  dosageForm: DosageForm;
  quantity: number;
  dosage: string;
  frequency: string;
  frequencyType: FrequencyType;
  duration: string;
  durationUnit: DurationUnit;
  route: MedicationRoute;
  instructions?: string;
  refills?: number;
  substitutionAllowed?: boolean;
  isControlledSubstance?: boolean;
  sideEffects?: string[];
  contraindications?: string[];
}

export interface MedicationTemplate {
  id: string;
  name: string;
  genericName?: string;
  strength: string;
  dosageForm: DosageForm;
  route: MedicationRoute;
  category: MedicationCategory;
  isControlled: boolean;
  commonDosages: string[];
  commonFrequencies: string[];
  commonDurations: string[];
  sideEffects: string[];
  contraindications: string[];
  interactions: string[];
}

export enum PrescriptionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DISPENSED = 'DISPENSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum DosageForm {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  LIQUID = 'LIQUID',
  SYRUP = 'SYRUP',
  INJECTION = 'INJECTION',
  CREAM = 'CREAM',
  OINTMENT = 'OINTMENT',
  DROP = 'DROP',
  INHALER = 'INHALER',
  PATCH = 'PATCH',
  SUPPOSITORY = 'SUPPOSITORY',
  POWDER = 'POWDER'
}

export enum MedicationRoute {
  ORAL = 'ORAL',
  TOPICAL = 'TOPICAL',
  INTRAVENOUS = 'INTRAVENOUS',
  INTRAMUSCULAR = 'INTRAMUSCULAR',
  SUBCUTANEOUS = 'SUBCUTANEOUS',
  INHALATION = 'INHALATION',
  RECTAL = 'RECTAL',
  VAGINAL = 'VAGINAL',
  NASAL = 'NASAL',
  OPHTHALMIC = 'OPHTHALMIC',
  OTIC = 'OTIC'
}

export enum MedicationCategory {
  ANTIBIOTIC = 'ANTIBIOTIC',
  ANALGESIC = 'ANALGESIC',
  ANTI_INFLAMMATORY = 'ANTI_INFLAMMATORY',
  ANTIHYPERTENSIVE = 'ANTIHYPERTENSIVE',
  ANTIDIABETIC = 'ANTIDIABETIC',
  ANTIHISTAMINE = 'ANTIHISTAMINE',
  ANTACID = 'ANTACID',
  VITAMIN = 'VITAMIN',
  SUPPLEMENT = 'SUPPLEMENT',
  CARDIAC = 'CARDIAC',
  RESPIRATORY = 'RESPIRATORY',
  NEUROLOGICAL = 'NEUROLOGICAL',
  GASTROINTESTINAL = 'GASTROINTESTINAL',
  DERMATOLOGICAL = 'DERMATOLOGICAL',
  OTHER = 'OTHER'
}

export enum FrequencyType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  AS_NEEDED = 'AS_NEEDED',
  EVERY_HOUR = 'EVERY_HOUR',
  EVERY_4_HOURS = 'EVERY_4_HOURS',
  EVERY_6_HOURS = 'EVERY_6_HOURS',
  EVERY_8_HOURS = 'EVERY_8_HOURS',
  EVERY_12_HOURS = 'EVERY_12_HOURS',
  TWICE_DAILY = 'TWICE_DAILY',
  THREE_TIMES_DAILY = 'THREE_TIMES_DAILY',
  FOUR_TIMES_DAILY = 'FOUR_TIMES_DAILY'
}

export enum DurationUnit {
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS',
  YEARS = 'YEARS',
  DOSES = 'DOSES',
  UNTIL_FINISHED = 'UNTIL_FINISHED',
  ONGOING = 'ONGOING'
}

// Request/Response interfaces
export interface CreatePrescriptionRequest {
  patientId: string;
  consultationId?: string;
  prescriptionDate: Date;
  medications: Omit<PrescriptionMedication, 'id'>[];
  instructions?: string;
  notes?: string;
  refillsAllowed?: number;
  validUntil?: Date;
  pharmacyInstructions?: string;
}

export interface UpdatePrescriptionRequest {
  id: string;
  patientId?: string;
  consultationId?: string;
  prescriptionDate?: Date;
  status?: PrescriptionStatus;
  medications?: Omit<PrescriptionMedication, 'id'>[];
  instructions?: string;
  notes?: string;
  refillsAllowed?: number;
  validUntil?: Date;
  pharmacyInstructions?: string;
}

export interface PrescriptionSearchParams {
  patientId?: string;
  doctorId?: string;
  consultationId?: string;
  status?: PrescriptionStatus;
  dateFrom?: Date;
  dateTo?: Date;
  medicationName?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PrescriptionsResponse {
  data: Prescription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MedicationSearchParams {
  name?: string;
  category?: MedicationCategory;
  dosageForm?: DosageForm;
  isControlled?: boolean;
  limit?: number;
}

export interface MedicationTemplatesResponse {
  data: MedicationTemplate[];
  total: number;
}