# Admin Marriage Requests Actions Fix - Summary

## Problem Identified

The admin dashboard in the marriage requests section had **non-functional action buttons**. When clicked, the approve/reject buttons for marriage requests would not call any API endpoints because:

1. **Backend**: No endpoints existed for approving/rejecting marriage requests
2. **Frontend**: No API methods were implemented for these actions
3. **UI**: Buttons had no `onClick` handlers attached

## Solution Implemented

### Backend Changes

#### 1. Added Validation Rules (`alzawaj-project-backend/src/routes/adminRoutes.ts`)

Added validation schema for request actions:

```typescript
const requestActionValidation = [
  param("requestId").isMongoId().withMessage("معرف طلب الزواج غير صحيح"),
  body("action").isIn(["approve", "reject"]).withMessage("الإجراء غير صحيح"),
  body("reason").optional().isLength({ max: 500 }).withMessage("السبب لا يجب أن يتجاوز 500 حرف"),
];
```

#### 2. Added API Routes (`alzawaj-project-backend/src/routes/adminRoutes.ts`)

Added two new endpoints:

```typescript
// Approve marriage request
router.post(
  "/requests/:requestId/approve",
  protect,
  adminOnly,
  requestActionValidation,
  validateRequest,
  adminController.approveMarriageRequest
);

// Reject marriage request
router.post(
  "/requests/:requestId/reject",
  protect,
  adminOnly,
  requestActionValidation,
  validateRequest,
  adminController.rejectMarriageRequest
);
```

#### 3. Added Controller Methods (`alzawaj-project-backend/src/controllers/adminController.ts`)

Implemented `approveMarriageRequest` controller:

```typescript
export const approveMarriageRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;

    const request = await MarriageRequest.findById(requestId);

    if (!request) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    if (request.status !== "pending") {
      res.status(400).json(
        createErrorResponse("يمكن فقط اعتماد طلبات الزواج المعلقة")
      );
      return;
    }

    request.status = "accepted";
    request.moderatedBy = req.user?.id || "";
    request.moderatedAt = new Date();
    await request.save();

    res.json(
      createSuccessResponse("تم اعتماد طلب الزواج بنجاح", { request })
    );
  } catch (error) {
    next(error);
  }
};
```

Implemented `rejectMarriageRequest` controller:

```typescript
export const rejectMarriageRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await MarriageRequest.findById(requestId);

    if (!request) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    if (request.status !== "pending") {
      res.status(400).json(
        createErrorResponse("يمكن فقط رفض طلبات الزواج المعلقة")
      );
      return;
    }

    request.status = "rejected";
    request.moderatedBy = req.user?.id || "";
    request.moderatedAt = new Date();
    request.rejectionReason = reason;
    await request.save();

    res.json(
      createSuccessResponse("تم رفض طلب الزواج بنجاح", { request })
    );
  } catch (error) {
    next(error);
  }
};
```

#### 4. Updated MarriageRequest Model (`alzawaj-project-backend/src/models/MarriageRequest.ts`)

**Updated Interface** (IMarriageRequest):

Added moderation fields:
```typescript
// Admin moderation fields
moderatedBy?: mongoose.Types.ObjectId;
moderatedAt?: Date;
rejectionReason?: string;
```

**Updated Schema** (marriageRequestSchema):

Added schema fields:
```typescript
// Admin moderation fields
moderatedBy: {
  type: Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
moderatedAt: {
  type: Date,
  default: null,
},
rejectionReason: {
  type: String,
  default: null,
},
```

### Frontend Changes

#### 1. Added API Methods (`alzawaj-project-frontend/lib/services/admin-api-service.ts`)

Added `approveMarriageRequest` method:

```typescript
async approveMarriageRequest(
  requestId: string
): Promise<ApiResponse<null>> {
  return this.request<ApiResponse<null>>(`/requests/${requestId}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
