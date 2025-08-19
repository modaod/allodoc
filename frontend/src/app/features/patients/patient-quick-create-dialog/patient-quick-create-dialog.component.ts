import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PatientsService } from '../services/patients.service';
import { Patient } from '../models/patient.model';

@Component({
  selector: 'app-patient-quick-create-dialog',
  templateUrl: './patient-quick-create-dialog.component.html',
  styleUrls: ['./patient-quick-create-dialog.component.scss']
})
export class PatientQuickCreateDialogComponent {
  patientForm: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PatientQuickCreateDialogComponent>,
    private patientsService: PatientsService,
    @Inject(MAT_DIALOG_DATA) public data: { searchTerm?: string }
  ) {
    this.patientForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      phone: ['', [Validators.pattern('^[0-9-+() ]+$')]],
      email: ['', [Validators.email]],
      address: ['']
    });

    // If search term was provided, try to parse it for pre-filling
    if (data?.searchTerm) {
      const parts = data.searchTerm.trim().split(' ');
      if (parts.length >= 2) {
        this.patientForm.patchValue({
          firstName: parts[0],
          lastName: parts.slice(1).join(' ')
        });
      } else if (parts.length === 1) {
        this.patientForm.patchValue({
          firstName: parts[0]
        });
      }
    }
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.saving = true;
      const formValue = this.patientForm.value;
      
      // Convert date to ISO date string (YYYY-MM-DD)
      if (formValue.dateOfBirth) {
        formValue.dateOfBirth = new Date(formValue.dateOfBirth).toISOString().split('T')[0];
      }

      this.patientsService.createPatient(formValue).subscribe({
        next: (patient: Patient) => {
          this.saving = false;
          this.dialogRef.close(patient);
        },
        error: (error) => {
          console.error('Error creating patient:', error);
          this.saving = false;
          // You might want to show an error message here
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getFieldError(fieldName: string): string {
    const field = this.patientForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return `${this.formatFieldName(fieldName)} is required`;
      }
      if (field.errors?.['email']) {
        return 'Please enter a valid email';
      }
      if (field.errors?.['pattern']) {
        return 'Please enter a valid phone number';
      }
    }
    return '';
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}