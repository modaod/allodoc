import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalPatients: number;
  todayConsultations: number;
  thisWeekConsultations: number;
  totalConsultations: number;
}

export interface ActivityItem {
  type: 'consultation' | 'patient' | 'prescription';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  time?: string; // Added for UI display
  entityId?: string; // ID of the related entity for navigation
}

export interface RecentActivity {
  activities: ActivityItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getRecentActivity(): Observable<RecentActivity> {
    return this.http.get<RecentActivity>(`${this.apiUrl}/recent-activity`);
  }
}