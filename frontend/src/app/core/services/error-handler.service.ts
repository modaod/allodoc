import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  error?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  handleError(error: HttpErrorResponse | any): Observable<never> {
    let apiError: ApiError;

    if (error instanceof HttpErrorResponse) {
      // Server-side error
      if (error.error instanceof ErrorEvent) {
        // Client-side network error
        apiError = {
          message: `Network error: ${error.error.message}`,
          status: 0,
          statusText: 'Network Error'
        };
      } else {
        // Server-side error response
        apiError = {
          message: this.getServerErrorMessage(error),
          status: error.status,
          statusText: error.statusText,
          error: error.error
        };
      }
    } else {
      // Client-side error
      apiError = {
        message: error.message || 'An unexpected error occurred',
        error: error
      };
    }

    // Log error to console (in production, you might want to send to logging service)
    console.error('API Error:', apiError);

    return throwError(apiError);
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 400:
        return error.error?.message || 'Bad request. Please check your input.';
      case 401:
        return 'You are not authorized to perform this action. Please log in.';
      case 403:
        return 'Access forbidden. You do not have permission to perform this action.';
      case 404:
        return error.error?.message || 'The requested resource was not found.';
      case 409:
        return error.error?.message || 'A conflict occurred. The resource may already exist.';
      case 422:
        return error.error?.message || 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. The server took too long to respond.';
      default:
        return error.error?.message || `Server error: ${error.status} ${error.statusText}`;
    }
  }

  getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }

  isNetworkError(error: any): boolean {
    return error?.status === 0 || error?.statusText === 'Network Error';
  }

  isAuthenticationError(error: any): boolean {
    return error?.status === 401;
  }

  isValidationError(error: any): boolean {
    return error?.status === 400 || error?.status === 422;
  }

  isNotFoundError(error: any): boolean {
    return error?.status === 404;
  }

  isServerError(error: any): boolean {
    return error?.status >= 500;
  }
}