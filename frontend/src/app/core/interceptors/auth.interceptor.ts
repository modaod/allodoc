import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log(`=== AUTH INTERCEPTOR DEBUG ===`);
    console.log(`Request URL: ${req.url}`);
    console.log(`Request method: ${req.method}`);
    
    // Skip auth header for auth endpoints
    if (this.isAuthEndpoint(req.url)) {
      console.log('Skipping auth header for auth endpoint');
      return next.handle(req);
    }

    // Add auth header if user is authenticated
    const authToken = this.authService.getAccessToken();
    console.log(`Auth token exists: ${!!authToken}`);
    if (authToken) {
      console.log(`Auth token (first 20 chars): ${authToken.substring(0, 20)}...`);
      req = this.addAuthHeader(req, authToken);
      console.log('Added auth header to request');
    } else {
      console.log('No auth token found!');
    }
    
    console.log(`Final request headers:`, req.headers.keys());
    console.log(`=== END AUTH INTERCEPTOR DEBUG ===`);

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(`=== AUTH INTERCEPTOR ERROR ===`);
        console.log(`Error status: ${error.status}`);
        console.log(`Error URL: ${req.url}`);
        console.log(`=== END AUTH INTERCEPTOR ERROR ===`);
        
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