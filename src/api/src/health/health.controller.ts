import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @Public()
    async check() {
        return this.healthService.check();
    }

    @Get('live')
    @Public()
    liveness() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }

    @Get('ready')
    @Public()
    async readiness() {
        return this.healthService.checkReadiness();
    }
}