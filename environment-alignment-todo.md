# Environment Configuration Alignment Task

## Objective

Align the `docker-compose.yaml` file with the `.env.cleaned` reference file by updating missing or incorrect environment variables.

## Tasks to Complete

### 1. Frontend Service Updates

- [ ] Add missing FRONTEND_PORT environment variable
- [ ] Update NEXT_PUBLIC_API_URL to NEXT_PUBLIC_API_BASE_URL
- [ ] Add missing frontend environment variables from .env.cleaned
- [ ] Update health check URL to use proper NEXT_PUBLIC_APP_URL

### 2. Backend Service Updates

- [ ] Add PORT=5000 (from .env.cleaned)
- [ ] Add missing JWT variables (JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN)
- [ ] Add missing database port variables (MONGODB_PORT, REDIS_PORT)
- [ ] Add SERVICE_URL_BACKEND for health check
- [ ] Update CORS_ORIGIN to match .env.cleaned
- [ ] Add missing backend environment variables

### 3. Database Service Updates

- [ ] Add MONGODB_PORT environment variable
- [ ] Add REDIS_PORT environment variable

### 4. Health Check Updates

- [ ] Update backend health check to use SERVICE_URL_BACKEND
- [ ] Update frontend health check to use NEXT_PUBLIC_APP_URL

### 5. Validation

- [ ] Verify all .env.cleaned variables are properly referenced
- [ ] Ensure proper fallback values are maintained
- [ ] Check for any syntax errors

## Reference Files

- Source: `.env.cleaned`
- Target: `docker-compose.yaml`
- Current: `docker-compose.yaml` (to be updated)
