import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SuperAdminService } from '../../services/super-admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

export interface UserDialogData {
  mode: 'create' | 'edit';
  user?: any;
}

interface Role {
  id: string;
  name: string;
}

@Component({
  selector: 'app-user-form-dialog',
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss']
})
export class UserFormDialogComponent implements OnInit {
  userForm!: FormGroup;
  loading = false;
  organizations: any[] = [];
  availableRoles: Role[] = [
    { id: '650e8400-e29b-41d4-a716-446655440002', name: 'ADMIN' },
    { id: '650e8400-e29b-41d4-a716-446655440003', name: 'DOCTOR' },
    { id: '650e8400-e29b-41d4-a716-446655440004', name: 'SECRETARY' }
  ];

  constructor(
    public dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
    private fb: FormBuilder,
    private superAdminService: SuperAdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadOrganizations();
    if (this.data.mode === 'edit' && this.data.user) {
      this.populateForm(this.data.user);
    }
  }

  initializeForm(): void {
    const formConfig: any = {
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.minLength(8), Validators.maxLength(20)]],
      dateOfBirth: [''],
      gender: [''],
      organizationId: ['', Validators.required],
      roles: [[], Validators.required],
      licenseNumber: [''],
      specialty: ['']
    };

    // Add password field only for creation
    if (this.data.mode === 'create') {
      formConfig.password = ['', [Validators.required, Validators.minLength(8)]];
    }

    this.userForm = this.fb.group(formConfig);

    // Listen to role changes to show/hide doctor fields
    this.userForm.get('roles')?.valueChanges.subscribe(() => {
      this.updateDoctorFieldsValidation();
    });
  }

  loadOrganizations(): void {
    this.superAdminService.getAllOrganizations(1, 100).subscribe({
      next: (response) => {
        this.organizations = response.data;
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
        this.notificationService.showError('Failed to load organizations');
      }
    });
  }

  populateForm(user: any): void {
    // Convert roles to role IDs
    const roleIds = user.roles?.map((role: any) => {
      const foundRole = this.availableRoles.find(r => r.name === role.name || r.name === role);
      return foundRole?.id;
    }).filter(Boolean) || [];

    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      organizationId: user.organizationId || user.organization?.id,
      roles: roleIds,
      licenseNumber: user.licenseNumber || '',
      specialty: user.specialty || ''
    });
  }

  isDoctorSelected(): boolean {
    const selectedRoles = this.userForm.get('roles')?.value || [];
    const doctorRoleId = '650e8400-e29b-41d4-a716-446655440003';
    return selectedRoles.includes(doctorRoleId);
  }

  updateDoctorFieldsValidation(): void {
    const licenseControl = this.userForm.get('licenseNumber');
    const specialtyControl = this.userForm.get('specialty');

    if (this.isDoctorSelected()) {
      licenseControl?.setValidators([Validators.minLength(5), Validators.maxLength(50)]);
      specialtyControl?.setValidators([Validators.minLength(2), Validators.maxLength(100)]);
    } else {
      licenseControl?.clearValidators();
      specialtyControl?.clearValidators();
    }

    licenseControl?.updateValueAndValidity();
    specialtyControl?.updateValueAndValidity();
  }

  onOrganizationChange(): void {
    // Optional: Add any logic needed when organization changes
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      const formData = { ...this.userForm.value };

      // Rename roles to roleIds for backend
      formData.roleIds = formData.roles;
      delete formData.roles;

      // Remove empty optional fields
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null || 
            (Array.isArray(formData[key]) && formData[key].length === 0)) {
          delete formData[key];
        }
      });

      // Remove doctor fields if not a doctor
      if (!this.isDoctorSelected()) {
        delete formData.licenseNumber;
        delete formData.specialty;
      }

      if (this.data.mode === 'create') {
        this.createUser(formData);
      } else {
        this.updateUser(formData);
      }
    }
  }

  createUser(data: any): void {
    this.superAdminService.createUser(data).subscribe({
      next: (user) => {
        this.loading = false;
        this.notificationService.showSuccess('User created successfully');
        this.dialogRef.close(user);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating user:', error);
        this.notificationService.showError(error.error?.message || 'Failed to create user');
      }
    });
  }

  updateUser(data: any): void {
    if (!this.data.user?.id) {
      this.notificationService.showError('User ID is missing');
      this.loading = false;
      return;
    }

    // Remove email and password from update data
    delete data.email;
    delete data.password;

    this.superAdminService.updateUser(this.data.user.id, data).subscribe({
      next: (user) => {
        this.loading = false;
        this.notificationService.showSuccess('User updated successfully');
        this.dialogRef.close(user);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating user:', error);
        this.notificationService.showError(error.error?.message || 'Failed to update user');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}