import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { Consultation, ConsultationSearchParams, ConsultationStatus, ConsultationType } from '../models/consultation.model';
import { ConsultationsService } from '../services/consultations.service';
import { PaginationStateService } from '../../../core/services/pagination-state.service';
import { DateFormatterService } from '../../../core/utils/date-formatter';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-consultations-list',
  templateUrl: './consultations-list.component.html',
  styleUrls: ['./consultations-list.component.scss']
})
export class ConsultationsListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['consultationNumber', 'patientName', 'consultationDate', 'type', 'status', 'chiefComplaint'];
  dataSource = new MatTableDataSource<Consultation>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  searchControl = new FormControl('');
  loading = false;
  totalConsultations = 0;
  
  // Pagination state
  currentPage = 0;
  pageSize = 10;

  // Enum values for template
  consultationStatuses = Object.values(ConsultationStatus);
  consultationTypes = Object.values(ConsultationType);
  
  // Advanced search controls
  filterForm = new FormGroup({
    dateFrom: new FormControl<Date | string | null>(null),
    dateTo: new FormControl<Date | string | null>(null),
    status: new FormControl(''),
    type: new FormControl(''),
    sortBy: new FormControl('consultationDate'),
    sortOrder: new FormControl<'ASC' | 'DESC'>('DESC')
  });
  
  sortOptions: any[] = [];

  private readonly STATE_KEY = 'consultations-list';

  constructor(
    private consultationsService: ConsultationsService,
    private router: Router,
    private route: ActivatedRoute,
    private paginationState: PaginationStateService,
    private translate: TranslateService,
    private dateFormatter: DateFormatterService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initialize sort options with translations
    this.initializeSortOptions();
    
    // Update sort options when language changes
    this.translate.onLangChange.subscribe(() => {
      this.initializeSortOptions();
    });
    // Try to restore saved state
    const savedState = this.paginationState.getState(this.STATE_KEY);
    let stateRestored = false;
    
    // Check for query parameters to determine which endpoint to use
    this.route.queryParams.subscribe(params => {
      const filter = params['filter'];
      
      // Only restore state if no special filter is applied
      if (!filter && !params['dateFrom'] && !params['dateTo'] && savedState && !stateRestored) {
        stateRestored = true;
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
      }
      
      if (filter === 'today') {
        // Set today's date in both from and to fields for visual feedback
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day in local timezone
        
        console.log('Today filter - Date:', {
          raw: today,
          isoString: today.toISOString(),
          localString: today.toLocaleDateString()
        });
        
        this.filterForm.patchValue({
          dateFrom: today,
          dateTo: today
        }, { emitEvent: false });
        
        // Load consultations with today's date filter and pagination
        this.applyFilters();
      } else if (filter === 'week') {
        // Calculate this week's date range (Sunday to Saturday) for visual feedback
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
        
        // Calculate Sunday
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - dayOfWeek);
        sunday.setHours(0, 0, 0, 0);
        
        // Calculate Saturday
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        saturday.setHours(0, 0, 0, 0);
        
        console.log('Week filter - Date calculation:', {
          today,
          dayOfWeek,
          sunday: sunday.toLocaleDateString(),
          saturday: saturday.toLocaleDateString()
        });
        
        this.filterForm.patchValue({
          dateFrom: sunday,
          dateTo: saturday
        }, { emitEvent: false });
        
        // Load consultations with this week's date filter and pagination
        this.applyFilters();
      } else if (params['dateFrom'] || params['dateTo']) {
        // Apply the date filters from query parameters
        this.filterForm.patchValue({
          dateFrom: params['dateFrom'] || '',
          dateTo: params['dateTo'] || ''
        }, { emitEvent: false });
        this.applyFilters();
      } else {
        // No query params, clear date filters and load all consultations
        // Clear date filters when navigating to all consultations
        if (!params['dateFrom'] && !params['dateTo']) {
          this.filterForm.patchValue({
            dateFrom: null,
            dateTo: null
          }, { emitEvent: false });
        }
        this.applyFilters();
      }
    });
    
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

  private initializeSortOptions(): void {
    this.sortOptions = [
      { value: 'consultationDate', label: this.translate.instant('consultations.fields.date') },
      { value: 'consultationNumber', label: this.translate.instant('consultations.fields.consultationNumber') },
      { value: 'createdAt', label: this.translate.instant('common.createdDate') },
      { value: 'status', label: this.translate.instant('consultations.fields.status') },
      { value: 'type', label: this.translate.instant('consultations.fields.type') }
    ];
  }

  private saveCurrentState(): void {
    const filters = this.filterForm.value;
    this.paginationState.saveState(this.STATE_KEY, {
      pageIndex: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchControl.value || undefined,
      filters: {
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        sortBy: filters.sortBy || 'consultationDate',
        sortOrder: filters.sortOrder || 'DESC'
      }
    });
  }

  loadConsultations(params?: ConsultationSearchParams): void {
    this.loading = true;
    this.consultationsService.getAllConsultations(params).subscribe({
      next: (response) => {
        console.log('Consultations list received:', response);
        this.dataSource.data = response.data || [];
        this.totalConsultations = response.meta?.total || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading consultations:', error);
        this.dataSource.data = [];
        this.totalConsultations = 0;
        this.loading = false;
      }
    });
  }

  // Removed loadTodayConsultations and loadThisWeekConsultations
  // Now using applyFilters() with date ranges for consistent pagination

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
    
    // Convert Date objects to YYYY-MM-DD strings for the API
    let startDateStr: string | undefined;
    let endDateStr: string | undefined;
    
    if (filters.dateFrom) {
      const dateFrom = filters.dateFrom instanceof Date ? filters.dateFrom : new Date(filters.dateFrom as string);
      const year = dateFrom.getFullYear();
      const month = String(dateFrom.getMonth() + 1).padStart(2, '0');
      const day = String(dateFrom.getDate()).padStart(2, '0');
      startDateStr = `${year}-${month}-${day}`;
    }
    
    if (filters.dateTo) {
      const dateTo = filters.dateTo instanceof Date ? filters.dateTo : new Date(filters.dateTo as string);
      const year = dateTo.getFullYear();
      const month = String(dateTo.getMonth() + 1).padStart(2, '0');
      const day = String(dateTo.getDate()).padStart(2, '0');
      endDateStr = `${year}-${month}-${day}`;
    }
    
    const params: ConsultationSearchParams = {
      search: this.searchControl.value || undefined,
      startDate: startDateStr,
      endDate: endDateStr,
      status: filters.status as ConsultationStatus || undefined,
      type: filters.type as ConsultationType || undefined,
      sortBy: filters.sortBy || 'consultationDate',
      sortOrder: filters.sortOrder || 'DESC',
      page: this.currentPage + 1, // API uses 1-based pagination
      limit: this.pageSize
    };
    this.loadConsultations(params);
  }
  
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }
  
  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.filterForm.reset({
      dateFrom: null,
      dateTo: null,
      status: '',
      type: '',
      sortBy: 'consultationDate',
      sortOrder: 'DESC'
    }, { emitEvent: false });
    
    // Reset pagination
    this.currentPage = 0;
    this.pageSize = 10;
    
    // Clear saved state
    this.paginationState.clearState(this.STATE_KEY);
    
    // Clear query parameters and reload with pagination
    this.router.navigate(['/consultations']);
    this.applyFilters();
  }


  viewConsultation(consultation: Consultation): void {
    this.router.navigate(['/consultations', consultation.id]);
  }

  editConsultation(consultation: Consultation): void {
    this.router.navigate(['/consultations', consultation.id, 'edit']);
  }

  newConsultation(): void {
    this.router.navigate(['/consultations', 'new']);
  }

  formatDate(date: Date | string | undefined): string {
    return this.dateFormatter.formatDate(date);
  }

  getStatusClass(status: ConsultationStatus): string {
    switch (status) {
      case ConsultationStatus.COMPLETED:
        return 'status-completed';
      case ConsultationStatus.IN_PROGRESS:
        return 'status-in-progress';
      case ConsultationStatus.SCHEDULED:
        return 'status-scheduled';
      case ConsultationStatus.CANCELLED:
        return 'status-cancelled';
      case ConsultationStatus.NO_SHOW:
        return 'status-no-show';
      default:
        return '';
    }
  }

  getTypeClass(type: ConsultationType): string {
    switch (type) {
      case ConsultationType.EMERGENCY:
        return 'type-emergency';
      case ConsultationType.INITIAL:
        return 'type-initial';
      case ConsultationType.FOLLOW_UP:
        return 'type-follow-up';
      case ConsultationType.ROUTINE_CHECKUP:
        return 'type-routine';
      case ConsultationType.SPECIALIST:
        return 'type-specialist';
      case ConsultationType.TELEMEDICINE:
        return 'type-telemedicine';
      default:
        return '';
    }
  }
  
  formatEnumValue(value: string): string {
    return value.replace(/_/g, ' ');
  }

  canCreateConsultation(): boolean {
    return this.authService.hasAnyRole(['DOCTOR', 'ADMIN', 'SUPER_ADMIN']);
  }
}
