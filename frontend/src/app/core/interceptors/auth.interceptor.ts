import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService: AuthService | null = null;

  constructor(private injector: Injector) {}

  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    return this.authService;
  }

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
    const authToken = this.getAuthService().getAccessToken();
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
        if (error.status === 401 && !this.shouldSkip401Handling(req.url)) {
          return this.handle401Error(req, next);
        }
        
        return throwError(error);
      })
    );
  }

  private isAuthEndpoint(url: string): boolean {
    // Only these endpoints should skip auth header
    return url.includes('/auth/login') || 
           url.includes('/auth/register') || 
           url.includes('/auth/refresh');
  }
  
  private shouldSkip401Handling(url: string): boolean {
    // These endpoints handle their own 401 errors
    return this.isAuthEndpoint(url) || 
           url.includes('/auth/switch-organization');
  }

  private addAuthHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.getAuthService().refreshToken().pipe(
      switchMap(() => {
        // Retry the original request with new token
        const newToken = this.getAuthService().getAccessToken();
        if (newToken) {
          const newReq = this.addAuthHeader(req, newToken);
          return next.handle(newReq);
        }
        return throwError('Token refresh failed');
      }),
      catchError((error) => {
        // Refresh failed, logout user
        this.getAuthService().logout();
        return throwError(error);
      })
    );
  }
}