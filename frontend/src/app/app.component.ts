import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, User, Organization } from './core/services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { NotificationService } from './core/services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'AlloDoc - Medical Management System';
  currentUser: User | null = null;
  isAuthenticated = false;
  currentLang = 'en';
  isInSuperAdminMode = false;
  private destroy$ = new Subject<void>();
  private isFetchingOrganizations = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {
    // Set up translation service
    this.translate.addLangs(['en', 'fr']);
    
    // Get saved language from localStorage or use browser language
    const savedLang = localStorage.getItem('preferredLanguage');
    const browserLang = this.translate.getBrowserLang();
    const defaultLang = savedLang || (browserLang?.match(/en|fr/) ? browserLang : 'en');
    
    this.currentLang = defaultLang;
    this.translate.setDefaultLang('en');
    this.translate.use(defaultLang);
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
      
      // Fetch all organizations for Super Admin users if not already loaded
      if (user && this.isSuperAdmin() && !this.isFetchingOrganizations) {
        const orgs = user.organizations || [];
        if (orgs.length === 0) {
          this.isFetchingOrganizations = true;
          this.authService.fetchUserOrganizations().subscribe({
            next: (organizations) => {
              console.log('Fetched organizations for Super Admin:', organizations);
              this.isFetchingOrganizations = false;
            },
            error: (error) => {
              console.error('Failed to fetch organizations:', error);
              this.isFetchingOrganizations = false;
            }
          });
        }
      }
    });

    // Initialize view mode from localStorage
    this.initializeViewMode();

    // Detect route changes to update mode
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(event => {
        this.detectRouteMode((event as NavigationEnd).url);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeViewMode(): void {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('superAdminModeEnabled');
    if (savedMode !== null) {
      this.isInSuperAdminMode = savedMode === 'true';
    } else {
      // Check current URL
      this.detectRouteMode(this.router.url);
    }
  }

  private detectRouteMode(url: string): void {
    // Automatically set mode based on current route
    const wasInSuperAdminMode = this.isInSuperAdminMode;
    this.isInSuperAdminMode = url.startsWith('/super-admin');
    
    // Save to localStorage if changed
    if (wasInSuperAdminMode !== this.isInSuperAdminMode) {
      localStorage.setItem('superAdminModeEnabled', this.isInSuperAdminMode.toString());
    }
  }

  toggleSuperAdminMode(): void {
    this.isInSuperAdminMode = !this.isInSuperAdminMode;
    localStorage.setItem('superAdminModeEnabled', this.isInSuperAdminMode.toString());
    
    // Navigate to appropriate dashboard
    if (this.isInSuperAdminMode) {
      this.router.navigate(['/super-admin']);
    } else {
      this.router.navigate(['/dashboard']);
    }
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

  getDisplayOrganization(): Organization | undefined {
    // Return selected organization if it exists
    if (this.currentUser?.selectedOrganization) {
      return this.currentUser.selectedOrganization;
    }
    
    // For Super Admin, show first organization if no selection
    if (this.isSuperAdmin() && this.currentUser?.organizations && this.currentUser.organizations.length > 0) {
      return this.currentUser.organizations[0];
    }
    
    // For regular users with organizations but no selection, show first
    if (this.currentUser?.organizations && this.currentUser.organizations.length > 0) {
      return this.currentUser.organizations[0];
    }
    
    return undefined;
  }

  getUserOrganizations(): Organization[] {
    // For Super Admin, we need to ensure organizations are loaded
    if (this.isSuperAdmin()) {
      // Return organizations from current user, or trigger fetch if empty
      const orgs = this.currentUser?.organizations || [];
      if (orgs.length === 0 && this.currentUser && !this.isFetchingOrganizations) {
        // Trigger fetch if not already loaded and not currently fetching
        this.isFetchingOrganizations = true;
        this.authService.fetchUserOrganizations().subscribe({
          next: () => {
            this.isFetchingOrganizations = false;
          },
          error: () => {
            this.isFetchingOrganizations = false;
          }
        });
      }
      return orgs;
    }
    // For regular users, return their assigned organizations
    return this.currentUser?.organizations || [];
  }

  getUserRole(org: Organization): string {
    // Super Admin has the same role across all organizations
    if (this.isSuperAdmin()) {
      return 'Super Admin';
    }
    // Find the user's role in the specific organization
    const userOrg = this.currentUser?.organizations?.find(o => o.id === org.id);
    return userOrg?.role || 'Member';
  }

  switchOrganization(organizationId: string): void {
    const currentOrgId = this.getCurrentOrganization()?.id || this.getDisplayOrganization()?.id;
    if (organizationId === currentOrgId) {
      return; // Already selected
    }

    this.authService.selectOrganization(organizationId).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Organization switched successfully');
        
        // Check if we're in super admin area and switching organizations
        if (this.isInSuperAdminMode) {
          // Exit super admin mode when switching organizations
          this.isInSuperAdminMode = false;
          this.router.navigate(['/dashboard']);
        } else {
          // Reload current route to refresh data
          const currentUrl = this.router.url;
          if (currentUrl === '/dashboard' || currentUrl.startsWith('/dashboard')) {
            // For dashboard, just navigate to trigger reload
            this.router.navigate(['/dashboard']);
          } else {
            // For other routes, use the skip location trick
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
              this.router.navigate([currentUrl]);
            });
          }
        }
      },
      error: (error) => {
        // Handle error without disrupting the UI
        let errorMessage = 'Failed to switch organization';
        
        if (error?.error?.message) {
          if (typeof error.error.message === 'string') {
            errorMessage = error.error.message;
          } else if (error.error.message.message) {
            errorMessage = error.error.message.message;
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.showError(errorMessage);
        console.error('Organization switch error:', error);
        
        // Don't navigate or logout - keep user on current page
      }
    });
  }

  switchLanguage(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    localStorage.setItem('preferredLanguage', lang);
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.roles?.includes('SUPER_ADMIN') || false;
  }
}
