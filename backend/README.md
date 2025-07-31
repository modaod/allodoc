# README.md

This file provides guidance when working with code in this repository.

## Development Commands

### Core Development

```bash
# Install dependencies
npm install

# Development server with hot reload
npm run start:dev

# Production build
npm run build

# Run production server
npm run start:prod

# Format code
npm run format

# Lint and fix
npm run lint
```

### Testing

```bash
# Unit tests
npm run test

# Watch mode for tests
npm run test:watch

# Test coverage
npm run test:cov

# End-to-end tests
npm run test:e2e

# Debug tests
npm run test:debug
```

### Database Management

```bash
# Generate new migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Sync database schema (development only)
npm run schema:sync

# Run database seeds
npm run db:seed
```

### Docker Development

```bash
# Start all services (PostgreSQL, Redis, PgAdmin, App)
npm run docker:dev

# Start only database
npm run docker:db

# Stop all services
npm run docker:down

# Alternative: use the startup script
./start-app.sh
```

## High-Level Architecture

### Multi-Tenant Medical Management System

This is a NestJS-based backend for a medical management system with the following key architectural patterns:

**Multi-Tenancy**: All entities are scoped to an Organization. Users, patients, appointments, etc. are isolated by `organizationId`.

**Role-Based Access Control (RBAC)**:

- Users have roles (SUPER_ADMIN, ADMIN, DOCTOR, NURSE, RECEPTIONIST)
- Each role has specific permissions
- Global guards enforce authentication and authorization

**Repository Pattern**: All data access goes through repository classes that extend `BaseRepository<T>`, providing:

- Standard CRUD operations
- Organization-scoped queries
- Pagination
- Search functionality
- Audit trail support

**Auditable Entities**: All entities extend `AuditableEntity` which automatically tracks:

- `createdAt`/`updatedAt` timestamps
- `createdBy`/`updatedBy` user references
- Utility methods for audit information

### Module Structure

- **Auth Module**: JWT-based authentication with refresh tokens
- **Organizations Module**: Multi-tenant organization management
- **Users Module**: User management with roles and permissions
- **Patients Module**: Patient records with medical history (JSON field)
- **Appointments Module**: Appointment scheduling
- **Consultations Module**: Medical consultation records
- **Prescriptions Module**: Prescription management
- **Common Module**: Shared utilities, guards, decorators, DTOs

### Global Configuration

- **Guards**: JWT authentication, role-based authorization, organization isolation, rate limiting
- **Interceptors**: Audit logging for all operations
- **Filters**: Centralized HTTP exception handling
- **Validation**: Class-validator with whitelist and transformation
- **Security**: Helmet, CORS, compression enabled

### Database Setup

- **PostgreSQL** with TypeORM
- **Migrations**: Located in `src/database/migrations/`
- **Seeds**: Default data setup via `SeedService`
- **Initialization**: SQL scripts in `src/database/init/` run on container startup

### Development Services

- **API**: http://localhost:3000/api (with Swagger docs at /api/docs)
- **Database**: PostgreSQL on localhost:5432
- **PgAdmin**: http://localhost:5050 (admin@medical.com / admin123)
- **Redis**: localhost:6379 (for sessions/cache)

### Key Patterns to Follow

**Repository Pattern**: Always extend `BaseRepository<T>` for data access:

```typescript
@Injectable()
export class PatientsRepository extends BaseRepository<Patient> {
    constructor(@InjectRepository(Patient) repository: Repository<Patient>) {
        super(repository);
    }

    // Add custom methods here
}
```

**Entity Pattern**: All business entities should extend `AuditableEntity`:

```typescript
@Entity('table_name')
export class MyEntity extends AuditableEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    organizationId: string; // Required for multi-tenancy

    @ManyToOne(() => Organization)
    organization: Organization;
}
```

**DTO Validation**: Use class-validator decorators for all DTOs:

```typescript
export class CreateEntityDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}
```

**Multi-tenant Queries**: Always filter by organization in repositories:

```typescript
async findByOrganization(organizationId: string): Promise<MyEntity[]> {
  return this.repository.find({ where: { organizationId } });
}
```

**Authentication Decorators**: Use provided decorators for route protection:

```typescript
@UseGuards(JwtAuthGuard)
@Roles(RoleName.DOCTOR, RoleName.ADMIN)
@ApiBearer('JWT-auth')
getProtectedRoute(@CurrentUser() user: User, @Organization() org: Organization) {
  // Implementation
}
```

### Configuration

Environment variables are loaded from `.env.development` (or `.env.production`). Key configurations are organized in `src/config/`:

- `app.config.ts`: Application settings (port, CORS, rate limiting)
- `database.config.ts`: Database connection settings
- `jwt.config.ts`: JWT token configuration

The system uses TypeORM with automatic entity discovery and supports both synchronization (development) and migrations (production).
