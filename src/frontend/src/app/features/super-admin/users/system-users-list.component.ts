import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SuperAdminService, SystemUser } from '../services/super-admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRoleDialogComponent } from './user-role-dialog.component';
import { UserFormDialogComponent } from './user-form-dialog/user-form-dialog.component';
import { MoveUserDialogComponent } from './move-user-dialog/move-user-dialog.component';

@Component({
  selector: 'app-system-users-list',
  templateUrl: './system-users-list.component.html',
  styleUrls: ['./system-users-list.component.scss']
})
export class SystemUsersListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['name', 'organization', 'roles', 'status', 'lastLogin', 'actions'];
  dataSource = new MatTableDataSource<SystemUser>([]);
  loading = false;
  totalUsers = 0;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';

  constructor(
    private superAdminService: SuperAdminService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.superAdminService.getAllUsers(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalUsers = response.meta.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.notificationService.showError('Failed to load users');
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerm = filterValue.trim().toLowerCase();
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  getRoleColor(roleName: string): string {
    switch (roleName) {
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

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '700px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openEditUserDialog(user: SystemUser): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '700px',
      data: { mode: 'edit', user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openRoleDialog(user: SystemUser): void {
    const dialogRef = this.dialog.open(UserRoleDialogComponent, {
      width: '500px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  toggleUserStatus(user: SystemUser): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    const confirmMessage = `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`;
    
    if (confirm(confirmMessage)) {
      this.superAdminService.toggleUserStatus(user.id).subscribe({
        next: (updatedUser) => {
          // Update the user in the local data
          const index = this.dataSource.data.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.dataSource.data[index] = updatedUser;
            this.dataSource.data = [...this.dataSource.data]; // Trigger change detection
          }
          this.notificationService.showSuccess(`User ${action}d successfully`);
        },
        error: (error) => {
          console.error(`Error ${action}ing user:`, error);
          this.notificationService.showError(`Failed to ${action} user`);
          // Reload to ensure UI is in sync
          this.loadUsers();
        }
      });
    }
  }

  moveUser(user: SystemUser): void {
    const dialogRef = this.dialog.open(MoveUserDialogComponent, {
      width: '500px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  deleteUser(user: SystemUser): void {
    // Soft delete - just deactivates the user
    const confirmMessage = `Are you sure you want to deactivate ${user.firstName} ${user.lastName}?\n\nThe user account will be disabled but data will be preserved.`;
    
    if (confirm(confirmMessage)) {
      this.superAdminService.deleteUser(user.id).subscribe({
        next: () => {
          // Update user status in local data
          const index = this.dataSource.data.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.dataSource.data[index].isActive = false;
            this.dataSource.data = [...this.dataSource.data]; // Trigger change detection
          }
          this.notificationService.showSuccess('User deactivated successfully');
        },
        error: (error) => {
          console.error('Error deactivating user:', error);
          this.notificationService.showError(error.error?.message || 'Failed to deactivate user');
          // Reload to ensure UI is in sync
          this.loadUsers();
        }
      });
    }
  }

  isSuperAdmin(user: SystemUser): boolean {
    return user.roles?.some((role: any) => role.name === 'SUPER_ADMIN') || false;
  }
}