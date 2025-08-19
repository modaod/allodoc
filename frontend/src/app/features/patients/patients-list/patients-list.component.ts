import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Patient, PatientSearchParams } from '../models/patient.model';
import { PatientsService } from '../services/patients.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PaginationStateService } from '../../../core/services/pagination-state.service';

@Component({
  selector: 'app-patients-list',
  templateUrl: './patients-list.component.html',
  styleUrls: ['./patients-list.component.scss']
})
export class PatientsListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['patientNumber', 'name', 'dateOfBirth', 'gender', 'phone', 'lastVisit'];
  dataSource = new MatTableDataSource<Patient>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  searchControl = new FormControl('');
  loading = false;
  totalPatients = 0;
  
  // Pagination state
  currentPage = 0;
  pageSize = 10;
  
  // Advanced search controls
  filterForm = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    sortBy: new FormControl('lastName'),
    sortOrder: new FormControl<'ASC' | 'DESC'>('ASC')
  });
  
  sortOptions = [
    { value: 'lastName', label: 'Last Name' },
    { value: 'firstName', label: 'First Name' },
    { value: 'createdAt', label: 'Registration Date' },
    { value: 'lastVisit', label: 'Last Visit' },
    { value: 'patientNumber', label: 'Patient Number' }
  ];

  private readonly STATE_KEY = 'patients-list';

  constructor(
    private patientsService: PatientsService,
    private router: Router,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private paginationState: PaginationStateService
  ) {}

  ngOnInit(): void {
    // Try to restore saved state
    const savedState = this.paginationState.getState(this.STATE_KEY);
    
    if (savedState) {
      // Restore pagination settings
      this.currentPage = savedState.pageIndex;
      this.pageSize = savedState.pageSize;
      
      // Restore search and filters
      if (savedState.search !== undefined) {
        this.searchControl.setValue(savedState.search, { emitEvent: false });
      }
      
      if (savedState.filters) {
        this.filterForm.patchValue(savedState.filters, { emitEvent: false });
      }
      
      // Load with restored state
      // Convert saved dates to ISO if they exist
      let startDateISO: string | undefined;
      let endDateISO: string | undefined;
      
      if (savedState.filters?.startDate) {
        const startDate = new Date(savedState.filters.startDate);
        startDateISO = startDate.toISOString();
      }
      
      if (savedState.filters?.endDate) {
        const endDate = new Date(savedState.filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        endDateISO = endDate.toISOString();
      }
      
      const params: PatientSearchParams = {
        page: this.currentPage + 1,
        limit: this.pageSize,
        search: savedState.search || undefined,
        startDate: startDateISO,
        endDate: endDateISO,
        sortBy: savedState.filters?.sortBy || 'lastName',
        sortOrder: savedState.filters?.sortOrder || 'ASC'
      };
      this.loadPatients(params);
    } else {
      // Load patients with initial pagination parameters
      const initialParams: PatientSearchParams = {
        page: 1,
        limit: this.pageSize,
        sortBy: 'lastName',
        sortOrder: 'ASC'
      };
      this.loadPatients(initialParams);
    }
    
    this.setupSearch();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    // Remove client-side pagination - we're using server-side
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    // Save current state before navigating away
    this.saveCurrentState();
  }

  private saveCurrentState(): void {
    const filters = this.filterForm.value;
    this.paginationState.saveState(this.STATE_KEY, {
      pageIndex: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchControl.value || undefined,
      filters: {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        sortBy: filters.sortBy || 'lastName',
        sortOrder: filters.sortOrder || 'ASC'
      }
    });
  }

  loadPatients(params?: PatientSearchParams): void {
    this.loading = true;
    this.patientsService.getAllPatients(params).subscribe({
      next: (response) => {
        console.log('Patients response:', response);
        // Handle both direct array and paginated response formats
        if (Array.isArray(response)) {
          this.dataSource.data = response;
          this.totalPatients = response.length;
        } else if (response && response.data) {
          this.dataSource.data = response.data;
          this.totalPatients = response.meta?.total || response.data.length;
        } else {
          this.dataSource.data = [];
          this.totalPatients = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.loading = false;
        this.dataSource.data = [];
        const errorMessage = this.errorHandler.getErrorMessage(error);
        this.notificationService.showError(`Failed to load patients: ${errorMessage}`);
      }
    });
  }

  setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.applyFilters();
      });
  }
  
  setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }
  
  applyFilters(): void {
    const filters = this.filterForm.value;
    
    // Convert Date objects to ISO 8601 strings
    let startDateISO: string | undefined;
    let endDateISO: string | undefined;
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDateISO = startDate.toISOString();
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      // Set to end of day for the end date
      endDate.setHours(23, 59, 59, 999);
      endDateISO = endDate.toISOString();
    }
    
    const params: PatientSearchParams = {
      search: this.searchControl.value || undefined,
      startDate: startDateISO,
      endDate: endDateISO,
      sortBy: filters.sortBy || 'lastName',
      sortOrder: filters.sortOrder || 'ASC',
      page: this.currentPage + 1, // API uses 1-based pagination
      limit: this.pageSize
    };
    this.loadPatients(params);
  }
  
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }
  
  clearFilters(): void {
    this.searchControl.setValue('');
    this.filterForm.reset({
      sortBy: 'lastName',
      sortOrder: 'ASC'
    });
    // Reset pagination
    this.currentPage = 0;
    this.pageSize = 10;
    // Clear saved state
    this.paginationState.clearState(this.STATE_KEY);
    // Load with reset pagination parameters
    const params: PatientSearchParams = {
      page: 1,
      limit: this.pageSize,
      sortBy: 'lastName',
      sortOrder: 'ASC'
    };
    this.loadPatients(params);
  }

  viewPatient(patient: Patient): void {
    console.log('Attempting to view patient:', patient);
    
    if (!patient.id) {
      console.error('Patient ID is missing:', patient);
      this.notificationService.showError('Cannot view patient: Patient ID is missing.');
      return;
    }
    
    console.log('Navigating to patient:', patient.id);
    this.router.navigate(['/patients', patient.id]).then(
      (navigationSuccessful) => {
        if (navigationSuccessful) {
          console.log('Navigation successful to patient:', patient.id);
        } else {
          console.error('Navigation failed to patient:', patient.id);
          this.notificationService.showError('Failed to navigate to patient details.');
        }
      }
    ).catch(error => {
      console.error('Navigation error:', error);
      this.notificationService.showError('Error navigating to patient details.');
    });
  }

  editPatient(patient: Patient): void {
    this.router.navigate(['/patients', patient.id, 'edit']);
  }

  addPatient(): void {
    this.router.navigate(['/patients', 'new']);
  }

  getPatientFullName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }
}
