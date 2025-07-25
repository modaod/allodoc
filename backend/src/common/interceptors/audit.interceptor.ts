import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params, query } = request;

    // Extract audit information
    const auditInfo = {
      method,
      url,
      userId: user?.id,
      userEmail: user?.email,
      userFullName: user?.fullName,
      organizationId: user?.organizationId || request.organizationId,
      ip: request.ip || request.connection.remoteAddress,
      userAgent: request.get('User-Agent'),
      timestamp: new Date().toISOString(),
      requestBody: this.sanitizeData(body),
      params: this.sanitizeData(params),
      query: this.sanitizeData(query),
    };

    console.log(`[AUDIT] ${method} ${url}`, {
      userId: auditInfo.userId,
      organizationId: auditInfo.organizationId,
      timestamp: auditInfo.timestamp,
    });

    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        console.log(`[AUDIT] SUCCESS ${method} ${url} - ${duration}ms`);

        this.logAuditEvent('REQUEST_SUCCESS', auditInfo, {
          duration,
          responseSize: JSON.stringify(response).length,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        console.error(`[AUDIT] ERROR ${method} ${url} - ${duration}ms`, {
          error: error.message,
          stack: error.stack,
        });

        this.logAuditEvent('REQUEST_ERROR', auditInfo, {
          duration,
          errorMessage: error.message,
          errorCode: error.status || 500,
        });

        throw error;
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'refreshToken', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private logAuditEvent(eventType: string, auditInfo: any, additionalData: any): void {
    // In a real application, you might save this to a separate audit database
    // or send to a logging service like ELK stack, Datadog, etc.
    const auditRecord = {
      eventType,
      ...auditInfo,
      ...additionalData,
    };

    // For now, just log to console with structured format
    console.log(`[AUDIT_EVENT] ${eventType}`, JSON.stringify(auditRecord, null, 2));

    // TODO: Save to audit database table
    // await this.auditService.saveAuditRecord(auditRecord);
  }
}