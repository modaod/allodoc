// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';

// Fix for crypto module in Node.js 18 with TypeORM
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as any;
}

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Basic configuration
    const port = configService.get<number>('app.port');
    const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';
    const corsOrigin = configService.get<string>('app.corsOrigin');
    const corsCredentials = configService.get<boolean>('app.corsCredentials');

    // Global prefix for all routes
    app.setGlobalPrefix(apiPrefix);

    // API versioning
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // Security
    app.use(helmet());
    app.use(compression());

    // Cookie parser for handling cookies
    app.use(cookieParser(configService.get<string>('app.cookieSecret')));

    // CORS - ensure credentials are properly configured
    app.enableCors({
        origin: corsOrigin,
        credentials: true, // Always true for cookie support
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-CSRF-Token'],
        exposedHeaders: ['X-CSRF-Token'], // Expose CSRF token header
    });

    // Global validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            disableErrorMessages: configService.get('app.nodeEnv') === 'production',
        }),
    );

    // Global serialization interceptor to enforce @Exclude decorators
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    // Swagger documentation (development only)
    if (configService.get('app.nodeEnv') === 'development') {
        const config = new DocumentBuilder()
            .setTitle('Medical Management System API')
            .setDescription('API for medical records management')
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth',
            )
            .addTag('auth', 'Authentication')
            .addTag('users', 'User management')
            .addTag('organizations', 'Organization management')
            .addTag('patients', 'Patient management')
            .addTag('appointments', 'Appointment management')
            .addTag('consultations', 'Medical consultations')
            .addTag('prescriptions', 'Prescriptions')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });

        console.log(`📚 Swagger Documentation: http://localhost:${port}/${apiPrefix}/docs`);
    }

    // Server startup
    const listenPort = port ?? 3000;
    await app.listen(listenPort);

    console.log(`🚀 Application started on: http://localhost:${listenPort}/${apiPrefix}`);
    console.log(`🏥 Environment: ${configService.get('app.nodeEnv')}`);
}

bootstrap().catch((error) => {
    console.error('❌ Error during startup:', error);
    process.exit(1);
});
