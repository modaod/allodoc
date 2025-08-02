import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class PrescriptionsService {
  private readonly apiUrl = `${environment.apiUrl}/prescriptions`;
  private readonly medicationsApiUrl = `${environment.apiUrl}/medications`;

  constructor(private http: HttpClient) { }

  getAllPrescriptions(params?: PrescriptionSearchParams): Observable<PrescriptionsResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof PrescriptionSearchParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<PrescriptionsResponse>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Error fetching prescriptions:', error);
          throw error;
        })
      );
  }

  getPrescriptionById(id: string): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching prescription:', error);
          throw error;
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
    const params = new HttpParams().set('patientId', patientId);
    return this.http.get<Prescription[]>(`${this.apiUrl}/patient/${patientId}`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching prescriptions by patient:', error);
          throw error;
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