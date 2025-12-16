# Mock Data Replacement Plan - Islamic Zawaj Platform

## 📊 Executive Summary

This document provides a comprehensive plan to replace all mock data in the frontend with real API calls to the backend. The frontend currently uses extensive mock data for development purposes, which needs to be systematically replaced with actual backend integration.

## 🔍 Mock Data Inventory

### 1. Profile Mock Data
**File**: `lib/mock-data/profiles.ts`
- **Data**: `mockProfiles` (15 user profiles with full details)
- **Data**: `mockCurrentUser` (current authenticated user mock)
- **Data**: `filterOptions` (search filter options)
- **Used In**: Search components, profile cards, dashboard

### 2. Admin Mock Data (Multiple Files)
**Files**:
- `lib/static-data/admin-mock-data.ts`
- `lib/static-data/comprehensive-admin-mock.ts`

**Data Exported**:
- `mockUsers` - Admin user list
- `mockMarriageRequests` - Marriage request list
- `mockFlaggedMessages` - Flagged message list
- `mockActiveChats` - Active chat list
- `mockUserReports` - User report list
- `mockAdminNotifications` - Admin notification list
- `mockSystemSettings` - System settings
- `mockAdminStats` - Dashboard statistics
- `mockAdminUsers`, `mockAdminReports`, `mockAdminSettings` - Additional admin data
- Helper functions: `getAdminStats()`, `getAdminDashboardStats()`, etc.

**Used In**: Admin dashboard, user management, report management, settings

### 3. Search Mock Data
**File**: `lib/static-data/search-profiles.ts`
- **Data**: `staticMaleProfiles`, `staticFemaleProfiles`, `staticAllProfiles`
- **Data**: Search filter functions
- **Data**: `mockSearchApi` - Mock search API
- **Used In**: Search pages, filter components, profile discovery

### 4. Marriage Request Mock Data
**File**: `lib/static-data/marriage-requests.ts`
- **Data**: `staticReceivedRequests` - 8 mock received requests
- **Data**: `staticSentRequests` - 6 mock sent requests
- **Data**: `mockRequestsApi` - Mock API functions
- **Used In**: Request pages, request lists, request details

### 5. Service Files with Mock Fallbacks
**File**: `lib/services/search-service.ts`
- **Issue**: Has `convertApiProfileToMockProfile()` conversion function
- **Issue**: Falls back to mock implementation on API error
- **Status**: Partially integrated with real API

**File**: `lib/services/admin-requests-service.ts`
- **Issue**: Returns mock data in catch blocks
- **Status**: Has real API calls but with mock fallbacks

**File**: `lib/api/admin.ts`
- **Issue**: Has `useMockData = true` flag
- **Status**: Switches between mock and real API based on flag

### 6. Components Using Mock Data Directly

#### Dashboard
- `components/dashboard/dashboard-home.tsx`
  - Uses: `searchService.getDashboardStats()`

#### Admin Components
- `components/admin/admin-dashboard.tsx`
  - Uses: `adminApi.getStats()`
- `components/admin/chat-overview-panel.tsx`
  - Uses: `mockActiveChats`
- `components/admin/notifications-box.tsx`
  - Uses: `mockAdminNotifications`

#### Search Components
- `components/search/search-results.tsx`
- `components/search/search-filters.tsx`
- `components/search/request-modal.tsx`
- `components/search/profile-card.tsx`
- `components/search/filter-sidebar.tsx`

#### Request Components
- `components/requests/send-request-form.tsx`
- `components/requests/requests-list.tsx`
- `components/requests/request-response-dialog.tsx`

## 🗺️ API Endpoint Mapping

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - User logout

