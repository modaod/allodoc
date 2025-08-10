# ARCHITECTURE - Allodoc Medical Management System

This document captures key architectural decisions and patterns used in the Allodoc system.

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Angular)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Auth      │  │   Features   │  │      Core        │   │
│  │  Module     │  │   Modules    │  │    Services      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST API
                          │ JWT Auth
┌─────────────────────────┴───────────────────────────────────┐
│                      API Gateway (v1)                        │
│                    ┌──────────────┐                          │
│                    │   Swagger    │                          │
│                    │     Docs     │                          │
│                    └──────────────┘                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    Backend (NestJS)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Guards    │  │  Controllers │  │    Services      │   │
│  │Interceptors │  │              │  │                  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Repository Layer (TypeORM)              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │Organization │  │    Users     │  │   Medical Data   │   │
│  │   Tables    │  │   Tables     │  │     Tables       │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Architectural Decisions

### 1. Multi-Tenant Architecture

**Decision**: Row-level security with organizationId field  
**Rationale**: 
- Simpler than database-per-tenant
- Better resource utilization
- Easier maintenance and updates

**Implementation**:
```typescript
// All entities include organizationId
@Entity()
export class Patient extends AuditableEntity {
  @Column()
  organizationId: string;
  
  @ManyToOne(() => Organization)
  organization: Organization;
}

// BaseRepository enforces organization scoping
findAll(organizationId: string, options?: FindOptions) {
  return this.repository.find({
    where: { organizationId, ...options.where }
  });
}
```

### 2. Repository Pattern

**Decision**: Custom repository layer extending TypeORM  
**Rationale**:
- Centralized data access logic
- Consistent organization scoping
- Reusable pagination and search

**Benefits**:
- Single source of truth for data access
- Easy to mock for testing
- Consistent API across all entities

### 3. JWT Authentication with Refresh Tokens

**Decision**: Dual token system (access + refresh)  
**Rationale**:
- Short-lived access tokens (15 min) for security
- Long-lived refresh tokens (7 days) for UX
- Stored refresh tokens allow revocation

**Security Features**:
- Automatic token refresh in frontend
- HTTP-only cookies consideration for future
- Token blacklisting capability

### 4. Modular Monolith

**Decision**: Single deployment unit with module boundaries  
**Rationale**:
- Simpler deployment and operations
- Clear module boundaries for future microservices
- Shared code without network overhead

**Module Structure**:
```
src/
├── auth/          # Authentication & authorization
├── common/        # Shared utilities and base classes
├── users/         # User management
├── patients/      # Patient records
├── consultations/ # Medical consultations
└── prescriptions/ # Prescription management
```

### 5. Frontend State Management

**Decision**: Service-based state with RxJS  
**Rationale**:
- Simpler than NgRx for current scale
- Leverages Angular's built-in capabilities
- Easy to understand and maintain

**Future Consideration**: 
- Migrate to NgRx when complexity increases
- Current structure supports easy migration

### 6. API Versioning

