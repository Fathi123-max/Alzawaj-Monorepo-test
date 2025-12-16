# Islamic Zawaj Platform

## Project Overview

The Islamic Zawaj Platform is a comprehensive Next.js 14 application designed as a platform for Islamic marriage connections. It's built with privacy, moderation, and cultural sensitivity at its core, targeting the Muslim community worldwide.

### Architecture
- **Frontend**: Next.js 16 (App Router) with TypeScript, Tailwind CSS, and RTL support
- **Backend**: Node.js/Express with TypeScript and MongoDB
- **Architecture**: API-driven with real-time chat capabilities
- **Focus**: Cultural sensitivity, Islamic values, and privacy compliance

### Technology Stack

#### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with RTL plugin for Arabic support
- **Icons**: Lucide React
- **State Management**: React Context + useReducer
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Socket.IO client for chat functionality
- **Testing**: Jest + React Testing Library + Playwright

#### Backend
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

## Directory Structure

```
alzawaj-project/
├── alzawaj-project-backend/      # Node.js/Express API server
├── alzawaj-project-frontend/     # Next.js frontend application
├── ACTIVE_CHATS_FIX_SUMMARY.md   # Active chats feature documentation
├── ADMIN_REQUESTS_FIX_SUMMARY.md # Admin functionality fixes
├── API_ERRORS_FIXED.md          # API error resolution documentation
├── API_MISMATCH_ANALYSIS.md     # API compatibility analysis
├── CHAT_IMPROVEMENTS.md         # Chat system improvements
├── DATABASE_SEEDING_SUMMARY.md  # Database seeding documentation
├── MOCK_DATA_REPLACEMENT_PLAN.md # Mock data replacement planning
├── MOCK_DATA_REPLACEMENT_SUMMARY.md # Mock data replacement summary
├── PROFILE_API_FIX_SUMMARY.md   # Profile API fixes
├── START_BACKEND.md            # Backend startup instructions
├── USER_REQUESTS_FIX_SUMMARY.md # User requests fixes
```

## Building and Running

### Prerequisites
- Node.js 18+ (for frontend) / Node.js 20.19+ (for backend)
- pnpm 8+
- Git
- MongoDB (local or Atlas)

### Frontend Setup
1. Navigate to frontend directory: `cd alzawaj-project-frontend`
2. Install dependencies: `npm install`
3. Set up environment variables by copying `.env.local.example` to `.env.local`
4. Start development server: `npm run dev`

### Backend Setup
1. Navigate to backend directory: `cd alzawaj-project-backend`
2. Install dependencies: `pnpm install`
3. Set up environment variables in `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://<your-mongodb-connection-string>
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_ENDPOINT=your_imagekit_endpoint
   NODE_ENV=development
   PORT=5001
   ```
4. Start development server: `pnpm run dev`

### Development Commands

#### Frontend
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e

# Documentation
npm run storybook
npm run analyze
```

#### Backend
```bash
# Development server with hot reload
pnpm run dev

# Build TypeScript to dist/
pnpm run build

# Run production build
pnpm start

# Testing
pnpm test
pnpm run test:watch
pnpm run test:coverage

# Code quality
pnpm run lint
pnpm run lint:fix
pnpm run format

# Database operations
pnpm run db:seed
pnpm run db:migrate

