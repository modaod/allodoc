# Backend API Integration

This document outlines the backend API integration implemented in the AlloCare frontend application.

## Overview

The application has been fully integrated with the NestJS backend API. All services now make real HTTP requests to the backend instead of using mock data.

## API Configuration

### Base URL
The API base URL is configured in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

## Integrated Services

### 1. AuthService (`src/app/core/services/auth.service.ts`)
- **Endpoints**: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/profile`
- **Features**: JWT token management, automatic refresh, session persistence
- **Status**: ✅ Fully integrated with backend

### 2. PatientsService (`src/app/features/patients/services/patients.service.ts`)
- **Endpoints**: `/patients`, `/patients/:id`, `/patients/search`
- **Operations**: CRUD operations, search, pagination
- **Status**: ✅ Fully integrated with backend

### 3. ConsultationsService (`src/app/features/consultations/services/consultations.service.ts`)
- **Endpoints**: `/consultations`, `/consultations/:id`, `/consultations/patient/:patientId`
- **Operations**: CRUD operations, patient filtering, search
- **Status**: ✅ Fully integrated with backend

### 4. PrescriptionsService (`src/app/features/prescriptions/services/prescriptions.service.ts`)
- **Endpoints**: `/prescriptions`, `/prescriptions/:id`, `/prescriptions/patient/:patientId`, `/medications`
- **Operations**: CRUD operations, patient/consultation filtering, medication search
- **Status**: ✅ Fully integrated with backend

## Error Handling

### ErrorHandlerService (`src/app/core/services/error-handler.service.ts`)
- Centralized error handling for HTTP requests
- Provides user-friendly error messages based on HTTP status codes
- Handles network errors, authentication errors, validation errors

### NotificationService (`src/app/core/services/notification.service.ts`)
- Uses Angular Material Snackbar for user notifications
- Provides success, error, warning, and info notifications
- Styled with custom CSS classes in `src/styles.scss`

## HTTP Interceptors

### AuthInterceptor (`src/app/core/interceptors/auth.interceptor.ts`)
- Automatically attaches JWT tokens to requests
- Handles 401 responses with automatic token refresh
- Redirects to login on authentication failure

## Security Features

- JWT token-based authentication
- Automatic token refresh before expiration
- Secure token storage in localStorage
- Organization-based access control
- Role-based authorization helpers

## Error States and Fallbacks

### MockDataService (`src/app/core/services/mock-data.service.ts`)
- Provides fallback data for development when backend is unavailable
- Can be used to demonstrate functionality without backend
- Not currently active (all services use real API calls)

## Usage Examples

### Making API Calls
```typescript
// In components, services automatically handle errors
this.patientsService.getAllPatients({ page: 1, limit: 10 }).subscribe({
  next: (response) => {
    // Handle successful response
    this.patients = response.data;
  },
  error: (error) => {
    // Error is automatically handled by ErrorHandlerService
    // User sees friendly notification via NotificationService
  }
});
```

### Authentication Flow
```typescript
// Login automatically stores tokens and user data
this.authService.login({ email, password, organizationId }).subscribe({
  next: (response) => {
    // User is logged in, tokens stored, navigation handled
  },
  error: (error) => {
    // Error notification shown to user
  }
});
```

## Backend Requirements

The frontend expects the backend to implement the following:

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile

### Data Endpoints
- Full CRUD operations for patients, consultations, and prescriptions
- Search and filtering capabilities
- Pagination support
- Proper HTTP status codes and error responses

### Response Format
All endpoints should return data in the expected format:
```typescript
// List endpoints
{
  data: T[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}

// Single item endpoints
T // Direct object return
```

## Testing the Integration

1. Start the NestJS backend server on `http://localhost:3000`
2. Start the Angular frontend with `npm start`
3. Navigate to `http://localhost:4200`
4. The application will redirect to login page
5. Use valid credentials to test the authentication flow
6. Test CRUD operations on patients, consultations, and prescriptions

## Development Notes

- The application gracefully handles backend unavailability with proper error messages
- All API calls include proper loading states and error handling
- The UI remains responsive during API operations
- Network errors are distinguished from server errors
- Users receive appropriate feedback for all operations

## Security Considerations

- Tokens are stored securely in localStorage
- Automatic logout on token expiration
- HTTPS recommended for production
- Sensitive data is not logged to console
- Proper CORS configuration required on backend