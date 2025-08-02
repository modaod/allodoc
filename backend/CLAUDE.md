# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Development server with hot reload (runs on http://localhost:3000)
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

# Run a single test file
npm run test -- patient.service.spec.ts
```

### Database Management
```bash
# Generate new migration from entity changes (provide migration name)
npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Sync database schema (development only - dangerous in production)
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

This is a **NestJS-based multi-tenant medical management system** built with TypeScript, PostgreSQL, and TypeORM. The application follows a modular architecture with strong separation of concerns.

### Key Architectural Patterns

**1. Multi-Tenancy**
- All entities are scoped to an Organization via `organizationId`
- Organization isolation is enforced at the repository level
- Global guards ensure users only access their organization's data

**2. Repository Pattern**
- All data access extends `BaseRepository<T>` (src/common/repositories/base.repository.ts:8)
- Provides standardized CRUD operations with organization scoping
- Built-in pagination, search, and audit trail support

**3. Auditable Entities**
- All business entities extend `AuditableEntity` (src/common/entities/auditable.entity.ts)
- Automatically tracks `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- Soft delete support through `isActive` field

**4. Role-Based Access Control (RBAC)**
- Roles: SUPER_ADMIN, ADMIN, DOCTOR, NURSE, RECEPTIONIST
- Permission-based authorization system
- Global guards enforce authentication and authorization

### Module Structure

**Core Modules:**
- **Auth Module**: JWT authentication with refresh tokens, login/register endpoints
- **Common Module**: Shared utilities, base classes, decorators, guards, interceptors
- **Config Module**: Centralized configuration management (app, database, JWT)

**Feature Modules:**
- **Organizations**: Multi-tenant organization management
- **Users**: User management with roles and permissions
- **Patients**: Patient records with medical history (JSON field)
- **Appointments**: Appointment scheduling system
- **Consultations**: Medical consultation records
- **Prescriptions**: Prescription management
- **Dashboard**: Analytics and reporting
- **Audit**: Audit trail for all operations

### Global Configuration

**Security Stack:**
- JWT authentication (JwtAuthGuard globally applied)
- Role-based authorization (RolesGuard)
- Organization isolation (OrganizationGuard)
- Rate limiting (ThrottlerGuard)
- Helmet for security headers
- CORS configuration

**Data Validation:**
- Class-validator with whitelist enabled
- Automatic DTO transformation
- Custom validation decorators

**Error Handling:**
- Centralized HTTP exception filter
- Consistent error response format

### Key Implementation Patterns

**Creating a New Repository:**
```typescript
@Injectable()
export class MyEntityRepository extends BaseRepository<MyEntity> {
    constructor(@InjectRepository(MyEntity) repository: Repository<MyEntity>) {
        super(repository);
    }
    
    // Add custom methods here
}
```

**Creating a New Entity:**
```typescript
@Entity('table_name')
export class MyEntity extends AuditableEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    organizationId: string;

    @ManyToOne(() => Organization)
    organization: Organization;
    
    // Other fields...
}
```

**Protecting Routes:**
```typescript
@Controller('my-entity')
@UseGuards(JwtAuthGuard)
@ApiTags('my-entity')
@ApiBearerAuth('JWT-auth')
export class MyEntityController {
    @Get()
    @Roles(RoleName.DOCTOR, RoleName.ADMIN)
    async findAll(
        @CurrentUser() user: User,
        @Organization() org: Organization,
        @Query() paginationDto: PaginationDto
    ) {
        // Implementation
    }
}
```

**DTO Validation:**
```typescript
export class CreateMyEntityDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}
```

### Database Configuration

- **Development**: Uses TypeORM synchronization (auto-creates/updates tables)
- **Production**: Uses migrations only
- **Connection**: PostgreSQL with connection pooling
- **Initialization**: SQL scripts in `src/database/init/` run on container startup

### Testing Framework

- **Jest** for unit and e2e tests
- **Test files**: `*.spec.ts` for unit tests
- **Coverage**: Run with `npm run test:cov`
- **E2E configuration**: `test/jest-e2e.json`

### API Documentation

- **Swagger UI**: Available at `/api/docs` in development
- **Authentication**: Use JWT bearer token
- **Versioning**: API v1 at `/api/v1/*`

### Development Services

- **API**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432 (user: postgres, password: postgres123, database: medical_db)
- **PgAdmin**: http://localhost:5050 (admin@medical.com / admin123)
- **Redis**: localhost:6379