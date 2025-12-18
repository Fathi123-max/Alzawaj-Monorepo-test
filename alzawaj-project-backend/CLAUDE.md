# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Zawag Backend** - Islamic Marriage Platform API built with Node.js, Express, TypeScript, and MongoDB. Provides RESTful API with real-time chat capabilities, user profiles, marriage requests, and admin functionality.

## Technology Stack

- **Runtime**: Node.js 20.19+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with bcrypt
- **Real-time**: Socket.IO for chat
- **Documentation**: OpenAPI/Swagger
- **Testing**: Jest with MongoDB Memory Server
- **Image Upload**: ImageKit CDN
- **Notifications**: SMS (Twilio) & Email (Nodemailer)
- **Package Manager**: pnpm

## Development Commands

### Common Operations

```bash
# Development server with hot reload
pnpm run dev

# Build TypeScript to dist/
pnpm run build

# Run production build
pnpm start

# Build and deploy to production
pnpm run deploy

# Watch mode for TypeScript compilation
pnpm run build:watch
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage report
pnpm run test:coverage

# Run specific test file
pnpm test -- profileController.test.ts
```

### Code Quality

```bash
# Lint code with ESLint
pnpm run lint

# Fix linting issues automatically
pnpm run lint:fix

# Format code with Prettier
pnpm run format
```

### Database Operations

```bash
# Seed database with test data
pnpm run db:seed

# Run database migrations
pnpm run db:migrate
```

### Production Management

```bash
# View application logs
pnpm run logs

# Restart application
pnpm run restart

# Stop application
pnpm run stop
```

### Testing Scripts

```bash
# Health check endpoint
pnpm run health-check

# Test user registration
pnpm run test-registration

# Test valid registration
pnpm run test-valid-registration

# Test user login
pnpm run test-login

# Run comprehensive tests
pnpm run comprehensive-test

# Monitor rate limiting
pnpm run monitor-rate-limit
```

## Project Architecture

### Directory Structure

```
src/
├── config/              # Configuration files (DB, Swagger, Logger, Rate limiting)
├── controllers/         # Request handlers (auth, profile, search, chat, etc.)
├── database/
│   └── seeders/         # Database seeders for test data
├── middleware/          # Express middleware (auth, validation, error handling)
├── models/              # Mongoose models (User, Profile, ChatRoom, etc.)
├── routes/              # Route definitions (organized by feature)
├── services/            # Business logic services (email, SMS, upload, search)
├── types/               # TypeScript type definitions
├── utils/               # Helper functions and utilities
├── validation/          # Input validation schemas (Joi)
└── server.ts            # Application entry point
```

### Core Models

- **User** (`src/models/User.ts`) - User accounts and authentication
- **Profile** (`src/models/Profile.ts`) - User profiles with search text index
- **MarriageRequest** (`src/models/MarriageRequest.ts`) - Marriage proposals
- **ChatRoom** & **Message** (`src/models/ChatRoom.ts`, `src/models/Message.ts`) - Chat system
- **Notification** (`src/models/Notification.ts`) - In-app notifications
- **Report** (`src/models/Report.ts`) - User reports
- **AdminSettings** (`src/models/AdminSettings.ts`) - Admin configuration
- **OTPCode** (`src/models/OTPCode.ts`) - One-time password codes

### API Endpoints

All routes are prefixed with `/api/`:

- `/api/auth` - Authentication (register, login, logout)
- `/api/profile` - User profiles
- `/api/search` - User search and filtering
- `/api/requests` - Marriage requests
- `/api/chat` - Chat rooms and messages
- `/api/notifications` - Notifications
- `/api/admin` - Admin functionality
- `/api/debug` - Debug routes (development only)

### Key Configuration Files

- **TypeScript**: `tsconfig.json` - Path aliases configured (`@/*` maps to `src/*`)
- **ESLint**: `.eslintrc.test.js` - Airbnb base configuration
- **OpenAPI**: `src/config/openapi.yaml` - API documentation specification

### Environment Variables Required

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_ENDPOINT=your_imagekit_endpoint
NODE_ENV=development
PORT=5001
```

## Development Guidelines

### Code Organization

- Controllers handle HTTP requests/responses
- Services contain business logic
- Models define data schemas
- Middleware provides cross-cutting concerns (auth, validation, errors)
- Utils contain reusable helper functions

### Path Aliases

Use configured aliases to import modules:

- `@/*` - Root of src directory
- `@/models/*` - Models
- `@/controllers/*` - Controllers
- `@/services/*` - Services
- `@/config/*` - Configuration files

### Testing

- Tests use Jest with MongoDB Memory Server
- Test files follow pattern: `src/tests/**/*.test.ts`
- Setup configured in `src/tests/setup.ts`
- Coverage excludes tests, seeders, and server.ts

### Database

- MongoDB with Mongoose ODM
- Connection in `src/config/database.ts`
- Text index created automatically on Profile model for search
- Seeders available for populating test data

### Real-time Features

- Socket.IO configured in `src/server.ts`
- CORS configured for frontend URL
- Chat service available in `src/services/chatService.ts`

### API Documentation

- Swagger UI available at `/api-docs` (development only)
- OpenAPI specification in `/api-docs/swagger.json`
- Source specification: `src/config/openapi.yaml`

## Common Development Tasks

### Adding a New Feature

1. Create Mongoose model in `src/models/`
2. Add route definition in `src/routes/`
3. Implement controller in `src/controllers/`
4. Add business logic in `src/services/` (if needed)
5. Add validation schemas in `src/validation/`
6. Create middleware if needed in `src/middleware/`
7. Add tests in `src/tests/`
8. Update OpenAPI spec in `src/config/openapi.yaml`

### Working with Tests

```bash
# Run specific test
pnpm test auth.test.ts

# Run tests with coverage
pnpm test -- --coverage

# Debug tests
pnpm test -- --inspect-brk
```

### Database Operations

```bash
# Rebuild search index
# Restart the server - index is created automatically

# Seed test data
pnpm run db:seed

# Clear and reseed
# Delete data manually or add migration script
```

### Error Handling

- Centralized error middleware in `src/middleware/errorMiddleware.ts`
- Consistent error responses using `src/utils/responseHelper.ts`
- Logging configured in `src/config/logger.ts` using Winston

### Image Upload

- Images handled by ImageKit service
- Upload service available in `src/services/uploadService.ts`
- Maximum file size: 5MB (configurable via `MAX_FILE_SIZE`)

### Rate Limiting

- Configured in `src/config/rateLimiting.ts`
- Separate limits for auth, search, and general routes
- Uses Redis store in production

## Useful Resources

- **API Documentation**: http://localhost:5001/api-docs (development)
- **Health Check**: http://localhost:5001/health
- **Swagger JSON**: http://localhost:5001/api-docs/swagger.json
- **Logs Directory**: `logs/` (rotated daily)

## Important Notes

- **Pre-commit hooks**: Linting and formatting run automatically before commits
- **Build process**: Copies `src/config/openapi.yaml` to `dist/config/` during build
- **Socket.IO**: Currently configured but commented out in server.ts
- **Test database**: Uses separate MongoDB instance for tests
- **Production**: Deploy script uses PM2 for process management
