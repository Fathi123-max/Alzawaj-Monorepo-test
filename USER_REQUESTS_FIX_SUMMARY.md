# User Marriage Requests Response Fix - Summary

## Problem Identified

When users tried to respond to marriage requests (accept/reject) in the user dashboard, they got a **405 Method Not Allowed** error:

```
POST http://localhost:3000/api/requests/respond 405 (Method Not Allowed)
```

## Root Cause

**Mismatched API endpoints between frontend and backend:**

### Frontend was calling:
```
POST /api/requests/respond
```

### Backend had:
```
POST /api/requests/respond/:requestId/accept
POST /api/requests/respond/:requestId/reject
```

The frontend was calling a non-existent endpoint `/api/requests/respond`, which resulted in a 405 error.

## Solution Implemented

### 1. Fixed Frontend API Service

**File:** `alzawaj-project-frontend/lib/services/requests-api-service.ts`

**Before:**
```typescript
async respondToRequest(
  data: RespondToRequestData,
): Promise<SingleRequestResponse> {
  return this.request<SingleRequestResponse>("/respond", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

**After:**
```typescript
async respondToRequest(
  data: RespondToRequestData,
): Promise<SingleRequestResponse> {
  // Use the correct endpoint based on response type
  const endpoint = `/respond/${data.requestId}/${data.response}`;

  return this.request<SingleRequestResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

**Explanation:** Now the frontend dynamically constructs the endpoint based on the response type:
- If `response = "accept"` → calls `/respond/{requestId}/accept`
- If `response = "reject"` → calls `/respond/{requestId}/reject`

### 2. Fixed Backend Validation

**File:** `alzawaj-project-backend/src/routes/requestRoutes.ts`

**Before:**
```typescript
const respondRequestValidation = [
  param("requestId").isMongoId().withMessage("معرف الطلب غير صحيح"),
  body("response").isIn(["accepted", "rejected"]).withMessage("الرد يجب أن يكون مقبول أو مرفوض"),
  body("message").optional().isLength({ max: 500 }).withMessage("الرسالة لا يجب أن تتجاوز 500 حرف"),
];
```

**After:**
```typescript
const respondRequestValidation = [
  param("requestId").isMongoId().withMessage("معرف الطلب غير صحيح"),
  body("response").isIn(["accept", "reject"]).withMessage("الرد يجب أن يكون قبول أو رفض"),
  body("message").optional().isLength({ max: 500 }).withMessage("الرسالة لا يجب أن تتجاوز 500 حرف"),
];
```

**Explanation:** Updated the validation to accept `"accept"` and `"reject"` instead of `"accepted"` and `"rejected"`, matching what the frontend sends.

## API Flow

### Accept Request Flow:

1. **Frontend** (requests-list.tsx):
   - User clicks "قبول" (Accept) button
   - Calls `handleResponse(requestId, "accept")`

2. **Frontend API** (requests-api-service.ts):
   - Calls `respondToRequest({ requestId, response: "accept", ... })`
   - Makes POST to `/api/requests/respond/{requestId}/accept`

3. **Backend Routes** (requestRoutes.ts):
   - Route: `POST /respond/:requestId/accept`
   - Validates requestId and response field

4. **Backend Controller** (requestController.ts):
   - `acceptRequest` controller runs
   - Updates request status to "accepted"
   - Creates chat room for the couple
   - Sends notification to sender
   - Returns success response

5. **Frontend**:
   - Receives success response
   - Shows success toast
   - Refreshes requests list

### Reject Request Flow:

Same flow but with:
- User clicks "رفض" (Reject) button
- Frontend sends response: "reject"
- Backend calls `rejectRequest` controller
- Request status updated to "rejected"
- No chat room created

## Files Modified

1. `alzawaj-project-frontend/lib/services/requests-api-service.ts`
   - Updated `respondToRequest()` method to use correct endpoint

2. `alzawaj-project-backend/src/routes/requestRoutes.ts`
   - Updated validation to accept "accept"/"reject" instead of "accepted"/"rejected"

## How to Test

### 1. Start Backend
```bash
cd alzawaj-project-backend
pnpm run dev
```

### 2. Start Frontend
```bash
cd alzawaj-project-frontend
npm run dev
```

### 3. Test User Request Response

1. **Login as regular user**
2. **Go to Requests page**: http://localhost:3000/dashboard/requests
3. **Find a received request** with status "في الانتظار" (pending)
4. **Click "قبول" (Accept)**:
   - Expected: Success toast "تم قبول طلب الزواج بنجاح"
   - Expected: Request status changes to "مقبول" (accepted)
   - Expected: Accept/Reject buttons disappear
5. **Test another request**:
   - Click "رفض" (Reject)
   - Expected: Success toast "تم رفض طلب الزواج بنجاح"
   - Expected: Request status changes to "مرفوض" (rejected)
   - Expected: Accept/Reject buttons disappear

### 4. Verify Network Calls

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Click Accept/Reject on a request
4. Verify you see:
   - POST request to `/api/requests/respond/{requestId}/accept` OR `/api/requests/respond/{requestId}/reject`
   - Response status: 200
   - Response body contains success: true

## Success Criteria

✅ No 405 Method Not Allowed errors
✅ Accept button works and updates request status
✅ Reject button works and updates request status
✅ Success toasts appear in Arabic
✅ Request list refreshes after response
✅ Network tab shows correct API calls
✅ Chat room created when request is accepted
✅ Notifications sent to sender

## Notes

- The backend already had the correct controllers (`acceptRequest` and `rejectRequest`)
- The frontend was just calling the wrong endpoint
- The fix was simple: match the frontend endpoint to the backend route
- The validation was also slightly wrong and needed adjustment
