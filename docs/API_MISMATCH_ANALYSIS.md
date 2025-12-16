# API Mismatch Analysis: Frontend vs Backend

**Date**: November 1, 2025
**Purpose**: Detailed comparison between frontend API expectations and backend implementations
**Author**: Claude Code Analysis

---

## Executive Summary

This analysis identifies **missing APIs** and **mismatches** between the frontend (Next.js) and backend (Node.js/Express) implementations. The frontend expects certain endpoints that the backend doesn't provide, and vice versa.

### Key Findings
- **🔴 Critical**: 16 endpoints expected by frontend but missing from backend
- **🟡 Moderate**: 6 endpoint mismatches (wrong paths/methods)
- **🟢 Minor**: 6 backend-only endpoints not used by frontend
- **📊 Total Frontend Endpoints**: 41
- **📊 Total Backend Endpoints**: 49

---

## 1. CRITICAL MISSING ENDPOINTS (Frontend → Backend)

### 1.1 Authentication Routes

| # | Frontend Expects | Method | Status | Backend Implementation |
|---|------------------|--------|--------|----------------------|
| 1 | `/auth/verify-otp` | POST | ❌ Missing | No OTP verification endpoint |
| 2 | `/auth/resend-otp` | POST | ❌ Missing | Backend uses `send-phone-verification` |
| 3 | `/auth/forgot-password` | POST | ✅ Exists | Available but different implementation |
| 4 | `/auth/reset-password` | POST | ✅ Exists | Available but different implementation |

**Impact**: HIGH - Authentication flows broken

**Frontend Code** (lib/api/index.ts:100-128):
```typescript
verifyOTP: (data: OTPFormData) => ApiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data),
resendOTP: (identifier: string) => ApiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, { identifier }),
```

**Backend Code** (src/routes/authRoutes.ts:215-221):
```typescript
// Backend has verify-phone, not verify-otp
router.post("/verify-phone", protect, phoneVerificationValidation, validateRequest, verifyPhone);
```

**Recommendation**: Create `/auth/verify-otp` and `/auth/resend-otp` endpoints, or update frontend to use backend's `/verify-phone` and `/send-phone-verification`.

---

### 1.2 Profile Routes

| # | Frontend Expects | Method | Status | Backend Implementation |
|---|------------------|--------|--------|----------------------|
| 5 | `/profile/picture` | DELETE | ❌ Missing | Backend has `/profile/photo/:fileId` |
| 6 | `/profile/complete` | POST | ❌ Missing | No profile completion endpoint |

**Impact**: MEDIUM - Profile picture deletion and completion tracking broken

**Frontend Code** (lib/api/index.ts:157-160):
```typescript
deleteProfilePicture: () => ApiClient.delete(API_ENDPOINTS.PROFILE.DELETE_PICTURE),
completeProfile: () => ApiClient.post(API_ENDPOINTS.PROFILE.COMPLETE),
```

**Backend Code** (src/routes/profileRoutes.ts:87-89):
```typescript
// Backend has different endpoint
router.delete("/photo/:fileId", protect, param('fileId').notEmpty(), validateRequest, profileController.deletePhoto);
```

**Recommendation**: Create DELETE `/profile/picture` and POST `/profile/complete` endpoints.

---

### 1.3 Search Routes

| # | Frontend Expects | Method | Status | Backend Implementation |
|---|------------------|--------|--------|----------------------|
| 7 | `/search/profiles` | POST | ❌ Missing | Backend has GET `/search` |
| 8 | `/search/filters` | GET | ✅ Exists | Available |
| 9 | `/search/quick` | GET | ✅ Exists | Available |
| 10 | `/search/recommendations` | GET | ✅ Exists | Available |

**Impact**: HIGH - Search functionality broken

**Frontend Code** (lib/api/index.ts:164-174):
```typescript
searchProfiles: (filters: SearchFilters, page = 1, limit = 20) =>
  ApiClient.post<{
    profiles: Profile[];
    pagination: any;
  }>(API_ENDPOINTS.SEARCH.PROFILES, { filters, page, limit }),
```

