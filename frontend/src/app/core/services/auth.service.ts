import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PaginationStateService } from './pagination-state.service';

export interface LoginRequest {
  email: string;
  password: string;
  organizationId?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  role: string;
  lastAccessed?: Date;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    organizationId?: string;
    organizations?: Organization[];
  };
  organizations?: Organization[];
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  organizationId?: string;
  organizations?: Organization[];
  selectedOrganization?: Organization;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenExpiryTimer: any;

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private paginationState: PaginationStateService
  ) {
    // Check for existing session on service initialization
    this.loadStoredUser();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser && !!this.getAccessToken();
  }

  get hasSelectedOrganization(): boolean {
    return !!this.currentUser?.selectedOrganization;
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, registerData)
      .pipe(
        map(response => {
          // Create organizations array from user data for consistency
          if (response.user.organizationId) {
            response.organizations = [{
              id: response.user.organizationId,
              name: this.getOrganizationName(response.user.organizationId),
              role: response.user.roles?.[0] || 'USER',
              lastAccessed: new Date()
            }];
          }
          return response;
        }),
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => this.handleAuthError(error))
      );
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, loginData).pipe(
      map(response => {
        // Create organizations array from user data for consistency
        if (response.user.organizationId) {
          response.organizations = [{
            id: response.user.organizationId,
            name: this.getOrganizationName(response.user.organizationId),
            role: response.user.roles?.[0] || 'USER',
            lastAccessed: new Date()
          }];
        }
        return response;
      }),
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      return this.http.post(`${this.API_URL}/auth/logout`, { refreshToken })
        .pipe(
          tap(() => this.handleLogout()),
          catchError(() => {
            // Even if logout fails on server, clear local session
            this.handleLogout();
            return throwError('Logout failed');
          })
        );
    } else {
      this.handleLogout();
      return new Observable(observer => {
        observer.next({ message: 'Logged out locally' });
        observer.complete();
      });
    }
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.handleLogout();
      return throwError('No refresh token available');
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          this.handleLogout();
          return this.handleAuthError(error);
        })
      );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/profile`)
      .pipe(
        tap(user => this.currentUserSubject.next(user)),
        catchError(error => this.handleAuthError(error))
      );
  }

  selectOrganization(organizationId: string): Observable<AuthResponse> {
    const organization = this.currentUser?.organizations?.find(org => org.id === organizationId);
    
    if (!organization) {
      return throwError('Organization not found');
    }

    // Update selected organization locally
    const updatedUser = {
      ...this.currentUser!,
      selectedOrganization: organization,
      organizationId: organization.id,
      roles: [organization.role]
    };

    // Store selected organization
    localStorage.setItem('selectedOrganizationId', organizationId);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);

    // In a real implementation, this would call the backend
    // return this.http.post<AuthResponse>(`${this.API_URL}/auth/select-organization`, { organizationId })
    
    // For now, return a mock response
    return new Observable<AuthResponse>(observer => {
      observer.next({
        user: updatedUser,
        accessToken: this.getAccessToken() || '',
        refreshToken: this.getRefreshToken() || '',
        expiresIn: 86400
      });
      observer.complete();
    });
  }

  getUserOrganizations(): Organization[] {
    return this.currentUser?.organizations || [];
  }

  private getOrganizationName(organizationId: string): string {
    // Map organization IDs to names based on database data
    const orgNames: { [key: string]: string } = {
      '550e8400-e29b-41d4-a716-446655440001': 'Saint Mary Medical Center',
      '550e8400-e29b-41d4-a716-446655440002': 'Downtown Family Clinic',
      '550e8400-e29b-41d4-a716-446655440003': 'Pediatric Care Center'
    };
    return orgNames[organizationId] || 'Unknown Organization';
  }

  private handleAuthSuccess(response: AuthResponse): void {
    // Store tokens
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    // Process user data with organizations
    const user = response.user;
    if (response.organizations) {
      user.organizations = response.organizations;
    }
    
    // If user has single organization, auto-select it
    if (user.organizations && user.organizations.length === 1) {
      const updatedUser = {
        ...user,
        selectedOrganization: user.organizations[0],
        organizationId: user.organizations[0].id,
        roles: [user.organizations[0].role]
      };
      localStorage.setItem('selectedOrganizationId', user.organizations[0].id);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
      
      // Set token expiry timer
      this.setTokenExpiryTimer(response.expiresIn);
      return;
    }
    
    // Store user data
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    // Set token expiry timer
    this.setTokenExpiryTimer(response.expiresIn);
  }

  private handleLogout(): void {
    // Clear storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedOrganizationId');
    
    // Clear user state
    this.currentUserSubject.next(null);
    
    // Clear pagination states
    this.paginationState.clearAll();
    
    // Clear timer
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
    }
    
    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  private handleAuthError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      // Handle nested message structure from backend
      if (typeof error.error.message === 'object' && error.error.message.message) {
        errorMessage = error.error.message.message;
      } else if (typeof error.error.message === 'string') {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(errorMessage);
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    const accessToken = localStorage.getItem('accessToken');
    
    if (storedUser && accessToken) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        
        // Check if token is still valid (basic check)
        const tokenPayload = this.parseJwtPayload(accessToken);
        if (tokenPayload && tokenPayload.exp * 1000 > Date.now()) {
          // Token is still valid, set expiry timer
          const expiresIn = tokenPayload.exp * 1000 - Date.now();
          this.setTokenExpiryTimer(Math.floor(expiresIn / 1000));
        } else {
          // Token expired, try to refresh
          this.refreshToken().subscribe({
            error: () => this.handleLogout()
          });
        }
      } catch (error) {
        // Invalid stored data, clear it
        this.handleLogout();
      }
    }
  }

  private setTokenExpiryTimer(expiresInSeconds: number): void {
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
    }
    
    // Refresh token 5 minutes before expiry
    const refreshTime = Math.max(0, (expiresInSeconds - 300) * 1000);
    
    this.tokenExpiryTimer = setTimeout(() => {
      this.refreshToken().subscribe({
        error: () => this.handleLogout()
      });
    }, refreshTime);
  }

  private parseJwtPayload(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles?.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }
}