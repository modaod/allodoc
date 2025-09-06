import { Component, OnInit } from '@angular/core';
import { SuperAdminService } from '../services/super-admin.service';
import { SystemStats } from '../models/system-stats.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-super-admin-dashboard',
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.scss']
})
export class SuperAdminDashboardComponent implements OnInit {
  systemStats: SystemStats | null = null;
  loading = true;
  
  // For charts
  roleChartData: any[] = [];
  orgChartData: any[] = [];

  constructor(
    private superAdminService: SuperAdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSystemStats();
  }

  loadSystemStats(): void {
    this.loading = true;
    this.superAdminService.getSystemStats().subscribe({
      next: (stats) => {
        this.systemStats = stats;
        this.prepareChartData(stats);
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load system stats:', error);
        this.notificationService.showError('Failed to load system statistics');
        this.loading = false;
      }
    });
  }

  prepareChartData(stats: SystemStats): void {
    // Prepare role distribution data
    if (stats.usersByRole) {
      this.roleChartData = Object.entries(stats.usersByRole).map(([role, count]) => ({
        name: this.formatRoleName(role),
        value: count
      }));
    }

    // Prepare organization data
    if (stats.topOrganizations) {
      this.orgChartData = stats.topOrganizations.map(org => ({
        name: org.name,
        users: org.userCount,
        patients: org.patientCount
      }));
    }
  }

  formatRoleName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN': 'Admin',
      'DOCTOR': 'Doctor',
      'SECRETARY': 'Secretary',
      'NURSE': 'Nurse'
    };
    return roleMap[role] || role;
  }

  getCardIcon(type: string): string {
    const icons: { [key: string]: string } = {
      organizations: 'business',
      users: 'people',
      patients: 'personal_injury',
      consultations: 'medical_services',
      prescriptions: 'medication',
      appointments: 'event'
    };
    return icons[type] || 'info';
  }

  getCardColor(type: string): string {
    const colors: { [key: string]: string } = {
      organizations: 'primary',
      users: 'accent',
      patients: 'warn',
      consultations: 'primary',
      prescriptions: 'accent',
      appointments: 'warn'
    };
    return colors[type] || 'primary';
  }
}