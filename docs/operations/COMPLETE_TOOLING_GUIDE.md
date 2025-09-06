# Complete AlloDoc DevOps & Testing Tooling Guide

## 🌟 Overview

AlloDoc includes a comprehensive DevOps and testing stack providing production-ready monitoring, testing, and CI/CD capabilities for your medical management system.

### **Technology Stack**
- **Infrastructure**: Docker, Docker Compose
- **Monitoring**: Prometheus, Grafana, Loki, AlertManager + Exporters
- **Testing**: Artillery.js (load), Playwright (UAT), Jest (unit)
- **CI/CD**: GitHub Actions with security scanning
- **Container Registry**: GitHub Container Registry (GHCR)

---

## 📊 Monitoring Stack (Prometheus + Grafana + Loki)

### **Architecture Overview**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  AlloDoc    │───▶│ Prometheus  │───▶│   Grafana   │
│     API     │    │  (Metrics)  │    │(Dashboard)  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Loki     │    │AlertManager │    │  Exporters  │
│   (Logs)    │    │ (Alerts)    │    │(Sys/DB/etc) │
└─────────────┘    └─────────────┘    └─────────────┘
```

### **Quick Start**

**1. Start Monitoring Stack:**
```bash
# Navigate to Docker directory
cd infrastructure/docker

# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose.monitoring.yml ps
```

**2. Access Monitoring Interfaces:**
- **Prometheus**: http://localhost:9090 (metrics collection)
- **Grafana**: http://localhost:3001 (username: admin, password: admin123!)
- **Loki**: http://localhost:3100 (log aggregation)
- **AlertManager**: http://localhost:9093 (alert handling)

**3. System Metrics Endpoints:**
- **Node Exporter**: http://localhost:9100/metrics (system metrics)
- **Postgres Exporter**: http://localhost:9187/metrics (database metrics)
- **Redis Exporter**: http://localhost:9121/metrics (cache metrics)
- **cAdvisor**: http://localhost:8080 (container metrics)
- **Nginx Exporter**: http://localhost:9113/metrics (web server metrics)

### **Grafana Dashboard Setup**

**Initial Configuration:**
1. Login to Grafana (admin/admin123!)
2. Go to Configuration → Data Sources
3. Add Prometheus: http://prometheus:9090
4. Add Loki: http://loki:3100
5. Import or create dashboards for your metrics

**Key Dashboards to Create:**
- **API Performance**: Response times, error rates, throughput
- **System Health**: CPU, memory, disk usage
- **Database Metrics**: Connection pools, query performance, locks
- **Business Metrics**: Patient registrations, consultations, prescriptions

### **Alerting Rules**

**Pre-configured Alerts** (in `infrastructure/monitoring/prometheus/rules/allodoc-alerts.yml`):
- API application down
- High error rate (>10% 5xx errors)
- High response time (>2 seconds 95th percentile)
- High memory usage (>80%)
- High CPU usage (>80%)
- Database connection issues
- High disk usage (>85%)

**Custom Alert Example:**
```yaml
groups:
  - name: custom-medical-alerts
    rules:
      - alert: HighPatientRegistrationFailures
        expr: rate(patient_registration_failures_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High patient registration failure rate"
          description: "Patient registration failures: {{ $value }} per second"
```

---

## 🧪 Load Testing with Artillery.js

### **Test Scenarios Available**

**1. Authentication Testing** (`auth.yml`):
- User login/logout flows
- Token refresh mechanisms  
- Failed login attempts
- Session management validation

**2. Patient Management** (`patients.yml`):
- Patient CRUD operations
- Search and filtering performance
- Medical history retrieval
- Bulk patient operations

**3. Consultation Workflows** (`consultations.yml`):
- Consultation creation with vital signs
- Physical examination data handling
- Diagnosis and treatment plan creation
- File attachment processing

**4. Prescription Management** (`prescriptions.yml`):
- Prescription creation with multiple medications
- Complex medication regimen handling
- Prescription search performance
- Drug interaction validation

**5. Complete Workflows** (`full-workflow.yml`):
- End-to-end patient journey (registration → consultation → prescription)
- Multi-step medical consultation processes
- Appointment scheduling workflows
- Report generation performance

**6. Stress Testing** (`stress-test.yml`):
- High-concurrency scenarios (100+ concurrent users)
- Database connection pool testing
- Memory and resource usage validation
- Rate limiting verification

### **Running Load Tests**

**Setup:**
```bash
cd testing/load-testing
npm install
```

**Individual Test Scenarios:**
```bash
# Authentication stress testing
npm run test:auth
# OR: artillery run scenarios/auth.yml

# Patient management performance
npm run test:patients

# Full medical workflow testing
npm run test:workflow

# High-load stress testing
npm run test:stress

# Custom configuration
artillery run scenarios/consultations.yml --config config/production.yml
```

**Custom Load Test Configuration:**
```bash
# Run with custom phases
artillery run scenarios/auth.yml \
  --phase-duration 60 \
  --phase-arrival-rate 10 \
  --phase-name "Custom Load Test"

# Output detailed metrics
artillery run scenarios/full-workflow.yml --output load-test-results.json

# Generate HTML report
artillery report load-test-results.json --output report.html
```

### **Interpreting Load Test Results**

**Key Metrics to Monitor:**
- **Response Time**: p50, p95, p99 percentiles
- **Requests per Second**: Throughput capacity
- **Error Rate**: 4xx/5xx response percentages
- **Virtual Users**: Concurrent user capacity
- **Resource Usage**: CPU, memory during tests

**Performance Benchmarks:**
- API response time < 200ms (p95)
- Error rate < 1%
- Throughput > 100 requests/second
- Database query time < 50ms (p95)

---

## 🎭 User Acceptance Testing (UAT) with Playwright

### **Test Coverage**

**Core Functionality Tests:**
- **Authentication**: Login, logout, registration, password reset
- **Patient Management**: Create, view, edit, search patients
- **Consultation Workflows**: Complete consultation creation
- **Prescription Management**: Create and manage prescriptions
- **Appointment Scheduling**: Book and manage appointments
- **Dashboard & Reports**: View analytics and generate reports

**Cross-Platform Testing:**
- **Desktop Browsers**: Chrome, Firefox, Safari
- **Mobile Devices**: iPhone, Android (responsive design)
- **Tablet**: iPad Pro compatibility
- **Accessibility**: WCAG compliance testing

### **Running UAT Tests**

**Setup:**
```bash
cd testing/user-acceptance-tests
npm install
npx playwright install  # Install browser binaries
```

**Test Execution:**
```bash
# Run all tests across all browsers
npm run test
# OR: npx playwright test

# Run specific browser tests
npm run test:chrome    # Chrome only
npm run test:firefox   # Firefox only  
npm run test:safari    # Safari only
npm run test:mobile    # Mobile devices

# Run specific test file
npx playwright test scenarios/01-authentication.spec.js

# Debug mode (opens browser)
npm run test:debug
# OR: npx playwright test --debug

# Headed mode (see browser during test)
npx playwright test --headed

# Run with specific timeout
npx playwright test --timeout=30000
```

**Test Configuration Options:**
```bash
# Run tests in parallel
npx playwright test --workers=4

# Run only failed tests
npx playwright test --last-failed

# Generate trace files for debugging
npx playwright test --trace=on

# Take screenshots on failure
npx playwright test --screenshot=on-failure

# Record video for failed tests
npx playwright test --video=retain-on-failure
```

### **Test Results & Debugging**

**View Test Reports:**
```bash
# Open HTML report
npm run test:report
# OR: npx playwright show-report

# View specific test trace
npx playwright show-trace test-results/trace.zip

# Generate JUnit XML report
npx playwright test --reporter=junit
```

**Test Result Locations:**
- **HTML Reports**: `reports/playwright-report/`
- **Screenshots**: `test-results/`
- **Videos**: `test-results/`
- **Traces**: `test-results/`

### **Writing Custom UAT Tests**

**Example Test Structure:**
```javascript
// scenarios/custom-workflow.spec.js
import { test, expect } from '@playwright/test';

test.describe('Custom Medical Workflow', () => {
  test('Complete patient consultation flow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'doctor@medical.com');
    await page.fill('[data-testid=password]', 'Test123!');
    await page.click('[data-testid=login-button]');
    
    // Navigate to patients
    await page.click('[data-testid=patients-nav]');
    
    // Create new patient
    await page.click('[data-testid=new-patient]');
    await page.fill('[data-testid=patient-name]', 'John Doe');
    await page.fill('[data-testid=patient-email]', 'john@example.com');
    await page.click('[data-testid=save-patient]');
    
    // Verify patient created
    await expect(page.locator('[data-testid=patient-list]')).toContainText('John Doe');
  });
});
```

---

## 🚀 GitHub Actions CI/CD Pipeline

### **Workflow Triggers**

**Automatic Triggers:**
- **Push to main/develop**: Full CI pipeline
- **Pull Request**: Code quality checks + tests
- **Daily at 2 AM UTC**: Security scans
- **Release tag creation**: Production deployment

**Manual Triggers:**
```bash
# Trigger specific workflows
gh workflow run ci.yml
gh workflow run security-scan.yml  
gh workflow run deploy.yml -f environment=production

# List available workflows
gh workflow list

