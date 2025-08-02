import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  Consultation, 
  CreateConsultationRequest, 
  UpdateConsultationRequest, 
  ConsultationSearchParams, 
  ConsultationsResponse
} from '../models/consultation.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsultationsService {
  private readonly apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) { }

  getAllConsultations(params?: ConsultationSearchParams): Observable<ConsultationsResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof ConsultationSearchParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ConsultationsResponse>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Error fetching consultations:', error);
          throw error;
        })
      );
  }

  getConsultationById(id: string): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching consultation:', error);
          throw error;
        })
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
    return this.http.put<Consultation>(`${this.apiUrl}/${id}`, consultation)
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
    const params = new HttpParams().set('patientId', patientId);
    return this.http.get<Consultation[]>(`${this.apiUrl}/patient/${patientId}`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching consultations by patient:', error);
          throw error;
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