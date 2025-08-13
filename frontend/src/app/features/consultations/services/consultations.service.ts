import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Consultation, 
  CreateConsultationRequest, 
  UpdateConsultationRequest, 
  ConsultationSearchParams, 
  ConsultationsResponse
} from '../models/consultation.model';
import { environment } from '../../../../environments/environment';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class ConsultationsService {
  private readonly apiUrl = `${environment.apiUrl}/consultations`;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) { }

  getAllConsultations(params?: ConsultationSearchParams): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof ConsultationSearchParams];
        if (value !== undefined && value !== null) {
          // Map 'type' to 'category' for backend compatibility
          if (key === 'type') {
            httpParams = httpParams.set('category', value.toString());
          } else if (key === 'startDate' || key === 'endDate') {
            // Convert Date objects to ISO strings for date fields
            if (value instanceof Date) {
              httpParams = httpParams.set(key, value.toISOString());
            } else {
              httpParams = httpParams.set(key, value.toString());
            }
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }
    
    return this.http.get<any>(this.apiUrl, { params: httpParams })
      .pipe(
        map(response => {
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
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }

  getTodayConsultations(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/today`)
      .pipe(
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }

  getThisWeekConsultations(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/this-week`)
      .pipe(
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }

  getConsultationById(id: string): Observable<Consultation> {
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.get<Consultation>(url)
      .pipe(
        catchError(this.errorHandler.handleError.bind(this.errorHandler))
      );
  }

  createConsultation(consultation: CreateConsultationRequest): Observable<Consultation> {
    return this.http.post<Consultation>(this.apiUrl, consultation)
      .pipe(
        catchError(error => {
          console.error('Error creating consultation:', error);
          throw error;
        })
      );
  }

  updateConsultation(id: string, consultation: UpdateConsultationRequest): Observable<Consultation> {
    return this.http.patch<Consultation>(`${this.apiUrl}/${id}`, consultation)
      .pipe(
        catchError(error => {
          console.error('Error updating consultation:', error);
          throw error;
        })
      );
  }

  deleteConsultation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting consultation:', error);
          throw error;
        })
      );
  }

  getConsultationsByPatient(patientId: string): Observable<Consultation[]> {
    // Use the correct endpoint for patient history
    return this.http.get<any>(`${this.apiUrl}/patient/${patientId}/history`)
      .pipe(
        map(response => {
          console.log('Patient history response:', response);
          // The API returns an object with consultations array
          if (response && response.consultations) {
            return response.consultations;
          }
          return [];
        }),
        catchError(error => {
          console.error('Error fetching consultations by patient:', error);
          // Return empty array on error to prevent timeline from breaking
          return of([]);
        })
      );
  }

  searchConsultations(searchTerm: string): Observable<Consultation[]> {
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<Consultation[]>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError(error => {
          console.error('Error searching consultations:', error);
          throw error;
        })
      );
  }
}