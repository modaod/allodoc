import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, User } from '../../core/services/auth.service';
import { DashboardService, DashboardStats, ActivityItem } from '../../core/services/dashboard.service';
import { NotificationService } from '../../core/services/notification.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = true;
  private destroy$ = new Subject<void>();
  
  statistics: DashboardStats = {
    totalPatients: 0,
    todayConsultations: 0,
    thisWeekConsultations: 0,
    totalConsultations: 0
  };

  recentActivities: ActivityItem[] = [];
  private originalActivities: ActivityItem[] = []; // Store original activity data

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadDashboardData();
        }
      });
    
    // Reload data when organization changes
    this.authService.organizationChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Organization changed, reloading dashboard data...');
        this.loadDashboardData();
      });
    
    // Subscribe to language changes and update activity titles
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.originalActivities.length > 0) {
          this.updateActivityTitles();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        // Store original activities for re-translation on language change
        this.originalActivities = activity.activities;
        this.updateActivityTitles();
      }
      this.loading = false;
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      this.loading = false;
    });
  }

  private updateActivityTitles(): void {
    this.recentActivities = this.originalActivities.map(item => {
      // Extract patient name from the original title if it exists
      let title = item.title;
      const patientNameMatch = item.title.match(/(?:with|for|:)\s+(.+)$/);
      const patientName = patientNameMatch ? patientNameMatch[1] : '';
      
      if (item.type === 'consultation' && patientName) {
        title = this.translate.instant('dashboard.activities.consultation') + ' ' + patientName;
      } else if (item.type === 'patient') {
        title = this.translate.instant('dashboard.activities.patientRegistered') + (patientName ? ': ' + patientName : '');
      } else if (item.type === 'prescription' && patientName) {
        title = this.translate.instant('dashboard.activities.prescription') + ' ' + patientName;
      }
      
      return {
        ...item,
        title,
        time: this.formatTimeAgo(new Date(item.timestamp))
      };
    });
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      const key = diffInMinutes === 1 ? 'dates.minuteAgo' : 'dates.minutesAgo';
      return this.translate.instant(key, { count: diffInMinutes });
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      const key = diffInHours === 1 ? 'dates.hourAgo' : 'dates.hoursAgo';
      return this.translate.instant(key, { count: diffInHours });
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    const key = diffInDays === 1 ? 'dates.dayAgo' : 'dates.daysAgo';
    return this.translate.instant(key, { count: diffInDays });
  }

  navigateToPatients(): void {
    this.router.navigate(['/patients']);
  }

  navigateToConsultations(): void {
    // Explicitly clear query params when navigating to all consultations
    this.router.navigate(['/consultations'], {
      queryParams: {}
    });
  }
  
  navigateToTodayConsultations(): void {
    this.router.navigate(['/consultations'], {
      queryParams: { filter: 'today' }
    });
  }
  
  navigateToWeekConsultations(): void {
    this.router.navigate(['/consultations'], {
      queryParams: { filter: 'week' }
    });
  }
  
  navigateToAllConsultations(): void {
    // Navigate without any filters for total consultations
    // Explicitly clear query params to ensure filters are removed
    this.router.navigate(['/consultations'], {
      queryParams: {}
    });
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

  scheduleAppointment(): void {
    this.notificationService.showInfo(this.translate.instant('common.appointmentComingSoon'));
  }

  navigateToActivity(activity: ActivityItem): void {
    if (!activity.entityId) {
      console.warn('Activity item has no entityId:', activity);
      return;
    }

    switch (activity.type) {
      case 'consultation':
        this.router.navigate(['/consultations', activity.entityId]);
        break;
      case 'patient':
        this.router.navigate(['/patients', activity.entityId]);
        break;
      case 'prescription':
        this.router.navigate(['/prescriptions', activity.entityId]);
        break;
      default:
        console.warn('Unknown activity type:', activity.type);
    }
  }
}