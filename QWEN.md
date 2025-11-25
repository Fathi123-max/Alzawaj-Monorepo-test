# Islamic Zawaj Platform - QWEN Documentation

## Project Overview

The Islamic Zawaj Platform is a comprehensive, culturally-sensitive application built to facilitate Islamic marriage connections. It consists of a Next.js 14 frontend and a Node.js/Express/MongoDB backend, with privacy, moderation, and cultural sensitivity at its core.

The project is organized in two main directories:
- `alzawaj-project-frontend/` - Next.js 14 frontend application
- `alzawaj-project-backend/` - Node.js/Express API server with MongoDB

### Key Features

- **Islamic Values Integration**: Built with Islamic principles and cultural sensitivity
- **Privacy Controls**: Advanced privacy settings for profile data and communications
- **Moderated Communications**: AI-powered moderation with Islamic guidelines enforcement
- **Multi-language Support**: Arabic and English with right-to-left (RTL) support
- **8-Step Registration**: Guided profile creation process
- **Advanced Search**: Geographic, religious, and compatibility-based filtering
- **Secure Messaging**: Encrypted chat system with Islamic guidelines
- **Family Involvement**: Guardian approval workflow for female users
- **Admin Dashboard**: Comprehensive user and content management

### Tech Stack

#### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with RTL plugin for Arabic support
- **Icons**: Lucide React
- **State Management**: React Context + useReducer + TanStack Query
- **Forms**: React Hook Form + Zod validation
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

## Building and Running

### Prerequisites
- Node.js (18+ for frontend, 20.19+ for backend)
- pnpm (backend) and npm (frontend)
- MongoDB (local or cloud instance)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd alzawaj-project-backend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create `.env` file with required environment variables
4. Start the development server:
   ```bash
   pnpm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd alzawaj-project-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` file with required environment variables
4. Start the development server:
   ```bash
   npm run dev
   ```

### API Integration Status
The frontend has replaced mock data with real API calls. The authentication system, profile management, search, and chat functionality are integrated with the backend API endpoints.

## Key Configuration Files

- `alzawaj-project-backend/.env` - Backend environment variables
- `alzawaj-project-frontend/.env.local` - Frontend environment variables
- `alzawaj-project-backend/package.json` - Backend dependencies and scripts
- `alzawaj-project-frontend/package.json` - Frontend dependencies and scripts
- `alzawaj-project-backend/tsconfig.json` - Backend TypeScript configuration
- `alzawaj-project-frontend/tsconfig.json` - Frontend TypeScript configuration

## Development Conventions

### Code Structure
- Frontend uses Next.js App Router structure with a focus on feature-based routing
- Backend follows MVC pattern with controllers, models, services, and middleware
- Type definitions are maintained for both frontend and backend with alignment between API and UI types
- Path aliases configured in both projects

### Security & Privacy
- End-to-end encryption for sensitive communications
- JWT-based authentication with secure cookies
- Rate limiting to prevent abuse
- Input validation and sanitization
- GDPR/CCPA compliance with Islamic privacy principles
- Comprehensive privacy controls allowing users to hide specific fields (age, location, occupation, etc.)

### Cultural Considerations
- Right-to-left (RTL) layout support for Arabic
- Islamic guidelines enforcement in content moderation
- Privacy controls respecting Islamic values for male-female interactions
- Arabic/English translation support
- Guardian approval workflow for female users
- Compatibility checking based on religious criteria (madhab, prayer level, etc.)

### Testing Strategy
- Unit tests with Jest for both frontend and backend
- Component tests with React Testing Library
- End-to-end tests with Playwright
- Integration tests for API endpoints
- Mock service worker (MSW) for API mocking during development
- Comprehensive test coverage targeting 80%+

### Error Handling
- Graceful error handling with Arabic language error messages
- Backend health checks before API calls
- Fallback mechanisms when API is unavailable
- Proper user feedback for various error conditions
- Detailed logging for debugging (Winston in backend, console in frontend)

## Important Directories

### Frontend Structure
- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable UI components organized by feature
- `lib/` - Utilities, API clients, validation schemas, and type definitions
- `providers/` - React Context providers
- `public/` - Static assets (images, fonts, locales)

### Backend Structure
- `src/` - Source code organized by feature
- `src/controllers/` - Express route controllers
- `src/models/` - MongoDB Mongoose models
- `src/routes/` - API route definitions
- `src/middleware/` - Express middleware functions
- `src/services/` - Business logic services
- `src/config/` - Configuration files (database, JWT, etc.)

