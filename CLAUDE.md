# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Reference

**Start Development:**
```bash
# Terminal 1 - Backend (port 5001)
cd alzawaj-project-backend && pnpm run dev

# Terminal 2 - Frontend (port 3000)
cd alzawaj-project-frontend && npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api
- Backend Health: http://localhost:5001/health

**Key Files:**
- Filter Mapping: `lib/constants/filter-mapping.ts` (Arabic↔English conversion)
- API Client: `lib/api/client.ts` (JWT auth + interceptors)
- Quick Search: `app/dashboard/search/page.tsx`

## Project Overview

**Islamic Zawaj Platform** - A comprehensive monorepo containing a full-stack Islamic marriage platform with Arabic-first design, privacy controls, and Islamic compliance. The platform facilitates halal marriage connections with gender-specific privacy controls, moderated chat, and formal introduction workflows.

## Repository Structure

This is a monorepo with two main projects:

```
alzawaj-project/
├── alzawaj-project-backend/    # Node.js/Express API server
└── alzawaj-project-frontend/   # Next.js 14 web application
```

## Technology Stack

### Backend (alzawaj-project-backend)
- **Runtime**: Node.js 20.19+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with bcrypt
- **Real-time**: Socket.IO for chat (configured but may be commented out)
- **Testing**: Jest with MongoDB Memory Server
- **Package Manager**: pnpm
- **Deployment**: PM2 + Render.com

### Frontend (alzawaj-project-frontend)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with RTL support
- **Forms**: React Hook Form + Zod validation
- **State**: React Query (@tanstack/react-query) + Context providers
- **UI Components**: Radix UI primitives
- **Testing**: Jest + React Testing Library + Playwright
- **Package Manager**: npm
- **Deployment**: Vercel

## Monorepo-Level Development

### Prerequisites
- **Node.js**: 20.19+ (backend), 18+ (frontend)
- **pnpm**: 8.0.0+ (backend only)
- **npm**: 9.0.0+ (frontend only)

### Quick Start

```bash
# Navigate to backend directory
cd alzawaj-project-backend

# Install dependencies
pnpm install

# Start development server (port 5001)
pnpm run dev

# In a new terminal, navigate to frontend
cd ../alzawaj-project-frontend

# Install dependencies
npm install

# Start development server (port 3000)
npm run dev
```

### Development Commands by Directory

#### Backend (alzawaj-project-backend)
```bash
# Start dev server with hot reload
pnpm run dev

# Build TypeScript to dist/
pnpm run build

# Run production build
pnpm start

# Run tests
pnpm test
pnpm test:coverage

# Code quality
pnpm run lint
pnpm run lint:fix
pnpm run format

# Database operations
pnpm run db:seed

# Production management
pnpm run deploy      # Build and deploy to Render
pnpm run logs        # View application logs
pnpm run restart     # Restart application
```

**Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/health
- **API Docs**: http://localhost:5001/api-docs (development only)

#### Frontend (alzawaj-project-frontend)
```bash
# Start dev server
npm run dev

# Build for production
npm run build
npm run start

# Type checking
npm run type-check

# Code quality
npm run lint
npm run lint:fix

# Testing
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e      # Playwright E2E tests

# Documentation
npm run storybook     # Component library (port 6006)
```

**Frontend App**: http://localhost:3000

## High-Level Architecture

### System Overview

The platform follows a traditional client-server architecture:

```
┌─────────────────────────────────────────┐
│   Frontend (Next.js 14)                 │
│   - Arabic-first UI (RTL)               │
│   - User authentication                 │
│   - Profile management                  │
│   - Search & filtering                  │
│   - Marriage request workflow           │
│   - Moderated chat interface            │
└──────────────┬──────────────────────────┘
               │ HTTPS (REST API)
               ▼
