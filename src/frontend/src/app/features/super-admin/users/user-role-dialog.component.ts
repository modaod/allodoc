import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SuperAdminService } from '../services/super-admin.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-user-role-dialog',
  templateUrl: './user-role-dialog.component.html',
  styleUrls: ['./user-role-dialog.component.scss']
})
export class UserRoleDialogComponent implements OnInit {
  availableRoles = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SECRETARY'];
  currentRoles: string[] = [];
  selectedRoles: string[] = [];
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<UserRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any },
    private superAdminService: SuperAdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Extract current role names
    this.currentRoles = this.data.user.roles?.map((role: any) => 
      typeof role === 'string' ? role : role.name
    ) || [];
    
    // Initialize selected roles with current roles
    this.selectedRoles = [...this.currentRoles];
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'warn';
      case 'ADMIN':
        return 'accent';
      case 'DOCTOR':
        return 'primary';
      default:
        return '';
    }
  }

  getRoleDescription(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Full system access and control';
      case 'ADMIN':
        return 'Organization administration';
      case 'DOCTOR':
        return 'Medical professional with patient access';
      case 'SECRETARY':
        return 'Administrative and scheduling tasks';
      default:
        return '';
    }
  }

  canAssignSuperAdmin(): boolean {
    // In a real app, check if current user is super admin
    // For now, we'll allow it
    return true;
  }

  hasChanges(): boolean {
    if (this.selectedRoles.length !== this.currentRoles.length) {
      return true;
    }
    
    return !this.selectedRoles.every(role => this.currentRoles.includes(role));
  }

  onSave(): void {
    if (this.hasChanges() && this.selectedRoles.length > 0) {
      this.loading = true;
      
      this.superAdminService.assignRoles(this.data.user.id, this.selectedRoles).subscribe({
        next: (updatedUser) => {
          this.loading = false;
          this.notificationService.showSuccess('User roles updated successfully');
          this.dialogRef.close(updatedUser);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error updating roles:', error);
          this.notificationService.showError(error.error?.message || 'Failed to update user roles');
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}