# Production management
pnpm run logs
pnpm run restart
pnpm run stop
```

## Key Features

### User Management & Authentication
- Smart 8-step registration system with Islamic values integration
- OTP verification for secure phone/email verification
- Profile builder wizard with privacy controls
- Religious compatibility matching (Madhab, prayer level)
- Family background information management
- Two-factor authentication and secure password policies

### Advanced Search & Discovery
- Smart filtering system with age, location, education, profession criteria
- Privacy-respecting search (users control who can view their profiles)
- AI-powered compatibility scoring based on Islamic principles
- Geographic search with privacy controls
- Saved searches and profile bookmarking

### Communication & Interaction
- Secure marriage requests with parental involvement options
- Moderated chat system with Islamic guidelines enforcement
- Rate-limited messaging to prevent spam
- Auto-translation support for Arabic/English
- File sharing with content moderation
- Voice messages and video call integration

### Privacy & Security
- End-to-end encryption for sensitive communications
- Islamic privacy controls respecting guidelines for male-female interactions
- Parental oversight features
- GDPR/CCPA compliance with Islamic privacy principles
- Anonymous browsing options

### AI-Powered Moderation
- Arabic content analysis with advanced NLP
- Islamic guidelines enforcement
- Behavioral analysis for suspicious activities
- Automated warnings and real-time monitoring
- Cultural sensitivity AI

### Admin & Management
- Comprehensive dashboard with real-time analytics
- Content moderation panel
- User management system
- Request monitoring
- Analytics and reporting

### Internationalization & Accessibility
- Full RTL support for Arabic language
- Multi-language support (Arabic and English)
- WCAG 2.1 AA compliance
- Screen reader and keyboard navigation support
- High contrast mode and adjustable text sizes

## API Endpoints

### Frontend API Routes
- `/api/auth` - Authentication
- `/api/profile` - Profile management
- `/api/search` - Profile search functionality
- `/api/requests` - Marriage requests
- `/api/chat` - Chat system
- `/api/notifications` - Notifications
- `/api/admin` - Admin functionality
- `/api/reports` - Report submission

### Backend API Endpoints
- `/api/auth/*` - Authentication (register, login, logout)
- `/api/profile/*` - Profile management
- `/api/search/*` - Search and filtering
- `/api/requests/*` - Marriage requests
- `/api/chat/*` - Chat functionality
- `/api/notifications/*` - Notifications
- `/api/admin/*` - Admin panel
- `/api/reports/*` - Reporting system

## Development Conventions

### Code Organization
- Frontend uses Next.js App Router structure
- Backend follows MVC pattern with controllers, models, services
- Type definitions are maintained for both frontend and backend
- Path aliases configured in both projects

### Testing Strategy
- Unit tests with Jest
- Component tests with React Testing Library
- End-to-end tests with Playwright
- Integration tests for API endpoints

### Security & Privacy
- End-to-end encryption for sensitive communications
- JWT-based authentication with secure cookies
- Rate limiting to prevent abuse
- Input validation and sanitization
- GDPR/CCPA compliance with Islamic privacy principles

### Cultural Considerations
- Right-to-left (RTL) layout support for Arabic
- Islamic guidelines enforcement in content moderation
- Privacy controls respecting Islamic values for male-female interactions
- Arabic/English translation support
- Cultural sensitivity in UI design

## Common Issues & Solutions

### Backend Not Running
- Ensure backend server is running on port 5001
- Check environment variables are properly set
- Verify MongoDB connection
- See START_BACKEND.md for detailed instructions

### API Errors
- Empty error responses usually mean backend is not running
- Verify API endpoints are correctly configured
- Check CORS settings match frontend URL

### Type Mismatches
- API response types may differ from UI component expectations
- Use type casting when necessary (marked with `as unknown as Type`)
- Align TypeScript interfaces between frontend and backend

### API Mismatch Issues
The project has several API mismatches between frontend expectations and backend implementations:
- Authentication: Frontend expects `/auth/verify-otp` but backend uses `/auth/verify-phone`
- Search: Frontend uses POST `/search/profiles` but backend expects GET `/search`
- Profile: Different endpoints for profile picture deletion
- Marriage requests: Frontend expects unified `/requests/respond` but backend has separate accept/reject endpoints

## Documentation Files

Several markdown files provide detailed information about specific aspects of the project:
- `START_BACKEND.md` - Backend startup instructions
- `API_ERRORS_FIXED.md` - API error resolution documentation
- `API_MISMATCH_ANALYSIS.md` - Detailed analysis of API endpoint mismatches
- `MOCK_DATA_REPLACEMENT_SUMMARY.md` - Mock data replacement details
- `PROFILE_API_FIX_SUMMARY.md` - Profile API fixes and implementation
- `DATABASE_SEEDING_SUMMARY.md` - Database seeding information
- `CHAT_IMPROVEMENTS.md` - Chat system improvements
- `ADMIN_REQUESTS_FIX_SUMMARY.md` - Admin functionality fixes