import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../core/services/auth.service';
import { DashboardService, DashboardStats, ActivityItem } from '../../core/services/dashboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;
  
  statistics: DashboardStats = {
    totalPatients: 0,
    todayConsultations: 0,
    thisWeekConsultations: 0,
    totalConsultations: 0
  };

  recentActivities: ActivityItem[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadDashboardData();
      }
    });
  }

  private loadDashboardData(): void {
    this.loading = true;
    
    // Load statistics and recent activity in parallel
    Promise.all([
      this.dashboardService.getDashboardStats().toPromise(),
      this.dashboardService.getRecentActivity().toPromise()
    ]).then(([stats, activity]) => {
      if (stats) {
        this.statistics = stats;
      }
      if (activity) {
        this.recentActivities = activity.activities.map(item => ({
          ...item,
          time: this.formatTimeAgo(new Date(item.timestamp))
        }));
      }
      this.loading = false;
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      this.loading = false;
    });
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  navigateToPatients(): void {
    this.router.navigate(['/patients']);
  }

  navigateToConsultations(): void {
    this.router.navigate(['/consultations']);
  }

  navigateToPrescriptions(): void {
    this.router.navigate(['/prescriptions']);
  }

  addNewPatient(): void {
    this.router.navigate(['/patients/new']);
  }

  newConsultation(): void {
    this.router.navigate(['/consultations/new']);
  }

  quickPrescription(): void {
    this.router.navigate(['/prescriptions/new']);
  }
}