**Current State**: ✅ **Already Integrated** - No mock data replacement needed

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/picture` - Upload profile picture

**Current State**: ✅ **Already Integrated** - No mock data replacement needed

### Search & Discovery
- `GET /api/search/profiles` - Search profiles with filters
- `GET /api/search/filters` - Get available filter options

**Current State**: ⚠️ **Partially Integrated**
- Service has conversion function from API to mock format
- Fallback to mock data on API errors
- Need to remove conversion and use API directly

### Marriage Requests
- `GET /api/requests/received` - Get received requests
- `GET /api/requests/sent` - Get sent requests
- `POST /api/requests/send` - Send new request
- `POST /api/requests/respond/:requestId/:action` - Accept/reject request
- `GET /api/requests/stats` - Get request statistics

**Current State**: ⚠️ **Partially Integrated**
- Frontend API routes proxy to backend
- Mock fallbacks exist in services
- Need to remove mock fallbacks

### Chat
- `GET /api/chat/rooms` - Get chat rooms
- `GET /api/chat/messages/:roomId` - Get messages
- `POST /api/chat/send` - Send message
- `GET /api/chat/limits` - Get user's chat limits

**Current State**: ✅ **Already Integrated** - No mock data replacement needed

### Admin Dashboard
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - Get users (paginated)
- `GET /api/admin/requests` - Get all requests
- `GET /api/admin/reports` - Get user reports
- `GET /api/admin/settings` - Get admin settings
- `PUT /api/admin/settings` - Update settings
- `POST /api/admin/users/:id/action` - User actions
- `POST /api/admin/reports/:id/action` - Report actions

**Current State**: ⚠️ **Has Mock Flag**
- `lib/api/admin.ts` has `useMockData = true`
- Mock data used in development
- Need to set flag to `false` and test

## 📋 Replacement Strategy

### Phase 1: Remove Mock Flags (High Priority)
1. **Set `useMockData = false`** in `lib/api/admin.ts:31`
2. **Test admin dashboard** to ensure it works with real API
3. **Fix any API response mismatches** between mock and real format

### Phase 2: Remove Mock Fallbacks (High Priority)
1. **Search Service** (`lib/services/search-service.ts`)
   - Remove `convertApiProfileToMockProfile()` function
   - Remove mock fallback in `catch` block
   - Update components to use API response format directly
   - Update TypeScript types if needed

2. **Admin Requests Service** (`lib/services/admin-requests-service.ts`)
   - Remove mock data returns in catch blocks
   - Ensure proper error handling without mock fallbacks

3. **Marriage Requests Mock API** (`lib/static-data/marriage-requests.ts`)
   - Remove `mockRequestsApi` object
   - Remove static request arrays
   - Update components to use real API

### Phase 3: Update Components (Medium Priority)
1. **Dashboard Home** (`components/dashboard/dashboard-home.tsx`)
   - Replace `getDashboardStats()` with real API call
   - Update stats interface if needed

2. **Admin Components**
   - `admin-dashboard.tsx` - Remove mock data dependencies
   - `chat-overview-panel.tsx` - Replace `mockActiveChats` with API
   - `notifications-box.tsx` - Replace `mockAdminNotifications` with API
   - Other admin components using mock data

3. **Search Components**
   - Update to use API response format
   - Remove mock data imports
   - Update type definitions

4. **Request Components**
   - Remove mock API imports
   - Use real API endpoints
   - Update loading and error states

### Phase 4: Remove Mock Data Files (Low Priority)
After all components are updated:
1. Delete `lib/mock-data/profiles.ts`
2. Delete `lib/static-data/admin-mock-data.ts`
3. Delete `lib/static-data/comprehensive-admin-mock.ts`
4. Delete `lib/static-data/search-profiles.ts`
5. Delete `lib/static-data/marriage-requests.ts`

### Phase 5: Testing (Critical)
1. Test all user flows with real API:
   - User authentication
   - Profile management
   - Search and filtering
   - Sending/receiving requests
   - Chat functionality
   - Admin dashboard
2. Test error handling
3. Test loading states
4. Test pagination
5. Test filtering and sorting

## 🔧 Implementation Details

### Type Changes Required

The main type mismatches will likely be in:

1. **Profile Data Format**
   - API format: `{ firstname, lastname, gender: "m"|"f", ... }`
   - Mock format: `{ firstname, lastname, gender: "male"|"female", ... }`

2. **Admin Data Format**
   - API may use different field names than mock
   - Need to align TypeScript types with backend

3. **API Response Wrappers**
   - Ensure all API calls handle: `{ success, data, message, error }`
   - Update components to extract `data` field

### Code Changes by File

#### 1. `lib/api/admin.ts`
```typescript
// Change from:
private useMockData = true;

// To:
private useMockData = false;
```

#### 2. `lib/services/search-service.ts`
```typescript
// Remove or simplify:
// - convertApiProfileToMockProfile()
// - searchProfilesMock()
// - Fallback to mock in catch block

// Keep only real API call:
const response = await searchApiService.searchProfiles(apiFilters);
return {
  profiles: response.data.profiles, // Use directly
  total: response.data.pagination.total,
  // ...
};
```

#### 3. `lib/services/admin-requests-service.ts`
```typescript
// Remove mock return in catch block:
// throw error instead of returning mock data
```

#### 4. Components using mock data
```typescript
// Instead of:
import { mockActiveChats } from '@/lib/static-data/comprehensive-admin-mock';

// Use:
const { data: chats, isLoading } = useQuery({
  queryKey: ['admin-chats'],
  queryFn: () => adminApi.getChats()
});
```

## 📈 Benefits of This Migration

1. **Real Data**: Users see actual platform data
2. **Proper Testing**: Test with real API responses
3. **Accurate Analytics**: Admin sees real platform statistics
4. **Error Handling**: Test real error scenarios
5. **Performance**: Test with real data loads
6. **Security**: Test with real authentication flows

## ⚠️ Risks & Mitigation

### Risk 1: API Response Format Mismatch
**Mitigation**:
- Check backend API documentation
- Compare mock vs real API responses
- Update TypeScript types gradually
- Test each component individually

### Risk 2: Breaking Existing Functionality
**Mitigation**:
- Test each phase before moving to next
- Keep mock data files until all tests pass
- Have rollback plan (set `useMockData = true`)

### Risk 3: Missing Error Handling
**Mitigation**:
- Add proper error boundaries
- Test API failure scenarios
- Add loading states
- Add retry mechanisms

## ✅ Verification Checklist

- [ ] Admin API `useMockData` set to `false`
- [ ] Admin dashboard loads real data
- [ ] Search service uses API directly (no conversion)
- [ ] All admin components use real API
- [ ] Marriage request components use real API
- [ ] Dashboard stats use real API
- [ ] No mock data imports in components
- [ ] All API calls properly handle errors
- [ ] All API calls properly handle loading states
- [ ] All type errors resolved
- [ ] All tests pass
- [ ] E2E tests pass
- [ ] No console errors or warnings

## 📚 Resources

- Backend API Documentation: http://localhost:5001/api-docs
- API Base URL: http://localhost:5001/api (dev) / https://alzawaj-backend-staging.onrender.com/api (prod)
- Frontend API Routes: `/app/api/*` (proxy to backend)

## 🎯 Next Steps

1. Review this plan with the team
2. Set up proper testing environment
3. Start with Phase 1 (remove mock flags)
4. Execute phase by phase
5. Test thoroughly after each phase
6. Deploy to staging for final testing
7. Deploy to production when all tests pass

---

**Estimated Time**: 2-3 days
**Priority**: High
**Complexity**: Medium
**Testing Required**: Extensive
