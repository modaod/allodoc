import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Consultation, ConsultationStatus, ConsultationType } from '../models/consultation.model';
import { ConsultationsService } from '../services/consultations.service';

@Component({
  selector: 'app-consultation-detail',
  templateUrl: './consultation-detail.component.html',
  styleUrls: ['./consultation-detail.component.scss']
})
export class ConsultationDetailComponent implements OnInit {
  consultation: Consultation | null = null;
  loading = false;
  consultationId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationsService: ConsultationsService
  ) {}

  ngOnInit(): void {
    this.consultationId = this.route.snapshot.paramMap.get('id');
    if (this.consultationId) {
      this.loadConsultation(this.consultationId);
    }
  }

  // Helper methods to handle simplified structures
  getPhysicalExaminationText(): string {
    if (!this.consultation?.physicalExamination) return '';
    
    if (typeof this.consultation.physicalExamination === 'string') {
      return this.consultation.physicalExamination;
    }
    
    // Convert complex structure to simple text
    const exam = this.consultation.physicalExamination;
    const parts = [];
    if (exam.general) parts.push(`General: ${exam.general}`);
    if (exam.cardiovascular) parts.push(`Cardiovascular: ${exam.cardiovascular}`);
    if (exam.respiratory) parts.push(`Respiratory: ${exam.respiratory}`);
    if (exam.gastrointestinal) parts.push(`Gastrointestinal: ${exam.gastrointestinal}`);
    if (exam.neurological) parts.push(`Neurological: ${exam.neurological}`);
    if (exam.musculoskeletal) parts.push(`Musculoskeletal: ${exam.musculoskeletal}`);
    if (exam.dermatological) parts.push(`Dermatological: ${exam.dermatological}`);
    if (exam.other) parts.push(`Other: ${exam.other}`);
    
    return parts.join('\n');
  }

  getDiagnosisText(): string {
    if (!this.consultation?.diagnosis) return '';
    
    if (typeof this.consultation.diagnosis === 'string') {
      return this.consultation.diagnosis;
    }
    
    // Convert complex structure to simple text
    return this.consultation.diagnosis
      .map((d, i) => `${i + 1}. ${d.description}`)
      .join('\n');
  }

  getChiefComplaint(): string {
    return this.consultation?.chiefComplaint || this.consultation?.reason || '';
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
        this.router.navigate(['/consultations']);
      }
    });
  }

  editConsultation(): void {
    if (this.consultationId) {
      this.router.navigate(['/consultations', this.consultationId, 'edit']);
    }
  }

  deleteConsultation(): void {
    if (this.consultation && confirm(`Are you sure you want to delete consultation ${this.consultation.consultationNumber}?`)) {
      this.consultationsService.deleteConsultation(this.consultation.id!).subscribe({
        next: () => {
          this.router.navigate(['/consultations']);
        },
        error: (error) => {
          console.error('Error deleting consultation:', error);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/consultations']);
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

  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  getBMIClass(bmi: number): string {
    if (bmi < 18.5) return 'bmi-underweight';
    if (bmi < 25) return 'bmi-normal';
    if (bmi < 30) return 'bmi-overweight';
    return 'bmi-obese';
  }
}