┌─────────────────────────────────────────┐
│   Backend (Express + Node.js)           │
│   - RESTful API                         │
│   - JWT authentication                  │
│   - MongoDB database                    │
│   - File upload (ImageKit)              │
│   - Email/SMS notifications             │
│   - Socket.IO (chat)                    │
│   - Rate limiting                       │
│   - Content moderation                  │
└─────────────────────────────────────────┘
```

### Core Features

1. **User Authentication & Profiles**
   - OTP verification (email/SMS)
   - Multi-step profile builder
   - Gender-specific profile fields
   - Privacy controls

2. **Search & Discovery**
   - Advanced filtering (age, location, education, religion)
   - Privacy-respecting search
   - Profile browsing

3. **Marriage Request System**
   - Formal introduction workflow
   - Request tracking (sent/received)
   - Response handling

4. **Moderated Communication**
   - Rate-limited chat (1 msg/hour, 3/day)
   - Content filtering (Arabic + English)
   - Admin moderation panel

5. **Admin Dashboard**
   - User management
   - Content moderation
   - Platform analytics

### API Integration

The frontend integrates with the backend via:

**Base URLs**:
- **Development**: http://localhost:5001/api
- **Production**: https://alzawaj-backend-staging.onrender.com/api

**Key Endpoints**:
- `/api/auth/*` - Authentication (register, login, verify-otp, refresh-token)
- `/api/profile/*` - Profile management (get, update, upload picture)
- `/api/search/*` - User search (profiles, filters)
- `/api/requests/*` - Marriage requests (send, received, sent, respond)
- `/api/chat/*` - Chat (rooms, messages, limits)
- `/api/admin/*` - Admin functionality (users, requests, moderation)

**Authentication Flow**:
1. Register → verify OTP → login
2. Receive JWT token + refresh token
3. Tokens stored in localStorage
4. Token automatically added to all API requests
5. On 401, automatic refresh attempt

### Privacy & Security Model

**Profile Visibility Controls** (lib/types/index.ts:88-128):
- Profile picture: everyone/matches-only/none
- Age/Location/Occupation: show/hide toggles
- Female-specific controls:
  - Profile visibility: everyone/verified-only/premium-only/guardian-approved
  - Allow profile views: everyone/verified-males/premium-males/guardian-approved
  - Require guardian approval for contact

**Chat Rate Limiting**:
- 1 message per hour
- 3 messages per day
- Max 3 concurrent chats
- Messages expire after 7 days
- Max 500 characters per message

**Content Moderation**:
- Arabic abusive words filtering
- Admin review workflow
- Message approval system

### Database Schema

**Core Models** (MongoDB/Mongoose):

1. **User** - Authentication and account data
2. **Profile** - User profiles with search text index (for full-text search)
3. **MarriageRequest** - Marriage proposals (sent/received/accepted/rejected)
4. **ChatRoom & Message** - Chat system with rate limiting
5. **Notification** - In-app notifications
6. **Report** - User-submitted reports
7. **AdminSettings** - Platform configuration
8. **OTPCode** - One-time password codes

### File Upload System

- **Service**: ImageKit CDN
- **Max File Size**: 5MB (configurable via `MAX_FILE_SIZE`)
- **Supported Formats**: JPEG, PNG, WebP
- **Endpoint**: `POST /api/profile/picture`

### Notifications

- **Email**: Nodemailer
- **SMS**: Twilio
- **Prayer Time Reminders**: Optional Islamic prayer time notifications

## Development Workflow

### Typical Development Session

```bash
# 1. Start backend (in one terminal)
cd alzawaj-project-backend
pnpm run dev

# 2. Start frontend (in another terminal)
cd alzawaj-project-frontend
npm run dev

# 3. Run tests
# Backend
cd alzawaj-project-backend
pnpm test

# Frontend
cd alzawaj-project-frontend
npm run test
npm run test:e2e
```

### Pre-commit Hooks

Both projects use Husky for pre-commit hooks:

**Backend** (alzawaj-project-backend):
- ESLint + Prettier formatting
- Runs automatically before commits

**Frontend** (alzawaj-project-frontend):
- Lint-staged runs on `*.{js,jsx,ts,tsx}`: ESLint fix + Prettier write
- Runs automatically before commits

### Environment Variables

#### Backend (.env)
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_ENDPOINT=your_imagekit_endpoint
NODE_ENV=development
PORT=5001
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
GOOGLE_VERIFICATION_ID=optional_seo_verification
```

## Detailed Documentation

For more detailed information, refer to the specific CLAUDE.md files in each subdirectory:

- **Backend**: [`alzawaj-project-backend/CLAUDE.md`](./alzawaj-project-backend/CLAUDE.md)
  - Detailed API documentation
  - Database models and schemas
  - Middleware and services
  - Testing strategies

- **Frontend**: [`alzawaj-project-frontend/CLAUDE.md`](./alzawaj-project-frontend/CLAUDE.md)
  - Component library documentation
  - Custom hooks and providers
  - Type definitions
  - RTL/Arabic support

- **Frontend**: [`alzawaj-project-frontend/README.md`](./alzawaj-project-frontend/README.md)
  - Comprehensive feature overview
  - Deployment instructions
  - Contributing guidelines

## Common Development Tasks

### Adding a New API Endpoint (Backend)

1. Create/update Mongoose model in `src/models/`
2. Add route definition in `src/routes/`
3. Implement controller in `src/controllers/`
4. Add business logic in `src/services/`
5. Add validation schemas in `src/validation/`
6. Update OpenAPI spec in `src/config/openapi.yaml`
7. Add tests in `src/tests/`

### Adding a New Feature (Frontend)

1. Create API function in `lib/api/*.ts`
2. Add TypeScript types in `lib/types/*.ts`
3. Add custom hook in `lib/hooks/` (if needed)
4. Create page in `app/(dashboard)/` or `app/admin/`
5. Add validation schema in `lib/validation/`
6. Add tests in appropriate `tests/` directory
7. Update navigation in relevant menu component

### Testing

**Backend Testing**:
```bash
cd alzawaj-project-backend
pnpm test                    # Run all tests
pnpm test auth.test.ts       # Run specific test
pnpm test -- --coverage      # Generate coverage
```

**Frontend Testing**:
```bash
cd alzawaj-project-frontend
npm test                     # Jest unit tests
npm run test:e2e             # Playwright E2E tests
npm run test:coverage        # Coverage report
```

### Database Operations

```bash
# Seed test data
cd alzawaj-project-backend
pnpm run db:seed

# Search index rebuild
# Restart backend - index created automatically on Profile model
```

## Key Configuration Files

### Backend
- **TypeScript**: `tsconfig.json` - Path aliases (`@/*` → `src/*`)
- **ESLint**: `.eslintrc.test.js` - Airbnb base configuration
- **Jest**: Configured in `package.json` (lines 150-171)
- **OpenAPI**: `src/config/openapi.yaml` - API documentation

### Frontend
- **Next.js**: `next.config.js` - Image optimization, security headers, i18n
- **Tailwind**: `tailwind.config.js` - Custom Arabic fonts, RTL support
- **TypeScript**: `tsconfig.json` - Strict mode, path aliases
- **Storybook**: `.storybook/` - Component documentation

## Islamic Compliance Features

The platform is built with Islamic principles at its core:

- **Gender-specific privacy controls** for female users
- **Guardian approval system** for female profile interactions
- **Prayer level matching** in search filters
- **Halal marriage request workflow** with formal introduction
- **No direct messaging** without marriage request acceptance
- **Chat rate limiting** to prevent inappropriate conversations
- **Content moderation** with Arabic language support
- **Arabic-first design** with RTL optimization
- **Islamic prayer time integration** (optional notifications)

## Deployment

### Backend (alzawaj-project-backend)
- **Platform**: Render.com
- **Process Manager**: PM2
- **Build Command**: `pnpm run build`
- **Start Command**: `pnpm start`
- **Config**: `render.yaml`

### Frontend (alzawaj-project-frontend)
- **Platform**: Vercel
- **Build Command**: `npm run build`
- **Output**: Standalone mode
- **Config**: `next.config.js`

## Important Notes

1. **Monorepo Structure**: Work within individual subdirectories - there are no root-level build scripts
2. **Database**: Backend uses MongoDB - ensure connection is available
3. **API Documentation**: Backend Swagger UI available at `/api-docs` (development only)
4. **CORS**: Backend configured to accept requests from frontend URL
5. **Real-time**: Socket.IO configured but may be commented out - chat uses polling
6. **Image Upload**: Uses ImageKit CDN - ensure credentials are configured
7. **Notifications**: Email (Nodemailer) and SMS (Twilio) - requires external service setup
8. **Arabic Support**: Full RTL layout with Arabic fonts (Noto Kufi Arabic, Amiri)
9. **Pre-commit Hooks**: Automatic linting and formatting configured via Husky

## Path Aliases

### Backend (alzawaj-project-backend)
- `@/*` → `src/*`
- `@/models/*` → `src/models/*`
- `@/controllers/*` → `src/controllers/*`
- `@/services/*` → `src/services/*`
- `@/config/*` → `src/config/*`

### Frontend (alzawaj-project-frontend)
- `@/*` → `./`
- Use `@/lib/*`, `@/components/*`, `@/app/*` for absolute imports

## Performance Considerations

### Backend
- Database indexes on Profile model (text index for search)
- Rate limiting configured (Redis in production)
- Image optimization with Sharp
- Compression middleware enabled

### Frontend
- Next.js Image optimization for S3 domains
- Font preloading for Arabic fonts
- React Query for client-side caching
- Bundle analysis with `npm run analyze`
- SWC minification enabled

## Recent Updates

### November 2024
- **Filter Mapping System** (`lib/constants/filter-mapping.ts`): Implemented comprehensive Arabic↔English filter value conversion for education, marital status, religious level, and location fields
- **Quick Search Functionality**: Added full-text search endpoint `/api/search/quick` with frontend integration in search page
- **API Client Enhancements** (`lib/api/client.ts`): Fixed refresh token response parsing to handle nested token structure
- **Alert Styling**: Enhanced toast notifications with gradient backgrounds and improved visual design
- **Next.js 16 Compatibility**: Updated API proxy routes to use async params pattern

### Critical Files to Know
- **Filter Alignment**: All search filters now properly convert frontend Arabic values to backend English values
- **Authentication**: Refresh token mechanism properly handles backend response format
- **Quick Search**: Users can now search by name/occupation via the search bar on `/dashboard/search`

## Troubleshooting

### Frontend won't start with Turbopack
```bash
# Use webpack flag instead
npm run dev -- --webpack
```

### Backend MongoDB connection errors
```bash
# Ensure MongoDB is running locally
# Or update MONGODB_URI in .env to your MongoDB cluster
```

### API requests returning 401
- Check that JWT token is stored in localStorage
- Verify refresh token logic in `lib/api/client.ts` lines 98-166
- Backend should return tokens in format: `{ data: { tokens: { accessToken, refreshToken } } }`

### Search filters not working
- Verify `lib/constants/filter-mapping.ts` has the correct conversion mappings
- Frontend sends Arabic values, backend expects English values
- Use `validateAndConvertFilters()` before sending to backend

### Quick search returns no results
- Backend endpoint exists at `/api/search/quick?query=<search_term>`
- Ensure MongoDB text index is created on Profile model
- Check browser console for API call errors

---

For more specific information about either project, consult the respective `CLAUDE.md` files in each subdirectory.
