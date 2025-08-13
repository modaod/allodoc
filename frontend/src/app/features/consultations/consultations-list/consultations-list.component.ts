import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Consultation, ConsultationSearchParams, ConsultationStatus, ConsultationType } from '../models/consultation.model';
import { ConsultationsService } from '../services/consultations.service';

@Component({
  selector: 'app-consultations-list',
  templateUrl: './consultations-list.component.html',
  styleUrls: ['./consultations-list.component.scss']
})
export class ConsultationsListComponent implements OnInit {
  displayedColumns: string[] = ['consultationNumber', 'patientName', 'consultationDate', 'type', 'status', 'chiefComplaint', 'actions'];
  dataSource = new MatTableDataSource<Consultation>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  searchControl = new FormControl('');
  loading = false;
  totalConsultations = 0;

  // Enum values for template
  consultationStatuses = Object.values(ConsultationStatus);
  consultationTypes = Object.values(ConsultationType);
  
  // Advanced search controls
  filterForm = new FormGroup({
    dateFrom: new FormControl(''),
    dateTo: new FormControl(''),
    status: new FormControl(''),
    type: new FormControl(''),
    sortBy: new FormControl('consultationDate'),
    sortOrder: new FormControl<'ASC' | 'DESC'>('DESC')
  });
  
  sortOptions = [
    { value: 'consultationDate', label: 'Consultation Date' },
    { value: 'consultationNumber', label: 'Consultation Number' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'status', label: 'Status' },
    { value: 'type', label: 'Type' }
  ];

  constructor(
    private consultationsService: ConsultationsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for query parameters to determine which endpoint to use
    this.route.queryParams.subscribe(params => {
      const filter = params['filter'];
      
      if (filter === 'today') {
        // Set today's date in both from and to fields for visual feedback
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        console.log('Today filter - Date calculation:', {
          raw: today,
          year,
          month,
          day,
          todayStr
        });
        
        this.filterForm.patchValue({
          dateFrom: todayStr,
          dateTo: todayStr
        }, { emitEvent: false });
        
        // Use the special endpoint for today's consultations
        this.loadTodayConsultations();
      } else if (filter === 'week') {
        // Calculate this week's date range (Sunday to Saturday) for visual feedback
        const today = new Date();
        const dayOfWeek = today.getDay();
        
        // Calculate Sunday
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - dayOfWeek);
        const sundayYear = sunday.getFullYear();
        const sundayMonth = String(sunday.getMonth() + 1).padStart(2, '0');
        const sundayDay = String(sunday.getDate()).padStart(2, '0');
        const sundayStr = `${sundayYear}-${sundayMonth}-${sundayDay}`;
        
        // Calculate Saturday
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        const saturdayYear = saturday.getFullYear();
        const saturdayMonth = String(saturday.getMonth() + 1).padStart(2, '0');
        const saturdayDay = String(saturday.getDate()).padStart(2, '0');
        const saturdayStr = `${saturdayYear}-${saturdayMonth}-${saturdayDay}`;
        
        console.log('Week filter - Date calculation:', {
          today,
          dayOfWeek,
          sunday,
          sundayStr,
          saturday,
          saturdayStr
        });
        
        this.filterForm.patchValue({
          dateFrom: sundayStr,
          dateTo: saturdayStr
        }, { emitEvent: false });
        
        // Use the special endpoint for this week's consultations
        this.loadThisWeekConsultations();
      } else if (params['dateFrom'] || params['dateTo']) {
        // Apply the date filters from query parameters
        this.filterForm.patchValue({
          dateFrom: params['dateFrom'] || '',
          dateTo: params['dateTo'] || ''
        }, { emitEvent: false });
        this.applyFilters();
      } else {
        // No query params, load all consultations
        this.loadConsultations();
      }
    });
    
    this.setupSearch();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadConsultations(params?: ConsultationSearchParams): void {
    this.loading = true;
    this.consultationsService.getAllConsultations(params).subscribe({
      next: (response) => {
        console.log('Consultations list received:', response);
        this.dataSource.data = response.data || [];
        this.totalConsultations = response.total || 0;
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

  loadTodayConsultations(): void {
    this.loading = true;
    this.consultationsService.getTodayConsultations().subscribe({
      next: (consultations) => {
        console.log('Today consultations received:', consultations);
        this.dataSource.data = consultations || [];
        this.totalConsultations = consultations?.length || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading today consultations:', error);
        this.dataSource.data = [];
        this.totalConsultations = 0;
        this.loading = false;
      }
    });
  }

  loadThisWeekConsultations(): void {
    this.loading = true;
    this.consultationsService.getThisWeekConsultations().subscribe({
      next: (consultations) => {
        console.log('This week consultations received:', consultations);
        this.dataSource.data = consultations || [];
        this.totalConsultations = consultations?.length || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading week consultations:', error);
        this.dataSource.data = [];
        this.totalConsultations = 0;
        this.loading = false;
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
    const params: ConsultationSearchParams = {
      search: this.searchControl.value || undefined,
      startDate: filters.dateFrom || undefined,
      endDate: filters.dateTo || undefined,
      status: filters.status as ConsultationStatus || undefined,
      type: filters.type as ConsultationType || undefined,
      sortBy: filters.sortBy || 'consultationDate',
      sortOrder: filters.sortOrder || 'DESC',
      page: 1,
      limit: 10
    };
    this.loadConsultations(params);
  }
  
  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.filterForm.reset({
      dateFrom: '',
      dateTo: '',
      status: '',
      type: '',
      sortBy: 'consultationDate',
      sortOrder: 'DESC'
    }, { emitEvent: false });
    
    // Clear query parameters and reload
    this.router.navigate(['/consultations']);
    this.loadConsultations();
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

  formatDate(date: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
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
}
