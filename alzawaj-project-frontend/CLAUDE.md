# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Common Commands

### Development

```bash
npm run dev              # Start development server on http://localhost:3000
npm run type-check       # Run TypeScript type checking
```

### Building & Deployment

```bash
npm run build           # Production build with Prettier formatting
npm run start           # Start production server
npm run analyze         # Analyze bundle size (set ANALYZE=true)
```

### Code Quality

```bash
npm run lint            # ESLint checking
npm run lint:fix        # Fix ESLint issues automatically
```

### Testing

```bash
npm run test            # Run unit tests with Jest
npm run test:watch      # Watch mode for development
npm run test:coverage   # Generate coverage report
npm run test:e2e        # Run end-to-end tests with Playwright
```

### Documentation

```bash
npm run storybook       # Start Storybook on http://localhost:6006
npm run build-storybook # Build Storybook for deployment
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks (configured in `.husky/`). Lint-staged runs automatic formatting before commits.

## 📋 Project Overview

**Islamic Zawaj Platform** - A Next.js 14 Arabic-first matrimonial platform for Muslim marriages with RTL support, gender-specific privacy controls, and Islamic compliance.

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with RTL support
- **Forms**: React Hook Form + Zod validation
- **State**: React Query (@tanstack/react-query) + Context providers
- **UI Components**: Radix UI primitives + custom components
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library + Playwright
- **Backend Integration**: Axios with interceptors (connects to backend at alzawaj-backend-staging.onrender.com)

## 🏗️ High-Level Architecture

### Directory Structure

```
alzawaj-project-frontend/
├── app/                          # Next.js App Router (v14)
│   ├── (auth)/                   # Auth route group
│   │   ├── login/                # Login page
│   │   ├── register/             # Multi-step registration
│   │   ├── forgot-password/      # Password reset
│   │   └── verify-otp/           # OTP verification
│   ├── (dashboard)/              # Protected user routes (via middleware)
│   │   ├── profile/              # Profile management
│   │   ├── search/               # Search with filters
│   │   ├── requests/             # Marriage requests (sent/received)
│   │   ├── chat/                 # Moderated chat system
│   │   └── settings/             # User settings
│   ├── admin/                    # Admin dashboard
│   │   ├── users/                # User management
│   │   ├── requests/             # Request moderation
│   │   └── messages/             # Message moderation
│   ├── api/                      # API routes (proxy to backend)
│   │   ├── auth/                 # Auth endpoints
│   │   ├── requests/             # Request endpoints
│   │   └── admin/                # Admin endpoints
│   ├── layout.tsx                # Root layout (Arabic, RTL, fonts)
│   ├── page.tsx                  # Landing page
│   └── providers.tsx             # Provider composition

├── components/                   # Reusable components
│   ├── ui/                       # Base UI components (Radix + shadcn-style)
│   ├── auth/                     # Auth-specific components
│   │   └── registration-steps/   # Multi-step form
│   ├── search/                   # Search components
│   ├── chat/                     # Chat components
│   ├── admin/                    # Admin components
│   ├── profile/                  # Profile components
│   ├── requests/                 # Request components
│   ├── common/                   # Shared components
│   └── layouts/                  # Layout components

├── lib/                          # Core utilities and configurations
│   ├── api/                      # API client layer
│   │   ├── client.ts             # Axios instance with interceptors
│   │   ├── auth.ts               # Auth API functions
│   │   ├── profile.ts            # Profile API functions
│   │   ├── search.ts             # Search API functions
│   │   └── admin.ts              # Admin API functions
│   ├── auth/                     # Authentication utilities
│   ├── constants/                # App constants (countries, options, etc.)
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Authentication hook
│   │   ├── useOTP.ts             # OTP verification hook
│   │   ├── useRegistration.ts    # Registration hook
│   │   └── useSelectorData.ts    # Data selector hook
│   ├── services/                 # External service integrations
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts              # Main types
│   │   ├── auth.types.ts         # User/Profile types
│   │   └── admin.types.ts        # Admin types
│   ├── utils/                    # Helper functions
│   ├── validation/               # Zod schemas
│   ├── static-data/              # Static app data
│   └── mock-data/                # Mock data for development

├── providers/                    # React Context providers
│   ├── auth-provider.tsx         # Authentication state
│   ├── theme-provider.tsx        # Theme configuration
│   ├── language-provider.tsx     # Internationalization
│   ├── notification-provider.tsx # Toast notifications
│   ├── chat-provider.tsx         # Chat state
│   ├── loading-provider.tsx      # Loading states
│   └── profile-privacy-provider.tsx # Privacy controls

└── public/                       # Static assets
    ├── fonts/                    # Arabic fonts (Noto Kufi Arabic, Amiri)
    └── images/                   # Images and icons
```

### Key Architecture Patterns

#### 1. **Provider Composition Pattern** (app/providers.tsx:47-66)

Providers are nested in a specific order for dependency management:

```typescript
<ErrorBoundary>
  <QueryClientProvider>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ProfilePrivacyProvider>
            <LoadingProvider>
              <NotificationProvider>
                <ChatProvider>{children}</ChatProvider>
              </NotificationProvider>
            </LoadingProvider>
          </ProfilePrivacyProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
