# AlloDoc Load Testing Suite

## Overview

Comprehensive load testing suite for the AlloDoc medical management system using Artillery.js. This suite tests authentication, patient management, consultations, prescriptions, and complete medical workflows under various load conditions.

## Installation

```bash
cd load-testing
npm install
```

## Test Scenarios

### 1. Authentication Testing (`auth.yml`)
- User login/logout flows
- Token refresh mechanisms
- Failed login attempts
- Session management

### 2. Patient Management (`patients.yml`)
- Patient CRUD operations
- Search and filtering
- Medical history retrieval
- Bulk patient operations

### 3. Consultations (`consultations.yml`)
- Consultation creation with vital signs
- Physical examination data
- Diagnosis and treatment plans
- File attachments handling

### 4. Prescriptions (`prescriptions.yml`)
- Prescription creation with multiple medications
- Complex medication regimens
- Prescription searches
- Drug interaction checks

### 5. Full Workflow (`full-workflow.yml`)
- Complete patient journey from registration to prescription
- Multi-step medical consultation process
- Appointment scheduling and management
- Report generation

### 6. Stress Testing (`stress-test.yml`)
- High-concurrency scenarios
- Database connection pool testing
- Memory and resource usage monitoring
- Rate limiting validation

## Running Tests

### Quick Test
```bash
# Quick health check
npm run test:quick

# Individual scenario tests
npm run test:auth
npm run test:patients
npm run test:consultations
npm run test:prescriptions

# Full workflow test
npm run test:full

# Stress test
npm run test:stress
```

### Custom Configuration
```bash
# Run with specific environment
artillery run scenarios/auth.yml --environment staging

# Run with custom arrival rate
artillery run scenarios/patients.yml --arrival-rate 10

# Run with longer duration
artillery run scenarios/consultations.yml --duration 600
```

### Generate Reports
```bash
# Run test and generate HTML report
artillery run scenarios/full-workflow.yml --output results/report.json
artillery report results/report.json
```

## Load Test Phases

Each test scenario follows these phases:

1. **Warm-up**: Low load to establish baseline
2. **Ramp-up**: Gradually increasing load
3. **Sustained Load**: Target load for extended period
4. **Peak Load**: Maximum expected load
5. **Cool-down**: Gradual reduction

## Performance Targets

### Response Time SLAs
- Authentication: < 500ms
- Patient operations: < 1000ms
- Consultation creation: < 2000ms
- Prescription generation: < 1500ms
- Dashboard loading: < 1000ms

### Throughput Targets
- Concurrent users: 100
- Requests per second: 50
- Database connections: 50
- Error rate: < 1%

## Monitoring Metrics

### Key Metrics Tracked
- Response times (p50, p95, p99)
- Throughput (requests/second)
- Error rates and types
- Database connection pool usage
- Memory consumption
- CPU utilization

### Custom Metrics
- Consultation creation time
- Prescription generation time
- Full workflow completion time
- Authentication token refresh rate

## Test Data

### Generated Data
- Uses Faker.js for realistic test data
- Randomized patient information
- Medical conditions and medications
- Appointment scheduling patterns

### Data Cleanup
```bash
# Clean test data after load testing
node scripts/cleanup-test-data.js
```

## Results Analysis

### Viewing Results
```bash
# Generate HTML report
artillery report results/latest.json

# View in browser
open results/latest.html
```

### Performance Baselines

| Endpoint | Baseline (ms) | Target (ms) | Max (ms) |
|----------|---------------|-------------|----------|
| Login | 200 | 500 | 1000 |
| Patient Create | 300 | 1000 | 2000 |
| Patient List | 150 | 500 | 1000 |
| Consultation Create | 500 | 2000 | 3000 |
| Prescription Create | 400 | 1500 | 2500 |
| Dashboard Stats | 250 | 1000 | 2000 |

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure backend is running on port 3000
   - Check Docker containers are up

2. **Authentication Failures**
   - Verify test user credentials
   - Check JWT token configuration

3. **Rate Limiting**
   - Adjust arrival rate in test config
   - Increase rate limits for testing

4. **Database Connection Errors**
   - Check connection pool settings
   - Monitor database performance

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Load Tests
  run: |
    cd load-testing
    npm install
    npm run test:full
    npm run test:stress
```

### Performance Gates
- p95 response time < 2000ms
- Error rate < 1%
- Throughput > 40 req/s

## Best Practices

1. **Isolate Test Environment**
   - Use dedicated test database
   - Separate from production systems

2. **Gradual Load Increase**
   - Start with low load
   - Gradually increase to find breaking point

3. **Monitor System Resources**
   - Track CPU, memory, disk I/O
   - Monitor database performance

4. **Regular Testing**
   - Run after major changes
   - Establish performance baselines
   - Track trends over time

## Support

For issues or questions about load testing, contact the DevOps team or create an issue in the repository.