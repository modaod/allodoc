import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Add request ID for tracing
        const requestId = uuidv4();
        req.headers['x-request-id'] = requestId;
        res.setHeader('X-Request-ID', requestId);

        // Add request start time
        (req as any).startTime = Date.now();

        // Enhanced IP detection
        const forwarded = req.headers['x-forwarded-for'] as string;
        const realIp = req.headers['x-real-ip'] as string;
        const detectedIp = forwarded?.split(',')[0] || realIp || req.socket.remoteAddress || req.ip;
        (req as any).realIp = detectedIp;

        console.log(`[REQUEST] ${req.method} ${req.url} - ID: ${requestId} - IP: ${detectedIp}`);

        next();
    }
}
