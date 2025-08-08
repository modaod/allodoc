import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { 
  Consultation,
  ConsultationStatus,
  ConsultationType
} from '../models/consultation.model';
import { ConsultationsService } from '../services/consultations.service';
import { PatientsService } from '../../patients/services/patients.service';
import { Patient } from '../../patients/models/patient.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-consultation-form',
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.scss']
})
export class ConsultationFormComponent implements OnInit {
  consultationForm!: FormGroup;
  isEditMode = false;
  consultationId: string | null = null;
  loading = false;
  saving = false;
  showEditModeInfo = false;

  // Data for dropdowns
  patients: Patient[] = [];
  consultationTypes = Object.values(ConsultationType);
  consultationStatuses = Object.values(ConsultationStatus);

  constructor(
    private fb: FormBuilder,
    private consultationsService: ConsultationsService,
    private patientsService: PatientsService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPatients();
    this.checkRouteParams();
  }

  initializeForm(): void {
    this.consultationForm = this.fb.group({
      patientId: ['', Validators.required],
      consultationDate: ['', Validators.required],
      type: ['', Validators.required],
      status: [ConsultationStatus.SCHEDULED],
      reason: ['', [Validators.required, Validators.minLength(5)]],  // Changed from chiefComplaint
      symptoms: [''],  // Changed from historyOfPresentIllness
      physicalExamination: [''],
      diagnosis: [''],  // Changed from FormArray to simple string
      treatmentPlan: [''],

      // Simplified vital signs - only key ones
      vitalSigns: this.fb.group({
        temperature: [''],
        heartRate: [''],
        bloodPressureText: [''], // Simplified as single text field
        weight: ['']
      }),

      // Integrated prescriptions array
      prescriptions: this.fb.array([]),
      
      followUpInstructions: [''],
      notes: ['']
    });
  }

  get prescriptions(): FormArray {
    return this.consultationForm.get('prescriptions') as FormArray;
  }

  createPrescriptionGroup(): FormGroup {
    return this.fb.group({
      medicationName: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      duration: ['', Validators.required],
      instructions: ['']
    });
  }

  addPrescription(): void {
    this.prescriptions.push(this.createPrescriptionGroup());
  }

  removePrescription(index: number): void {
    this.prescriptions.removeAt(index);
  }

  loadPatients(): void {
    this.patientsService.getAllPatients().subscribe({
      next: (response) => {
        this.patients = response.data;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
      }
    });
  }

  checkRouteParams(): void {
    this.consultationId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = this.consultationId !== null && this.consultationId !== 'new';

    if (this.isEditMode && this.consultationId) {
      this.loadConsultation(this.consultationId);
    } else {
      // Check for query parameters to pre-populate form
      const patientId = this.route.snapshot.queryParamMap.get('patientId');
      if (patientId) {
        this.consultationForm.patchValue({ patientId });
      }
      
      // Set default consultation date to now
      const now = new Date();
      const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      this.consultationForm.patchValue({ consultationDate: localISOTime });
    }
  }

  loadConsultation(id: string): void {
    this.loading = true;
    this.consultationsService.getConsultationById(id).subscribe({
      next: (consultation) => {
        this.populateForm(consultation);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading consultation:', error);
        this.loading = false;
      }
    });
  }

