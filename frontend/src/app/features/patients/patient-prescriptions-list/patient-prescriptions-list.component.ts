import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrescriptionsService } from '../../prescriptions/services/prescriptions.service';
import { PatientsService } from '../services/patients.service';
import { Prescription, PrescriptionStatus } from '../../prescriptions/models/prescription.model';
import { Patient } from '../models/patient.model';

@Component({
  selector: 'app-patient-prescriptions-list',
  templateUrl: './patient-prescriptions-list.component.html',
  styleUrls: ['./patient-prescriptions-list.component.scss']
})
export class PatientPrescriptionsListComponent implements OnInit {
  prescriptions: Prescription[] = [];
  patient: Patient | null = null;
  loading = true;
  patientId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionsService: PrescriptionsService,
    private patientsService: PatientsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.patientId = params['patientId'];
      if (this.patientId) {
        this.loadPatientData();
        this.loadPrescriptions();
      }
    });
  }

  loadPatientData(): void {
    this.patientsService.getPatientById(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
      },
      error: (error) => {
        console.error('Error loading patient:', error);
      }
    });
  }

  loadPrescriptions(): void {
    this.loading = true;
    // Using the patient-specific endpoint to get all prescriptions for this patient
    this.prescriptionsService.getPrescriptionsByPatient(this.patientId).subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.prescriptions = [];
        this.loading = false;
      }
    });
  }

  viewPrescriptionDetail(prescriptionId: string): void {
    // Navigate with patient context
    this.router.navigate(['/patients', this.patientId, 'prescriptions', prescriptionId]);
  }

  goBackToPatient(): void {
    this.router.navigate(['/patients', this.patientId]);
  }

  newPrescription(): void {
    // Navigate to new prescription with patient pre-selected
    this.router.navigate(['/prescriptions/new'], { 
      queryParams: { patientId: this.patientId }
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(status: PrescriptionStatus | undefined): string {
    if (!status) return 'status-active';
    switch (status) {
      case PrescriptionStatus.ACTIVE:
        return 'status-active';
      case PrescriptionStatus.EXPIRED:
        return 'status-expired';
      case PrescriptionStatus.CANCELLED:
        return 'status-cancelled';
      case PrescriptionStatus.COMPLETED:
        return 'status-completed';
      default:
        return '';
    }
  }

  formatEnumValue(value: string): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  getMedicationNames(prescription: Prescription): string {
    if (!prescription.medications || prescription.medications.length === 0) {
      return 'No medications';
    }
    const names = prescription.medications
      .map(med => (med as any).name || (med as any).medicationName || 'Unknown')
      .slice(0, 3);
    const remaining = prescription.medications.length - 3;
    return remaining > 0 ? `${names.join(', ')} +${remaining} more` : names.join(', ');
  }

  getMedicationCount(prescription: Prescription): number {
    return prescription.medications?.length || 0;
  }

  isLinkedToConsultation(prescription: Prescription): boolean {
    return !!(prescription as any).consultationId || !!(prescription as any).consultation;
  }

  getConsultationNumber(prescription: Prescription): string | null {
    const consultation = (prescription as any).consultation;
    if (consultation) {
      return consultation.consultationNumber || `#${consultation.id?.substring(0, 8)}`;
    }
    return null;
  }

  getPrescriptionDate(prescription: Prescription): Date | string {
    return (prescription as any).prescriptionDate || 
           (prescription as any).prescribedDate || 
           prescription.createdAt || 
           new Date();
  }

  getDoctorName(prescription: Prescription): string | null {
    const doctor = (prescription as any).doctor;
    if (doctor) {
      return `Dr. ${doctor.firstName} ${doctor.lastName}`;
    }
    return null;
  }

  hasDoctor(prescription: Prescription): boolean {
    return !!(prescription as any).doctor;
  }
}
