import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationsService } from '../../consultations/services/consultations.service';
import { PatientsService } from '../services/patients.service';
import { Consultation, ConsultationStatus, ConsultationType } from '../../consultations/models/consultation.model';

@Component({
  selector: 'app-patient-consultations-list',
  templateUrl: './patient-consultations-list.component.html',
  styleUrls: ['./patient-consultations-list.component.scss']
})
export class PatientConsultationsListComponent implements OnInit {
  consultations: Consultation[] = [];
  patient: any = null;
  loading = true;
  patientId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationsService: ConsultationsService,
    private patientsService: PatientsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.patientId = params['patientId'];
      if (this.patientId) {
        this.loadPatientData();
        this.loadConsultations();
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

  loadConsultations(): void {
    this.loading = true;
    // Using the patient history endpoint to get consultations for this patient
    this.consultationsService.getConsultationsByPatient(this.patientId).subscribe({
      next: (consultations) => {
        this.consultations = consultations || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading consultations:', error);
        this.consultations = [];
        this.loading = false;
      }
    });
  }

  viewConsultationDetail(consultationId: string): void {
    // Navigate with patient context
    this.router.navigate(['/patients', this.patientId, 'consultations', consultationId]);
  }

  goBackToPatient(): void {
    this.router.navigate(['/patients', this.patientId]);
  }

  newConsultation(): void {
    // Navigate to new consultation with patient pre-selected
    this.router.navigate(['/consultations/new'], { 
      queryParams: { patientId: this.patientId }
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
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

  formatEnumValue(value: string): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  getPrescriptionCount(consultation: Consultation): number {
    return consultation.prescriptions?.length || 0;
  }

  hasPrescriptions(consultation: Consultation): boolean {
    return this.getPrescriptionCount(consultation) > 0;
  }
}