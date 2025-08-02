import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    if (!this.authService.isAuthenticated) {
      // Store the attempted URL for redirecting
      localStorage.setItem('redirectUrl', state.url);
      
      // Redirect to login page
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (!this.authService.hasSelectedOrganization) {
      // Store the attempted URL for redirecting
      localStorage.setItem('redirectUrl', state.url);
      
      // Redirect to organization selector
      this.router.navigate(['/auth/select-organization']);
      return false;
    }

    return true;
  }
}