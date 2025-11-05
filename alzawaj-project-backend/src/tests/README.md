# Test Suite

This directory contains the test suite for the Zawag backend API.

## Structure

- `setup.ts` - Test environment setup and teardown
- `testUtils.ts` - Utility functions for creating test data
- `health.test.ts` - Tests for health check endpoints
- `auth.test.ts` - Tests for authentication endpoints

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Database

Tests use an in-memory MongoDB instance provided by `mongodb-memory-server`. Each test suite gets a fresh database instance.

## Environment

Tests run in a `test` environment with specific configuration in `setup.ts`.