# QWEN.md - Islamic Zawaj Platform

## Project Overview

The Islamic Zawaj Platform is a comprehensive Next.js 14 application designed as a platform for Islamic marriage connections. It's built with privacy, moderation, and cultural sensitivity at its core, targeting the Muslim community worldwide.

The project follows a modern full-stack architecture with:
- **Frontend**: Next.js 14 (App Router) with TypeScript, Tailwind CSS, and RTL support
- **Backend**: Node.js/Express with TypeScript and MongoDB
- **Architecture**: API-driven with real-time chat capabilities
- **Focus**: Cultural sensitivity, Islamic values, and privacy compliance

## Project Structure

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

## Frontend (Next.js Application)

### Technology Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with RTL plugin for Arabic support
- **Icons**: Lucide React
- **State Management**: React Context + useReducer
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library + Playwright

### Key Features
- Multi-step registration process with 8-step guided profile creation
- OTP verification for secure phone/email verification
- Comprehensive profile builder with privacy controls
- Advanced search with geographic and religious compatibility filters
- Real-time chat system with Islamic guidelines enforcement
- End-to-end encryption for sensitive communications
- Full RTL support for Arabic language
- WCAG 2.1 AA accessibility compliance
- Mobile-first responsive design

### Development Commands
```bash
# Install dependencies
npm install

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

# Other utilities
npm run storybook    # Component documentation
npm run analyze      # Bundle analysis
```

### Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
AWS_S3_BUCKET_URL=your_s3_bucket_url
# Additional variables from .env.local.example
```

## Backend (Node.js/Express API)

### Technology Stack
- **Runtime**: Node.js 20.19+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with bcrypt
- **Real-time**: Socket.IO for chat
- **Documentation**: OpenAPI/Swagger
- **Testing**: Jest with MongoDB Memory Server
- **Image Upload**: ImageKit CDN
- **Package Manager**: pnpm

### Key Features
- RESTful API with comprehensive endpoints
- User authentication and profile management
- Advanced search and filtering capabilities
- Real-time chat system with moderation
- Marriage request system
- Admin dashboard with user management
- Content moderation with Islamic guidelines
- Rate limiting and security measures
- API documentation with Swagger UI

### Development Commands
```bash
# Install dependencies
pnpm install

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

### Environment Variables
Create a `.env` file in the backend directory with:
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

## Development Workflow

### Starting the Application
1. Navigate to the backend directory and start the server:
   ```bash
   cd alzawaj-project-backend
   pnpm install
   pnpm run dev
   ```
   
2. In a new terminal, navigate to the frontend directory and start the client:
   ```bash
   cd alzawaj-project-frontend
   npm install
   npm run dev
   ```

### API Integration Status
- Mock data has been replaced with real API calls
- Backend connection established and tested
- Admin panel now uses real data instead of mock data
- Search functionality integrated with real backend
- Profile viewing fixed to work with user IDs

### Key Endpoints
**Frontend API Routes:**
- `/api/auth` - Authentication
- `/api/profile` - Profile management
- `/api/search` - Profile search functionality
- `/api/requests` - Marriage requests
- `/api/chat` - Chat system
- `/api/notifications` - Notifications
- `/api/admin` - Admin functionality

**Backend API Endpoints:**
- `/api/auth/*` - Authentication (register, login, logout)
- `/api/profile/*` - Profile management
- `/api/search/*` - Search and filtering
- `/api/requests/*` - Marriage requests
- `/api/chat/*` - Chat functionality
- `/api/notifications/*` - Notifications
- `/api/admin/*` - Admin panel

## Development Guidelines

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

## Documentation Files

Several markdown files provide detailed information about specific aspects of the project:
- `START_BACKEND.md` - Backend startup instructions
- `API_ERRORS_FIXED.md` - API error resolution documentation
- `MOCK_DATA_REPLACEMENT_SUMMARY.md` - Mock data replacement details
- `PROFILE_API_FIX_SUMMARY.md` - Profile API fixes and implementation
- `DATABASE_SEEDING_SUMMARY.md` - Database seeding information
- `CHAT_IMPROVEMENTS.md` - Chat system improvements
- `ADMIN_REQUESTS_FIX_SUMMARY.md` - Admin functionality fixes

## Deployment

### Frontend (Vercel)
- Production build: `npm run build`
- Start production server: `npm run start`
- Deploy with Vercel CLI: `vercel --prod`

### Backend (PM2/Render)
- Production build: `pnpm run build`
- Start with PM2: `pnpm run deploy`
- Configured for Render deployment with `render.yaml`