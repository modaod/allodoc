import { Component, OnInit } from '@angular/core';
import { AuthService, User, Organization } from './core/services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'AlloDoc - Medical Management System';
  currentUser: User | null = null;
  isAuthenticated = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Logout successful, already redirected by AuthService
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Force logout even if server request fails
        this.router.navigate(['/auth/login']);
      }
    });
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return 'User';
  }

  hasMultipleOrganizations(): boolean {
    return this.currentUser?.organizations && this.currentUser.organizations.length > 1 || false;
  }

  getCurrentOrganization(): Organization | undefined {
    return this.currentUser?.selectedOrganization;
  }

  getUserOrganizations(): Organization[] {
    return this.currentUser?.organizations || [];
  }

  switchOrganization(organizationId: string): void {
    if (organizationId === this.getCurrentOrganization()?.id) {
      return; // Already selected
    }

    this.authService.selectOrganization(organizationId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Organization switched successfully');
        // Stay on current page
      },
      error: (error) => {
        this.notificationService.showError('Failed to switch organization');
        console.error('Organization switch error:', error);
      }
    });
  }
}
