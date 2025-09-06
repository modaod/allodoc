# AlloDoc Quick Reference Commands

## 🚀 **Quick Start Commands**

### **Start Development Environment**
```bash
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d
```

### **Start Monitoring Stack**
```bash
cd infrastructure/docker
docker-compose -f docker-compose.monitoring.yml up -d
```

### **Access URLs**
- Frontend: http://localhost:4200
- API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin123!)

---

## 📊 **Monitoring Commands**

```bash
# Start monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Check service status
docker-compose -f docker-compose.monitoring.yml ps

# View logs
docker-compose -f docker-compose.monitoring.yml logs grafana
docker-compose -f docker-compose.monitoring.yml logs prometheus

# Stop monitoring
docker-compose -f docker-compose.monitoring.yml down
```

---

## 🧪 **Load Testing Commands**

```bash
cd testing/load-testing

# Install dependencies
npm install

# Run different test scenarios
npm run test:auth        # Authentication testing
npm run test:patients    # Patient management
npm run test:workflow    # Complete workflows  
npm run test:stress      # Stress testing

# Custom Artillery commands
artillery run scenarios/auth.yml
artillery run scenarios/full-workflow.yml --output results.json
artillery report results.json --output report.html
```

---

## 🎭 **UAT Testing Commands**

```bash
cd testing/user-acceptance-tests

# Setup
npm install
npx playwright install

# Run tests
npm run test              # All browsers
npm run test:chrome       # Chrome only
npm run test:firefox      # Firefox only
npm run test:mobile       # Mobile devices
npm run test:debug        # Debug mode

# View results
npm run test:report       # HTML report
npx playwright show-trace test-results/trace.zip
```

---

## 🚀 **GitHub Actions Commands**

```bash
# Trigger workflows manually
gh workflow run ci.yml
gh workflow run security-scan.yml
gh workflow run deploy.yml -f environment=production

# View workflow status
gh workflow list
gh run list --workflow=ci.yml
gh run view --log

# Check security
gh secret list
gh workflow view security-scan.yml
```

---

## 🔧 **Development Commands**

```bash
# API Development
cd src/api
npm run start:dev         # Development server
npm run test             # Unit tests
npm run test:watch       # Watch mode
npm run test:e2e         # Integration tests
npm run build            # Production build
npm run lint             # Code linting

# Frontend Development  
cd src/frontend
npm start                # Development server
npm run test             # Unit tests
npm run test:watch       # Watch mode
npm run build            # Production build
npm run lint             # Code linting
```

---

## 🐳 **Docker Commands**

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml ps
docker-compose -f docker-compose.dev.yml logs api-dev
docker-compose -f docker-compose.dev.yml down

# Production environment
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml ps

# Monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d
docker-compose -f docker-compose.monitoring.yml ps

# Clean up
docker system prune -f
docker volume prune -f
```

---

## 🔍 **Debugging Commands**

```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:4200
curl http://localhost:9090/-/healthy

# Database connection
docker-compose -f docker-compose.dev.yml exec postgres-dev psql -U dev_user -d dev_db

# View container logs
docker logs allodoc_api_dev
docker logs allodoc_grafana
docker logs allodoc_prometheus

# Container shell access
docker exec -it allodoc_api_dev bash
docker exec -it allodoc_postgres_dev psql -U dev_user -d dev_db
```

---

## 📈 **Performance Testing**

```bash
# Quick performance check
cd testing/load-testing
artillery quick --count 10 --num 5 http://localhost:3000/health

# Stress test with monitoring
artillery run scenarios/stress-test.yml &
# Monitor in Grafana: http://localhost:3001

# Custom load test
artillery run scenarios/auth.yml --phase-duration 60 --phase-arrival-rate 10
```

---

## 🔒 **Security Commands**

```bash
# Manual security scans
cd src/api && npm audit
cd src/frontend && npm audit

# Dependency vulnerability check
cd src/api && npx snyk test
cd src/frontend && npx snyk test

# Docker security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image allodoc-api:latest
```

---

## 📊 **Monitoring Queries (Prometheus)**

```promql
# API response time (95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="allodoc-api"}[5m]))

# Error rate
rate(http_requests_total{job="allodoc-api",status=~"5.."}[5m])

# Request rate
rate(http_requests_total{job="allodoc-api"}[5m])

# Memory usage
container_memory_usage_bytes{name="allodoc_api_prod"} / container_spec_memory_limit_bytes{name="allodoc_api_prod"} * 100

# CPU usage
rate(container_cpu_usage_seconds_total{name="allodoc_api_prod"}[5m]) * 100
```

---

## 🚨 **Emergency Commands**

```bash
# Stop all services
docker stop $(docker ps -q)

# Emergency rollback (production)
gh workflow run deploy.yml -f environment=production -f action=rollback

# Check system resources
docker stats
df -h
free -h
ps aux --sort=-%cpu | head

# Database backup
docker-compose -f docker-compose.prod.yml exec postgres-prod \
  pg_dump -U ${DATABASE_USERNAME} ${DATABASE_NAME} > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🔄 **Daily Workflow**

```bash
# 1. Start development
cd infrastructure/docker && docker-compose -f docker-compose.dev.yml up -d

# 2. Run tests during development
cd src/api && npm run test:watch
cd src/frontend && npm run test:watch

# 3. Before commit
cd src/api && npm run lint && npm run test:ci
cd src/frontend && npm run lint && npm run test:ci

# 4. Pre-release testing
cd testing/load-testing && npm run test:auth
cd testing/user-acceptance-tests && npm run test

# 5. Clean up at end of day
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.monitoring.yml down
```

---

*💡 **Tip**: Bookmark this page for quick access to all essential AlloDoc commands!*