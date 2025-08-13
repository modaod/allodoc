import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, combineLatest, Observable } from 'rxjs';
import { Patient } from '../models/patient.model';
import { PatientsService } from '../services/patients.service';
import { ConsultationsService } from '../../consultations/services/consultations.service';
import { PrescriptionsService } from '../../prescriptions/services/prescriptions.service';
import { Consultation } from '../../consultations/models/consultation.model';
import { Prescription } from '../../prescriptions/models/prescription.model';

interface MedicalTimelineEvent {
  id: string;
  type: 'consultation' | 'prescription';
  date: Date;
  title: string;
  subtitle?: string;
  description: string;
  status?: string;
  data: Consultation | Prescription;
}

@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.scss']
})
export class PatientDetailComponent implements OnInit {
  patient: Patient | null = null;
  consultations: Consultation[] = [];
  prescriptions: Prescription[] = [];
  medicalTimeline: MedicalTimelineEvent[] = [];
  loading = false;
  loadingTimeline = false;
  patientId: string | null = null;
  activeTab = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientsService: PatientsService,
    private consultationsService: ConsultationsService,
    private prescriptionsService: PrescriptionsService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    console.log('Patient detail component initialized with ID:', this.patientId);
    
    if (this.patientId && this.patientId !== 'new') {
      this.loadPatient(this.patientId);
    } else {
      console.error('Invalid patient ID received:', this.patientId);
      this.router.navigate(['/patients']);
    }
  }

  loadPatient(id: string): void {
    console.log('Loading patient with ID:', id);
    this.loading = true;
    this.loadingTimeline = true;

    // Load patient data first, then try to load medical history
    this.patientsService.getPatientById(id).subscribe({
      next: (patient) => {
        console.log('Patient loaded successfully:', patient);
        this.patient = patient;
        this.loading = false;
        
        // Try to load consultations and prescriptions, but don't fail if they're not available
        this.loadMedicalHistory(id);
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.loading = false;
        this.loadingTimeline = false;
        // Don't automatically redirect on error - show error message instead
        alert(`Failed to load patient details: ${error.message || 'Unknown error'}`);
      }
    });
  }

  private loadMedicalHistory(patientId: string): void {
    console.log('Loading medical history for patient:', patientId);
    
    // Use the patient-specific endpoints
    const consultations$ = this.consultationsService ? 
      this.consultationsService.getConsultationsByPatient(patientId) : 
      new Observable<any>(observer => { 
        console.log('ConsultationsService not available');
        observer.next([]); 
        observer.complete(); 
      });
      
    const prescriptions$ = this.prescriptionsService ? 
      this.prescriptionsService.getPrescriptionsByPatient(patientId) : 
      new Observable<any>(observer => { 
        console.log('PrescriptionsService not available');
        observer.next([]); 
        observer.complete(); 
      });

    combineLatest([consultations$, prescriptions$]).subscribe({
      next: ([consultationsResponse, prescriptionsResponse]) => {
        console.log('Medical history API responses:', { consultationsResponse, prescriptionsResponse });
        
        // Now we're getting arrays directly from the patient-specific endpoints
        this.consultations = Array.isArray(consultationsResponse) ? consultationsResponse : [];
        this.prescriptions = Array.isArray(prescriptionsResponse) ? prescriptionsResponse : [];

        console.log('Processed medical data:', { 
          consultations: this.consultations, 
          prescriptions: this.prescriptions 
        });
        
        this.buildMedicalTimeline();
        this.loadingTimeline = false;
      },
      error: (error) => {
        console.error('Error loading medical history:', error);
        this.consultations = [];
        this.prescriptions = [];
        this.buildMedicalTimeline();
        this.loadingTimeline = false;
      }
    });
  }

  editPatient(): void {
    if (this.patientId) {
      this.router.navigate(['/patients', this.patientId, 'edit']);
    }
  }

  deletePatient(): void {
    if (this.patient && confirm(`Are you sure you want to delete patient ${this.patient.firstName} ${this.patient.lastName}?`)) {
      this.patientsService.deletePatient(this.patient.id!).subscribe({
        next: () => {
          this.router.navigate(['/patients']);
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }

  getPatientAge(): number {
    if (!this.patient?.dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(this.patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  getGenderDisplay(): string {
    return this.patient?.gender === 'M' ? 'Male' : 'Female';
  }

  buildMedicalTimeline(): void {
    console.log('Building medical timeline with data:', { 
      consultations: this.consultations, 
      prescriptions: this.prescriptions 
    });
    
    this.medicalTimeline = [];

    // Add consultations to timeline
    if (this.consultations && Array.isArray(this.consultations)) {
      this.consultations.forEach(consultation => {
        if (consultation && consultation.id) {
          this.medicalTimeline.push({
            id: consultation.id,
            type: 'consultation',
            date: new Date(consultation.consultationDate || consultation.createdAt),
            title: `Consultation - ${consultation.type || 'General'}`,
            subtitle: consultation.consultationNumber || 'No number',
            description: consultation.reason || consultation.symptoms || (typeof consultation.diagnosis === 'string' ? consultation.diagnosis : 'No description'),
            status: consultation.status || 'COMPLETED',
            data: consultation
          });
        }
      });
    }

    // Add prescriptions to timeline
    if (this.prescriptions && Array.isArray(this.prescriptions)) {
      this.prescriptions.forEach(prescription => {
        if (prescription && prescription.id) {
          const medicationNames = prescription.medications?.map(m => (m as any).name || (m as any).medicationName).join(', ') || 'No medications';
          this.medicalTimeline.push({
            id: prescription.id,
            type: 'prescription',
            date: new Date(prescription.prescriptionDate || prescription.prescribedDate || prescription.createdAt || new Date()),
            title: `Prescription - ${prescription.prescriptionNumber || 'No number'}`,
            subtitle: `${prescription.medications?.length || 0} medication(s)`,
            description: medicationNames,
            status: prescription.status || 'ACTIVE',
            data: prescription
          });
        }
      });
    }

    // Sort timeline by date (most recent first)
    this.medicalTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log('Built medical timeline:', this.medicalTimeline);
  }

  newConsultation(): void {
    if (this.patient) {
      // Navigate to consultation form with patient context
      this.router.navigate(['/consultations/new'], {
        queryParams: {
          patientId: this.patient.id,
          patientName: `${this.patient.firstName} ${this.patient.lastName}`
        }
      });
    }
  }

  viewConsultation(consultationId: string): void {
    // Navigate with patient context
    this.router.navigate(['/patients', this.patientId, 'consultations', consultationId]);
  }

  viewPrescription(prescriptionId: string): void {
    // Navigate with patient context
    this.router.navigate(['/patients', this.patientId, 'prescriptions', prescriptionId]);
  }

  newPrescription(): void {
    if (this.patient) {
      this.router.navigate(['/prescriptions/new'], {
        queryParams: {
          patientId: this.patient.id,
          patientName: `${this.patient.firstName} ${this.patient.lastName}`
        }
      });
    }
  }

  getTimelineIcon(type: string): string {
    return type === 'consultation' ? 'medical_services' : 'medication';
  }

  getTimelineColor(type: string): string {
    return type === 'consultation' ? 'primary' : 'accent';
  }

  getStatusColor(type: string, status: string): string {
    if (type === 'consultation') {
      switch (status) {
        case 'COMPLETED': return 'success';
        case 'SCHEDULED': return 'primary';
        case 'CANCELLED': return 'warn';
        default: return 'default';
      }
    } else {
      switch (status) {
        case 'ACTIVE': return 'success';
        case 'EXPIRED': return 'warn';
        case 'CANCELLED': return 'warn';
        default: return 'default';
      }
    }
  }

  onTabChange(event: any): void {
    this.activeTab = event.index;
  }

  viewAllConsultations(): void {
    // Navigate to patient-specific consultations list
    this.router.navigate(['/patients', this.patientId, 'consultations']);
  }

  viewAllPrescriptions(): void {
    // Navigate to patient-specific prescriptions list
    this.router.navigate(['/patients', this.patientId, 'prescriptions']);
  }
}
