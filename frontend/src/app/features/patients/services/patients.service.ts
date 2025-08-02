import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Patient, CreatePatientRequest, UpdatePatientRequest, PatientSearchParams, PatientsResponse } from '../models/patient.model';
import { environment } from '../../../../environments/environment';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class PatientsService {
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) { }

  getAllPatients(params?: PatientSearchParams): Observable<PatientsResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof PatientSearchParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<PatientsResponse>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }

  createPatient(patient: CreatePatientRequest): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patient)
      .pipe(
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }

  updatePatient(id: string, patient: UpdatePatientRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient)
      .pipe(
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }

  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }

  searchPatients(searchTerm: string): Observable<Patient[]> {
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<Patient[]>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }
}