  populateForm(consultation: Consultation): void {
    // Convert date to local datetime string for input
    const consultationDate = new Date(consultation.consultationDate);
    const localISOTime = new Date(consultationDate.getTime() - consultationDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    this.consultationForm.patchValue({
      patientId: consultation.patientId,
      consultationDate: localISOTime,
      type: consultation.type || '',
      status: consultation.status || ConsultationStatus.COMPLETED,
      reason: consultation.reason,
      symptoms: consultation.symptoms || '',
      physicalExamination: typeof consultation.physicalExamination === 'string' 
        ? consultation.physicalExamination 
        : consultation.physicalExamination?.general || '',
      treatmentPlan: consultation.treatmentPlan,
      followUpInstructions: consultation.followUpInstructions,
      notes: consultation.notes,
      vitalSigns: {
        temperature: consultation.vitalSigns?.temperature || '',
        heartRate: consultation.vitalSigns?.heartRate || '',
        bloodPressureText: consultation.vitalSigns?.bloodPressure ? 
          `${consultation.vitalSigns.bloodPressure.systolic}/${consultation.vitalSigns.bloodPressure.diastolic}` : '',
        weight: consultation.vitalSigns?.weight || ''
      }
    });

    // For now, skip prescriptions since we need to integrate with backend properly
    
    // Disable fields that cannot be updated in edit mode
    if (this.isEditMode) {
      this.disableNonEditableFields();
      this.showEditModeInfo = true;
    }
  }

  disableNonEditableFields(): void {
    // Only notes and vitalSigns can be updated according to UpdateConsultationDto
    const fieldsToDisable = [
      'patientId', 'consultationDate', 'type', 'status', 
      'reason', 'symptoms', 'physicalExamination', 
      'diagnosis', 'treatmentPlan', 'followUpInstructions', 'prescriptions'
    ];

    fieldsToDisable.forEach(fieldName => {
      const control = this.consultationForm.get(fieldName);
      if (control) {
        control.disable();
      }
    });

    // Keep vitalSigns and notes enabled (these can be updated)
    // Notes field is already editable by default
    // VitalSigns fields are already editable by default
  }

  onSubmit(): void {
    if (this.consultationForm.valid) {
      this.saving = true;
      const formData = this.prepareFormData();

      if (this.isEditMode && this.consultationId) {
        this.consultationsService.updateConsultation(this.consultationId, formData).subscribe({
          next: () => {
            this.saving = false;
            this.router.navigate(['/consultations']);
          },
          error: (error) => {
            console.error('Error updating consultation:', error);
            this.saving = false;
          }
        });
      } else {
        this.consultationsService.createConsultation(formData).subscribe({
          next: () => {
            this.saving = false;
            this.router.navigate(['/consultations']);
          },
          error: (error) => {
            console.error('Error creating consultation:', error);
            this.saving = false;
          }
        });
      }
    }
  }

  prepareFormData(): any {
    const formValue = this.consultationForm.value;
    const currentUser = this.authService.currentUser;
    
    // Parse blood pressure text back to object if provided
    let bloodPressure = undefined;
    if (formValue.vitalSigns.bloodPressureText) {
      const bpMatch = formValue.vitalSigns.bloodPressureText.match(/(\d+)\/(\d+)/);
      if (bpMatch) {
        bloodPressure = {
          systolic: parseInt(bpMatch[1]),
          diastolic: parseInt(bpMatch[2])
        };
      }
    }

    if (this.isEditMode) {
      // For updates, only send fields that are allowed by UpdateConsultationDto
      return {
        notes: formValue.notes,
        vitalSigns: {
          temperature: formValue.vitalSigns.temperature ? parseFloat(formValue.vitalSigns.temperature) : undefined,
          heartRate: formValue.vitalSigns.heartRate ? parseInt(formValue.vitalSigns.heartRate) : undefined,
          bloodPressure: bloodPressure,
          weight: formValue.vitalSigns.weight ? parseFloat(formValue.vitalSigns.weight) : undefined
        }
      };
    }

    // For creation, prepare all required fields
    const baseData = {
      patientId: formValue.patientId,
      doctorId: currentUser?.id || '',  // Add doctorId from current user
      consultationDate: new Date(formValue.consultationDate).toISOString(),
      type: formValue.type,
      reason: formValue.reason,  // Use reason instead of chiefComplaint
      symptoms: formValue.symptoms,  // Use symptoms instead of historyOfPresentIllness
      physicalExamination: formValue.physicalExamination, // Send as string
      diagnosis: formValue.diagnosis || '', // Send as string
      treatmentPlan: formValue.treatmentPlan,
      followUpInstructions: formValue.followUpInstructions,
      notes: formValue.notes,
      vitalSigns: {
        temperature: formValue.vitalSigns.temperature ? parseFloat(formValue.vitalSigns.temperature) : undefined,
        heartRate: formValue.vitalSigns.heartRate ? parseInt(formValue.vitalSigns.heartRate) : undefined,
        bloodPressure: bloodPressure,
        weight: formValue.vitalSigns.weight ? parseFloat(formValue.vitalSigns.weight) : undefined
      },
      prescriptions: formValue.prescriptions || [] // Add integrated prescriptions
    };

    return baseData;
  }

  getFieldError(fieldName: string): string {
    const field = this.consultationForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return `${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
      if (field.errors?.['minlength']) {
        return `${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  onCancel(): void {
    this.router.navigate(['/consultations']);
  }
}