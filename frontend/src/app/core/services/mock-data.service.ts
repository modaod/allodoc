import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Patient, PatientsResponse } from '../../features/patients/models/patient.model';
import { Consultation, ConsultationsResponse, ConsultationStatus, ConsultationType, DiagnosisType, DiagnosisSeverity } from '../../features/consultations/models/consultation.model';
import { Prescription, PrescriptionsResponse, PrescriptionStatus, DosageForm, FrequencyType, DurationUnit, MedicationRoute } from '../../features/prescriptions/models/prescription.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  constructor() { }

  getMockPatients(): Observable<PatientsResponse> {
    const mockPatients: Patient[] = [
      {
        id: '1',
        patientNumber: 'P001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1985-06-15'),
        gender: 'M',
        email: 'john.doe@email.com',
        phone: '+1234567890',
        address: '123 Main St, City, State',
        isActive: true,
        lastVisit: new Date('2024-01-15'),
        medicalHistory: {
          allergies: ['Penicillin'],
          chronicDiseases: ['Hypertension'],
          surgeries: [{
            procedure: 'Appendectomy',
            date: '2020-03-15',
            hospital: 'City General Hospital'
          }],
          medications: [{
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily'
          }]
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        patientNumber: 'P002',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1990-09-22'),
        gender: 'F',
        email: 'jane.smith@email.com',
        phone: '+1987654321',
        address: '456 Oak Ave, City, State',
        isActive: true,
        lastVisit: new Date('2024-01-20'),
        medicalHistory: {
          allergies: ['Peanuts', 'Shellfish'],
          chronicDiseases: [],
          surgeries: [],
          medications: []
        },
        createdAt: new Date('2023-02-15'),
        updatedAt: new Date('2024-01-20')
      }
    ];

    return of({
      data: mockPatients,
      total: mockPatients.length,
      page: 1,
      limit: 10,
      totalPages: 1
    });
  }

  getMockConsultations(): Observable<ConsultationsResponse> {
    const mockConsultations: Consultation[] = [
      {
        id: '1',
        consultationNumber: 'CON001',
        patientId: '1',
        patientName: 'John Doe',
        doctorId: 'doc1',
        doctorName: 'Dr. Smith',
        consultationDate: new Date('2024-01-15T10:00:00'),
        status: ConsultationStatus.COMPLETED,
        type: ConsultationType.INITIAL,
        chiefComplaint: 'Chest pain and shortness of breath',
        historyOfPresentIllness: 'Patient reports chest pain started 2 days ago, associated with mild shortness of breath during exertion.',
        vitalSigns: {
          temperature: 36.8,
          bloodPressure: { systolic: 140, diastolic: 90 },
          heartRate: 88,
          respiratoryRate: 18,
          oxygenSaturation: 98,
          weight: 75,
          height: 175,
          bmi: 24.5
        },
        physicalExamination: {
          general: 'Alert and oriented, appears comfortable',
          cardiovascular: 'Regular rate and rhythm, no murmurs',
          respiratory: 'Clear to auscultation bilaterally',
          other: 'No acute distress noted'
        },
        diagnosis: [
          {
            id: 'd1',
            code: 'I25.9',
            description: 'Chronic ischemic heart disease',
            type: DiagnosisType.PRIMARY,
            severity: DiagnosisSeverity.MODERATE
          }
        ],
        treatmentPlan: 'Start ACE inhibitor, lifestyle modifications, follow-up in 2 weeks',
        followUpInstructions: 'Return if symptoms worsen, schedule follow-up appointment',
        notes: 'Patient counseled on diet and exercise',
        duration: 45,
        fee: 150.00,
        createdAt: new Date('2024-01-15T10:00:00'),
        updatedAt: new Date('2024-01-15T11:00:00')
      }
    ];

    return of({
      data: mockConsultations,
      total: mockConsultations.length,
      page: 1,
      limit: 10,
      totalPages: 1
    });
  }

  getMockPrescriptions(): Observable<PrescriptionsResponse> {
    const mockPrescriptions: Prescription[] = [
      {
        id: '1',
        prescriptionNumber: 'RX001',
        patientId: '1',
        patientName: 'John Doe',
        doctorId: 'doc1',
        doctorName: 'Dr. Smith',
        consultationId: '1',
        prescriptionDate: new Date('2024-01-15T11:00:00'),
        status: PrescriptionStatus.ACTIVE,
        medications: [
          {
            id: 'm1',
            medicationName: 'Lisinopril',
            genericName: 'Lisinopril',
            strength: '10mg',
            dosageForm: DosageForm.TABLET,
            quantity: 30,
            dosage: '10mg',
            frequency: '1',
            frequencyType: FrequencyType.DAILY,
            duration: '30',
            durationUnit: DurationUnit.DAYS,
            route: MedicationRoute.ORAL,
            instructions: 'Take with or without food',
            refills: 5,
            substitutionAllowed: true
          }
        ],
        instructions: 'Take as directed. Monitor blood pressure regularly.',
        refillsAllowed: 5,
        validUntil: new Date('2024-07-15'),
        createdAt: new Date('2024-01-15T11:00:00'),
        updatedAt: new Date('2024-01-15T11:00:00')
      }
    ];

    return of({
      data: mockPrescriptions,
      total: mockPrescriptions.length,
      page: 1,
      limit: 10,
      totalPages: 1
    });
  }

  showOfflineMessage(): void {
    console.warn('Backend API is not available. Using mock data for development.');
  }
}