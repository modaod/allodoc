# AlloDoc Frontend - Medical Management UI

A modern, responsive Angular application providing an intuitive interface for healthcare professionals to manage patients, consultations, prescriptions, and appointments.

## Architecture Overview

Built with Angular 16 and Angular Material, following a feature-based module architecture:
- **Lazy-loaded modules** for optimal performance
- **Reactive forms** for complex data entry
- **RxJS** for state management and async operations
- **Angular Material** for consistent UI components
- **Responsive design** for desktop and tablet use

## Features

### Authentication & Authorization
- Secure login/logout functionality
- JWT token management with auto-refresh
- Organization selection for multi-clinic users
- Role-based UI elements

### Dashboard
- Real-time statistics display
- Recent activity feed
- Quick access to common actions
- Organization-specific metrics

### Patient Management
- Patient registration and profile management
- Medical history overview
- Search and filter capabilities
- Detailed patient information cards

### Consultation Management
- Comprehensive consultation forms
- Vital signs recording
- Medical examination notes
- Diagnosis and treatment planning
- File attachment support
- Prescription integration

### Prescription Management
- Medication selection and dosage
- Duration and frequency settings
- Linked to consultations
- Printable prescription formats

### Appointment System
- Calendar view for appointments
- Status tracking
- Patient appointment history
- Consultation linking

## Prerequisites

- Node.js 18+ and npm
- Angular CLI 16.x (`npm install -g @angular/cli@16`)

## Installation

1. Clone the repository and navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure the proxy for API calls (already set in `proxy.conf.json`):
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

## Development

### Start Development Server

```bash
npm start
```

This runs `ng serve` with proxy configuration and allows access from network devices.

Access the application at:
- Local: http://localhost:4200
- Network: http://[your-ip]:4200

### Available Scripts

```bash
# Development
npm start           # Start dev server with proxy
npm run build       # Build for production
npm run watch       # Build and watch for changes

# Testing
npm test           # Run unit tests with Karma

# Angular CLI
npm run ng         # Access Angular CLI commands
```

## Project Structure

```
src/
├── app/
│   ├── core/                      # Core module (singleton services)
│   │   ├── guards/               # Route guards
│   │   ├── interceptors/         # HTTP interceptors
│   │   └── services/             # Global services
│   │
│   ├── features/                 # Feature modules
│   │   ├── auth/                # Authentication module
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── organization-selector/
│   │   │
│   │   ├── dashboard/           # Dashboard module
│   │   │
│   │   ├── patients/            # Patient management
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── patient-list/
│   │   │   ├── patient-detail/
│   │   │   └── patient-form/
│   │   │
│   │   ├── consultations/       # Consultation management
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── consultations-list/
│   │   │   ├── consultation-detail/
│   │   │   └── consultation-form/
│   │   │
│   │   └── prescriptions/       # Prescription management
│   │       ├── models/
│   │       ├── services/
│   │       ├── prescriptions-list/
│   │       ├── prescription-detail/
│   │       └── prescription-form/
│   │
│   ├── app-routing.module.ts    # Main routing configuration
│   ├── app.component.*          # Root component
│   └── app.module.ts            # Root module
│
├── assets/                      # Static assets
├── environments/                # Environment configurations
├── styles.scss                  # Global styles
└── index.html                   # Main HTML file
```

## Key Components

### Core Services

- **AuthService**: Manages authentication state and tokens
- **DashboardService**: Fetches dashboard statistics
- **NotificationService**: Displays user notifications
- **ErrorHandlerService**: Global error handling

### Guards

- **AuthGuard**: Protects routes requiring authentication

### Interceptors

- **AuthInterceptor**: Adds JWT token to requests and handles token refresh

### Feature Services

- **PatientsService**: CRUD operations for patients
- **ConsultationsService**: Manages consultation data
- **PrescriptionsService**: Handles prescription operations

## Styling

The application uses:
- **Angular Material** theme with custom colors
- **SCSS** for component styles
- **Responsive breakpoints** for different screen sizes
- **Material Icons** for consistent iconography

### Theme Customization

Modify `src/styles.scss` to customize the Material theme:

```scss
@use '@angular/material' as mat;

$primary: mat.define-palette(mat.$indigo-palette);
$accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
```

## Environment Configuration

### Development
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: '/api/v1'
};
```

### Production
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '/api/v1'
};
```

## Building for Production

1. Build the application:
```bash
npm run build
```

2. The build artifacts will be stored in the `dist/` directory.

3. Serve with a static file server or integrate with backend.

## Testing

### Unit Tests

Run unit tests with Karma:
```bash
npm test
```

### E2E Tests

E2E testing setup can be added using Cypress or Protractor.

## Performance Optimization

- **Lazy Loading**: All feature modules are lazy-loaded
- **OnPush Strategy**: Used where applicable for better performance
- **TrackBy Functions**: Implemented in lists for efficient rendering
- **Preloading Strategy**: Modules are preloaded after initial load

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Common Issues

1. **Proxy Connection Refused**
   - Ensure backend is running on http://localhost:3000
   - Check proxy.conf.json configuration

2. **CORS Errors**
   - Verify backend CORS settings allow http://localhost:4200
   - Check if using correct API endpoints

3. **Module Not Found**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Ensure Angular CLI version matches project version

4. **Build Errors**
   - Check TypeScript version compatibility
   - Verify all imports are correct

## Best Practices

1. **Component Design**
   - Keep components small and focused
   - Use smart/dumb component pattern
   - Implement OnPush change detection where possible

2. **State Management**
   - Use services for shared state
   - Leverage RxJS for reactive patterns
   - Avoid component-to-component communication

3. **Form Handling**
   - Use reactive forms for complex forms
   - Implement proper validation
   - Show clear error messages

4. **API Integration**
   - Handle loading states
   - Implement proper error handling
   - Use interceptors for common functionality

## Contributing

1. Follow Angular style guide
2. Write unit tests for new components/services
3. Ensure responsive design works
4. Test across different browsers
5. Update documentation as needed

## License

UNLICENSED