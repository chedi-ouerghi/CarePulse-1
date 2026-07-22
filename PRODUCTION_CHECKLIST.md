# CarePulse — Production Hardening Checklist

## Overview

This document lists all items that must be addressed before deploying CarePulse to a production environment. Items are organized by category and priority.

---

## 1. Secrets Management

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Replace `JWT_SECRET` from `.env` with a managed secret (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager) | Not done |
| **P0** | Rotate `JWT_SECRET` immediately if the current dev value was ever committed to git | Not done |
| **P0** | Replace `DATABASE_URL` with a managed secret | Not done |
| **P1** | Store `MISTRAL_API_KEY` in a secrets manager | Not done |
| **P1** | Remove all `.env` files from version control; add to `.gitignore` | Verify |
| **P2** | Implement secret rotation policy (quarterly minimum) | Not done |

**Commands:**
```bash
# Verify .env is gitignored
git check-ignore .env apps/api/.env

# Rotate JWT_SECRET
openssl rand -base64 48  # Generate new secret
```

---

## 2. TLS / HTTPS

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Deploy behind a TLS-terminating reverse proxy (nginx, Traefik, AWS ALB) | Not done |
| **P0** | Redirect all HTTP traffic to HTTPS | Not done |
| **P1** | Enable HSTS headers (`Strict-Transport-Security: max-age=31536000`) | Not done |
| **P1** | Configure secure cookie flags (SameSite=Lax, Secure, HttpOnly) | Not done |
| **P2** | Obtain TLS certificate via Let's Encrypt or cloud provider | Not done |

**nginx example:**
```nginx
server {
    listen 80;
    server_name api.carepulse.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.carepulse.com;
    
    ssl_certificate /etc/letsencrypt/live/api.carepulse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.carepulse.com/privkey.pem;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. CORS Configuration

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Set `FRONTEND_URL` to production domain (e.g., `https://carepulse.com`) | Not done |
| **P0** | Never use wildcard `*` in production CORS | Verify |
| **P1** | Restrict allowed methods to only those needed | Verify |
| **P1** | Add rate limiting per IP for all endpoints (not just auth) | Not done |
| **P2** | Implement CSRF protection | Not done |

---

## 4. Database Security

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Use a managed PostgreSQL (AWS RDS, GCP Cloud SQL, Azure Database) | Not done |
| **P0** | Enable SSL for database connections (`?sslmode=require`) | Not done |
| **P0** | Use strong, unique password for database | Not done |
| **P1** | Enable automated backups (daily minimum, 30-day retention) | Not done |
| **P1** | Configure point-in-time recovery | Not done |
| **P1** | Restrict database access to API service only (no public access) | Not done |
| **P2** | Enable query logging for audit trail | Not done |
| **P2** | Implement connection pooling (PgBouncer) for high traffic | Not done |

**Connection string update:**
```
DATABASE_URL=postgresql://carepulse:PASSWORD@hostname:5432/carepulse?sslmode=require
```

---

## 5. Redis Security

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Use a managed Redis (AWS ElastiCache, GCP Memorystore) | Not done |
| **P0** | Enable Redis AUTH (require password) | Not done |
| **P1** | Use TLS for Redis connections | Not done |
| **P1** | Restrict Redis access to API and worker services only | Not done |
| **P2** | Configure Redis memory limits and eviction policy | Not done |

---

## 6. Authentication & Authorization

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Implement JWT refresh token rotation | Partial (RefreshToken model exists) |
| **P0** | Set short access token expiry (15-30 min) | Verify (currently 24h) |
| **P1** | Implement account lockout after failed login attempts | Not done |
| **P1** | Add multi-factor authentication (MFA) | Not done |
| **P1** | Implement session invalidation on password change | Not done |
| **P2** | Add IP-based suspicious activity detection | Not done |
| **P2** | Implement audit logging for all auth events | Partial (AuditLog exists) |

---

## 7. Input Validation & Security

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Verify `whitelist: true` and `forbidNonWhitelisted: true` in ValidationPipe | Done |
| **P0** | Sanitize all user inputs to prevent XSS | Verify (Prisma parameterized queries) |
| **P1** | Implement rate limiting per user (not just IP) | Not done |
| **P1** | Add request size limits (body-parser) | Verify (default NestJS limits) |
| **P2** | Implement Content Security Policy headers | Not done |
| **P2** | Add SQL injection protection (Prisma handles this) | Verify |

---

