# Scripts

This directory contains utility scripts for the Zawag backend.

## Health Check Script

The `health-check.ts` script can be used to verify that your production API is running correctly.

### Usage

```bash
pnpm health-check
```

This script will check:
1. The health endpoint (`/health`)
2. The root endpoint (`/`)
3. Authentication protection (`/api/auth/me`)

### Output

The script will output the status of each check and any relevant information from the API responses.