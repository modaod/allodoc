import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  isActive: boolean;
  specialty?: string; // For doctors
}

export interface UsersResponse {
  data: User[];
  total: number;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(params?: any): Observable<UsersResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<UsersResponse>(this.apiUrl, { params: httpParams });
  }

  getDoctors(): Observable<User[]> {
    // Filter users by DOCTOR role
    const params = new HttpParams().set('role', 'DOCTOR');
    
    return this.http.get<UsersResponse>(this.apiUrl, { params }).pipe(
      map(response => response.data || [])
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }
}