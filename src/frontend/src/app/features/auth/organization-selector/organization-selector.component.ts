import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Organization } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-organization-selector',
  templateUrl: './organization-selector.component.html',
  styleUrls: ['./organization-selector.component.scss']
})
export class OrganizationSelectorComponent implements OnInit {
  organizations: Organization[] = [];
  loading = false;
  selectedOrganizationId?: string;
  rememberChoice = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Check if organization already selected
    if (this.authService.hasSelectedOrganization) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Get user's organizations
    this.organizations = this.authService.getUserOrganizations();

    // If only one organization, select it automatically
    if (this.organizations.length === 1) {
      this.selectOrganization(this.organizations[0].id);
    } else if (this.organizations.length === 0) {
      this.notificationService.showError('No organizations found for this user');
      this.authService.logout();
    }

    // Check for remembered organization
    const rememberedOrgId = localStorage.getItem('rememberedOrganizationId');
    if (rememberedOrgId && this.organizations.find(org => org.id === rememberedOrgId)) {
      this.selectedOrganizationId = rememberedOrgId;
    }
  }

  selectOrganization(organizationId: string): void {
    this.loading = true;
    
    this.authService.selectOrganization(organizationId).subscribe({
      next: () => {
        if (this.rememberChoice) {
          localStorage.setItem('rememberedOrganizationId', organizationId);
        }
        
        // Navigate to dashboard or redirect URL
        const redirectUrl = localStorage.getItem('redirectUrl') || '/dashboard';
        localStorage.removeItem('redirectUrl');
        this.router.navigate([redirectUrl]);
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.showError('Failed to select organization');
        console.error('Organization selection error:', error);
      }
    });
  }

  getTimeSinceAccess(lastAccessed?: Date): string {
    if (!lastAccessed) return 'Never accessed';
    
    const now = new Date();
    const accessed = new Date(lastAccessed);
    const diffInDays = Math.floor((now.getTime() - accessed.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
