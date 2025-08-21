import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SuperAdminService } from '../services/super-admin.service';
import { NotificationService } from '../../../core/services/notification.service';

export interface OrganizationDialogData {
  mode: 'create' | 'edit';
  organization?: any;
}

@Component({
  selector: 'app-organization-form-dialog',
  templateUrl: './organization-form-dialog.component.html',
  styleUrls: ['./organization-form-dialog.component.scss']
})
export class OrganizationFormDialogComponent implements OnInit {
  organizationForm!: FormGroup;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<OrganizationFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrganizationDialogData,
    private fb: FormBuilder,
    private superAdminService: SuperAdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.data.mode === 'edit' && this.data.organization) {
      this.populateForm(this.data.organization);
    }
  }

  initializeForm(): void {
    this.organizationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      type: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      phone: ['', [Validators.minLength(8), Validators.maxLength(20)]],
      email: ['', Validators.email],
      registrationNumber: ['', [Validators.minLength(5), Validators.maxLength(20)]],
      description: ['']
    });
  }

  populateForm(organization: any): void {
    this.organizationForm.patchValue({
      name: organization.name,
      type: organization.type,
      address: organization.address,
      phone: organization.phone || '',
      email: organization.email || '',
      registrationNumber: organization.registrationNumber || '',
      description: organization.description || ''
    });
  }

  onSubmit(): void {
    if (this.organizationForm.valid) {
      this.loading = true;
      const formData = this.organizationForm.value;

      // Remove empty optional fields
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null) {
          delete formData[key];
        }
      });

      if (this.data.mode === 'create') {
        this.createOrganization(formData);
      } else {
        this.updateOrganization(formData);
      }
    }
  }

  createOrganization(data: any): void {
    this.superAdminService.createOrganization(data).subscribe({
      next: (organization) => {
        this.loading = false;
        this.notificationService.showSuccess('Organization created successfully');
        this.dialogRef.close(organization);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating organization:', error);
        this.notificationService.showError(error.error?.message || 'Failed to create organization');
      }
    });
  }

  updateOrganization(data: any): void {
    if (!this.data.organization?.id) {
      this.notificationService.showError('Organization ID is missing');
      this.loading = false;
      return;
    }

    this.superAdminService.updateOrganization(this.data.organization.id, data).subscribe({
      next: (organization) => {
        this.loading = false;
        this.notificationService.showSuccess('Organization updated successfully');
        this.dialogRef.close(organization);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating organization:', error);
        this.notificationService.showError(error.error?.message || 'Failed to update organization');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}