import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { startWith, debounceTime, distinctUntilChanged, switchMap, map, catchError } from 'rxjs/operators';

import { 
  Prescription, 
  PrescriptionStatus, 
  PrescriptionMedication, 
  DosageForm, 
  FrequencyType, 
  DurationUnit 
} from '../models/prescription.model';
import { PrescriptionsService } from '../services/prescriptions.service';
import { ConsultationsService } from '../../consultations/services/consultations.service';
import { PatientsService } from '../../patients/services/patients.service';
import { Patient } from '../../patients/models/patient.model';
import { AuthService } from '../../../core/services/auth.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-prescription-form',
  templateUrl: './prescription-form.component.html',
  styleUrls: ['./prescription-form.component.scss']
})
export class PrescriptionFormComponent implements OnInit {
  prescriptionForm: FormGroup;
  isEditMode = false;
  prescriptionId: string | null = null;
  consultationId: string | null = null;
  loading = false;
  saving = false;

  // Patient autocomplete
  patientSearchControl = new FormControl();
  filteredPatients$!: Observable<Patient[]>;
  selectedPatient: Patient | null = null;
  showCreatePatient = false;

  // Enum values for templates
  prescriptionStatuses = Object.values(PrescriptionStatus);
  dosageForms = Object.values(DosageForm);
  frequencyTypes = Object.values(FrequencyType);
  durationUnits = Object.values(DurationUnit);

  // Data for dropdowns
  availableMedications = [
    'Amoxicillin', 'Ibuprofen', 'Acetaminophen', 'Lisinopril', 'Metformin',
    'Atorvastatin', 'Omeprazole', 'Aspirin', 'Hydrochlorothiazide', 'Gabapentin',
    'Amlodipine', 'Simvastatin', 'Losartan', 'Levothyroxine', 'Azithromycin'
  ];

