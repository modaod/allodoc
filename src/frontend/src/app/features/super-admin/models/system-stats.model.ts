export interface SystemStats {
  totalOrganizations: number;
  totalUsers: number;
  totalPatients: number;
  totalConsultations: number;
  totalPrescriptions: number;
  totalAppointments: number;
  activeUsers: number;
  usersByRole: { [key: string]: number };
  topOrganizations: OrganizationStats[];
}

export interface OrganizationStats {
  id: string;
  name: string;
  userCount: number;
  patientCount: number;
}

export interface OrganizationWithStats {
  id: string;
  name: string;
  type: 'CLINIC' | 'HOSPITAL' | 'MEDICAL_CENTER';
  address: string;
  phone?: string;
  email?: string;
  registrationNumber?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  patientCount: number;
}