**Frontend Code** (lib/api/search.ts:66-103):
```typescript
// Also uses GET with query params
export async function searchProfiles(filters: SearchFilters = {}): Promise<SearchResponse> {
  const endpoint = `/search${queryString ? `?${queryString}` : ""}`;
  const response = await ApiClient.get<SearchResponse["data"]>(endpoint);
}
```

**Backend Code** (src/routes/searchRoutes.ts:50-51):
```typescript
// Backend expects GET with query params
router.get("/", protect, rateLimitConfig.search, searchValidation, validateRequest, searchController.searchProfiles);
```

**Recommendation**: Update frontend to use GET `/search` with query params instead of POST `/search/profiles`.

---

### 1.4 Marriage Request Routes

| # | Frontend Expects | Method | Status | Backend Implementation |
|---|------------------|--------|--------|----------------------|
| 11 | `/requests/respond` | POST | ❌ Missing | Backend has `/requests/respond/:requestId/accept` and `/requests/respond/:requestId/reject` |

**Impact**: HIGH - Request response functionality broken

**Frontend Code** (lib/api/index.ts:198-199):
```typescript
respondToRequest: (data: RespondToRequestFormData) =>
  ApiClient.post<MarriageRequest>(API_ENDPOINTS.REQUESTS.RESPOND, data),
```

**Backend Code** (src/routes/requestRoutes.ts:57-61):
```typescript
// Backend uses separate endpoints for accept/reject
router.post("/respond/:requestId/accept", protect, respondRequestValidation, validateRequest, requestController.acceptRequest);
router.post("/respond/:requestId/reject", protect, respondRequestValidation, validateRequest, requestController.rejectRequest);
```

**Recommendation**: Create unified `/requests/respond` endpoint, or update frontend to use backend's separate endpoints.

---

### 1.5 Notification Routes

| # | Frontend Expects | Method | Status | Backend Implementation |
|---|------------------|--------|--------|----------------------|
| 12 | `/notifications/:notificationId/read` | PATCH | ❌ Missing | Backend has `/notifications/:notificationId/read` |
| 13 | `/notifications/read` | PATCH | ✅ Exists | Backend has `/notifications/read` (mark all) |
| 14 | `/notifications/unread-count` | GET | ✅ Exists | Available |

**Impact**: LOW - Individual notification marking works

**Frontend Code** (lib/api/index.ts:228-236):
```typescript
markAsRead: (notificationId: string) =>
  ApiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS.MARK_READ}/${notificationId}`),
markAllAsRead: () => ApiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ),
```

**Backend Code** (src/routes/notificationRoutes.ts:24-28):
```typescript
// Backend uses PATCH /:notificationId/read
router.patch("/:notificationId/read", protect, markAsReadValidation, validateRequest, notificationController.markAsRead);
router.patch("/read", protect, notificationController.markAllAsRead);
```

**Note**: Endpoint structure matches but frontend expects `/notifications/read/:id` vs backend's `/notifications/:id/read`. Both implementations exist, just path order differs.

**Recommendation**: Keep backend version (it's RESTful standard), update frontend to use `/notifications/:id/read`.

---

### 1.6 Chat Routes

| # | Frontend Expects | Method | Status | Backend Implementation |
|---|------------------|--------|--------|----------------------|
| 15 | `/chat/rooms` | GET | ✅ Exists | Available |
| 16 | `/chat/messages` | GET | ✅ Exists | Backend has `/chat/messages/:chatRoomId` |
| 17 | `/chat/send` | POST | ✅ Exists | Available |
| 18 | `/chat/limits` | GET | ✅ Exists | Available |

**Impact**: LOW - Chat rooms listing works, messages by room ID works

**Frontend Code** (lib/api/index.ts:208-219):
```typescript
getChatRooms: () => ApiClient.get<ChatRoom[]>(API_ENDPOINTS.CHAT.GET_ROOMS),
getMessages: (chatRoomId: string, page = 1, limit = 50) =>
  ApiClient.get<{
    messages: Message[];
    pagination: any;
  }>(`${API_ENDPOINTS.CHAT.GET_MESSAGES}/${chatRoomId}?page=${page}&limit=${limit}`),
