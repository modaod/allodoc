import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { 
  Prescription, 
  PrescriptionSearchParams, 
  PrescriptionStatus 
} from '../models/prescription.model';
import { PrescriptionsService } from '../services/prescriptions.service';

@Component({
  selector: 'app-prescriptions-list',
  templateUrl: './prescriptions-list.component.html',
  styleUrls: ['./prescriptions-list.component.scss']
})
export class PrescriptionsListComponent implements OnInit {
  displayedColumns: string[] = ['prescriptionNumber', 'patientName', 'prescriptionDate', 'status', 'medications', 'validUntil', 'actions'];
  dataSource = new MatTableDataSource<Prescription>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Reactive Forms for filtering
  filterForm = new FormGroup({
    search: new FormControl(''),
    status: new FormControl(''),
    dateFrom: new FormControl(''),
    dateTo: new FormControl(''),
    sortBy: new FormControl('prescribedDate'),
    sortOrder: new FormControl<'ASC' | 'DESC'>('DESC')
  });
  
  sortOptions = [
    { value: 'prescribedDate', label: 'Prescription Date' },
    { value: 'prescriptionNumber', label: 'Prescription Number' },
    { value: 'status', label: 'Status' },
    { value: 'validUntil', label: 'Valid Until' },
    { value: 'createdAt', label: 'Created Date' }
  ];
  
  loading = false;
  totalPrescriptions = 0;

  // Enum values for template
  prescriptionStatuses = Object.values(PrescriptionStatus);