## API Endpoints

### Frontend API Routes
- `/api/auth/*` - Authentication (login, register, OTP, logout)
- `/api/profile/*` - Profile management (view, update, privacy settings)
- `/api/search/*` - Profile search and recommendations
- `/api/requests/*` - Marriage requests (send, respond, track)
- `/api/chat/*` - Chat functionality (messages, rooms, limits)
- `/api/notifications/*` - Notification management
- `/api/admin/*` - Admin panel endpoints

### Backend API Endpoints
- `/api/auth/*` - User authentication
- `/api/profile/*` - Profile management
- `/api/search/*` - Search and filtering
- `/api/requests/*` - Marriage requests
- `/api/chat/*` - Chat functionality
- `/api/notifications/*` - Notifications
- `/api/admin/*` - Admin functionality
- `/api/health` - Backend health check

## Privacy Settings Enforcement

The application implements comprehensive privacy controls that are enforced at the backend level:

1. **Profile Display Privacy**:
   - `showAge`: Hides age and date of birth from non-owners
   - `showLocation`: Hides location data from non-owners
   - `showOccupation`: Hides occupation information from non-owners
   - `showProfilePicture`: Controls who can view profile pictures

2. **Communication Privacy**:
   - `allowMessagesFrom`: Controls who can send messages (none, matches-only, everyone)
   - `allowContactRequests`: Controls who can send marriage requests
   - `requireGuardianApproval`: Requires guardian approval for requests (especially for female users)

3. **Search Privacy**:
   - `allowNearbySearch`: Excludes users who disabled nearby search
   - `hideFromLocalUsers`: Hides users from local searches

## Key Development Notes

### Type Alignment
- There may be type mismatches between API response types and UI component expectations
- Type casting is sometimes required when API Profile types differ from UI Profile types
- Use `as unknown as Type` when necessary, but aim to align types properly

### Testing Requirements
- The application requires the backend to be running for full functionality
- API error responses show meaningful messages when backend is unavailable
- Mock fallbacks have been removed, so the backend must be running for API-dependent features

### Cultural Sensitivity Features
- Automatic guardian approval requirements for female users
- Religious compatibility filtering (madhab, prayer level, etc.)
- Islamic content moderation enforcing appropriate communication
- Privacy controls that respect Islamic principles for gender interactions

## Troubleshooting Common Issues

### Backend Not Running
- Ensure backend server is running on port 5001 (or configured port)
- Check environment variables are properly set
- Verify MongoDB connection
- See START_BACKEND.md for detailed instructions

### API Errors
- Empty error responses usually mean backend is not running
- Verify API endpoints are correctly configured
- Check CORS settings match frontend URL
- Ensure authentication tokens are valid and not expired

### Type Mismatches
- API response types may differ from UI component expectations
- Use type casting when necessary but mark with `as unknown as Type`
- Align TypeScript interfaces between frontend and backend

### Privacy Settings Not Working
- Verify privacy settings are being saved to the database
- Check that backend controllers are properly enforcing privacy settings
- Ensure frontend is sending privacy setting updates correctly

## Deployment Notes

### Frontend (Vercel)
- Production build: `npm run build`
- Start production server: `npm run start`
- Deploy with Vercel CLI: `vercel --prod`

### Backend (PM2/Render)
- Production build: `pnpm run build`
- Start with PM2: `pnpm run deploy`
- Configured for Render deployment with `render.yaml`

## Documentation Files

Several markdown files provide detailed information about specific aspects of the project:
- `START_BACKEND.md` - Backend startup instructions
- `API_ERRORS_FIXED.md` - API error resolution documentation
- `MOCK_DATA_REPLACEMENT_SUMMARY.md` - Mock data replacement details
- `PROFILE_API_FIX_SUMMARY.md` - Profile API fixes and implementation
- `DATABASE_SEEDING_SUMMARY.md` - Database seeding information
- `CHAT_IMPROVEMENTS.md` - Chat system improvements
- `ADMIN_REQUESTS_FIX_SUMMARY.md` - Admin functionality fixes
- `PRIVACY_ENFORCEMENT_SUMMARY.md` - Privacy settings implementation

This documentation provides essential context for development, including the cultural sensitivity requirements, Islamic values integration, privacy controls, and technical architecture of the Islamic Zawaj Platform.