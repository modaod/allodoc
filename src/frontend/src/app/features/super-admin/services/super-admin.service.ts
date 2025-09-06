import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SystemStats, OrganizationWithStats } from '../models/system-stats.model';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  organization: {
    id: string;
    name: string;
  };
  organizationId: string;
  roles: any[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignRoleDto {
  roles: string[];
}

export interface MoveUserDto {
  organizationId: string;
}

export interface CreateOrganizationDto {
  name: string;
  type: 'CLINIC' | 'HOSPITAL' | 'MEDICAL_CENTER';
  address: string;
  phone?: string;
  email?: string;
  registrationNumber?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private apiUrl = `${environment.apiUrl}/super-admin`;

  constructor(private http: HttpClient) {}

  // System Statistics
  getSystemStats(): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.apiUrl}/system-stats`);
  }

  // User Management
  getAllUsers(page = 1, limit = 10, search?: string): Observable<PaginatedResponse<SystemUser>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<SystemUser>>(`${this.apiUrl}/users`, { params });
  }

  createUser(userData: any): Observable<SystemUser> {
    return this.http.post<SystemUser>(`${this.apiUrl}/users`, userData);
  }

  assignRoles(userId: string, roles: string[]): Observable<SystemUser> {
    return this.http.post<SystemUser>(`${this.apiUrl}/users/${userId}/roles`, { roles });
  }

  moveUserToOrganization(userId: string, organizationId: string): Observable<SystemUser> {
    return this.http.post<SystemUser>(`${this.apiUrl}/users/${userId}/move-organization`, { 
      organizationId 
    });
  }

  // Organization Management
  getAllOrganizations(page = 1, limit = 10, search?: string): Observable<PaginatedResponse<OrganizationWithStats>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<OrganizationWithStats>>(`${this.apiUrl}/organizations`, { params });
  }

  createOrganization(organizationData: CreateOrganizationDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/organizations`, organizationData);
  }

  updateOrganization(organizationId: string, organizationData: Partial<CreateOrganizationDto>): Observable<any> {
    return this.http.put(`${this.apiUrl}/organizations/${organizationId}`, organizationData);
  }

  deleteOrganization(organizationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/organizations/${organizationId}`);
  }

  // Patient Management
  getAllPatients(page = 1, limit = 10, search?: string): Observable<PaginatedResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/patients`, { params });
  }

  // Additional User Management Methods
  updateUser(userId: string, userData: any): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.apiUrl}/users/${userId}`, userData);
  }

  toggleUserStatus(userId: string): Observable<SystemUser> {
    // Uses PATCH endpoint to toggle user status
    return this.http.patch<SystemUser>(`${this.apiUrl}/users/${userId}/toggle-status`, {});
  }

  deleteUser(userId: string): Observable<void> {
    // Soft delete - deactivates the user
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }
}