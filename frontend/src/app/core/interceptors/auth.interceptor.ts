import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth header for auth endpoints
    if (this.isAuthEndpoint(req.url)) {
      return next.handle(req);
    }

    // Add auth header if user is authenticated
    const authToken = this.authService.getAccessToken();
    if (authToken) {
      req = this.addAuthHeader(req, authToken);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 errors by attempting token refresh
        if (error.status === 401 && !this.isAuthEndpoint(req.url)) {
          return this.handle401Error(req, next);
        }
        
        return throwError(error);
      })
    );
  }

  private isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/login') || 
           url.includes('/auth/register') || 
           url.includes('/auth/refresh');
  }

  private addAuthHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.authService.refreshToken().pipe(
      switchMap(() => {
        // Retry the original request with new token
        const newToken = this.authService.getAccessToken();
        if (newToken) {
          const newReq = this.addAuthHeader(req, newToken);
          return next.handle(newReq);
        }
        return throwError('Token refresh failed');
      }),
      catchError((error) => {
        // Refresh failed, logout user
        this.authService.logout();
        return throwError(error);
      })
    );
  }
}