# Notification Permission Implementation

## Overview

This document describes the implementation of notification permissions in the Islamic Zawaj Platform, specifically how notification permissions are requested when users log in.

## Implementation Details

### 1. Location of Implementation

Notification permissions are requested in the authentication flow after successful login or OTP verification. The implementation is located in:

- `alzawaj-project-frontend/providers/auth-provider.tsx`

### 2. Trigger Points

Notification permissions are requested after:

1. Successful password-based login (`login` function)
2. Successful OTP verification (`verifyOTP` function)

Both of these functions call the `requestNotificationPermission()` function from the notification service.

### 3. Implementation Flow

1. User enters credentials or OTP and submits
2. Authentication API call is made to the backend
3. On successful response:
   - User data and tokens are stored in localStorage
   - Auth state is updated in the context
   - `requestNotificationPermission()` is called
4. `requestNotificationPermission()` function:
   - Checks if running in browser environment
   - Requests notification permissions from the browser
   - If granted, gets an FCM token from Firebase
   - Sends the FCM token to the backend API
   - Backend stores the token associated with the user

### 4. Service Files Involved

- `alzawaj-project-frontend/lib/services/notification-service.ts`: Contains the main `requestNotificationPermission` function
- `alzawaj-project-frontend/lib/services/firebase.ts`: Handles Firebase initialization and token generation
- `alzawaj-project-frontend/public/firebase-messaging-sw.js`: Service worker for handling push notifications

### 5. Error Handling

- Notification permission errors are caught and logged
- The authentication flow continues even if notification permission is denied
- Errors don't interrupt the successful login process

### 6. Environmental Dependencies

This implementation requires the following environment variables in the frontend:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY  # Optional but recommended
```

### 7. Backend Integration

The FCM token is sent to the backend via the `notificationsApi.registerDeviceToken` endpoint, which associates the token with the user's account.

### 8. Service Worker

The service worker (`public/firebase-messaging-sw.js`) handles push notifications when the app is in the background. It receives push events from Firebase and displays the notifications to the user.