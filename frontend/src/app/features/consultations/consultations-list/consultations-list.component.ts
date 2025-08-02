import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
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

  constructor(
    private consultationsService: ConsultationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConsultations();
    this.setupSearch();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadConsultations(params?: ConsultationSearchParams): void {
    this.loading = true;
    this.consultationsService.getAllConsultations(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalConsultations = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading consultations:', error);
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
        this.loadConsultations({ search: searchTerm || undefined });
      });
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
}
