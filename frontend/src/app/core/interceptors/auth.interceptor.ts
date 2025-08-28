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
    // Always add withCredentials for cookie-based authentication
    // The browser will automatically send httpOnly cookies with every request
    req = req.clone({ withCredentials: true });

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 errors - session might have expired
        if (error.status === 401 && !this.shouldSkip401Handling(req.url)) {
          return this.handle401Error(req, next);
        }
        
        return throwError(error);
      })
    );
  }

  private isAuthEndpoint(url: string): boolean {
    // Auth endpoints that handle their own errors
    return url.includes('/auth/login') || 
           url.includes('/auth/register') || 
           url.includes('/auth/refresh');
  }
  
  private shouldSkip401Handling(url: string): boolean {
    // These endpoints handle their own 401 errors
    return this.isAuthEndpoint(url) || 
           url.includes('/auth/switch-organization');
  }


  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Try to refresh the session using the refresh token cookie
    return this.getAuthService().refreshToken().pipe(
      switchMap(() => {
        // Retry the original request - cookies will be automatically sent
        return next.handle(req);
      }),
      catchError((error) => {
        // Refresh failed, logout user
        this.getAuthService().logout();
        return throwError(error);
      })
    );
  }
}