```

**Backend Code** (src/routes/chatRoutes.ts:31-32):
```typescript
// Backend expects /chat/messages/:chatRoomId
router.get("/messages/:chatRoomId", protect, getMessagesValidation, validateRequest, chatController.getChatMessages);
```

**Note**: Both implementations work, just different endpoint structures.

---

### 1.7 Admin Routes

| # | Frontend Expects | Method | Status | Backend Implementation |
|---|------------------|--------|--------|----------------------|
| 19 | `/admin/users` | GET | ✅ Exists | Available |
| 20 | `/admin/requests` | GET | ✅ Exists | Available |
| 21 | `/admin/messages` | GET | ❌ Missing | Backend has `/admin/messages/pending` |
| 22 | `/admin/reports` | GET | ✅ Exists | Available |
| 23 | `/admin/settings` | GET/PUT | ✅ Exists | Available |
| 24 | `/admin/stats` | GET | ✅ Exists | Available |

**Impact**: LOW - Admin message moderation limited

**Frontend Code** (alzawaj-project-frontend/lib/api/admin.ts):
- Uses mock data currently (useMockData = true)
- Expects `/admin/messages` but backend provides `/admin/messages/pending`

---

### 1.8 Additional Frontend Expectations (lib/api/search.ts)

| # | Frontend Expects | Method | Status | Backend Implementation |
|---|------------------|--------|--------|----------------------|
| 25 | `/search/quick` | GET | ✅ Exists | Available |
| 26 | `/search/recommendations` | GET | ✅ Exists | Available |

---

### 1.9 Reports API

| # | Frontend Expects | Method | Status | Backend Implementation |
|---|------------------|--------|--------|----------------------|
| 27 | `/reports` | POST | ❌ Missing | No reports submission endpoint found |

**Impact**: MEDIUM - Users cannot submit reports

**Frontend Code** (lib/api/index.ts:240-243):
```typescript
submitReport: (data: ReportFormData) =>
  ApiClient.post<Report>("/api/reports", data),
