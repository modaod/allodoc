import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { Patient, CreatePatientRequest, UpdatePatientRequest } from '../models/patient.model';
import { PatientsService } from '../services/patients.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.scss']
})
export class PatientFormComponent implements OnInit {
  patientForm!: FormGroup;
  isEditMode = false;
  patientId: string | null = null;
  loading = false;
  saving = false;

  allergies: string[] = [];
  chronicDiseases: string[] = [];

  constructor(
    private fb: FormBuilder,
    private patientsService: PatientsService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkRouteParams();
  }

  initializeForm(): void {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      alternatePhone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      address: [''],
      notes: [''],
      medicalHistory: this.fb.group({
        allergies: [[]],
        chronicDiseases: [[]],
        surgeries: this.fb.array([]),
        medications: this.fb.array([]),
        familyHistory: this.fb.group({
          diseases: [[]],
          notes: ['']
        })
      })
    });
  }

  checkRouteParams(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = this.patientId !== null && this.patientId !== 'new';

    if (this.isEditMode && this.patientId) {
      this.loadPatient(this.patientId);
    }
  }

  loadPatient(id: string): void {
    this.loading = true;
    this.patientsService.getPatientById(id).subscribe({
      next: (patient) => {
        this.populateForm(patient);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.loading = false;
        const errorMessage = this.errorHandler.getErrorMessage(error);
        this.notificationService.showError(`Failed to load patient: ${errorMessage}`);
        this.router.navigate(['/patients']);
      }
    });
  }

  populateForm(patient: Patient): void {
    // Format the date correctly for the date input field
    let formattedDate: any = patient.dateOfBirth;
    if (patient.dateOfBirth) {
      const date = new Date(patient.dateOfBirth);
      formattedDate = date.toISOString().split('T')[0];
    }
    
    this.patientForm.patchValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: formattedDate,
      gender: patient.gender,
      email: patient.email,
      phone: patient.phone,
      alternatePhone: patient.alternatePhone,
      address: patient.address,
      notes: patient.notes,
      medicalHistory: {
        familyHistory: {
          diseases: patient.medicalHistory?.familyHistory?.diseases || [],
          notes: patient.medicalHistory?.familyHistory?.notes || ''
        }
      }
    });

    this.allergies = patient.medicalHistory?.allergies || [];
    this.chronicDiseases = patient.medicalHistory?.chronicDiseases || [];

    // Populate surgeries and medications arrays
    if (patient.medicalHistory?.surgeries) {
      patient.medicalHistory.surgeries.forEach(surgery => {
        this.surgeries.push(this.fb.group({
          procedure: [surgery.procedure, Validators.required],
          date: [surgery.date, Validators.required],
          hospital: [surgery.hospital],
          notes: [surgery.notes]
        }));
      });
    }

    if (patient.medicalHistory?.medications) {
      patient.medicalHistory.medications.forEach(medication => {
        this.medications.push(this.fb.group({
          name: [medication.name, Validators.required],
          dosage: [medication.dosage, Validators.required],
          frequency: [medication.frequency, Validators.required],
          startDate: [medication.startDate],
          endDate: [medication.endDate]
        }));
      });
    }
  }

  get surgeries(): FormArray {
    return this.patientForm.get('medicalHistory.surgeries') as FormArray;
  }

  get medications(): FormArray {
    return this.patientForm.get('medicalHistory.medications') as FormArray;
  }

  addSurgery(): void {
    this.surgeries.push(this.fb.group({
      procedure: ['', Validators.required],
      date: ['', Validators.required],
      hospital: [''],
      notes: ['']
    }));
  }

  removeSurgery(index: number): void {
    this.surgeries.removeAt(index);
  }

  addMedication(): void {
    this.medications.push(this.fb.group({
      name: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      startDate: [''],
      endDate: ['']
    }));
  }

  removeMedication(index: number): void {
    this.medications.removeAt(index);
  }

  addAllergyFromInput(event: Event, input: HTMLInputElement): void {
    event.preventDefault();
    const value = input.value.trim();
    if (value && !this.allergies.includes(value)) {
      this.allergies.push(value);
      input.value = '';
    }
  }

  removeAllergy(allergy: string): void {
    const index = this.allergies.indexOf(allergy);
    if (index >= 0) {
      this.allergies.splice(index, 1);
    }
  }

  addChronicDiseaseFromInput(event: Event, input: HTMLInputElement): void {
    event.preventDefault();
    const value = input.value.trim();
    if (value && !this.chronicDiseases.includes(value)) {
      this.chronicDiseases.push(value);
      input.value = '';
    }
  }

  removeChronicDisease(disease: string): void {
    const index = this.chronicDiseases.indexOf(disease);
    if (index >= 0) {
      this.chronicDiseases.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.saving = true;
      const formValue = { ...this.patientForm.value };
      
      // Include allergies and chronic diseases
      formValue.medicalHistory.allergies = this.allergies;
      formValue.medicalHistory.chronicDiseases = this.chronicDiseases;

      // Convert date to ISO string if it's a Date object
      if (formValue.dateOfBirth instanceof Date) {
        formValue.dateOfBirth = formValue.dateOfBirth.toISOString().split('T')[0];
      } else if (formValue.dateOfBirth && typeof formValue.dateOfBirth === 'string' && formValue.dateOfBirth.includes('T')) {
        // If it's already an ISO string, extract just the date part
        formValue.dateOfBirth = formValue.dateOfBirth.split('T')[0];
      }
      
      // Remove empty optional fields to avoid backend validation errors
      if (!formValue.phone || formValue.phone.trim() === '') {
        delete formValue.phone;
      }
      if (!formValue.email || formValue.email.trim() === '') {
        delete formValue.email;
      }
      if (!formValue.address || formValue.address.trim() === '') {
        delete formValue.address;
      }
      if (!formValue.alternatePhone || formValue.alternatePhone.trim() === '') {
        delete formValue.alternatePhone;
      }
      if (!formValue.notes || formValue.notes.trim() === '') {
        delete formValue.notes;
      }

      console.log('Form value before submission:', formValue);

      if (this.isEditMode && this.patientId) {
        const updateRequest: UpdatePatientRequest = formValue;
        this.patientsService.updatePatient(this.patientId, updateRequest).subscribe({
          next: (updatedPatient) => {
            this.saving = false;
            this.notificationService.showSuccess('Patient updated successfully');
            this.router.navigate(['/patients', this.patientId]);
          },
          error: (error) => {
            console.error('Error updating patient - Full error object:', error);
            console.error('Error structure:', {
              status: error?.status,
              message: error?.message,
              error: error?.error,
              errorMessage: error?.error?.message
            });
            this.saving = false;
            const errorMessage = this.errorHandler.getErrorMessage(error);
            this.notificationService.showError(`Failed to update patient: ${errorMessage}`);
          }
        });
      } else {
        const createRequest: CreatePatientRequest = formValue;
        this.patientsService.createPatient(createRequest).subscribe({
          next: (patient) => {
            this.saving = false;
            this.notificationService.showSuccess('Patient created successfully');
            this.router.navigate(['/patients', patient.id]);
          },
          error: (error) => {
            console.error('Error creating patient:', error);
            this.saving = false;
            const errorMessage = this.errorHandler.getErrorMessage(error);
            this.notificationService.showError(`Failed to create patient: ${errorMessage}`);
          }
        });
      }
    }
  }

  onCancel(): void {
    if (this.isEditMode && this.patientId) {
      this.router.navigate(['/patients', this.patientId]);
    } else {
      this.router.navigate(['/patients']);
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.patientForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const translatedField = this.translate.instant(`patients.fields.${fieldName}`);
        return this.translate.instant('common.required');
      }
      if (field.errors['email']) return this.translate.instant('patients.validation.invalidEmail');
      if (field.errors['minlength']) {
        const translatedField = this.translate.instant(`patients.fields.${fieldName}`);
        return this.translate.instant('patients.validation.tooShort', { field: translatedField });
      }
      if (field.errors['pattern']) {
        if (fieldName === 'phone' || fieldName === 'alternatePhone') {
          return this.translate.instant('patients.validation.invalidPhone');
        }
        return this.translate.instant('patients.validation.invalidFormat');
      }
    }
    return '';
  }
}