# View workflow runs
gh run list --workflow=ci.yml
```

### **CI Pipeline Stages**

**Stage 1: Code Quality & Testing**
- ESLint/TSLint code quality checks
- Unit tests with Jest (API + Frontend)
- Code coverage reporting (Codecov)
- Build verification (TypeScript compilation)

**Stage 2: Security Analysis**
- **Dependency Scanning**: npm audit, Snyk vulnerability detection
- **Static Analysis**: CodeQL for JavaScript/TypeScript
- **Secret Detection**: GitLeaks, TruffleHog OSS
- **Docker Security**: Trivy container scanning
- **Infrastructure Scanning**: Checkov for Docker/Kubernetes

**Stage 3: Integration & Testing**
- Docker image building and testing
- Integration test execution
- Load testing with Artillery.js
- User acceptance testing with Playwright

**Stage 4: Deployment (main branch only)**
- Database backup creation
- Blue-green deployment strategy
- Database migration execution
- Smoke testing validation
- Automatic rollback on failure

### **Security Scan Results**

**Accessing Security Reports:**
- **GitHub Security Tab**: View vulnerability alerts
- **Action Artifacts**: Download detailed scan reports
- **SARIF Files**: Automated security finding uploads
- **Pull Request Comments**: Security scan summaries

**Security Scan Components:**
```yaml
# Components scanned
matrix:
  component: [api, frontend]  # Both API and frontend code

# Scan types performed
- npm audit (dependency vulnerabilities)
- Snyk security scan (code + dependencies)  
- Docker image scanning (Trivy)
- Static analysis (CodeQL)
- Secret detection (GitLeaks + TruffleHog)
- Infrastructure as Code (Checkov)
```

### **Deployment Process**

**Production Deployment Steps:**
1. **Pre-deployment Checks**: Image validation, environment verification
2. **Database Backup**: Automatic backup creation
3. **Migration Execution**: Database schema updates
4. **Zero-downtime Deployment**: Rolling update with health checks
5. **Post-deployment Validation**: Smoke tests and monitoring
6. **Rollback Capability**: Automatic rollback on failure

**Deployment Commands:**
```bash
# Manual production deployment
gh workflow run deploy.yml \
  -f environment=production \
  -f image_tag=v1.2.3

# Emergency rollback
gh workflow run deploy.yml \
  -f environment=production \
  -f action=rollback

# Staging deployment
gh workflow run deploy.yml \
  -f environment=staging
```

---

## 🔄 Complete Development Workflow

### **Daily Development Setup**

**1. Start Full Development Environment:**
```bash
# Start core services (API, Frontend, Database, Redis)
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d

# Start monitoring (optional for development)
docker-compose -f docker-compose.monitoring.yml up -d

# Verify all services
docker-compose -f docker-compose.dev.yml ps
```

**2. Development URLs:**
- **Frontend**: http://localhost:4200
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Database Admin**: http://localhost:5050 (admin@allodoc.dev/admin123)

### **Testing During Development**

**Unit Tests (Watch Mode):**
```bash
# API unit tests
cd src/api
npm run test:watch

# Frontend unit tests  
cd src/frontend
npm run test:watch
```

**Quick Integration Testing:**
```bash
# Run API integration tests
cd src/api && npm run test:e2e

# Quick UAT smoke test
cd testing/user-acceptance-tests && npm run test:smoke

# Quick load test
cd testing/load-testing && npm run test:auth
```

### **Pre-Commit Workflow**

**Before Creating Pull Request:**
```bash
# 1. Code quality
cd src/api && npm run lint && npm run format
cd src/frontend && npm run lint

# 2. Full test suite
cd src/api && npm run test:ci
cd src/frontend && npm run test:ci

# 3. Build verification
cd src/api && npm run build
cd src/frontend && npm run build

# 4. Quick load test
cd testing/load-testing && npm run test:auth

# 5. Essential UAT
cd testing/user-acceptance-tests && npm run test:essential
```

### **Pre-Release Validation**

**Complete Pre-Production Testing:**
```bash
# 1. Full load testing suite
cd testing/load-testing
npm run test:all  # All scenarios

# 2. Complete UAT across all browsers
cd testing/user-acceptance-tests
npm run test:full  # All browsers + mobile

# 3. Security validation
gh workflow run security-scan.yml

