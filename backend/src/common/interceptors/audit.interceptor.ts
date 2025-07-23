import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;

    // Log de la requête entrante
    console.log(`[${new Date().toISOString()}] ${method} ${url}`, {
      userId: user?.id,
      organizationId: user?.organizationId,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
    });

    const now = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - now;
        console.log(`[${new Date().toISOString()}] Response: ${method} ${url} - ${responseTime}ms`);
        
        // Ici, vous pouvez ajouter la logique pour sauvegarder dans AuditLog
        // this.auditService.log({...})
      }),
    );
  }
}