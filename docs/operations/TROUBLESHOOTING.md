# AlloDoc Troubleshooting Guide

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Target Audience:** DevOps Engineers, Developers, Support Team

## 🎯 Quick Issue Resolution Index

| Issue Category | Time to Resolve | Page |
|----------------|-----------------|------|
| **Service Down** | 5-15 minutes | [Service Issues](#service-issues) |
| **Database Problems** | 10-30 minutes | [Database Issues](#database-issues) |
| **Performance Issues** | 15-45 minutes | [Performance Problems](#performance-problems) |
| **Authentication Problems** | 5-20 minutes | [Authentication Issues](#authentication-issues) |
| **Network/Connectivity** | 10-30 minutes | [Network Issues](#network-issues) |
| **Deployment Failures** | 20-60 minutes | [Deployment Issues](#deployment-issues) |

---

## 🚨 Service Issues

### Application Won't Start

#### Symptoms
- Docker containers not running
- Health check endpoints return 503
- Users can't access the application

#### Quick Diagnosis
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check container logs
docker logs allodoc_backend_prod --tail 50
docker logs allodoc_frontend_prod --tail 50
```

#### Common Causes & Solutions

##### 1. Port Conflicts
```bash
# Check what's using the port
netstat -tulpn | grep :3000
netstat -tulpn | grep :4200

# Kill process using the port
sudo kill -9 $(sudo lsof -t -i:3000)

# Or change port in docker-compose.yml
```

##### 2. Environment Variables Missing
```bash
# Check if .env files exist
ls -la backend/.env*
ls -la frontend/.env*

# Verify required variables
docker exec allodoc_backend_prod env | grep -E "(DATABASE_|JWT_|REDIS_)"
```

##### 3. Database Connection Issues
```bash
# Test database connectivity
docker exec allodoc_postgres_prod pg_isready

# Check database credentials
docker exec -it allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "SELECT 1;"
```

##### 4. Memory/Resource Issues
```bash
# Check system resources
free -h
df -h
docker stats --no-stream

# If out of memory, restart with memory cleanup
docker system prune -f
docker-compose restart
```

### Service Starts But Crashes

#### Symptoms
- Container starts then stops immediately
- Repeated restart attempts
- Exit code errors in logs

#### Diagnosis Steps
```bash
# Check exit codes and restart count
docker-compose ps

# View detailed logs
docker logs allodoc_backend_prod --since 10m

# Check for core dumps
ls -la /var/crash/
```

#### Common Solutions

##### 1. Application Error
```bash
# Check application logs for stack traces
docker logs allodoc_backend_prod 2>&1 | grep -A 10 -B 10 "Error:"

# Common fixes:
# - Fix syntax errors in code
# - Update environment variables
# - Check database schema matches application
```

##### 2. Resource Limits
```bash
# Check resource limits in docker-compose.yml
grep -A 5 -B 5 "mem_limit\|cpus" docker-compose.prod.yml

# Increase limits if needed:
# mem_limit: 2g
# cpus: 2
```

---

## 🗄️ Database Issues

### Database Connection Failures

#### Symptoms
- "Connection refused" errors
- Backend can't connect to database
- Timeout errors

#### Quick Diagnosis
```bash
# Check database container
docker ps | grep postgres
docker logs allodoc_postgres_prod --tail 20

# Test connection from backend container
docker exec allodoc_backend_prod pg_isready -h allodoc_postgres_prod -p 5432 -U allodoc_prod
```

#### Solutions

##### 1. Database Container Not Running
```bash
# Start database container
docker-compose -f docker-compose.prod.yml up -d postgres

# Check startup logs
docker logs allodoc_postgres_prod -f
```

##### 2. Wrong Connection Parameters
```bash
# Verify environment variables
docker exec allodoc_backend_prod env | grep DATABASE

# Check database is accepting connections
docker exec allodoc_postgres_prod netstat -ln | grep 5432
```

##### 3. Connection Pool Exhaustion
```bash
# Check active connections
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT count(*) as active_connections,
       max_conn.setting as max_connections,
       ROUND((count(*) * 100.0) / max_conn.setting::numeric, 2) as pct_used
FROM pg_stat_activity,
     (SELECT setting FROM pg_settings WHERE name = 'max_connections') max_conn
GROUP BY max_conn.setting;"

# Kill idle connections if needed
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND query_start < NOW() - INTERVAL '1 hour';"
```

### Database Performance Issues

#### Symptoms
- Slow query responses
- High CPU usage on database
- Application timeouts

#### Diagnosis
```bash
# Check database performance
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT query, calls, total_exec_time, mean_exec_time, max_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;"

# Check locks
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED;"
```

#### Solutions

##### 1. Missing Indexes
```bash
# Find missing indexes
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public' 
AND n_distinct > 100 
ORDER BY n_distinct DESC;"

# Add indexes for frequently queried columns
# CREATE INDEX CONCURRENTLY idx_patients_email ON patients(email);
```

##### 2. Outdated Statistics
```bash
# Update table statistics
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
ANALYZE;
VACUUM ANALYZE;"
```

##### 3. Long-Running Queries
```bash
# Find long-running queries
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
AND now() - query_start > interval '5 minutes';"

# Kill problematic queries (use carefully!)
# SELECT pg_terminate_backend(<pid>);
```

---

## ⚡ Performance Problems

### Slow API Response Times

#### Symptoms
- API responses taking > 3 seconds
- Frontend showing loading spinners
- Timeout errors

#### Diagnosis
```bash
# Check response times in nginx logs
docker logs allodoc_nginx_prod --tail 1000 | \
    awk '{print $NF}' | grep -E '^[0-9\.]+$' | sort -n | tail -20

# Monitor real-time requests
docker logs allodoc_nginx_prod -f | grep -E '[0-9]{3} [0-9\.]+ [0-9\.]+'

# Check backend metrics
curl http://localhost:3000/metrics | grep http_request_duration
```

#### Solutions

##### 1. Database Query Optimization
```bash
# Enable query logging temporarily
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();"

# Check slow queries
docker exec allodoc_postgres_prod tail -f /var/lib/postgresql/data/log/postgresql-*.log | grep "duration:"
```

##### 2. Cache Issues
```bash
# Check Redis connectivity and performance
docker exec allodoc_redis_prod redis-cli ping
docker exec allodoc_redis_prod redis-cli info stats

# Clear cache if corrupted
docker exec allodoc_redis_prod redis-cli flushdb
```

##### 3. Memory Issues
```bash
# Check if application is swapping
docker stats --no-stream
free -h

# Check for memory leaks in Node.js
docker exec allodoc_backend_prod node -e "console.log(process.memoryUsage())"

# Restart backend if memory leak detected
docker-compose restart backend
```

### High CPU Usage

#### Symptoms
- System becomes unresponsive
- Docker stats show high CPU
- Slow user interactions

#### Diagnosis
```bash
# Check CPU usage by container
docker stats --no-stream

# Check system load
top -bn1 | head -20

# Profile Node.js application
docker exec allodoc_backend_prod top -p $(docker exec allodoc_backend_prod pidof node)
```

#### Solutions

##### 1. Inefficient Code/Loops
```bash
# Check for busy loops in application logs
docker logs allodoc_backend_prod 2>&1 | grep -i "loop\|infinite\|recursion"

# Profile specific endpoints
# Add timing logs to identify bottlenecks
```

##### 2. Resource Limits
```bash
# Set CPU limits in docker-compose.yml
# cpus: "1.5"
# mem_limit: 2g

# Restart with new limits
docker-compose up -d backend
```

---

## 🔐 Authentication Issues

### Users Can't Log In

#### Symptoms
- Valid credentials rejected
- "Invalid credentials" error
- JWT token issues

#### Diagnosis
```bash
# Check authentication logs
docker logs allodoc_backend_prod 2>&1 | grep -i "auth\|login\|jwt"

# Test JWT secret configuration
docker exec allodoc_backend_prod env | grep JWT

# Check database for user records
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT email, is_active, role FROM users WHERE email = 'doctor@medical.com';"
```

#### Solutions

##### 1. Password Hash Issues
```bash
# Test password hashing
docker exec allodoc_backend_prod node -e "
const bcrypt = require('bcryptjs');
const password = 'Test123!@#';
const hash = bcrypt.hashSync(password, 10);
console.log('Hash:', hash);
console.log('Valid:', bcrypt.compareSync(password, hash));
"
```

##### 2. JWT Configuration Problems
```bash
# Check JWT secrets are set
docker exec allodoc_backend_prod env | grep -E "JWT_.*SECRET"

# Verify token generation
# Check application logs for JWT errors
```

##### 3. Session/Cookie Issues
```bash
# Clear cookies in browser
# Check CORS configuration
# Verify cookie domain settings
```

### Token Refresh Issues

#### Symptoms
- Users get logged out unexpectedly
- "Token expired" errors
- Refresh token not working

#### Solutions
```bash
# Check refresh token configuration
docker exec allodoc_backend_prod env | grep REFRESH

# Check token storage in Redis
docker exec allodoc_redis_prod redis-cli keys "*token*"
docker exec allodoc_redis_prod redis-cli ttl "refresh_token:*"

# Clear all tokens if corrupted
docker exec allodoc_redis_prod redis-cli eval "return redis.call('del',unpack(redis.call('keys','*token*')))" 0
```

---

## 🌐 Network Issues

### Frontend Can't Connect to Backend

#### Symptoms
- CORS errors in browser console
- Network errors in frontend
- API calls failing

#### Diagnosis
```bash
# Test backend connectivity
curl -v http://localhost:3000/health

# Check CORS configuration
curl -H "Origin: http://localhost:4200" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:3000/api/v1/auth/login

# Check nginx proxy configuration
docker exec allodoc_nginx_prod nginx -t
```

#### Solutions

##### 1. CORS Configuration
```bash
# Check CORS settings in backend
docker exec allodoc_backend_prod grep -r "cors" /app/src/

# Update CORS_ORIGIN in environment
# CORS_ORIGIN=http://localhost:4200,https://yourdomain.com
```

##### 2. Nginx Proxy Issues
```bash
# Test nginx configuration
docker exec allodoc_nginx_prod nginx -t

# Reload nginx configuration
docker exec allodoc_nginx_prod nginx -s reload

# Check upstream configuration
docker exec allodoc_nginx_prod cat /etc/nginx/nginx.conf | grep -A 10 upstream
```

### SSL/HTTPS Issues

#### Symptoms
- "Not secure" warning in browser
- SSL certificate errors
- Mixed content warnings

#### Solutions
```bash
# Check SSL certificate validity
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null

# Check certificate expiration
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Renew Let's Encrypt certificate
./scripts/setup-ssl.sh --renew

# Update nginx SSL configuration
docker exec allodoc_nginx_prod nginx -t
docker exec allodoc_nginx_prod nginx -s reload
```

---

## 🚀 Deployment Issues

### Deployment Fails

#### Symptoms
- Deploy script errors
- Containers won't start after deployment
- Health checks failing

#### Diagnosis
```bash
# Check deployment logs
tail -f /var/log/deploy.log

# Check git status
git status
git log --oneline -5

# Test build process
docker-compose -f docker-compose.prod.yml build --no-cache
```

#### Solutions

##### 1. Build Failures
```bash
# Check Dockerfile syntax
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend

# Check for missing dependencies
docker run --rm test-backend npm ls
```

##### 2. Database Migration Issues
```bash
# Check migration status
docker exec allodoc_backend_prod npm run migration:show

# Run migrations manually
docker exec allodoc_backend_prod npm run migration:run

# Revert problematic migration
docker exec allodoc_backend_prod npm run migration:revert
```

##### 3. Environment Configuration
```bash
# Compare environment files
diff backend/.env.production backend/.env.example

# Validate required environment variables
./scripts/check-production-readiness.sh
```

### Zero-Downtime Deployment Problems

#### Symptoms
- Brief service interruption during deployment
- 502 Bad Gateway errors
- Load balancer shows unhealthy instances

#### Solutions
```bash
# Use deployment script with health checks
./scripts/deploy.sh --zero-downtime

# Monitor health during deployment
watch -n 1 curl -f http://localhost:3000/health

# Implement proper graceful shutdown
# Add SIGTERM handler in application
```

---

## 🔧 Common Fixes Reference

### Emergency Commands
```bash
# Restart everything
docker-compose -f docker-compose.prod.yml restart

# Emergency database backup
./scripts/backup-database.sh production emergency_$(date +%Y%m%d_%H%M%S)

# Emergency rollback
./scripts/rollback.sh

# Clear all caches
docker exec allodoc_redis_prod redis-cli flushall
docker system prune -f

# Check system resources
df -h
free -h
docker stats --no-stream
```

### Log Analysis Commands
```bash
# Find errors in logs
docker logs allodoc_backend_prod 2>&1 | grep -i error | tail -20

# Monitor logs in real-time
docker logs allodoc_backend_prod -f | grep -E "(ERROR|WARN|error|warning)"

# Analyze nginx access patterns
docker logs allodoc_nginx_prod | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# Check for SQL errors
docker logs allodoc_postgres_prod | grep -i -E "(error|fatal|panic)"
```

### Performance Monitoring
```bash
# Quick performance check
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/v1/auth/profile

# Where curl-format.txt contains:
#     time_namelookup:  %{time_namelookup}\n
#      time_connect:  %{time_connect}\n
#   time_appconnect:  %{time_appconnect}\n
#  time_pretransfer:  %{time_pretransfer}\n
#     time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#         time_total:  %{time_total}\n
```

### Database Maintenance
```bash
# Quick database health check
docker exec allodoc_postgres_prod psql -U allodoc_prod -d allodoc_prod -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_returned(c.oid) as tuple_read,
    pg_stat_get_tuples_fetched(c.oid) as tuple_fetch
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## 📞 When to Escalate

### Immediate Escalation (Call Manager)
- Complete system outage > 15 minutes
- Data loss or corruption
- Security breach suspected
- Unable to restore service

### Schedule Emergency Meeting
- Performance degradation affecting > 50% users
- Database issues requiring expert intervention
- Unknown errors with no clear solution
- Multiple systems affected

### Next Business Day
- Minor UI issues
- Non-critical feature problems
- Performance optimization needs
- Documentation updates

---

**Remember:** When in doubt, document everything, take backups, and don't hesitate to escalate. It's better to ask for help early than to make the problem worse.

---

**Document Maintained By:** DevOps Team  
**Emergency Contact:** devops@allodoc.com  
**Last Tested:** January 2025