</ErrorBoundary>
```

#### 2. **API Client Layer** (lib/api/client.ts:6-301)

Axios-based client with:

- Automatic JWT token injection from localStorage
- Automatic token refresh on 401 errors
- Centralized error handling
- File upload support
- CSRF token injection

**Base URL Configuration:**

- Development: `http://localhost:3000/api`
- Production: `https://alzawaj-backend-staging.onrender.com/api`

#### 3. **Custom Hooks Pattern**

Centralized business logic in `lib/hooks/`:

- `useAuth.ts` - Login/logout, token management
- `useOTP.ts` - OTP verification flow
- `useRegistration.ts` - Multi-step registration
- `useSelectorData.ts` - Data selection utilities

#### 4. **Type-Safe API Responses** (lib/types/index.ts:278-289)

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### 5. **Gender-Specific Profile Types** (lib/types/auth.types.ts)

Profiles are strongly typed by gender with shared BaseProfile:

- `MaleProfile` - Male-specific fields (beard, financial situation, housing)
- `FemaleProfile` - Female-specific fields (hijab, guardian info, work preference)
- `Profile` - Union type for either gender

#### 6. **Registration Wizard Pattern** (components/auth/registration-steps/)

Multi-step registration with state persistence:

1. Basic Info (name, age, gender)
2. Religious Info (prayers, religious level)
3. Education & Work
4. Physical Appearance (gender-specific)
5. Preferences (what they're looking for)
6. Profile Picture (optional)
7. Guardian Info (for females)
8. Bio & Additional Info

### Authentication Flow

1. **Login** (app/auth/login/page.tsx)

   - User submits email/password
   - `useAuth` hook calls `/auth/login`
   - Token stored in localStorage (key: `zawaj_auth_token`)
   - Redirected to `/dashboard`

2. **Token Management** (lib/api/client.ts:21-160)

   - Token automatically added to all API requests
   - On 401, attempts refresh via `/auth/refresh-token`
   - Refresh token stored separately (key: `zawaj_refresh_token`)

3. **Route Protection**
   - Dashboard routes protected by middleware
   - Admin routes require admin role

### Key API Endpoints (lib/constants/index.ts:3-64)

**Authentication:**

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/verify-otp` - Verify phone/email OTP
- `POST /auth/refresh-token` - Refresh JWT token

**Profile:**

- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `POST /profile/picture` - Upload profile picture

**Search:**

- `GET /search/profiles` - Search profiles with filters
- `GET /search/filters` - Get available filter options

**Marriage Requests:**

- `POST /requests/send` - Send marriage request
- `GET /requests/received` - Get received requests
- `GET /requests/sent` - Get sent requests
- `POST /requests/respond` - Accept/reject request

**Chat:**

- `GET /chat/rooms` - Get chat rooms
- `GET /chat/messages` - Get messages
- `POST /chat/send` - Send message
- `GET /chat/limits` - Get user's chat limits

**Admin:**

- `GET /admin/users` - Get users with pagination
- `GET /admin/requests` - Get all requests
- `POST /admin/users/:id/action` - Suspend/activate user

### Privacy & Security

#### Privacy Controls (lib/types/index.ts:88-128)

- **Profile Picture Visibility**: everyone/matches-only/none
- **Age/Location/Occupation**: show/hide toggles
- **Gender-Specific Controls** (for females):
  - Profile visibility: everyone/verified-only/premium-only/guardian-approved
  - Allow profile views: everyone/verified-males/premium-males/guardian-approved
  - Require guardian approval for contact

#### Chat Rate Limiting (lib/constants/index.ts:152-158)

- 1 message per hour
- 3 messages per day
- Max 3 concurrent chats
- Messages expire after 7 days
- Max 500 characters per message

#### Content Moderation (lib/constants/index.ts:273-281)

- Arabic abusive words list for auto-filtering
- Admin moderation panel for flagged content
- Message approval workflow

### RTL & Internationalization

**Arabic-First Design** (app/layout.tsx:229-234)

- HTML `dir="rtl"` set globally
- Arabic fonts loaded with `display=swap`:
  - Noto Kufi Arabic (primary)
  - Amiri (secondary/serif)
- Font preloading for performance (lines 245-265)

**Font Loading** (lib/hooks/useFontLoading.ts)

- Custom hook for monitoring font loading state
- Optimized Arabic font rendering

### Important Configuration Files

**next.config.js**

- Image optimization for S3 domains (line 19-28)
- Security headers (X-Frame-Options, CSP) (line 31-55)
- i18n: Arabic as default locale (line 58-62)
- Webpack: Font optimization (line 70-92)
- Standalone output for deployment (line 115)

**tailwind.config.js**

- Custom Arabic font configuration
- RTL plugin enabled
- Custom color scheme (primary: #5d1a78, secondary: #4CAF50)
- Extended spacing and typography scales

**tsconfig.json**

- Strict TypeScript configuration
- Path aliases for clean imports (line 22-33)
- @/_ maps to ./_ for absolute imports

### Storage Keys (lib/constants/index.ts:212-218)

```typescript
AUTH_TOKEN: "zawaj_auth_token";
REFRESH_TOKEN: "zawaj_refresh_token";
USER_DATA: "zawaj_user_data";
THEME_SETTINGS: "zawaj_theme_settings";
PROFILE_BUILDER_DRAFT: "zawaj_profile_builder_draft";
```

### Key Constants (lib/constants/index.ts)

**Countries** (line 66-99): 29 countries with Arabic/English names
**Marital Status** (line 101-105): single, divorced, widowed
**Religious Levels** (line 107-111): basic, practicing, very-religious
**Education** (line 113-120): high-school through PhD
**Occupation** (line 122-137): 14 occupation options
**Validation Rules** (line 160-182): Name (2-50 chars), Age (18-70), Password (8-128 chars)
**File Upload** (line 184-190): Profile pictures max 5MB, JPEG/PNG/WebP

### Environment Variables

Required in `.env.local`:

- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend app URL (for metadata)
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_VERIFICATION_ID` - SEO verification (optional)

### Component Library (components/ui/)

Built on Radix UI primitives with shadcn-style:

- Button (variants: primary, secondary, outline, ghost, danger)
- Input (with label, error states)
- Dialog/Modal
- Dropdown Menu
- Checkbox
- Toast/Toaster
- Select
- Avatar
- Card

### Testing Strategy

**Unit Tests** (Jest + React Testing Library):

- Component rendering
- Custom hooks
- Utility functions
- API integration (with MSW - Mock Service Worker)

**E2E Tests** (Playwright):

- Authentication flows
- Profile creation
- Search functionality
- Request sending
- Admin workflows

### Performance Optimizations

- Next.js Image optimization (line 19-28 in next.config.js)
- Font preloading and optimization (app/layout.tsx:245-265)
- Bundle analyzer integration
- React Query for client-side caching
- SWC minification enabled
- Console removal in production (line 15 in next.config.js)

### Deployment

**Vercel-optimized** with:

- Standalone output mode
- Analytics integration (Vercel Analytics)
- Speed Insights
- Automatic redirects from `/home` → `/`, `/login` → `/auth/register`

### Development Workflow

1. **Install dependencies**: `npm install`
2. **Setup environment**: Copy `.env.local.example` to `.env.local`
3. **Start dev server**: `npm run dev`
4. **Run tests**: `npm run test`
5. **Lint & format**: Runs automatically on commit via Husky
6. **Build**: `npm run build` (includes Prettier formatting)

### Backend Integration

The frontend expects a REST API backend (currently staging at alzawaj-backend-staging.onrender.com). Key integration points:

**Authentication Flow**:

1. Register → verify OTP → login → receive JWT + refresh token
2. Token stored in localStorage
3. All API requests include `Authorization: Bearer <token>`
4. On 401, automatic refresh attempt

**File Uploads**:

- Profile pictures via `POST /profile/picture`
- FormData with file appended
- Progress callbacks supported

**Real-time Features**:

- Chat uses polling (Socket.IO prepared but may not be fully implemented)
- Notifications via polling

### Common Development Tasks

**Adding a new API endpoint**:

1. Add endpoint to `lib/constants/index.ts` → API_ENDPOINTS
2. Create API function in appropriate `lib/api/*.ts` file
3. Add TypeScript types in `lib/types/*.ts`
4. Use in components via custom hooks

**Adding a new page**:

1. Create route in `app/(dashboard)/` or `app/admin/`
2. Export metadata and default component
3. Add navigation in appropriate menu component
4. Add route to `lib/constants/index.ts` → ROUTES

**Adding validation**:

1. Create/update Zod schema in `lib/validation/`
2. Import and use with React Hook Form
3. Display errors using Input component's error prop

**Working with forms**:

- Use React Hook Form with Zod resolver
- Wrap with appropriate provider (Auth, Profile, etc.)
- Display loading states via LoadingProvider
- Show toasts via NotificationProvider

### Islamic Compliance Features

- **Gender-specific privacy controls** for female users
- **Guardian approval system** for female profile interactions
- **Prayer level matching** in search filters
- **Islamic prayer time integration** (optional notifications)
- **Halal marriage request workflow** with formal introduction process
- **No direct messaging** without marriage request acceptance
- **Chat rate limiting** to prevent inappropriate conversations
- **Content moderation** with Arabic language support

### Known Architectural Decisions

1. **localStorage for auth** (not cookies) - for better SSR compatibility
2. **Axios over Fetch** - for better interceptors and automatic transforms
3. **React Query for state management** - for caching and background updates
4. **Context + Hooks pattern** - for business logic separation
5. **Gender-specific types** - for type safety and clarity
6. **API proxy pattern** - Next.js API routes proxy to backend (in /app/api)
7. **Multi-step registration** - to reduce form abandonment
8. **Arabic-first design** - RTL support with Arabic typography optimization

---

This is an Islamic matrimonial platform built with Next.js 14, TypeScript, and Tailwind CSS. It's designed with Arabic as the primary language and Islamic privacy principles at its core. The codebase emphasizes type safety, accessibility, and gender-specific privacy controls.
