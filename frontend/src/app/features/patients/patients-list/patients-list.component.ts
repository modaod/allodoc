import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Patient, PatientSearchParams } from '../models/patient.model';
import { PatientsService } from '../services/patients.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-patients-list',
  templateUrl: './patients-list.component.html',
  styleUrls: ['./patients-list.component.scss']
})
export class PatientsListComponent implements OnInit {
  displayedColumns: string[] = ['patientNumber', 'name', 'dateOfBirth', 'gender', 'phone', 'lastVisit', 'actions'];
  dataSource = new MatTableDataSource<Patient>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  searchControl = new FormControl('');
  loading = false;
  totalPatients = 0;

  constructor(
    private patientsService: PatientsService,
    private router: Router,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
    this.setupSearch();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
          this.totalPatients = response.total || response.data.length;
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
        this.loadPatients({ search: searchTerm || undefined });
      });
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

  deletePatient(patient: Patient): void {
    if (confirm(`Are you sure you want to delete patient ${patient.firstName} ${patient.lastName}?`)) {
      this.patientsService.deletePatient(patient.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(`Patient ${patient.firstName} ${patient.lastName} has been deleted successfully.`);
          this.loadPatients();
        },
        error: (error) => {
          const errorMessage = this.errorHandler.getErrorMessage(error);
          this.notificationService.showError(`Failed to delete patient: ${errorMessage}`);
        }
      });
    }
  }

  getPatientFullName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }
}