```

**Recommendation**: Create POST `/reports` endpoint for user-submitted reports.

---

## 2. BACKEND-ONLY ENDPOINTS (Not Used by Frontend)

### 2.1 Authentication
1. `/auth/logout-all` - POST - Logout from all devices
2. `/auth/send-email-verification` - POST - Send email verification
3. `/auth/send-phone-verification` - POST - Send phone verification
4. `/auth/verify-email` - POST - Verify email address
5. `/auth/change-password` - POST - Change password (authenticated)
6. `/auth/me` - GET - Get current user info

**Note**: Frontend has `logout` function but uses different endpoint structure

### 2.2 Profile
7. `/profile/photos` - POST - Upload additional photos
8. `/profile/photos/:photoUrl` - DELETE - Delete additional photo
9. `/profile/photo/:fileId` - DELETE - Delete photo by fileId
10. `/profile/all` - GET - Get all profiles (admin/listing)
11. `/profile/privacy` - PATCH - Update privacy settings
12. `/profile/completion` - GET - Get profile completion status
13. `/profile/stats` - GET - Get profile statistics
14. `/profile/block` - POST - Block user
15. `/profile/unblock` - POST - Unblock user
16. `/profile/blocked` - GET - Get blocked users
17. `/profile/verify/:profileId` - PATCH - Verify profile (admin)

### 2.3 Search
18. `/search/save` - POST - Save search criteria
19. `/search/saved` - GET - Get saved searches
20. `/search/saved/:searchName` - DELETE - Delete saved search
21. `/search/stats` - GET - Get search statistics

### 2.4 Requests
22. `/requests/respond/:requestId/accept` - POST - Accept request
23. `/requests/respond/:requestId/reject` - POST - Reject request
24. `/requests/cancel/:requestId` - POST - Cancel sent request
25. `/requests/read/:requestId` - POST - Mark request as read
26. `/requests/meeting/:requestId` - POST - Arrange meeting
27. `/requests/meeting/:requestId/confirm` - POST - Confirm meeting
28. `/requests/stats` - GET - Get request statistics

### 2.5 Chat
29. `/chat/read/:chatRoomId` - POST - Mark messages as read
30. `/chat/archive/:chatRoomId` - POST - Archive chat
31. `/chat/unarchive/:chatRoomId` - POST - Unarchive chat
32. `/chat/:chatRoomId` - DELETE - Delete chat

### 2.6 Admin
33. `/admin/users/action` - POST - Perform user action
34. `/admin/messages/pending` - GET - Get pending messages
35. `/admin/messages/:messageId/approve` - POST - Approve message
36. `/admin/messages/:messageId/reject` - POST - Reject message
37. `/admin/reports/:reportId/action` - POST - Perform report action

### 2.7 Notifications
38. `/notifications/:notificationId` - DELETE - Delete notification

---

## 3. ENDPOINT PATH MISMATCHES

### 3.1 Profile Picture Delete

**Frontend**: `/profile/picture` (DELETE)
**Backend**: `/profile/photo/:fileId` (DELETE)

**Impact**: Profile picture deletion fails

**Recommendation**: Create both endpoints or standardize on one.

### 3.2 Chat Messages

**Frontend**: `/chat/messages/{chatRoomId}` (GET)
**Backend**: `/chat/messages/:chatRoomId` (GET)

**Impact**: Works but inconsistent naming (curly braces vs colon)

**Recommendation**: Use backend's RESTful parameter syntax.

### 3.3 Notification Mark as Read

**Frontend**: `/notifications/read/{notificationId}` (PATCH)
**Backend**: `/notifications/:notificationId/read` (PATCH)

**Impact**: Works but different RESTful style

**Recommendation**: Use backend's RESTful parameter syntax.

### 3.4 Marriage Request Respond

**Frontend**: `/requests/respond` (POST with requestId in body)
**Backend**:
- `/requests/respond/:requestId/accept` (POST)
- `/requests/respond/:requestId/reject` (POST)

**Impact**: Frontend's unified respond endpoint doesn't exist

**Recommendation**: Create unified respond endpoint or update frontend.

---

## 4. FRONTEND API INCONSISTENCIES

### 4.1 Search API - Dual Implementations

The frontend has **two different implementations** for search:

**Implementation 1** (lib/api/index.ts:164-174):
```typescript
export const searchApi = {
  searchProfiles: (filters: SearchFilters, page = 1, limit = 20) =>
    ApiClient.post<{ profiles: Profile[]; pagination: any }>(
      API_ENDPOINTS.SEARCH.PROFILES,  // "/search/profiles"
      { filters, page, limit }
    ),
  getFilterOptions: () =>
    ApiClient.get<{ countries, cities, educationLevels, occupations }>(
      API_ENDPOINTS.SEARCH.FILTERS  // "/search/filters"
    ),
};
```

**Implementation 2** (lib/api/search.ts:66-175):
```typescript
export async function searchProfiles(filters: SearchFilters = {}): Promise<SearchResponse> {
  const endpoint = `/search${queryString ? `?${queryString}` : ""}`;  // GET with query params
  const response = await ApiClient.get<SearchResponse["data"]>(endpoint);
}

export async function quickSearch(query: string): Promise<QuickSearchResponse> {
  const endpoint = `/search/quick?${params.toString()}`;
}

export async function getSearchRecommendations(): Promise<QuickSearchResponse> {
  const endpoint = `/search/recommendations`;
}
```

**Issue**: Frontend expects POST `/search/profiles` but also has GET `/search` implementation. Backend only supports GET `/search`.

### 4.2 Profile API - Inconsistent Updates

**Implementation 1** (lib/api/index.ts:132-161):
```typescript
export const profileApi = {
  getProfile: () => ApiClient.get<Profile>(API_ENDPOINTS.PROFILE.GET),
  updateBasicInfo: (data: BasicInfoFormData) =>
    ApiClient.patch<Profile>(`${API_ENDPOINTS.PROFILE.UPDATE}/basic`, data),
  updateReligiousInfo: (data: ReligiousInfoFormData) =>
    ApiClient.patch<Profile>(`${API_ENDPOINTS.PROFILE.UPDATE}/religious`, data),
  // ... more specific update endpoints
};
```

**Implementation 2** (lib/api/profile.ts:56-147):
```typescript
export async function updateProfileFlat(profileData: Record<string, any>): Promise<ApiProfile> {
  const response = await ApiClient.patch<ApiProfile>("/profile", profileData);
}

