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
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<any>(this.apiUrl, { params: httpParams })
      .pipe(
        map(response => {
          console.log('Consultations getAllConsultations response:', response);
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
          console.error('Error fetching consultations:', error);
          // Return empty response structure on error
          return of({ data: [], total: 0 });
        })
      );
  }

  getConsultationById(id: string): Observable<Consultation> {
    const url = `${this.apiUrl}/${id}`;
    console.log(`=== CONSULTATION SERVICE DEBUG ===`);
    console.log(`API URL: ${this.apiUrl}`);
    console.log(`Full URL: ${url}`);
    console.log(`Consultation ID: ${id}`);
    console.log(`About to make HTTP GET request...`);
    
    return this.http.get<Consultation>(url)
      .pipe(
        map(response => {
          console.log('=== HTTP RESPONSE DEBUG ===');
          console.log('Response type:', typeof response);
          console.log('Response keys:', Object.keys(response || {}));
          console.log('Full response:', JSON.stringify(response, null, 2));
          console.log('=== END HTTP RESPONSE DEBUG ===');
          return response;
        }),
        catchError(error => {
          console.error('=== HTTP ERROR DEBUG ===');
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error body:', error.error);
          console.error('Full error:', JSON.stringify(error, null, 2));
          console.error('=== END HTTP ERROR DEBUG ===');
          
          // For debugging purposes, return mock data if backend is not available
          if (error.status === 0 || error.status === 404) {
            console.log('Backend not available, returning mock data for testing...');
            const mockConsultation: Consultation = {
              id: id,
              consultationNumber: 'CONS-202407-0001',
              patientId: '850e8400-e29b-41d4-a716-446655440002',
              patient: {
                id: '850e8400-e29b-41d4-a716-446655440002',
                firstName: 'Robert',
                lastName: 'Johnson',
                email: 'robert.johnson@email.com'
              },
              doctorId: '750e8400-e29b-41d4-a716-446655440002',
              doctor: {
                id: '750e8400-e29b-41d4-a716-446655440002',
                firstName: 'Michael',
                lastName: 'Thompson',
                specialty: 'Cardiology'
              },
              consultationDate: new Date('2024-07-20T14:30:00'),
              status: 'COMPLETED' as any,
              type: 'FOLLOW_UP' as any,
              reason: 'Cardiology follow-up',
              symptoms: 'Occasional chest tightness with exertion',
              physicalExamination: 'Regular heart rhythm, no murmurs, lungs clear, no peripheral edema',
              diagnosis: 'Coronary Artery Disease, stable, post-PCI with good response',
              treatmentPlan: 'Continue dual antiplatelet therapy, statin therapy, beta-blocker',
              followUpInstructions: 'Next follow-up in 6 months unless symptoms worsen. Continue medications as prescribed',
              notes: 'Patient doing well post-intervention. Good exercise tolerance improvement.',
              vitalSigns: {
                bloodPressure: { systolic: 118, diastolic: 75 },
                heartRate: 68,
                temperature: 98.4,
                respiratoryRate: 16,
                oxygenSaturation: 98,
                weight: 180
              },
              createdAt: new Date('2024-07-20T14:30:00'),
              updatedAt: new Date('2024-07-20T14:30:00')
            };
            return of(mockConsultation);
          }
          
          return this.errorHandler.handleError(error);
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