import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Get required roles from route data
    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    // Check if user is authenticated
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Super Admin bypasses all role checks
    if (this.authService.hasRole('SUPER_ADMIN')) {
      return true;
    }

    // Check if user has any of the required roles
    const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);

    if (!hasRequiredRole) {
      // Show error message and redirect to dashboard
      this.notificationService.showError(
        `Access denied. This action requires one of the following roles: ${requiredRoles.join(', ')}`
      );
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}