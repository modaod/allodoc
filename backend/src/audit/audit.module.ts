import { Module, Global } from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@Global() // Make AuditService available everywhere
@Module({
    providers: [AuditService, AuditInterceptor],
    exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
