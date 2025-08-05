# AlloDoc Backend - Medical Management API

A robust RESTful API built with NestJS for managing medical operations including patient records, consultations, prescriptions, and appointments.

## Architecture Overview

This backend follows a modular architecture using NestJS with the following key patterns:
- **Repository Pattern**: For data access layer abstraction
- **DTO Pattern**: For request/response data validation
- **Guard Pattern**: For authentication and authorization
- **Interceptor Pattern**: For cross-cutting concerns like audit logging

## Features

### Core Modules

- **Authentication (`/auth`)**
  - JWT-based authentication with refresh tokens
  - Local strategy for username/password login
  - Organization selection support
  - Secure password hashing with bcrypt

- **Organizations (`/organizations`)**
  - Multi-tenant support
  - Organization-specific data isolation
  - Organization switching for users

- **Users (`/users`)**
  - Role-based access control (Admin, Doctor, Nurse, Receptionist)
  - User profile management
  - Doctor search functionality

- **Patients (`/patients`)**
  - Complete patient record management
  - Medical history tracking
  - Search and filtering capabilities

- **Consultations (`/consultations`)**
  - Detailed medical consultation records
  - Vital signs recording
  - File attachments support
  - Integration with prescriptions

- **Prescriptions (`/prescriptions`)**
  - Medication management
  - Linked to consultations
  - Dosage and duration tracking

- **Appointments (`/appointments`)**
  - Appointment scheduling
  - Status tracking
  - Integration with consultations

- **Dashboard (`/dashboard`)**
  - Real-time statistics
  - Recent activity tracking
  - Organization-specific metrics

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Docker and Docker Compose (optional)

## Installation

### Using Docker (Recommended)

1. Clone the repository and navigate to backend:
```bash
cd backend
```

2. Start all services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis cache on port 6379
- NestJS application on port 3000
- pgAdmin on port 5050

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=medical_user
DATABASE_PASSWORD=medical_password
DATABASE_NAME=medical_db

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=30d

# CORS
CORS_ORIGIN=http://localhost:4200
CORS_CREDENTIALS=true
```

4. Run database migrations:
```bash
npm run migration:run
```

5. Start the application:
```bash
npm run start:dev
```

## Available Scripts

```bash
# Development
npm run start:dev        # Start in watch mode
npm run start:debug      # Start with debugging

# Production
npm run build           # Build the application
npm run start:prod      # Start production build

# Database
npm run migration:generate -- -n MigrationName  # Generate migration
npm run migration:run                           # Run migrations
npm run migration:revert                        # Revert last migration
npm run schema:sync                             # Sync schema (dev only)

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage
npm run test:e2e        # Run e2e tests

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier

# Docker
npm run docker:dev      # Start all Docker services
npm run docker:db       # Start only PostgreSQL
npm run docker:down     # Stop all Docker services
```

## API Documentation

When running in development mode, Swagger documentation is available at:
```
http://localhost:3000/api/docs
```

### API Endpoints Overview

- **Auth**: `/api/v1/auth/*`
  - POST `/login` - User login
  - POST `/register` - User registration
  - POST `/refresh` - Refresh access token
  - POST `/logout` - User logout
  - POST `/select-organization` - Select active organization

- **Users**: `/api/v1/users/*`
  - GET `/` - List users
  - GET `/:id` - Get user details
  - POST `/` - Create user
  - PATCH `/:id` - Update user
  - DELETE `/:id` - Delete user
  - GET `/doctors/search` - Search doctors

- **Patients**: `/api/v1/patients/*`
  - GET `/` - List patients
  - GET `/:id` - Get patient details
  - POST `/` - Create patient
  - PATCH `/:id` - Update patient
  - DELETE `/:id` - Delete patient

- **Consultations**: `/api/v1/consultations/*`
  - GET `/` - List consultations
  - GET `/:id` - Get consultation details
  - POST `/` - Create consultation
  - PATCH `/:id` - Update consultation
  - DELETE `/:id` - Delete consultation

- **Prescriptions**: `/api/v1/prescriptions/*`
  - GET `/` - List prescriptions
  - GET `/:id` - Get prescription details
  - POST `/` - Create prescription
  - PATCH `/:id` - Update prescription
  - DELETE `/:id` - Delete prescription

## Database Schema

The application uses PostgreSQL with TypeORM. Key entities include:

- **User**: System users with roles and organization associations
- **Organization**: Medical facilities/clinics
- **Patient**: Patient records with personal and medical information
- **Consultation**: Medical consultation records with vital signs
- **Prescription**: Medication prescriptions linked to consultations
- **Appointment**: Scheduled appointments
- **RefreshToken**: JWT refresh token storage

## Security

- **Authentication**: JWT-based with access and refresh tokens
- **Password Security**: Bcrypt hashing with salt rounds
- **CORS**: Configurable CORS with credentials support
- **Helmet**: Security headers for production
- **Rate Limiting**: Throttling support via @nestjs/throttler
- **Input Validation**: DTOs with class-validator
- **SQL Injection Protection**: TypeORM parameterized queries

## Error Handling

The application implements global exception filters that provide consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/users"
}
```

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## Deployment

### Docker Production Build

1. Build the Docker image:
```bash
docker build -t allodoc-backend .
```

2. Run with environment variables:
```bash
docker run -p 3000:3000 --env-file .env.production allodoc-backend
```

### Traditional Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start:prod
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Migration Errors**
   - Run `npm run schema:sync` in development
   - Check migration files for conflicts

3. **JWT Errors**
   - Ensure JWT secrets are set in environment
   - Check token expiration settings

## Contributing

1. Follow the existing code structure and patterns
2. Write unit tests for new features
3. Update API documentation
4. Run linting before committing
5. Create detailed pull requests

## License

UNLICENSED