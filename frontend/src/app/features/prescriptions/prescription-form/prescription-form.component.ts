import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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

  // Enum values for templates
  prescriptionStatuses = Object.values(PrescriptionStatus);
  dosageForms = Object.values(DosageForm);
  frequencyTypes = Object.values(FrequencyType);
  durationUnits = Object.values(DurationUnit);

  // Mock data for dropdowns
  availableMedications = [
    'Amoxicillin', 'Ibuprofen', 'Acetaminophen', 'Lisinopril', 'Metformin',
    'Atorvastatin', 'Omeprazole', 'Aspirin', 'Hydrochlorothiazide', 'Gabapentin'
  ];

  availablePatients = [
    { id: '1', name: 'John Smith', age: 35 },
    { id: '2', name: 'Sarah Johnson', age: 28 },
    { id: '3', name: 'Michael Brown', age: 42 }
  ];

  availableDoctors = [
    { id: '1', name: 'Dr. Wilson' },
    { id: '2', name: 'Dr. Martinez' },
    { id: '3', name: 'Dr. Chen' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionsService: PrescriptionsService,
    private consultationsService: ConsultationsService
  ) {
    this.prescriptionForm = this.createForm();
  }

  ngOnInit(): void {
    this.prescriptionId = this.route.snapshot.paramMap.get('id');
    this.consultationId = this.route.snapshot.queryParamMap.get('consultationId');
    this.isEditMode = this.prescriptionId !== null && this.prescriptionId !== 'new';

    if (this.isEditMode && this.prescriptionId) {
      this.loadPrescription(this.prescriptionId);
    } else if (this.consultationId) {
      // Pre-populate from consultation if coming from consultation detail
      this.loadConsultationData(this.consultationId);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      prescriptionNumber: ['', Validators.required],
      patientId: ['', Validators.required],
      patientName: ['', Validators.required],
      doctorId: ['', Validators.required],
      doctorName: ['', Validators.required],
      prescriptionDate: [new Date().toISOString().split('T')[0], Validators.required],
      validUntil: ['', Validators.required],
      status: [PrescriptionStatus.DRAFT, Validators.required],
      medications: this.fb.array([]),
      instructions: [''],
      notes: [''],
      consultationId: [this.consultationId || '']
    });
  }

  get medicationsArray(): FormArray {
    return this.prescriptionForm.get('medications') as FormArray;
  }

  createMedicationFormGroup(): FormGroup {
    return this.fb.group({
      medicationName: ['', Validators.required],
      dosage: ['', Validators.required],
      dosageForm: [DosageForm.TABLET, Validators.required],
      frequency: ['', Validators.required],
      frequencyType: [FrequencyType.DAILY, Validators.required],
      duration: ['', Validators.required],
      durationUnit: [DurationUnit.DAYS, Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      instructions: [''],
      refills: [0, [Validators.min(0), Validators.max(12)]]
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
        
        // Generate prescription number
        this.generatePrescriptionNumber();
        
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
  }

  onPatientChange(): void {
    const patientId = this.prescriptionForm.get('patientId')?.value;
    const selectedPatient = this.availablePatients.find(p => p.id === patientId);
    if (selectedPatient) {
      this.prescriptionForm.patchValue({
        patientName: selectedPatient.name
      });
    }
  }

  onDoctorChange(): void {
    const doctorId = this.prescriptionForm.get('doctorId')?.value;
    const selectedDoctor = this.availableDoctors.find(d => d.id === doctorId);
    if (selectedDoctor) {
      this.prescriptionForm.patchValue({
        doctorName: selectedDoctor.name
      });
    }
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
      
      const prescription: Prescription = {
        ...formValue,
        prescriptionDate: new Date(formValue.prescriptionDate),
        validUntil: new Date(formValue.validUntil),
        medications: formValue.medications,
        id: this.isEditMode ? this.prescriptionId : undefined
      };

      const saveOperation = this.isEditMode
        ? this.prescriptionsService.updatePrescription(prescription.id!, {
            id: prescription.id!,
            patientId: prescription.patientId,
            consultationId: prescription.consultationId,
            prescriptionDate: prescription.prescriptionDate,
            status: prescription.status,
            medications: prescription.medications,
            instructions: prescription.instructions,
            notes: prescription.notes,
            refillsAllowed: prescription.refillsAllowed,
            validUntil: prescription.validUntil,
            pharmacyInstructions: prescription.pharmacyInstructions
          })
        : this.prescriptionsService.createPrescription(prescription);

      saveOperation.subscribe({
        next: (savedPrescription) => {
          this.saving = false;
          this.router.navigate(['/prescriptions', savedPrescription.id]);
        },
        error: (error) => {
          console.error('Error saving prescription:', error);
          this.saving = false;
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
    const timestamp = Date.now();
    const prescriptionNumber = `RX${timestamp.toString().slice(-8)}`;
    this.prescriptionForm.patchValue({
      prescriptionNumber: prescriptionNumber
    });
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
}
