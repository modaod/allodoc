# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- **Start development server**: `npm start` (runs on http://localhost:4200)
- **Build for production**: `npm build`
- **Run unit tests**: `npm test`
- **Watch mode build**: `npm run watch`

### Angular CLI Commands
- **Generate component**: `ng generate component features/<module>/<component-name>`
- **Generate service**: `ng generate service features/<module>/services/<service-name>`
- **Generate module**: `ng generate module features/<module-name> --routing`

## Architecture Overview

This is an Angular 16 medical management application (AlloCare) with a modular architecture. The application follows Angular best practices with lazy-loaded feature modules, reactive forms, and RxJS for state management.

### Core Architecture Patterns

1. **Module Structure**:
   - `core/` - Singleton services (AuthService, guards, interceptors) imported only in AppModule
   - `features/` - Lazy-loaded feature modules (auth, patients, consultations, prescriptions, dashboard)
   - Each feature module is self-contained with its own components, services, and routing

2. **Service Layer**:
   - All API calls go through dedicated services in each feature module
   - Services return Observables and handle HTTP operations
   - Error handling is centralized through `ErrorHandlerService`
   - Authentication is handled by `AuthInterceptor` which automatically attaches JWT tokens

3. **Routing & Guards**:
   - Lazy loading for all feature modules
   - `AuthGuard` protects authenticated routes
   - Hierarchical routing with child routes in feature modules

4. **Forms & Validation**:
   - All forms use Angular Reactive Forms
   - Complex forms (consultations, prescriptions) use FormArrays for dynamic fields
   - Validation is implemented at form control level

### API Integration

- Backend API URL: `http://localhost:3000/api/v1` (configured in environments/)
- JWT-based authentication with automatic token refresh
- Organization-based multi-tenant support
- All services expect paginated responses for list endpoints

### Key Technical Decisions

1. **Angular Material**: UI component library for consistent design
2. **Lazy Loading**: All feature modules are lazy loaded for performance
3. **RxJS Patterns**: Heavy use of Observables, operators (catchError, tap, map)
4. **TypeScript Models**: Strongly typed interfaces for all data structures
5. **Error Handling**: Centralized error handling with user notifications

### Medical Workflow

The application follows this primary workflow:
1. Patient registration/selection
2. Create consultation (with vital signs, diagnosis, physical exam)
3. Generate prescription (with multiple medications)
4. View medical timeline (chronological history)

### Important Files to Know

- `src/app/app-routing.module.ts` - Main routing configuration
- `src/app/core/services/auth.service.ts` - Authentication logic
- `src/app/core/interceptors/auth.interceptor.ts` - HTTP interceptor for auth
- `src/environments/environment.ts` - Environment configuration
- `BACKEND_INTEGRATION.md` - Detailed API integration documentation
- `PROJECT_PROGRESS.md` - Complete feature list and project status