  constructor(
    private prescriptionsService: PrescriptionsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPrescriptions();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPrescriptions(params?: PrescriptionSearchParams): void {
    this.loading = true;
    this.prescriptionsService.getAllPrescriptions(params).subscribe({
      next: (response) => {
        console.log('Prescriptions list received:', response);
        // Debug: Check statuses
        if (response.data) {
          console.log('All prescription statuses:', response.data.map((p: any) => ({
            number: p.prescriptionNumber,
            status: p.status,
            statusType: typeof p.status,
            class: this.getStatusClass(p.status)
          })));
        }
        this.dataSource.data = response.data || [];
        this.totalPrescriptions = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.dataSource.data = [];
        this.totalPrescriptions = 0;
        this.loading = false;
      }
    });
  }

  setupFilters(): void {
    // All filters with debounce
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    const formValue = this.filterForm.value;
    const params: PrescriptionSearchParams = {
      search: formValue.search || undefined,
      status: formValue.status as PrescriptionStatus || undefined,
      dateFrom: formValue.dateFrom ? new Date(formValue.dateFrom) : undefined,
      dateTo: formValue.dateTo ? new Date(formValue.dateTo) : undefined,
      sortBy: formValue.sortBy || 'prescribedDate',
      sortOrder: formValue.sortOrder || 'DESC',
      page: 1,
      limit: 10
    };
    
    this.loadPrescriptions(params);
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'prescribedDate',
      sortOrder: 'DESC'
    });
    this.loadPrescriptions();
  }

  viewPrescription(prescription: Prescription): void {
    this.router.navigate(['/prescriptions', prescription.id]);
  }

  editPrescription(prescription: Prescription): void {
    this.router.navigate(['/prescriptions', prescription.id, 'edit']);
  }

  addPrescription(): void {
    this.router.navigate(['/prescriptions', 'new']);
  }

  deletePrescription(prescription: Prescription): void {
    if (confirm(`Are you sure you want to delete prescription ${prescription.prescriptionNumber}?`)) {
      this.prescriptionsService.deletePrescription(prescription.id!).subscribe({
        next: () => {
          this.loadPrescriptions();
        },
        error: (error) => {
          console.error('Error deleting prescription:', error);
        }
      });
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(status: any): string {
    if (!status) return '';
    
    // Convert to string and handle both enum and string values
    const statusStr = String(status).toUpperCase().trim();
    
    switch (statusStr) {
      case 'ACTIVE':
        return 'status-active';
      case 'EXPIRING_SOON':
        return 'status-expiring-soon';
      case 'DISPENSED':
        return 'status-dispensed';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'EXPIRED':
        return 'status-expired';
      case 'DRAFT':
        return 'status-draft';
      default:
        return '';
    }
  }

  getStatusStyle(status: any): any {
    if (!status) return {};
    
    const statusStr = String(status).toUpperCase().trim();
    
    // Debug log for EXPIRING_SOON
    if (statusStr === 'EXPIRING_SOON') {
      console.log('Applying EXPIRING_SOON style for status:', status);
    }
    
    switch (statusStr) {
      case 'ACTIVE':
        return {
          'background-color': '#e8f5e8',
          'color': '#2e7d32',
          'padding': '4px 8px',
          'border-radius': '12px',
          'font-size': '12px',
          'font-weight': '500',
          'text-align': 'center',
          'display': 'inline-block',
          'min-width': '80px'
        };
      case 'EXPIRING_SOON':
        return {
          'background-color': '#fff3e0',
          'color': '#ff6f00',
          'padding': '4px 8px',
          'border-radius': '12px',
          'font-size': '12px',
          'font-weight': '500',
          'text-align': 'center',
          'display': 'inline-block',
          'min-width': '80px'
        };
      case 'DISPENSED':
        return {
          'background-color': '#e3f2fd',
          'color': '#1976d2',
          'padding': '4px 8px',
          'border-radius': '12px',
          'font-size': '12px',
          'font-weight': '500',
          'text-align': 'center',
          'display': 'inline-block',
          'min-width': '80px'
        };
      case 'COMPLETED':
        return {
          'background-color': '#f3e5f5',
          'color': '#7b1fa2',
          'padding': '4px 8px',
          'border-radius': '12px',
          'font-size': '12px',
          'font-weight': '500',
          'text-align': 'center',
          'display': 'inline-block',
          'min-width': '80px'
        };
      case 'EXPIRED':
        return {
          'background-color': '#f5f5f5',
          'color': '#666',
          'padding': '4px 8px',
          'border-radius': '12px',
          'font-size': '12px',
          'font-weight': '500',
          'text-align': 'center',
          'display': 'inline-block',
          'min-width': '80px'
        };
      case 'CANCELLED':
        return {
          'background-color': '#ffebee',
          'color': '#d32f2f',
          'padding': '4px 8px',
          'border-radius': '12px',
          'font-size': '12px',
          'font-weight': '500',
          'text-align': 'center',
          'display': 'inline-block',
          'min-width': '80px'
        };
      case 'DRAFT':
        return {
          'background-color': '#fff3e0',
          'color': '#f57c00',
          'padding': '4px 8px',
          'border-radius': '12px',
          'font-size': '12px',
          'font-weight': '500',
          'text-align': 'center',
          'display': 'inline-block',
          'min-width': '80px'
        };
      default:
        return {
          'padding': '4px 8px',
          'border-radius': '12px',
          'font-size': '12px',
          'font-weight': '500',
          'text-align': 'center',
          'display': 'inline-block',
          'min-width': '80px'
        };
    }
  }

  getMedicationsList(prescription: Prescription): string {
    if (!prescription.medications || prescription.medications.length === 0) {
      return 'No medications';
    }
    
    if (prescription.medications.length === 1) {
      return (prescription.medications[0] as any).name || (prescription.medications[0] as any).medicationName;
    }
    
    return `${(prescription.medications[0] as any).name || (prescription.medications[0] as any).medicationName} +${prescription.medications.length - 1} more`;
  }

  getMedicationsCount(prescription: Prescription): number {
    return prescription.medications?.length || 0;
  }

  isExpiringSoon(validUntil: Date | undefined): boolean {
    if (!validUntil) return false;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }

  isExpired(validUntil: Date | undefined): boolean {
    if (!validUntil) return false;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    return expiryDate < today;
  }
}
