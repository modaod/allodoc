import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { 
  Consultation, 
  CreateConsultationRequest, 
  UpdateConsultationRequest,
  ConsultationStatus,
  ConsultationType
} from '../models/consultation.model';
import { ConsultationsService } from '../services/consultations.service';
import { PatientsService } from '../../patients/services/patients.service';
import { Patient } from '../../patients/models/patient.model';

@Component({
  selector: 'app-consultation-form-simple',
  templateUrl: './consultation-form-simple.component.html',
  styleUrls: ['./consultation-form-simple.component.scss']
})
export class ConsultationFormSimpleComponent implements OnInit {
  consultationForm!: FormGroup;
  isEditMode = false;
  consultationId: string | null = null;
  loading = false;
  saving = false;

  // Data for dropdowns
  patients: Patient[] = [];
  consultationTypes = Object.values(ConsultationType);
  consultationStatuses = Object.values(ConsultationStatus);

  constructor(
    private fb: FormBuilder,
    private consultationsService: ConsultationsService,
    private patientsService: PatientsService,
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
      reason: ['', [Validators.required, Validators.minLength(5)]],
      symptoms: [''],
      physicalExamination: [''],
      diagnosis: [''],
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
      type: consultation.metadata?.consultationType || '',
      status: 'completed', // Assume completed if we're editing
      reason: consultation.reason,
      symptoms: consultation.symptoms,
      physicalExamination: consultation.physicalExamination,
      diagnosis: consultation.diagnosis,
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

    // Populate prescriptions if any exist
    if (consultation.prescriptions && consultation.prescriptions.length > 0) {
      consultation.prescriptions.forEach(prescription => {
        const prescriptionGroup = this.createPrescriptionGroup();
        prescriptionGroup.patchValue({
          medicationName: prescription.medications?.[0]?.medicationName || '',
          dosage: prescription.medications?.[0]?.dosage || '',
          frequency: prescription.medications?.[0]?.frequency || '',
          duration: prescription.medications?.[0]?.duration || '',
          instructions: prescription.instructions || ''
        });
        this.prescriptions.push(prescriptionGroup);
      });
    }
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

  prepareFormData(): CreateConsultationRequest | UpdateConsultationRequest {
    const formValue = this.consultationForm.value;
    
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

    const data = {
      patientId: formValue.patientId,
      consultationDate: new Date(formValue.consultationDate).toISOString(),
      reason: formValue.reason,
      symptoms: formValue.symptoms,
      physicalExamination: formValue.physicalExamination,
      diagnosis: formValue.diagnosis,
      treatmentPlan: formValue.treatmentPlan,
      followUpInstructions: formValue.followUpInstructions,
      notes: formValue.notes,
      vitalSigns: {
        temperature: formValue.vitalSigns.temperature || undefined,
        heartRate: formValue.vitalSigns.heartRate || undefined,
        bloodPressure: bloodPressure,
        weight: formValue.vitalSigns.weight || undefined
      },
      metadata: {
        consultationType: formValue.type,
        prescriptions: formValue.prescriptions || []
      }
    };

    return data;
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