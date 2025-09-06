import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { startWith, debounceTime, distinctUntilChanged, switchMap, map, catchError, tap } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';

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

  // Patient autocomplete
  patientSearchControl = new FormControl();
  filteredPatients$!: Observable<Patient[]>;
  selectedPatient: Patient | null = null;
  showCreatePatient = false;

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
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupPatientAutocomplete();
    this.checkRouteParams();
  }

  setupPatientAutocomplete(): void {
    this.filteredPatients$ = this.patientSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        // If value is an object (Patient), extract the name for search
        const searchTerm = typeof value === 'string' ? value : value?.firstName + ' ' + value?.lastName;
        
        if (searchTerm && searchTerm.length >= 2) {
          return this.patientsService.searchPatients(searchTerm).pipe(
            map(response => {
              // Handle both array response and paginated response
              const patients = Array.isArray(response) ? response : (response as any).data || [];
              this.showCreatePatient = patients.length === 0;
              return patients;
            }),
            catchError(() => {
              this.showCreatePatient = true;
              return of([]);
            })
          );
        }
        this.showCreatePatient = false;
        return of([]);
      })
    );
  }

  displayPatient(patient: Patient | string): string {
    if (!patient) return '';
    
    // If it's a string, return it as is (already formatted as "FirstName LastName")
    if (typeof patient === 'string') {
      return patient;
    }
    
    // If it's a Patient object, format the name
    return `${patient.firstName} ${patient.lastName}`;
  }

  onPatientSelected(event: MatAutocompleteSelectedEvent): void {
    const patient = event.option.value as Patient;
    this.selectedPatient = patient;
    this.consultationForm.patchValue({ patientId: patient.id });
  }

  async openCreatePatientDialog(): Promise<void> {
    // Dynamically import the PatientsModule to access the dialog component
    const { PatientsModule } = await import('../../patients/patients.module');
    const { PatientQuickCreateDialogComponent } = await import('../../patients/patient-quick-create-dialog/patient-quick-create-dialog.component');
    
    const dialogRef = this.dialog.open(PatientQuickCreateDialogComponent, {
      width: '600px',
      data: { searchTerm: this.patientSearchControl.value }
    });

    dialogRef.afterClosed().subscribe(patient => {
      if (patient) {
        // Set the newly created patient in the form
        this.selectedPatient = patient;
        this.patientSearchControl.setValue(patient, { emitEvent: false });
        this.consultationForm.patchValue({ patientId: patient.id });
      }
    });
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

  checkRouteParams(): void {
    this.consultationId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = this.consultationId !== null && this.consultationId !== 'new';

    if (this.isEditMode && this.consultationId) {
      this.loadConsultation(this.consultationId);
    } else {
      // Check for query parameters to pre-populate form
      const patientId = this.route.snapshot.queryParamMap.get('patientId');
      const patientName = this.route.snapshot.queryParamMap.get('patientName');
      
      if (patientId) {
        // Set the patientId in the form
        this.consultationForm.patchValue({ patientId });
        
        // If we have the patient name, set it in the search control for display
        if (patientName) {
          this.patientSearchControl.setValue(patientName, { emitEvent: false });
        } else {
          // Load the patient to display in autocomplete
          this.patientsService.getPatientById(patientId).subscribe({
            next: (patient) => {
              this.selectedPatient = patient;
              this.patientSearchControl.setValue(patient, { emitEvent: false });
            },
            error: (error) => {
              console.error('Error loading patient:', error);
            }
          });
        }
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

    // Set patient in autocomplete
    if (consultation.patient) {
      this.selectedPatient = consultation.patient as Patient;
      this.patientSearchControl.setValue(consultation.patient, { emitEvent: false });
    } else if (consultation.patientId) {
      // Load patient if not populated
      this.patientsService.getPatientById(consultation.patientId).subscribe({
        next: (patient) => {
          this.selectedPatient = patient;
          this.patientSearchControl.setValue(patient, { emitEvent: false });
        },
        error: (error) => {
          console.error('Error loading patient for autocomplete:', error);
        }
      });
    }

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
      // doctorId removed - backend automatically uses authenticated user's ID for security
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