```

Added `rejectMarriageRequest` method:

```typescript
async rejectMarriageRequest(
  requestId: string,
  reason?: string
): Promise<ApiResponse<null>> {
  return this.request<ApiResponse<null>>(`/requests/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
```

#### 2. Added Handler Functions (`alzawaj-project-frontend/components/admin/requests-table.tsx`)

Added `handleApprove` function:

```typescript
const handleApprove = async (requestId: string) => {
  try {
    await adminApiService.approveMarriageRequest(requestId);
    showToast.success("تم اعتماد طلب الزواج بنجاح");
    loadRequests(); // Refresh the list
  } catch (error: any) {
    console.error("Error approving request:", error);
    const errorMessage = handleApiError(error);
    showToast.error(errorMessage);
  }
};
```

Added `handleReject` function:

```typescript
const handleReject = async (requestId: string, reason?: string) => {
  try {
    await adminApiService.rejectMarriageRequest(requestId, reason);
    showToast.success("تم رفض طلب الزواج بنجاح");
    loadRequests(); // Refresh the list
  } catch (error: any) {
    console.error("Error rejecting request:", error);
    const errorMessage = handleApiError(error);
    showToast.error(errorMessage);
  }
};
```

#### 3. Connected Buttons to Handlers

**Desktop View** (lines 406-423):

```typescript
<Button
  size="sm"
  variant="ghost"
  className="text-green-600 hover:text-green-800"
  onClick={() => handleApprove(request._id || request.id)}
  title="قبول الطلب"
>
  <CheckCircle className="w-4 h-4" />
</Button>
<Button
  size="sm"
  variant="ghost"
  className="text-red-600 hover:text-red-800"
  onClick={() => handleReject(request._id || request.id)}
  title="رفض الطلب"
>
  <XCircle className="w-4 h-4" />
</Button>
```

**Mobile View** (lines 528-549):

```typescript
<Button
  variant="default"
  className="w-full"
  onClick={() => {
    handleApprove(selectedRequest._id || selectedRequest.id);
    setShowRequestDetails(false);
  }}
>
  <CheckCircle className="w-4 h-4 ml-2" />
  قبول الطلب
</Button>
<Button
  variant="destructive"
  className="w-full"
  onClick={() => {
    handleReject(selectedRequest._id || selectedRequest.id);
    setShowRequestDetails(false);
  }}
>
  <XCircle className="w-4 h-4 ml-2" />
  رفض الطلب
</Button>
```

## How to Test

### 1. Start the Backend

```bash
cd alzawaj-project-backend
pnpm install
pnpm run dev
```

Verify backend is running:
- Health check: http://localhost:5001/health
- API docs: http://localhost:5001/api-docs

### 2. Start the Frontend

```bash
cd alzawaj-project-frontend
npm install
npm run dev
```

Access the app at: http://localhost:3000

### 3. Test the Admin Dashboard

1. **Login as Admin**:
   - Register a new admin account or use existing admin credentials
   - Ensure the user has role: "admin" in the database

2. **Navigate to Admin Dashboard**:
   - Go to http://localhost:3000/admin
   - You should see the admin dashboard with various sections

3. **Test Marriage Requests Section**:
   - Scroll to the "طلبات الزواج" (Marriage Requests) section
   - You should see a table/list of marriage requests

4. **Test Approve Action** (Desktop):
   - Find a request with status "في الانتظار" (pending)
   - Click the green checkmark (✓) button
   - Expected: Toast message "تم اعتماد طلب الزواج بنجاح"
   - Expected: The request status changes to "مقبول" (accepted)
   - Expected: The approve/reject buttons disappear

5. **Test Reject Action** (Desktop):
   - Find another pending request
   - Click the red X button (✗)
   - Expected: Toast message "تم رفض طلب الزواج بنجاح"
   - Expected: The request status changes to "مرفوض" (rejected)
   - Expected: The approve/reject buttons disappear

6. **Test Mobile Actions**:
   - On mobile view, click the ⋯ (more) button on a pending request
   - In the sheet that opens, click "قبول الطلب" or "رفض الطلب"
   - Expected: Same behavior as desktop

7. **Verify API Calls**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Perform an action (approve/reject)
   - Expected: See POST request to `/api/admin/requests/:requestId/approve` or `/api/admin/requests/:requestId/reject`
   - Expected: Response status 200 with success message

## Files Modified

1. `/alzawaj-project-backend/src/routes/adminRoutes.ts` - Added routes
2. `/alzawaj-project-backend/src/controllers/adminController.ts` - Added controller methods
3. `/alzawaj-project-backend/src/models/MarriageRequest.ts` - Added moderation fields
4. `/alzawaj-project-frontend/lib/services/admin-api-service.ts` - Added API methods
5. `/alzawaj-project-frontend/components/admin/requests-table.tsx` - Added handlers and onClick events

## API Endpoints Added

### Approve Marriage Request
- **URL**: `POST /api/admin/requests/:requestId/approve`
- **Auth**: Required (Admin/Moderator)
- **Body**: `{}`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "request": { ... }
    },
    "message": "تم اعتماد طلب الزواج بنجاح"
  }
  ```

### Reject Marriage Request
- **URL**: `POST /api/admin/requests/:requestId/reject`
- **Auth**: Required (Admin/Moderator)
- **Body**:
  ```json
  {
    "reason": "Optional rejection reason"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "request": { ... }
    },
    "message": "تم رفض طلب الزواج بنجاح"
  }
  ```

## Success Criteria

✅ Backend endpoints created and working
✅ Frontend API methods implemented
✅ Button onClick handlers connected
✅ Success/error toasts displayed
✅ Request list refreshes after action
✅ Only pending requests show approve/reject buttons
✅ Both desktop and mobile views functional

## Notes

- Only requests with "pending" status can be approved/rejected
- The system validates admin permissions before allowing actions
- After approval/rejection, the request is marked with `moderatedBy` and `moderatedAt` fields
- Rejection reason is optional and stored in `rejectionReason` field
- The UI automatically hides approve/reject buttons for non-pending requests
