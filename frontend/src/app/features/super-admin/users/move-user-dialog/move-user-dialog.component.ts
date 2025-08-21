import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SuperAdminService } from '../../services/super-admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-move-user-dialog',
  templateUrl: './move-user-dialog.component.html',
  styleUrls: ['./move-user-dialog.component.scss']
})
export class MoveUserDialogComponent implements OnInit {
  selectedOrganizationId: string = '';
  organizations: any[] = [];
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<MoveUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any },
    private superAdminService: SuperAdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
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

  onConfirm(): void {
    if (this.selectedOrganizationId && this.selectedOrganizationId !== this.data.user.organizationId) {
      this.loading = true;
      
      this.superAdminService.moveUserToOrganization(this.data.user.id, this.selectedOrganizationId).subscribe({
        next: () => {
          this.loading = false;
          const newOrg = this.organizations.find(org => org.id === this.selectedOrganizationId);
          this.notificationService.showSuccess(
            `User moved to ${newOrg?.name || 'new organization'} successfully`
          );
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error moving user:', error);
          this.notificationService.showError(error.error?.message || 'Failed to move user');
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}