# 4. Performance benchmarking
cd testing/load-testing
npm run test:benchmark
```

**Production Readiness Checklist:**
- [ ] All unit tests passing (>95% coverage)
- [ ] Integration tests passing
- [ ] Load tests meet performance benchmarks
- [ ] UAT tests passing across all browsers
- [ ] Security scans show no critical vulnerabilities
- [ ] Database migrations tested
- [ ] Monitoring dashboards configured
- [ ] Alert thresholds set appropriately

---

## 🎯 Best Practices & Tips

### **Monitoring Best Practices**

**Alert Configuration:**
- Set alert thresholds based on baseline metrics
- Use multiple severity levels (warning, critical)
- Configure different notification channels per severity
- Test alert rules during low-traffic periods

**Dashboard Organization:**
- Create role-based dashboards (developer, ops, business)
- Use consistent naming conventions and color schemes
- Include both technical and business metrics
- Set up automated dashboard screenshots for reports

**Log Management:**
- Use structured logging (JSON format)
- Include correlation IDs for request tracing
- Set appropriate log retention periods
- Create log-based alerts for error patterns

### **Testing Best Practices**

**Load Testing:**
- Run tests from production-like environments
- Use realistic test data and user patterns
- Test during different times of day
- Monitor both application and database performance
- Gradually increase load to find breaking points

**UAT Testing:**
- Maintain test data independence between runs
- Use page object patterns for maintainable tests
- Include accessibility testing (axe-core integration)
- Test critical user journeys prioritized by business impact
- Run tests in CI/CD pipeline for every release

**Security Testing:**
- Run security scans on every commit
- Keep security tools updated
- Review and triage security findings promptly
- Implement security testing in development environments

### **CI/CD Best Practices**

**Pipeline Optimization:**
- Use caching for dependencies and build artifacts
- Run tests in parallel where possible
- Fail fast on critical issues
- Use matrix builds for multi-environment testing

**Deployment Safety:**
- Always use blue-green or rolling deployments
- Implement automatic rollback triggers
- Test deployment processes in staging
- Monitor key metrics during deployments
- Use feature flags for risky changes

**Environment Management:**
- Keep development, staging, and production environments consistent
- Use infrastructure as code (Docker Compose)
- Automate environment provisioning
- Regularly refresh staging with production-like data

---

## 🔧 Troubleshooting

### **Common Monitoring Issues**

**Prometheus Not Collecting Metrics:**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check service discovery
docker-compose -f docker-compose.monitoring.yml logs prometheus

# Verify network connectivity
docker network ls
docker network inspect monitoring_network
```

**Grafana Dashboard Issues:**
```bash
# Check data source connectivity
# Grafana → Configuration → Data Sources → Test

# Verify Prometheus query syntax
# Use Prometheus web UI to test queries first

# Check dashboard variables and time ranges
```

### **Common Load Testing Issues**

**Connection Refused Errors:**
```bash
# Verify API is running
curl http://localhost:3000/health

# Check network configuration
docker-compose -f docker-compose.dev.yml ps
docker network inspect medical_dev_network
```

**Authentication Failures:**
```bash
# Verify test user credentials exist in database
# Check JWT token format and expiration
# Validate API authentication endpoints manually
```

### **Common UAT Issues**

**Browser Installation Problems:**
```bash
# Reinstall browser binaries
npx playwright install --force

# Check browser versions
npx playwright --version

# Install system dependencies (Linux)
npx playwright install-deps
```

**Test Timeout Issues:**
```bash
# Increase timeout in playwright.config.js
use: {
  actionTimeout: 30000,
  navigationTimeout: 60000
}

# Or use per-test timeouts
test.setTimeout(60000);
```

### **Common CI/CD Issues**

**Build Failures:**
```bash
# Check Node.js version compatibility
# Verify package-lock.json is committed
# Check for missing environment variables
# Review build logs for specific error messages
```

**Deployment Failures:**
```bash
# Check deployment logs
gh run view --log

# Verify environment secrets are set
gh secret list

# Check Docker image builds
# Validate deployment scripts
```

---

## 📈 Scaling Recommendations

### **Monitoring Scale-Up**
- **High Traffic**: Add Prometheus federation for multiple instances
- **Long-term Storage**: Configure remote storage (Thanos, Cortex)
- **Multi-region**: Deploy monitoring stack per region
- **Alert Fatigue**: Implement alert aggregation and smart routing

### **Testing Scale-Up**
- **Parallel Load Testing**: Use distributed Artillery.js setup
- **UAT Parallelization**: Increase Playwright worker count
- **Test Data Management**: Implement test data factories and cleanup
- **CI/CD Parallelization**: Use GitHub Actions matrix builds

### **Infrastructure Scale-Up**
- **Container Orchestration**: Consider Kubernetes for production
- **Database Scaling**: Implement read replicas and connection pooling
- **CDN Integration**: Add CloudFlare or AWS CloudFront
- **Auto-scaling**: Implement horizontal pod autoscaling

---

This comprehensive guide provides everything you need to effectively use all the DevOps and testing tools in your AlloDoc project. Each tool is production-ready and configured for a medical management system's requirements.