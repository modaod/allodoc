import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Consultation, ConsultationStatus, ConsultationType } from '../models/consultation.model';
import { ConsultationsService } from '../services/consultations.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-consultation-detail',
  templateUrl: './consultation-detail.component.html',
  styleUrls: ['./consultation-detail.component.scss']
})
export class ConsultationDetailComponent implements OnInit {
  consultation: Consultation | null = null;
  loading = false;
  consultationId: string | null = null;
  patientId: string | null = null;
  isPatientContext = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationsService: ConsultationsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if we're in patient context
    this.patientId = this.route.snapshot.paramMap.get('patientId');
    this.isPatientContext = !!this.patientId;
    
    // Get consultation ID from either regular route or patient context route
    this.consultationId = this.route.snapshot.paramMap.get('id') || 
                          this.route.snapshot.paramMap.get('consultationId');
    
    if (this.consultationId) {
      this.loadConsultation(this.consultationId);
    }
  }

  // Helper methods to handle simplified structures
  getPhysicalExaminationText(): string {
    if (!this.consultation?.physicalExamination) return '';
    
    // Backend stores as simple text, not complex object
    return this.consultation.physicalExamination.toString();
  }

  getDiagnosisText(): string {
    if (!this.consultation?.diagnosis) return '';
    
    // Backend stores as simple text, not complex object
    return this.consultation.diagnosis.toString();
  }

  getReason(): string {
    return this.consultation?.reason || '';
  }

  getPatientName(): string {
    if (this.consultation?.patient) {
      return `${this.consultation.patient.firstName} ${this.consultation.patient.lastName}`;
    }
    return this.consultation?.patientName || '';
  }

  getDoctorName(): string {
    if (this.consultation?.doctor) {
      return `Dr. ${this.consultation.doctor.firstName} ${this.consultation.doctor.lastName}`;
    }
    return this.consultation?.doctorName || '';
  }

  getDoctorSpecialty(): string {
    return this.consultation?.doctor?.specialty || '';
  }

  loadConsultation(id: string): void {
    this.loading = true;
    this.consultationsService.getConsultationById(id).subscribe({
      next: (consultation) => {
        this.consultation = consultation;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading consultation:', error);
        this.loading = false;
        alert(`Failed to load consultation details. Error: ${error?.message || 'Unknown error'}`);
      }
    });
  }

  editConsultation(): void {
    if (this.consultationId) {
      this.router.navigate(['/consultations', this.consultationId, 'edit']);
    }
  }

  viewPatientDetail(): void {
    // Use patient.id if available (populated), otherwise use patientId
    const patientId = this.consultation?.patient?.id || this.consultation?.patientId;
    if (patientId) {
      this.router.navigate(['/patients', patientId]);
    }
  }

  goBack(): void {
    if (this.isPatientContext && this.patientId) {
      // If in patient context, go back to patient consultations
      this.router.navigate(['/patients', this.patientId, 'consultations']);
    } else {
      // Otherwise, go to general consultations list
      this.router.navigate(['/consultations']);
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

  getStatusClass(status: ConsultationStatus): string {
    switch (status) {
      case ConsultationStatus.COMPLETED:
        return 'status-completed';
      case ConsultationStatus.IN_PROGRESS:
        return 'status-in-progress';
      case ConsultationStatus.SCHEDULED:
        return 'status-scheduled';
      case ConsultationStatus.CANCELLED:
        return 'status-cancelled';
      case ConsultationStatus.NO_SHOW:
        return 'status-no-show';
      default:
        return '';
    }
  }

  getTypeClass(type: ConsultationType): string {
    switch (type) {
      case ConsultationType.EMERGENCY:
        return 'type-emergency';
      case ConsultationType.INITIAL:
        return 'type-initial';
      case ConsultationType.FOLLOW_UP:
        return 'type-follow-up';
      case ConsultationType.ROUTINE_CHECKUP:
        return 'type-routine';
      case ConsultationType.SPECIALIST:
        return 'type-specialist';
      case ConsultationType.TELEMEDICINE:
        return 'type-telemedicine';
      default:
        return '';
    }
  }

  printConsultation(): void {
    // Implementation for printing consultation
    window.print();
  }

  createPrescription(): void {
    // Navigate to prescription form with consultation context
    this.router.navigate(['/prescriptions', 'new'], { 
      queryParams: { consultationId: this.consultationId } 
    });
  }

  hasVitalSigns(): boolean {
    if (!this.consultation?.vitalSigns) return false;
    
    // Check if vitalSigns has any actual data
    const vitalSigns = this.consultation.vitalSigns;
    return !!(
      vitalSigns.bloodPressure?.systolic ||
      vitalSigns.bloodPressure?.diastolic ||
      vitalSigns.heartRate ||
      vitalSigns.temperature ||
      vitalSigns.respiratoryRate ||
      vitalSigns.oxygenSaturation ||
      vitalSigns.weight ||
      vitalSigns.height ||
      vitalSigns.bmi
    );
  }

  getBMICategory(bmi: number | undefined): string {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  getBMIClass(bmi: number | undefined): string {
    if (!bmi) return '';
    if (bmi < 18.5) return 'bmi-underweight';
    if (bmi < 25) return 'bmi-normal';
    if (bmi < 30) return 'bmi-overweight';
    return 'bmi-obese';
  }

  viewPrescriptionDetail(prescriptionId: string): void {
    if (this.isPatientContext && this.patientId) {
      // Navigate with patient context
      this.router.navigate(['/patients', this.patientId, 'prescriptions', prescriptionId]);
    } else {
      // Navigate to prescription detail with consultation context
      this.router.navigate(['/prescriptions', prescriptionId], {
        queryParams: { 'from-consultation': this.consultationId }
      });
    }
  }

  hasPrescriptions(): boolean {
    return !!(this.consultation?.prescriptions && this.consultation.prescriptions.length > 0);
  }

  getPrescriptionCount(): number {
    return this.consultation?.prescriptions?.length || 0;
  }

  // Helper methods for handling both full and embedded prescriptions
  isFullPrescription(prescription: any): boolean {
    return !!(prescription.medications || prescription.id);
  }

  getPrescriptionNumber(prescription: any, index: number): string {
    return prescription.prescriptionNumber || `${index + 1}`;
  }

  getPrescriptionDate(prescription: any): Date | undefined {
    return prescription.prescribedDate || prescription.prescriptionDate || prescription.createdAt;
  }

  getPrescriptionMedications(prescription: any): any[] {
    return prescription.medications || [];
  }

  getMedicationName(medication: any): string {
    return medication.name || medication.medicationName || '';
  }

  getPrescriptionNotes(prescription: any): string {
    return prescription.generalInstructions || prescription.notes || '';
  }

  getPrescriptionId(prescription: any): string | null {
    return prescription.id || null;
  }

  // Methods for embedded prescriptions
  getEmbeddedMedicationName(prescription: any): string {
    return prescription.medicationName || '';
  }

  getEmbeddedDosage(prescription: any): string {
    return prescription.dosage || '';
  }

  getEmbeddedFrequency(prescription: any): string {
    return prescription.frequency || '';
  }

  getEmbeddedDuration(prescription: any): string {
    return prescription.duration || '';
  }

  getEmbeddedInstructions(prescription: any): string | null {
    return prescription.instructions || null;
  }

  getEmbeddedQuantity(prescription: any): number | null {
    return prescription.quantity || null;
  }

  getOrganizationName(): string {
    if (this.consultation?.organization?.name) {
      return this.consultation.organization.name;
    }
    // Fallback to organizationId if organization object not populated
    return this.consultation?.organizationId || '';
  }

  // Role-based access control methods
  canEditConsultation(): boolean {
    return this.authService.hasAnyRole(['DOCTOR', 'ADMIN', 'SUPER_ADMIN']);
  }

  canCreatePrescription(): boolean {
    return this.authService.hasAnyRole(['DOCTOR', 'ADMIN', 'SUPER_ADMIN']);
  }

  canViewPatient(): boolean {
    // All authenticated users can view patient details
    return true;
  }
}