  patients: Patient[] = [];
  currentUserName: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionsService: PrescriptionsService,
    private consultationsService: ConsultationsService,
    private patientsService: PatientsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.prescriptionForm = this.createForm();
    // Add at least one medication by default to avoid form control errors
    this.addMedication();
  }

  ngOnInit(): void {
    this.prescriptionId = this.route.snapshot.paramMap.get('id');
    this.consultationId = this.route.snapshot.queryParamMap.get('consultationId');
    const patientIdFromQuery = this.route.snapshot.queryParamMap.get('patientId');
    this.isEditMode = this.prescriptionId !== null && this.prescriptionId !== 'new';

    // Get current user name
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.currentUserName = `Dr. ${currentUser.firstName} ${currentUser.lastName}`;
    }

    // Setup patient autocomplete
    this.setupPatientAutocomplete();

    if (this.isEditMode && this.prescriptionId) {
      this.loadPrescription(this.prescriptionId);
    } else if (this.consultationId) {
      // Pre-populate from consultation if coming from consultation detail
      this.loadConsultationData(this.consultationId);
    } else {
      // Check if we have a patient ID from query params (e.g., from patient detail page)
      if (patientIdFromQuery) {
        this.prescriptionForm.patchValue({
          patientId: patientIdFromQuery
        });
        // Load the patient to display in autocomplete
        this.patientsService.getPatientById(patientIdFromQuery).subscribe({
          next: (patient) => {
            this.selectedPatient = patient;
            this.patientSearchControl.setValue(patient, { emitEvent: false });
          },
          error: (error) => {
            console.error('Error loading patient:', error);
          }
        });
      }
      
      // Ensure at least one medication exists (already added in constructor)
      if (this.medicationsArray.length === 0) {
        this.addMedication();
      }
      // Don't generate prescription number - let backend handle it
      // Set default date to today
      this.prescriptionForm.patchValue({
        prescriptionDate: new Date().toISOString().split('T')[0]
      });
      this.calculateValidUntil();
      // Force change detection to ensure form displays properly
      this.cdr.detectChanges();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      prescriptionNumber: [''],
      patientId: ['', Validators.required],
      prescriptionDate: [new Date().toISOString().split('T')[0], Validators.required],
      validUntil: [''],
      status: [PrescriptionStatus.ACTIVE, Validators.required],
      medications: this.fb.array([]),
      generalInstructions: [''],
      notes: [''],
      consultationId: ['']
    });
  }

  get medicationsArray(): FormArray {
    return this.prescriptionForm.get('medications') as FormArray;
  }

  createMedicationFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      duration: ['', Validators.required],
      instructions: [''],
      quantity: ['', [Validators.required, Validators.min(1)]]
    });
  }

  addMedication(): void {
    this.medicationsArray.push(this.createMedicationFormGroup());
  }

  removeMedication(index: number): void {
    if (this.medicationsArray.length > 1) {
      this.medicationsArray.removeAt(index);
    }
  }

  loadPrescription(id: string): void {
    this.loading = true;
    this.prescriptionsService.getPrescriptionById(id).subscribe({
      next: (prescription) => {
        this.populateForm(prescription);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescription:', error);
        this.loading = false;
        this.router.navigate(['/prescriptions']);
      }
    });
  }

  loadConsultationData(consultationId: string): void {
    // Load consultation data to pre-populate patient/doctor info
    this.consultationsService.getConsultationById(consultationId).subscribe({
      next: (consultation) => {
        this.prescriptionForm.patchValue({
          consultationId: consultationId,
          patientId: consultation.patientId,
          patientName: consultation.patientName,
          doctorId: consultation.doctorId,
          doctorName: consultation.doctorName
        });
        
        // Don't generate prescription number - let backend handle it
        
        // Auto-calculate valid until date (6 months from today)
        this.calculateValidUntil();
      },
      error: (error) => {
        console.error('Error loading consultation data:', error);
        // Still set the consultation ID even if data loading fails
        this.prescriptionForm.patchValue({
          consultationId: consultationId
        });
      }
    });
  }

  populateForm(prescription: Prescription): void {
    // Clear existing medications
    while (this.medicationsArray.length) {
      this.medicationsArray.removeAt(0);
    }

    // Add medications
    prescription.medications?.forEach(medication => {
      const medicationGroup = this.createMedicationFormGroup();
      medicationGroup.patchValue(medication);
      this.medicationsArray.push(medicationGroup);
    });

    // Update form with prescription data
    this.prescriptionForm.patchValue({
      prescriptionNumber: prescription.prescriptionNumber,
      patientId: prescription.patientId,
      patientName: prescription.patientName,
      doctorId: prescription.doctorId,
      doctorName: prescription.doctorName,
      prescriptionDate: prescription.prescriptionDate ? 
        new Date(prescription.prescriptionDate).toISOString().split('T')[0] : '',
      validUntil: prescription.validUntil ? 
        new Date(prescription.validUntil).toISOString().split('T')[0] : '',
      status: prescription.status,
      instructions: prescription.instructions,
      notes: prescription.notes,
      consultationId: prescription.consultationId
    });

    // Set patient in autocomplete if available
    if (prescription.patientId) {
      // Load patient to display in autocomplete
      this.patientsService.getPatientById(prescription.patientId).subscribe({
        next: (patient) => {
          this.selectedPatient = patient;
          this.patientSearchControl.setValue(patient, { emitEvent: false });
        },
        error: (error) => {
          console.error('Error loading patient for autocomplete:', error);
        }
      });
    }
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
    this.prescriptionForm.patchValue({ patientId: patient.id });
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
        this.prescriptionForm.patchValue({ patientId: patient.id });
      }
    });
  }

  loadPatients(): void {
    // Deprecated - now using autocomplete search
  }

  onPatientChange(): void {
    // No need to set patient name separately
  }

  onDoctorChange(): void {
    // No need to set doctor name separately
  }

  calculateValidUntil(): void {
    const prescriptionDate = this.prescriptionForm.get('prescriptionDate')?.value;
    if (prescriptionDate) {
      const date = new Date(prescriptionDate);
      date.setMonth(date.getMonth() + 6); // Default 6 months validity
      this.prescriptionForm.patchValue({
        validUntil: date.toISOString().split('T')[0]
      });
    }
  }

  onSubmit(): void {
    if (this.prescriptionForm.valid) {
      this.saving = true;
      const formValue = this.prescriptionForm.value;
      
      // Prepare the data for backend
      // Note: doctorId and prescribedDate are now automatically set by the backend
      const prescriptionData: any = {
        patientId: formValue.patientId,
        consultationId: formValue.consultationId || undefined,
        medications: formValue.medications,
        generalInstructions: formValue.generalInstructions || '',
        notes: formValue.notes || ''
      };

      const saveOperation = this.isEditMode
        ? this.prescriptionsService.updatePrescription(this.prescriptionId!, prescriptionData)
        : this.prescriptionsService.createPrescription(prescriptionData);

      saveOperation.subscribe({
        next: (savedPrescription) => {
          this.saving = false;
          // Navigate to prescription detail
          this.router.navigate(['/prescriptions', savedPrescription.id]);
        },
        error: (error) => {
          console.error('Error saving prescription:', error);
          this.saving = false;
          // Show error message
          alert(`Error saving prescription: ${error?.error?.message?.message || error?.message || 'Unknown error'}`);
        }
      });
    } else {
      this.markFormGroupTouched(this.prescriptionForm);
    }
  }

  onCancel(): void {
    this.router.navigate(['/prescriptions']);
  }

  generatePrescriptionNumber(): void {
    // Deprecated - prescription number is now generated by backend
    // Keeping method to avoid breaking references
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.prescriptionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isMedicationFieldInvalid(medicationIndex: number, fieldName: string): boolean {
    const field = this.medicationsArray.at(medicationIndex).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.prescriptionForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be at most ${field.errors['max'].max}`;
    }
    return '';
  }

  getMedicationFieldError(medicationIndex: number, fieldName: string): string {
    const field = this.medicationsArray.at(medicationIndex).get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be at most ${field.errors['max'].max}`;
    }
    return '';
  }

  calculateAge(dateOfBirth: Date | string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
