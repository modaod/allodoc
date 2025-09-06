# AlloDoc - Medical Management System

A comprehensive medical management system built with modern web technologies, designed to streamline healthcare operations including patient management, consultations, prescriptions, and appointments.

<!-- CI/CD Pipeline Test: This comment validates that the pipeline processes safe changes correctly -->

## Overview

AlloDoc is a full-stack application that provides healthcare professionals with tools to manage their medical practice efficiently. The system supports multi-organization setups, allowing healthcare providers to work across different clinics or hospitals.

## Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL 15
- **Authentication**: JWT with refresh tokens
- **API Documentation**: Swagger/OpenAPI
- **ORM**: TypeORM
- **Security**: Helmet, bcrypt, Passport.js
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: Angular 16
- **UI Library**: Angular Material
- **State Management**: RxJS
- **HTTP Client**: Angular HttpClient
- **Styling**: SCSS
- **Build Tool**: Angular CLI

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Admin**: pgAdmin
- **Caching**: Redis (optional)

## Features

- 🔐 **Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- 🏥 **Multi-Organization Support**: Manage multiple clinics/hospitals with organization-specific data isolation
- 👥 **User Management**: Support for different user roles (Admin, Doctor, Nurse, Receptionist)
- 🏃 **Patient Management**: Comprehensive patient records with medical history
- 📋 **Consultation Management**: Record detailed medical consultations with vital signs and attachments
- 💊 **Prescription System**: Create and manage prescriptions linked to consultations
- 📅 **Appointment Scheduling**: Schedule and track patient appointments
- 📊 **Dashboard & Analytics**: Real-time statistics and activity monitoring
- 🔍 **Advanced Search**: Search across patients, consultations, and appointments

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized setup)
- PostgreSQL 15+ (if running without Docker)

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd allodoc
```

2. Start the API services:
```bash
cd src/api
docker-compose up -d
```

3. Install and start the frontend:
```bash
cd ../../src/frontend
npm install
npm start
```

4. Access the applications:
   - Frontend: http://localhost:4200
   - API: http://localhost:3000/api
   - API Documentation: http://localhost:3000/api/docs
   - pgAdmin: http://localhost:5050

### Manual Setup

For manual setup instructions, please refer to:
- [API README](./src/api/README.md)
- [Frontend README](./src/frontend/README.md)

## Project Structure

```
allodoc/
├── src/api/                 # NestJS API application
│   ├── src/
│   │   ├── appointments/    # Appointment management module
│   │   ├── auth/           # Authentication & authorization
│   │   ├── common/         # Shared utilities and base classes
│   │   ├── consultations/  # Medical consultation module
│   │   ├── database/       # Database configuration & migrations
│   │   ├── organizations/  # Organization management
│   │   ├── patients/       # Patient management module
│   │   ├── prescriptions/  # Prescription management
│   │   └── users/          # User management module
│   └── docker-compose.yml  # Docker services configuration
│
└── frontend/               # Angular frontend application
    └── src/
        ├── app/
        │   ├── core/       # Core services and guards
        │   └── features/   # Feature modules
        │       ├── auth/           # Authentication views
        │       ├── consultations/  # Consultation management
        │       ├── dashboard/      # Dashboard view
        │       ├── patients/       # Patient management
        │       └── prescriptions/  # Prescription management
        └── environments/   # Environment configurations
```

## Default Credentials

When using Docker setup with seed data:
- **Admin**: admin@medical.com / admin123
- **pgAdmin**: admin@medical.com / admin123

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED license.

## Support

For support and questions, please open an issue in the GitHub repository.