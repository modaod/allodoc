import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConsultations();
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
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
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
    this.searchControl.setValue('');
    this.filterForm.reset({
      sortBy: 'consultationDate',
      sortOrder: 'DESC'
    });
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
