# AlloDoc Operations Runbook

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** April 2025

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Daily Operations](#daily-operations)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Backup & Recovery](#backup--recovery)
6. [Security Operations](#security-operations)
7. [Maintenance Procedures](#maintenance-procedures)
8. [Incident Response](#incident-response)
9. [Contact Information](#contact-information)

---

## 🏗️ Overview

### System Summary
- **Application:** AlloDoc Medical Management System
- **Environment:** Production, Staging, Development
- **Technology Stack:** NestJS (Backend), Angular (Frontend), PostgreSQL, Redis
- **Infrastructure:** Docker containers, Nginx reverse proxy
- **Monitoring:** Prometheus, Grafana, Loki, AlertManager

### Service Dependencies
```
Internet → Nginx → AlloDoc Frontend (Angular)
              ↓
Internet → Nginx → AlloDoc Backend (NestJS) → PostgreSQL
              ↓                           ↓
              Redis Cache ←――――――――――――――――┘
              ↓
       Monitoring Stack (Prometheus/Grafana)
```

---

## 🏛️ System Architecture

### Production Environment
- **Frontend:** Nginx serving Angular app on port 80/443
- **Backend:** Node.js/NestJS on port 3000
- **Database:** PostgreSQL on port 5433
- **Cache:** Redis on port 6379
- **Monitoring:** Prometheus (9090), Grafana (3001)

### Resource Requirements
| Service | CPU | Memory | Disk | Network |
|---------|-----|--------|------|---------|
| Frontend | 0.5 cores | 512MB | 2GB | 100Mbps |
| Backend | 2 cores | 2GB | 5GB | 1Gbps |
| Database | 2 cores | 4GB | 100GB | 1Gbps |
| Redis | 1 core | 1GB | 5GB | 500Mbps |
| Monitoring | 1 core | 2GB | 20GB | 500Mbps |

---

## 📅 Daily Operations

### Morning Checklist (9:00 AM)

#### 1. System Health Check
```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check service health endpoints
curl -f http://localhost:3000/health || echo "Backend health check failed"
curl -f http://localhost:4200 || echo "Frontend health check failed"

# Check database connectivity
docker exec allodoc_postgres_prod pg_isready

# Check Redis
docker exec allodoc_redis_prod redis-cli ping
```

#### 2. Monitor Dashboard Review
- **Access Grafana:** http://monitoring.allodoc.com:3001
- **Check Dashboards:**
  - Application Performance Dashboard
  - Infrastructure Overview
  - Database Performance
  - Security Events

#### 3. Log Review
```bash
# Check application logs for errors
docker logs allodoc_backend_prod --since 24h | grep -i error

# Check nginx access logs
docker logs allodoc_nginx_prod --since 24h | grep -E "(4[0-9]{2}|5[0-9]{2})"

# Check system resource usage
docker stats --no-stream
```

#### 4. Alert Status
- Review AlertManager: http://monitoring.allodoc.com:9093
- Check for any active alerts
- Verify alert notification channels

### Evening Checklist (6:00 PM)

#### 1. Performance Review
```bash
# Check database performance
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE n_distinct > 100 
ORDER BY n_distinct DESC LIMIT 10;"

# Check slow queries
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC LIMIT 10;"
```

#### 2. Backup Verification
```bash
# Verify today's backup
ls -la /backups/$(date +%Y%m%d)*

# Test backup integrity (weekly)
if [ $(date +%u) -eq 1 ]; then
    ./scripts/test-backup-restore.sh /backups/latest.sql.gz
fi
```

#### 3. Security Check
```bash
# Check for failed login attempts
docker exec allodoc_backend_prod grep "login failed" /var/log/*.log | tail -20

# Review access patterns
docker logs allodoc_nginx_prod --since 24h | \
    awk '{print $1}' | sort | uniq -c | sort -rn | head -20
```

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

#### Application Metrics
- **Response Time:** < 2000ms (p95)
- **Error Rate:** < 1%
- **Throughput:** > 100 req/min
- **Active Users:** Monitor trends
- **Database Connections:** < 50

#### Infrastructure Metrics
- **CPU Usage:** < 80%
- **Memory Usage:** < 85%
- **Disk Usage:** < 90%
- **Network I/O:** Monitor for spikes
- **Container Health:** All containers running

### Critical Alerts

#### Immediate Response (PagerDuty/SMS)
- **Service Down:** Any core service unavailable
- **Database Connection Failure:** Cannot connect to PostgreSQL
- **High Error Rate:** > 5% errors in last 5 minutes
- **Memory Critical:** > 95% memory usage
- **Disk Critical:** > 95% disk usage

#### Standard Alerts (Email/Slack)
- **High Response Time:** p95 > 3000ms for 5 minutes
- **High CPU:** > 80% CPU for 10 minutes
- **Failed Backups:** Backup job failed
- **Security Events:** Multiple failed logins
- **Certificate Expiry:** SSL certificate expires in 30 days

### Alert Response Procedures

#### Service Down Alert
1. **Immediate Actions (< 5 minutes)**
   - Check service status: `docker-compose ps`
   - Restart failed service: `docker-compose restart <service>`
   - Check logs: `docker logs <container> --tail 100`

2. **Investigation (< 15 minutes)**
   - Check resource usage: `docker stats`
   - Review recent deployments
   - Check external dependencies

3. **Communication**
   - Update status page
   - Notify stakeholders if > 15 minutes downtime

#### Database Issues
1. **Connection Issues**
   ```bash
   # Check database status
   docker exec allodoc_postgres_prod pg_isready
   
   # Check active connections
   docker exec allodoc_postgres_prod psql -U allodoc_prod -c "
   SELECT count(*) FROM pg_stat_activity;"
   ```

2. **Performance Issues**
   ```bash
   # Check running queries
   docker exec allodoc_postgres_prod psql -U allodoc_prod -c "
   SELECT query, state, query_start 
   FROM pg_stat_activity 
   WHERE state = 'active';"
   
   # Kill long-running queries if necessary
   # SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;
   ```

---

## 💾 Backup & Recovery

### Backup Schedule
- **Database:** Daily at 2:00 AM (automated)
- **Application Files:** Daily at 3:00 AM
- **Configuration:** Weekly
- **Full System:** Weekly

### Backup Locations
- **Primary:** Local storage `/backups/`
- **Secondary:** AWS S3 bucket (if configured)
- **Retention:** 30 daily, 12 weekly, 12 monthly

### Backup Operations

#### Manual Database Backup
```bash
# Create backup
./scripts/backup-database.sh production

# Verify backup
pg_restore --list /backups/backup_production_$(date +%Y%m%d)_*.sql.gz | head -10
```

#### Restore Procedures

##### Emergency Database Restore
```bash
# 1. Stop application services
docker-compose stop backend frontend

# 2. Backup current database (just in case)
./scripts/backup-database.sh production emergency_$(date +%Y%m%d_%H%M%S)

# 3. Restore from backup
./scripts/restore-database.sh /backups/backup_production_YYYYMMDD_HHMMSS.sql.gz production

# 4. Verify restore
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "\dt"

# 5. Start services
docker-compose start backend frontend

# 6. Smoke test
curl -f http://localhost:3000/health
```

##### Partial Data Recovery
```bash
# Export specific tables
docker exec allodoc_postgres_prod pg_dump -U allodoc_prod -d allodoc_prod -t patients -t consultations > partial_backup.sql

# Restore specific tables
docker exec -i allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod < partial_backup.sql
```

### Recovery Time Objectives (RTO)
- **Database Restore:** 30 minutes
- **Full Application:** 1 hour
- **Partial Recovery:** 15 minutes

### Recovery Point Objectives (RPO)
- **Maximum Data Loss:** 24 hours (daily backups)
- **Critical Data Loss:** 1 hour (transaction logs)

---

## 🔒 Security Operations

### Daily Security Tasks

#### 1. Log Analysis
```bash
# Check authentication failures
grep -i "authentication failed" /var/log/auth.log | tail -20

# Check suspicious network activity
netstat -tuln | grep ESTABLISHED | wc -l

# Review nginx access logs for suspicious patterns
tail -1000 /var/log/nginx/access.log | grep -E "(sql|script|union|select)" | head -20
```

#### 2. User Access Review
```bash
# List active sessions
docker exec allodoc_backend_prod grep "user logged in" /var/log/*.log | tail -20

# Check for privilege escalation
docker exec allodoc_backend_prod grep "role changed" /var/log/*.log | tail -10
```

#### 3. System Updates
```bash
# Check for security updates (weekly)
docker exec allodoc_backend_prod npm audit
docker exec allodoc_frontend_prod npm audit

# Update containers (monthly, during maintenance window)
docker-compose pull
docker-compose up -d
```

### Security Incident Response

#### Suspected Breach
1. **Immediate Actions**
   - Change all administrative passwords
   - Review all user accounts for unauthorized changes
   - Check for unauthorized data access

2. **Investigation**
   - Export all relevant logs
   - Document timeline of events
   - Identify affected systems and data

3. **Containment**
   - Block suspicious IP addresses
   - Disable compromised accounts
   - Isolate affected systems if necessary

4. **Recovery**
   - Restore from clean backups if necessary
   - Update all security credentials
   - Apply security patches

---

## 🔧 Maintenance Procedures

### Scheduled Maintenance Windows
- **Weekly:** Sunday 2:00-4:00 AM (minor updates, patches)
- **Monthly:** First Sunday 2:00-6:00 AM (major updates, system maintenance)
- **Quarterly:** Planned downtime for major upgrades

### Pre-Maintenance Checklist
```bash
# 1. Notify users about maintenance window
# 2. Create full system backup
./scripts/backup-database.sh production pre_maintenance_$(date +%Y%m%d)

# 3. Document current system state
docker-compose ps > maintenance_log_$(date +%Y%m%d).txt
docker stats --no-stream >> maintenance_log_$(date +%Y%m%d).txt

# 4. Prepare rollback plan
cp docker-compose.prod.yml docker-compose.prod.yml.backup
```

### Common Maintenance Tasks

#### Update Application
```bash
# 1. Pull latest code
git fetch origin
git checkout main
git pull origin main

# 2. Build new images
docker-compose -f docker-compose.prod.yml build --no-cache

# 3. Deploy with zero downtime
./scripts/deploy.sh

# 4. Verify deployment
./scripts/post-deploy-checks.sh
```

#### Database Maintenance
```bash
# Analyze and vacuum database (monthly)
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
ANALYZE;
VACUUM ANALYZE;
REINDEX DATABASE allodoc_prod;
"

# Update statistics
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT schemaname, tablename, last_analyze, last_autoanalyze 
FROM pg_stat_user_tables 
ORDER BY last_analyze DESC;
"
```

#### Log Rotation
```bash
# Clean old logs (weekly)
find /var/log -name "*.log" -type f -mtime +30 -exec rm {} \;

# Rotate docker logs
docker system prune -f

# Archive important logs
tar -czf logs_archive_$(date +%Y%m%d).tar.gz /var/log/allodoc/
```

---

## 🚨 Incident Response

### Incident Classification

#### Severity 1 (Critical)
- **Definition:** Complete service outage or data breach
- **Response Time:** 15 minutes
- **Escalation:** Immediate to on-call engineer and management

#### Severity 2 (High)
- **Definition:** Significant degradation affecting multiple users
- **Response Time:** 1 hour
- **Escalation:** On-call engineer, notify manager within 2 hours

#### Severity 3 (Medium)
- **Definition:** Limited impact, workaround available
- **Response Time:** 4 hours
- **Escalation:** Next business day

#### Severity 4 (Low)
- **Definition:** Minor issues, cosmetic problems
- **Response Time:** Next business day
- **Escalation:** Standard ticket queue

### Incident Response Workflow

#### 1. Detection & Initial Response
- **Automated Monitoring:** Alerts trigger incident
- **Manual Discovery:** User reports or routine checks
- **Acknowledge Alert:** Within 5 minutes
- **Initial Assessment:** Determine severity level

#### 2. Investigation & Diagnosis
```bash
# Quick health check
./scripts/quick-health-check.sh

# Gather system info
./scripts/system-diagnostics.sh > incident_$(date +%Y%m%d_%H%M%S).log

# Check recent changes
git log --oneline -10
docker logs --since 1h allodoc_backend_prod | tail -50
```

#### 3. Resolution & Recovery
- **Implement Fix:** Based on diagnosis
- **Test Resolution:** Verify fix works
- **Monitor System:** Ensure stability
- **Document Actions:** All steps taken

#### 4. Communication
- **Status Page Updates:** Keep stakeholders informed
- **Internal Communication:** Slack/Teams updates
- **External Communication:** Customer notifications if needed

#### 5. Post-Incident Review
- **Root Cause Analysis:** Within 48 hours
- **Action Items:** Prevent recurrence
- **Documentation Update:** Update runbooks
- **Process Improvement:** Update procedures

---

## 📞 Contact Information

### On-Call Rotation
- **Primary:** DevOps Engineer (24/7)
- **Secondary:** Senior Developer (Business hours)
- **Escalation:** Engineering Manager

### Emergency Contacts
- **DevOps Team:** devops@allodoc.com
- **Engineering Manager:** manager@allodoc.com
- **Database Administrator:** dba@allodoc.com
- **Security Team:** security@allodoc.com

### External Vendors
- **AWS Support:** [Support Case System]
- **Database Consultant:** [Contact Details]
- **Security Consultant:** [Contact Details]

### Communication Channels
- **Slack:** #allodoc-ops, #allodoc-alerts
- **Email:** ops@allodoc.com
- **PagerDuty:** [Service Key]
- **Status Page:** status.allodoc.com

---

## 📋 Quick Reference Commands

### System Status
```bash
# All services status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats --no-stream

# Application health
curl -f http://localhost:3000/health
```

### Logs
```bash
# Application logs
docker logs allodoc_backend_prod -f

# Error logs only
docker logs allodoc_backend_prod 2>&1 | grep -i error

# Nginx access logs
docker logs allodoc_nginx_prod --tail 100
```

### Database
```bash
# Database status
docker exec allodoc_postgres_prod pg_isready

# Connect to database
docker exec -it allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod

# Database size
docker exec allodoc_postgres_prod psql -U allodoc_prod -c "SELECT pg_database_size('allodoc_prod');"
```

### Emergency Procedures
```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Emergency database backup
./scripts/backup-database.sh production emergency_$(date +%Y%m%d_%H%M%S)

# Emergency rollback
./scripts/rollback.sh
```

---

**Document Maintained By:** DevOps Team  
**Review Schedule:** Monthly  
**Approval:** Engineering Manager  
**Distribution:** Operations Team, On-Call Engineers