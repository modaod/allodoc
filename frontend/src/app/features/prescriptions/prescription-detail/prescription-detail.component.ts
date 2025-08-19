import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Prescription, PrescriptionStatus } from '../models/prescription.model';
import { PrescriptionsService } from '../services/prescriptions.service';

@Component({
  selector: 'app-prescription-detail',
  templateUrl: './prescription-detail.component.html',
  styleUrls: ['./prescription-detail.component.scss']
})
export class PrescriptionDetailComponent implements OnInit {
  prescription: Prescription | null = null;
  loading = false;
  prescriptionId: string | null = null;
  patientId: string | null = null;
  isPatientContext = false;
  fromConsultationId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionsService: PrescriptionsService
  ) {}

  ngOnInit(): void {
    // Check if we're in patient context
    this.patientId = this.route.snapshot.paramMap.get('patientId');
    this.isPatientContext = !!this.patientId;
    
    // Check if we came from a consultation
    this.fromConsultationId = this.route.snapshot.queryParamMap.get('from-consultation');
    
    // Get prescription ID from either regular route or patient context route
    this.prescriptionId = this.route.snapshot.paramMap.get('id') || 
                          this.route.snapshot.paramMap.get('prescriptionId');
    
    if (this.prescriptionId) {
      this.loadPrescription(this.prescriptionId);
    }
  }

  getPatientName(): string {
    // Check direct patient first (for standalone prescriptions)
    if (this.prescription?.patient) {
      const patient = this.prescription.patient;
      return `${patient.firstName} ${patient.lastName}`;
    }
    // Then check consultation patient (for consultation-linked prescriptions)
    if (this.prescription?.consultation?.patient) {
      const patient = this.prescription.consultation.patient;
      return `${patient.firstName} ${patient.lastName}`;
    }
    return this.prescription?.patientName || '';
  }

  getDoctorName(): string {
    // Check direct doctor first (for standalone prescriptions)
    if (this.prescription?.doctor) {
      const doctor = this.prescription.doctor;
      return `Dr. ${doctor.firstName} ${doctor.lastName}`;
    }
    // Then check consultation doctor (for consultation-linked prescriptions)
    if (this.prescription?.consultation?.doctor) {
      const doctor = this.prescription.consultation.doctor;
      return `Dr. ${doctor.firstName} ${doctor.lastName}`;
    }
    return this.prescription?.doctorName || '';
  }

  getPrescriptionDate(): string {
    if (this.prescription?.prescribedDate) {
      return this.formatDate(this.prescription.prescribedDate);
    }
    return this.formatDate(this.prescription?.prescriptionDate);
  }

  getPrescriptionNumber(): string {
    return this.prescription?.prescriptionNumber || `PR-${this.prescription?.id?.substring(0, 8)}` || '';
  }

  getInstructions(): string {
    return this.prescription?.generalInstructions || this.prescription?.instructions || '';
  }

  getMedicationsCount(): number {
    return this.prescription?.medications?.length || 0;
  }

  loadPrescription(id: string): void {
    console.log('Loading prescription with ID:', id);
    this.loading = true;
    this.prescriptionsService.getPrescriptionById(id).subscribe({
      next: (prescription) => {
        console.log('Prescription loaded:', prescription);
        this.prescription = prescription;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescription:', error);
        this.loading = false;
        // Don't navigate away immediately - show error message
        alert(`Failed to load prescription details. Error: ${error?.message || 'Unknown error'}`);
      }
    });
  }

  editPrescription(): void {
    if (this.prescriptionId) {
      this.router.navigate(['/prescriptions', this.prescriptionId, 'edit']);
    }
  }

  goBack(): void {
    if (this.fromConsultationId) {
      // If we came from a consultation, go back to it
      this.router.navigate(['/consultations', this.fromConsultationId]);
    } else if (this.isPatientContext && this.patientId) {
      // If in patient context, go back to patient prescriptions
      this.router.navigate(['/patients', this.patientId, 'prescriptions']);
    } else {
      // Otherwise, go to dashboard (no general prescriptions list)
      this.router.navigate(['/dashboard']);
    }
  }

  getBackButtonText(): string {
    if (this.fromConsultationId) {
      return 'Back to Consultation';
    } else if (this.isPatientContext) {
      return 'Back to Patient Prescriptions';
    } else {
      return 'Back to Dashboard';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  getStatusClass(status: PrescriptionStatus): string {
    switch (status) {
      case PrescriptionStatus.ACTIVE:
        return 'status-active';
      case PrescriptionStatus.EXPIRING_SOON:
        return 'status-expiring-soon';
      case PrescriptionStatus.DISPENSED:
        return 'status-dispensed';
      case PrescriptionStatus.COMPLETED:
        return 'status-completed';
      case PrescriptionStatus.CANCELLED:
        return 'status-cancelled';
      case PrescriptionStatus.EXPIRED:
        return 'status-expired';
      case PrescriptionStatus.DRAFT:
        return 'status-draft';
      default:
        return '';
    }
  }

  printPrescription(): void {
    window.print();
  }

  isExpiringSoon(validUntil: Date | undefined): boolean {
    if (!validUntil) return false;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }

  isExpired(validUntil: Date | undefined): boolean {
    if (!validUntil) return false;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    return expiryDate < today;
  }

  getTotalMedications(): number {
    return this.prescription?.medications?.length || 0;
  }

  getRemainingDays(validUntil: Date | undefined): number {
    if (!validUntil) return 0;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