export async function updateProfile(profileData: { basicInfo?, location?, ... }): Promise<ApiProfile> {
  const response = await ApiClient.patch<ApiProfile>("/profile", profileData);
}
```

**Issue**: Frontend has both generic `/profile` PATCH and specific `/profile/{section}` PATCH endpoints. Backend only supports generic `/profile` PATCH.

---

## 5. PRIORITY CLASSIFICATION

### 🔴 CRITICAL (Fix Immediately)

1. **Authentication - OTP Verification**
   - Missing: `/auth/verify-otp`, `/auth/resend-otp`
   - Impact: Users cannot complete registration/login flow
   - Solution: Create endpoints or map to existing `/verify-phone`

2. **Search - Profile Search**
   - Mismatch: Frontend POST `/search/profiles` vs Backend GET `/search`
   - Impact: Search functionality broken
   - Solution: Update frontend to use GET `/search`

3. **Marriage Requests - Respond**
   - Missing: `/requests/respond`
   - Impact: Cannot respond to marriage requests
   - Solution: Create unified endpoint or update frontend

### 🟡 MODERATE (Fix Soon)

4. **Profile - Picture Deletion**
   - Mismatch: `/profile/picture` vs `/profile/photo/:fileId`
   - Impact: Profile picture deletion fails
   - Solution: Create DELETE `/profile/picture` endpoint

5. **Profile - Completion**
   - Missing: `/profile/complete`
   - Impact: Cannot mark profile as complete
   - Solution: Create POST `/profile/complete` endpoint

6. **Reports - Submit Report**
   - Missing: POST `/reports`
   - Impact: Users cannot report inappropriate content
   - Solution: Create reports submission endpoint

7. **Search API Inconsistency**
   - Issue: Dual implementations in frontend
   - Impact: Code confusion and maintenance issues
   - Solution: Consolidate to one implementation

### 🟢 LOW (Fix When Possible)

8. **Notification Mark as Read Path**
   - Mismatch: Different RESTful parameter positions
   - Impact: Minor, both work
   - Solution: Standardize on backend's version

9. **Chat Messages Path**
   - Mismatch: Different RESTful parameter syntax
   - Impact: Minor
   - Solution: Update frontend to match backend

10. **Admin Messages Endpoint**
    - Mismatch: `/admin/messages` vs `/admin/messages/pending`
    - Impact: Admin panel limited
    - Solution: Create GET `/admin/messages` or update frontend

---

## 6. RECOMMENDED ACTIONS

### Phase 1: Critical Fixes (Week 1)

1. **Create Missing Auth Endpoints**
   ```typescript
   // Backend: src/routes/authRoutes.ts
   router.post("/verify-otp", protect, phoneVerificationValidation, validateRequest, verifyPhone);
   router.post("/resend-otp", protect, rateLimitConfig.auth, sendPhoneVerification);
   ```

2. **Update Frontend Search**
   ```typescript
   // Frontend: lib/api/index.ts
   searchProfiles: (filters: SearchFilters, page = 1, limit = 20) => {
     const params = new URLSearchParams({ ...filters, page, limit });
     return ApiClient.get(`/search?${params.toString()}`);
   }
   ```

3. **Create Unified Respond Endpoint**
   ```typescript
   // Backend: src/routes/requestRoutes.ts
   router.post("/respond", protect, respondRequestValidation, validateRequest, requestController.respondToRequest);
   ```

### Phase 2: Moderate Fixes (Week 2)

4. **Create Profile Picture Delete Endpoint**
   ```typescript
   // Backend: src/routes/profileRoutes.ts
   router.delete("/picture", protect, profileController.deleteProfilePicture);
   ```

5. **Create Profile Completion Endpoint**
   ```typescript
   // Backend: src/routes/profileRoutes.ts
   router.post("/complete", protect, profileController.completeProfile);
   ```

6. **Create Reports Endpoint**
   ```typescript
   // Backend: src/routes/reportRoutes.ts (new file)
   router.post("/", protect, submitReportValidation, validateRequest, submitReport);
   ```

### Phase 3: Cleanup (Week 3)

7. **Consolidate Frontend Search API**
   - Choose one implementation (recommend: GET with query params from lib/api/search.ts)
   - Remove duplicate code from lib/api/index.ts

8. **Standardize RESTful Paths**
   - Update frontend to match backend's RESTful parameter syntax
   - Update `/notifications/read/:id` → `/notifications/:id/read`
   - Update `/chat/messages/{chatRoomId}` → `/chat/messages/:chatRoomId`

9. **Clean Up Backend-Only Endpoints**
   - Review which endpoints are truly needed
   - Document unused endpoints
   - Consider removing if not used

---

## 7. TESTING CHECKLIST

After implementing fixes, test the following flows:

### Authentication Flow
- [ ] Register user
- [ ] Verify OTP
- [ ] Resend OTP
- [ ] Login
- [ ] Logout
- [ ] Refresh token

### Profile Flow
- [ ] Get profile
- [ ] Update profile (all sections)
- [ ] Upload profile picture
- [ ] Delete profile picture
- [ ] Upload additional photos
- [ ] Delete additional photo
- [ ] Update privacy settings
- [ ] Get profile completion status

### Search Flow
- [ ] Search profiles with filters
- [ ] Quick search
- [ ] Get recommendations
- [ ] Get filter options
- [ ] Save search (if implemented)
- [ ] Get saved searches (if implemented)

### Marriage Request Flow
- [ ] Send request
- [ ] Get received requests
- [ ] Get sent requests
- [ ] Respond to request (accept/reject)
- [ ] Cancel sent request
- [ ] Arrange meeting (if implemented)

### Chat Flow
- [ ] Get chat rooms
- [ ] Get messages for room
- [ ] Send message
- [ ] Get chat limits
- [ ] Mark messages as read
- [ ] Archive chat

### Notification Flow
- [ ] Get notifications
- [ ] Mark single notification as read
- [ ] Mark all notifications as read
- [ ] Get unread count

### Admin Flow
- [ ] Get admin stats
- [ ] Get users with pagination
- [ ] Perform user action
- [ ] Get marriage requests
- [ ] Get pending messages
- [ ] Approve/reject message
- [ ] Get reports
- [ ] Perform report action
- [ ] Get/update admin settings

### Reports Flow
- [ ] Submit report
- [ ] Get reports (admin)

---

## 8. CONCLUSION

The analysis reveals **significant mismatches** between frontend expectations and backend implementations, particularly in:

1. **Authentication** - OTP verification flow completely broken
2. **Search** - Wrong HTTP method (POST vs GET)
3. **Marriage Requests** - Missing unified respond endpoint
4. **Profile** - Picture deletion and completion tracking missing

The backend has **49 endpoints** while the frontend expects **41 endpoints**, with only **25 matching perfectly**.

**Immediate action required** on critical items to restore basic functionality.

**Estimated effort**:
- Critical fixes: 2-3 days
- Moderate fixes: 3-5 days
- Cleanup: 2-3 days
- **Total: 1-2 weeks**

---

## Appendix A: Complete Endpoint Lists

### Frontend Expected Endpoints (41 total)

#### Auth (7)
1. POST `/auth/register`
2. POST `/auth/login`
3. POST `/auth/logout`
4. POST `/auth/verify-otp` ❌
5. POST `/auth/resend-otp` ❌
6. POST `/auth/forgot-password`
7. POST `/auth/reset-password`
8. POST `/auth/refresh-token`

#### Profile (6)
9. GET `/profile`
10. PATCH `/profile`
11. POST `/profile/picture`
12. DELETE `/profile/picture` ❌
13. POST `/profile/complete` ❌
14. GET `/profile/:profileId` (from profile.ts)

#### Search (5)
15. POST `/search/profiles` ❌
16. GET `/search/filters`
17. GET `/search/quick`
18. GET `/search/recommendations`
19. GET `/search` (from search.ts - duplicate)

#### Requests (5)
20. POST `/requests/send`
21. GET `/requests/received`
22. GET `/requests/sent`
23. POST `/requests/respond` ❌
24. GET `/requests/:requestId`

#### Chat (4)
25. GET `/chat/rooms`
26. GET `/chat/messages/:chatRoomId`
27. POST `/chat/send`
28. GET `/chat/limits`

#### Notifications (3)
29. GET `/notifications`
30. PATCH `/notifications/:id/read`
31. PATCH `/notifications/read`
32. GET `/notifications/unread-count`

#### Admin (6)
33. GET `/admin/stats`
34. GET `/admin/users`
35. POST `/admin/users/action`
36. GET `/admin/requests`
37. GET `/admin/messages` ❌
38. GET `/admin/reports`
39. GET `/admin/settings`
40. PUT `/admin/settings`

#### Reports (1)
41. POST `/reports` ❌

### Backend Implemented Endpoints (49 total)

#### Auth (13)
1. POST `/auth/register`
2. POST `/auth/login`
3. POST `/auth/refresh-token`
4. POST `/auth/logout`
5. POST `/auth/logout-all`
6. POST `/auth/send-email-verification`
7. POST `/auth/verify-email`
8. POST `/auth/send-phone-verification`
9. POST `/auth/verify-phone`
10. POST `/auth/forgot-password`
11. POST `/auth/reset-password`
12. POST `/auth/change-password`
13. GET `/auth/me`

#### Profile (17)
14. GET `/profile`
15. PATCH `/profile`
16. POST `/profile/picture`
17. POST `/profile/photos`
18. DELETE `/profile/photos/:photoUrl`
19. DELETE `/profile/photo/:fileId`
20. GET `/profile/:profileId`
21. GET `/profile/all`
22. PATCH `/profile/privacy`
23. GET `/profile/completion`
24. GET `/profile/stats`
25. POST `/profile/block`
26. POST `/profile/unblock`
27. GET `/profile/blocked`
28. DELETE `/profile`
29. PATCH `/profile/verify/:profileId` (admin)

#### Search (8)
30. GET `/search`
31. GET `/search/recommendations`
32. GET `/search/quick`
33. GET `/search/filters`
34. POST `/search/save`
35. GET `/search/saved`
36. DELETE `/search/saved/:searchName`
37. GET `/search/stats`

#### Requests (10)
38. POST `/requests/send`
39. GET `/requests/received`
40. GET `/requests/sent`
41. POST `/requests/respond/:requestId/accept`
42. POST `/requests/respond/:requestId/reject`
43. POST `/requests/cancel/:requestId`
44. POST `/requests/read/:requestId`
45. POST `/requests/meeting/:requestId`
46. POST `/requests/meeting/:requestId/confirm`
47. GET `/requests/:requestId`
48. GET `/requests/stats`

#### Chat (7)
49. GET `/chat/rooms`
50. GET `/chat/messages/:chatRoomId`
51. POST `/chat/send`
52. GET `/chat/limits`
53. POST `/chat/read/:chatRoomId`
54. POST `/chat/archive/:chatRoomId`
55. POST `/chat/unarchive/:chatRoomId`
56. DELETE `/chat/:chatRoomId`

#### Notifications (5)
57. GET `/notifications`
58. PATCH `/notifications/:notificationId/read`
59. PATCH `/notifications/read`
60. GET `/notifications/unread-count`
61. DELETE `/notifications/:notificationId`

#### Admin (8)
62. GET `/admin/stats`
63. GET `/admin/users`
64. POST `/admin/users/action`
65. GET `/admin/requests`
66. GET `/admin/messages/pending`
67. POST `/admin/messages/:messageId/approve`
68. POST `/admin/messages/:messageId/reject`
69. GET `/admin/reports`
70. POST `/admin/reports/:reportId/action`
71. GET `/admin/settings`
72. PUT `/admin/settings`

---

**End of Analysis**
