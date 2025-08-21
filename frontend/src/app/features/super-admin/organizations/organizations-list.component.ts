import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { SuperAdminService } from '../services/super-admin.service';
import { OrganizationWithStats } from '../models/system-stats.model';
import { NotificationService } from '../../../core/services/notification.service';
import { OrganizationFormDialogComponent } from './organization-form-dialog.component';

@Component({
  selector: 'app-organizations-list',
  templateUrl: './organizations-list.component.html',
  styleUrls: ['./organizations-list.component.scss']
})
export class OrganizationsListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['name', 'type', 'userCount', 'patientCount', 'status', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<OrganizationWithStats>();
  loading = true;
  totalOrganizations = 0;
  searchQuery = '';

  constructor(
    private superAdminService: SuperAdminService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(page = 1, limit = 10): void {
    this.loading = true;
    this.superAdminService.getAllOrganizations(page, limit, this.searchQuery).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalOrganizations = response.meta.total;
        this.loading = false;

        // Set up pagination
        if (this.paginator) {
          this.paginator.length = response.meta.total;
          this.paginator.pageIndex = response.meta.page - 1;
          this.paginator.pageSize = response.meta.limit;
        }
      },
      error: (error) => {
        console.error('Failed to load organizations:', error);
        this.notificationService.showError('Failed to load organizations');
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery = filterValue.trim().toLowerCase();
    this.loadOrganizations();
  }

  onPageChange(event: any): void {
    this.loadOrganizations(event.pageIndex + 1, event.pageSize);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(OrganizationFormDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrganizations();
      }
    });
  }

  openEditDialog(organization: OrganizationWithStats): void {
    const dialogRef = this.dialog.open(OrganizationFormDialogComponent, {
      width: '600px',
      data: { mode: 'edit', organization }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrganizations();
      }
    });
  }

  deleteOrganization(organization: OrganizationWithStats): void {
    if (organization.userCount > 0) {
      this.notificationService.showError('Cannot delete organization with existing users');
      return;
    }

    if (confirm(`Are you sure you want to delete ${organization.name}?`)) {
      this.superAdminService.deleteOrganization(organization.id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Organization deleted successfully');
          this.loadOrganizations();
        },
        error: (error) => {
          console.error('Failed to delete organization:', error);
          this.notificationService.showError('Failed to delete organization');
        }
      });
    }
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'HOSPITAL': 'primary',
      'CLINIC': 'accent',
      'MEDICAL_CENTER': 'warn'
    };
    return colors[type] || '';
  }
}