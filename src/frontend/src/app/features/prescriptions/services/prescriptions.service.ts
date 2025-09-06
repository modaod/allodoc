import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Prescription, 
  CreatePrescriptionRequest, 
  UpdatePrescriptionRequest, 
  PrescriptionSearchParams, 
  PrescriptionsResponse,
  MedicationTemplate,
  MedicationSearchParams,
  MedicationTemplatesResponse
} from '../models/prescription.model';
import { environment } from '../../../../environments/environment';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionsService {
  private readonly apiUrl = `${environment.apiUrl}/prescriptions`;
  private readonly medicationsApiUrl = `${environment.apiUrl}/medications`;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) { }

  getAllPrescriptions(params?: PrescriptionSearchParams): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof PrescriptionSearchParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<any>(this.apiUrl, { params: httpParams })
      .pipe(
        map(response => {
          console.log('Prescriptions getAllPrescriptions response:', response);
          // Handle different response formats
          if (Array.isArray(response)) {
            // If backend returns direct array, wrap it in expected format
            return { data: response, total: response.length };
          } else if (response && response.data) {
            // If backend returns paginated format, use as is
            return response;
          } else {
            // Fallback
            return { data: [], total: 0 };
          }
        }),
        catchError(error => {
          console.error('Error fetching prescriptions:', error);
          // Return empty response structure on error
          return of({ data: [], total: 0 });
        })
      );
  }

  getPrescriptionById(id: string): Observable<Prescription> {
    console.log(`Fetching prescription from: ${this.apiUrl}/${id}`);
    return this.http.get<Prescription>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          console.log('Prescription by ID response:', response);
          return response;
        }),
        catchError(error => {
          console.error('Error fetching prescription by ID:', error);
          return this.errorHandler.handleError(error);
        })
      );
  }

  createPrescription(prescription: CreatePrescriptionRequest): Observable<Prescription> {
    return this.http.post<Prescription>(this.apiUrl, prescription)
      .pipe(
        catchError(error => {
          console.error('Error creating prescription:', error);
          throw error;
        })
      );
  }

  updatePrescription(id: string, prescription: UpdatePrescriptionRequest): Observable<Prescription> {
    return this.http.put<Prescription>(`${this.apiUrl}/${id}`, prescription)
      .pipe(
        catchError(error => {
          console.error('Error updating prescription:', error);
          throw error;
        })
      );
  }

  deletePrescription(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting prescription:', error);
          throw error;
        })
      );
  }

  getPrescriptionsByPatient(patientId: string): Observable<Prescription[]> {
    // Use the correct endpoint - no extra params needed
    return this.http.get<Prescription[]>(`${this.apiUrl}/patient/${patientId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching prescriptions by patient:', error);
          // Return empty array on error to prevent timeline from breaking
          return of([]);
        })
      );
  }

  getPrescriptionsByConsultation(consultationId: string): Observable<Prescription[]> {
    const params = new HttpParams().set('consultationId', consultationId);
    return this.http.get<Prescription[]>(`${this.apiUrl}/consultation/${consultationId}`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching prescriptions by consultation:', error);
          throw error;
        })
      );
  }

  searchMedications(params: MedicationSearchParams): Observable<MedicationTemplatesResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof MedicationSearchParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<MedicationTemplatesResponse>(`${this.medicationsApiUrl}/search`, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Error searching medications:', error);
          throw error;
        })
      );
  }

  getMedicationTemplates(): Observable<MedicationTemplate[]> {
    return this.http.get<MedicationTemplate[]>(`${this.medicationsApiUrl}/templates`)
      .pipe(
        catchError(error => {
          console.error('Error fetching medication templates:', error);
          throw error;
        })
      );
  }

  searchPrescriptions(searchTerm: string): Observable<Prescription[]> {
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<Prescription[]>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError(error => {
          console.error('Error searching prescriptions:', error);
          throw error;
        })
      );
  }
}