## 8. Logging & Observability

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Implement structured logging (JSON format) | Not done (currently using NestJS Logger) |
| **P0** | Set log level based on environment | Not done |
| **P1** | Integrate with centralized logging (ELK, Datadog, CloudWatch) | Not done |
| **P1** | Implement request tracing (correlation IDs) | Not done |
| **P1** | Add performance metrics (response times, error rates) | Not done |
| **P2** | Implement distributed tracing (OpenTelemetry) | Not done |
| **P2** | Add health check metrics endpoint | Not done |

**Structured logging example:**
```typescript
// Replace console.log/Logger with structured logger
{
  "level": "info",
  "message": "Alert created",
  "alertId": "abc123",
  "patientId": "def456",
  "severity": "HIGH",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "carepulse-api",
  "traceId": "xyz789"
}
```

---

## 9. Container Security

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Use specific image tags (not `latest`) | Done (postgres:16-alpine, redis:7-alpine) |
| **P0** | Run containers as non-root user | Done (nestjs, nextjs users) |
| **P1** | Scan images for vulnerabilities (Trivy, Snyk) | Not done |
| **P1** | Use multi-stage builds to minimize attack surface | Done |
| **P2** | Implement container image signing | Not done |
| **P2** | Set resource limits (CPU, memory) in docker-compose | Not done |

**docker-compose resource limits:**
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 10. Backup & Recovery

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Implement automated PostgreSQL backups | Not done |
| **P0** | Test backup restoration process | Not done |
| **P1** | Implement Redis persistence (RDB + AOF) | Not done |
| **P1** | Create disaster recovery runbook | Not done |
| **P2** | Implement cross-region backup replication | Not done |
| **P2** | Schedule regular restore tests (quarterly) | Not done |

**PostgreSQL backup command:**
```bash
pg_dump -h hostname -U carepulse carepulse | gzip > backup_$(date +%Y%m%d).sql.gz
```

---

## 11. Deployment

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Set up CI/CD pipeline (GitHub Actions, GitLab CI) | Not done |
| **P0** | Implement blue-green or rolling deployments | Not done |
| **P1** | Add deployment smoke tests | Not done |
| **P1** | Implement rollback procedure | Not done |
| **P2** | Set up staging environment | Not done |
| **P2** | Implement canary deployments | Not done |

**GitHub Actions example:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm run test:e2e
      - name: Deploy to production
        run: docker compose -f docker-compose.prod.yml up -d
```

---

## 12. Monitoring & Alerting

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Set up uptime monitoring (UptimeRobot, Pingdom) | Not done |
| **P0** | Configure error alerting (Sentry, Bugsnag) | Not done |
| **P1** | Set up performance monitoring (APM) | Not done |
| **P1** | Create alerting rules for critical metrics | Not done |
| **P2** | Implement custom dashboards (Grafana) | Not done |
| **P2** | Set up on-call rotation | Not done |

**Critical alerts to configure:**
- API response time > 2s
- Error rate > 1%
- Database connection failures
- Redis connection failures
- Disk space < 20%
- Memory usage > 80%

---

## 13. Compliance (Healthcare Data)

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Implement data encryption at rest | Not done |
| **P0** | Ensure HIPAA/GDPR compliance for patient data | Not done |
| **P1** | Implement data retention policies | Not done |
| **P1** | Add data export/deletion capabilities (GDPR right to erasure) | Not done |
| **P1** | Implement audit trail for all data access | Partial (AuditLog exists) |
| **P2** | Conduct security audit | Not done |
| **P2** | Implement BAA (Business Associate Agreement) with cloud providers | Not done |

---

## Quick Start for Production

```bash
# 1. Generate secure secrets
export JWT_SECRET=$(openssl rand -base64 48)
export DB_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 24)

# 2. Create .env.prod
cat > .env.prod << EOF
DATABASE_URL=postgresql://carepulse:${DB_PASSWORD}@your-rds-host:5432/carepulse?sslmode=require
REDIS_URL=redis://:${DB_PASSWORD}@your-redis-host:6379
JWT_SECRET=${JWT_SECRET}
FRONTEND_URL=https://carepulse.com
RISK_MODEL_URL=http://risk-model:8000
MISTRAL_API_KEY=your-key-here
EOF

# 3. Deploy with production compose
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 4. Run migrations
docker compose exec api npx prisma db push

# 5. Seed database
docker compose exec api npx prisma db seed

# 6. Verify health
curl https://your-domain.com/api/health
```

---

## Last Updated

Phase 10 — Final deployment preparation
