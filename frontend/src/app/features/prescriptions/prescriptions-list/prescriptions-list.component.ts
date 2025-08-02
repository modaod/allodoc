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
    dateTo: new FormControl('')
  });
  
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
        this.dataSource.data = response.data;
        this.totalPrescriptions = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.loading = false;
      }
    });
  }

  setupFilters(): void {
    // Search filter
    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => this.applyFilters());

    // Other filters
    this.filterForm.get('status')?.valueChanges.subscribe(() => this.applyFilters());
    this.filterForm.get('dateFrom')?.valueChanges.subscribe(() => this.applyFilters());
    this.filterForm.get('dateTo')?.valueChanges.subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    const formValue = this.filterForm.value;
    const params: PrescriptionSearchParams = {
      search: formValue.search || undefined,
      status: formValue.status as PrescriptionStatus || undefined,
      dateFrom: formValue.dateFrom ? new Date(formValue.dateFrom) : undefined,
      dateTo: formValue.dateTo ? new Date(formValue.dateTo) : undefined
    };
    
    this.loadPrescriptions(params);
  }

  clearFilters(): void {
    this.filterForm.reset();
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

  getStatusClass(status: PrescriptionStatus): string {
    switch (status) {
      case PrescriptionStatus.ACTIVE:
        return 'status-active';
      case PrescriptionStatus.DISPENSED:
        return 'status-dispensed';
      case PrescriptionStatus.COMPLETED:
        return 'status-completed';
      case PrescriptionStatus.CANCELLED:
        return 'status-cancelled';
      case PrescriptionStatus.EXPIRED:
        return 'status-expired';
      case PrescriptionStatus.DRAFT:
        return 'status-draft';
      default:
        return '';
    }
  }

  getMedicationsList(prescription: Prescription): string {
    if (!prescription.medications || prescription.medications.length === 0) {
      return 'No medications';
    }
    
    if (prescription.medications.length === 1) {
      return prescription.medications[0].medicationName;
    }
    
    return `${prescription.medications[0].medicationName} +${prescription.medications.length - 1} more`;
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