**Decision**: URL path versioning (/api/v1/*)  
**Rationale**:
- Clear and explicit
- Easy to route different versions
- Supports gradual migration

### 7. Database Migrations

**Decision**: TypeORM migrations for production  
**Rationale**:
- Version control for database changes
- Rollback capability
- Team collaboration

**Development vs Production**:
- Development: `synchronize: true` for rapid iteration
- Production: Migrations only for safety

---

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login
   └─> POST /api/v1/auth/login
       └─> Validate credentials
           └─> Generate JWT tokens
               └─> Return tokens + user info

2. Authenticated Request
   └─> Request with Bearer token
       └─> JwtAuthGuard validates
           └─> Extract user context
               └─> OrganizationGuard validates
                   └─> RolesGuard checks permissions
                       └─> Execute controller
```

### Security Layers
1. **Network**: HTTPS only in production
2. **Application**: JWT authentication
3. **Authorization**: Role-based access control
4. **Data**: Organization-level isolation
5. **Audit**: All actions logged

---

## 📊 Data Architecture

### Entity Relationships
```
Organization
    ├── Users (Doctors, Nurses, etc.)
    ├── Patients
    │   ├── Appointments
    │   ├── Consultations
    │   │   └── Prescriptions
    │   └── Medical History (JSON)
    └── Audit Logs
```

### Base Entity Pattern
All business entities extend `AuditableEntity`:
- `id`: UUID primary key
- `organizationId`: Tenant isolation
- `createdAt`, `updatedAt`: Timestamps
- `createdBy`, `updatedBy`: User tracking
- `isActive`: Soft delete support

---

## 🚀 Performance Considerations

### Backend Optimization
1. **Database Indexes**: On frequently queried fields
2. **Eager Loading**: Prevent N+1 queries
3. **Pagination**: Default limit of 10 items
4. **Connection Pooling**: TypeORM pool configuration

### Frontend Optimization
1. **Lazy Loading**: All feature modules
2. **OnPush Strategy**: For performance-critical components
3. **Debounced Search**: 300ms delay
4. **Virtual Scrolling**: For large lists (planned)

---

## 🔄 Development Workflow

### Git Strategy
- **Main Branch**: `main` - production ready
- **Development**: `dev/*` - feature development
- **Releases**: `release/*` - release candidates

### CI/CD Pipeline (Planned)
```
1. Code Push
2. Run Tests
3. Build Application
4. Run Linting
5. Security Scan
6. Deploy to Staging
7. Run E2E Tests
8. Deploy to Production
```

---

## 📦 Deployment Architecture

### Current (Development)
```
Docker Compose:
- Backend: Node.js container
- Frontend: Angular dev server
- Database: PostgreSQL container
- Cache: Redis container (planned)
- PgAdmin: Database management
```

### Production (Planned)
```
Cloud Provider (AWS/GCP/Azure):
- Frontend: CDN + S3/Cloud Storage
- Backend: Container orchestration (ECS/GKE)
- Database: Managed PostgreSQL
- Cache: Managed Redis
- Load Balancer: Application Load Balancer
```

---

## 🎨 Frontend Architecture Patterns

### Component Types
1. **Container Components**: Handle data and logic
2. **Presentational Components**: Pure UI components
3. **Page Components**: Route-level components

### Service Architecture
```typescript
// Feature service pattern
@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/patients`;
  
  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}
  
  getAll(): Observable<Patient[]> {
    return this.http.get<ApiResponse<Patient[]>>(this.apiUrl)
      .pipe(
        map(response => response.data),
        catchError(this.errorHandler.handleError)
      );
  }
}
```

---

## 🔮 Future Considerations

### Scalability Path
1. **Horizontal Scaling**: Stateless backend design
2. **Database Sharding**: By organizationId if needed
3. **Microservices**: Module boundaries support extraction
4. **Event-Driven**: Consider event sourcing for audit

### Technology Upgrades
1. **GraphQL**: For flexible frontend queries
2. **WebSockets**: For real-time notifications
3. **gRPC**: For internal service communication
4. **Elasticsearch**: For advanced search

### Feature Architecture
1. **Offline Support**: Service workers + IndexedDB
2. **Real-time Collaboration**: WebRTC for video consults
3. **AI Integration**: Diagnosis suggestions
4. **Mobile Apps**: Ionic or React Native

---

## 📝 Architecture Principles

1. **SOLID Principles**: Single responsibility, open/closed
2. **DRY**: Don't repeat yourself - use base classes
3. **KISS**: Keep it simple - avoid over-engineering
4. **YAGNI**: You aren't gonna need it - build what's needed
5. **Separation of Concerns**: Clear layer boundaries

---

## 🏁 Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-01 | NestJS + Angular | Modern, TypeScript, enterprise-ready | High |
| 2025-01 | PostgreSQL | Relational data, ACID compliance | High |
| 2025-01 | JWT Auth | Stateless, scalable | High |
| 2025-01 | Multi-tenant | Cost-effective, simpler | High |
| 2025-02 | TypeORM | Good NestJS integration | Medium |
| 2025-02 | Material Design | Professional UI, accessibility | Medium |

---

**Document Version**: 1.0  
**Last Updated**: August 5, 2025  
**Next Review**: September 2025