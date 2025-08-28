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
    // Skip auth header for auth endpoints
    if (this.isAuthEndpoint(req.url)) {
      // Add credentials for cookie support
      req = req.clone({ withCredentials: true });
      return next.handle(req);
    }

    // For cookie-based auth, we don't need to add Authorization header
    // The browser will automatically send cookies
    // But we still need withCredentials for CORS
    req = req.clone({ withCredentials: true });
    
    // For backward compatibility, also add Authorization header if token exists
    const authToken = this.getAuthService().getAccessToken();
    if (authToken) {
      req = this.addAuthHeader(req, authToken);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
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