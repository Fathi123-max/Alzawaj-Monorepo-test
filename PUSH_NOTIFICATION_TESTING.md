# Islamic Zawaj Platform - Push Notification Testing

This document provides instructions on how to test push notifications in the Islamic Zawaj Platform.

## Overview

The platform includes a notification system that can send both in-app notifications and push notifications to users' devices. When a user logs in, the system requests notification permissions and registers the device with Firebase Cloud Messaging (FCM).

## Prerequisites

1. Backend server running on `http://localhost:5001` (default port)
2. Valid user credentials in the database
3. For actual push notifications: Firebase configuration in backend environment

## Testing Methods

### Method 1: Using the Test Script (Recommended)

#### Bash Script
```bash
# Make sure you have jq installed
# On macOS: brew install jq
# On Ubuntu/Debian: sudo apt-get install jq

# Run the test script
./test-push-notifications.sh -e test@example.com -p password123 -t USER_ID_TO_SEND_TO
```

#### Node.js Script
```bash
# For the Node.js script, no additional dependencies are needed
node test-push-notifications.js
```

### Method 2: Using cURL Commands

#### Step 1: Get Authentication Token
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

#### Step 2: Send Test Notification
```bash
curl -X POST http://localhost:5001/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE" \
  -d '{
    "userId": "TARGET_USER_ID", 
    "title": "Test Notification",
    "message": "This is a test push notification",
    "type": "system"
  }'
```

#### Step 3: Check User's Notifications
```bash
curl -X GET http://localhost:5001/api/notifications \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE"
```

#### Step 4: Get Unread Count
```bash
curl -X GET http://localhost:5001/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE"
```

### Method 3: Register a Device Token
```bash
curl -X POST http://localhost:5001/api/notifications/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE" \
  -d '{
    "token": "YOUR_FCM_TOKEN_HERE"
  }'
```

## Environment Variables for Testing Scripts

For the test scripts, you can set these environment variables:

```bash
export TEST_USER_EMAIL="your_test_email@example.com"
export TEST_USER_PASSWORD="your_test_password"
export TARGET_USER_ID="user_id_to_send_notification_to"
node test-push-notifications.js
```

Or run:
```bash
TEST_USER_EMAIL="test@example.com" \
TEST_USER_PASSWORD="password" \
TARGET_USER_ID="507f1f77bcf86cd799439011" \
node test-push-notifications.js
```

## Firebase Configuration (For Actual Push Notifications)

To receive actual push notifications on devices, you need to configure Firebase in your backend:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Get your Firebase service account key:
   - Go to Project Settings
   - Scroll down to "Service Accounts"
   - Click "Generate new private key"
   - Save the JSON file

3. Set these environment variables in your backend `.env` file:
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_VAPID_KEY=your_vapid_key
```

4. For development, you might want to set a mock token:
```env
FIREBASE_MOCK_TOKEN=your_mock_token_for_testing
```

## How Push Notifications Work in the Platform

1. When a user logs in, the system requests notification permissions in the browser
2. If granted, the system gets an FCM token from Firebase
3. The FCM token is registered with the backend and stored in the user's profile
4. When a notification needs to be sent, the system:
   - Creates the notification in the database
   - Sends a real-time notification via WebSocket if the user is online
   - Sends a push notification via FCM (if the user has an FCM token)

## Expected Test Results

When running the tests, you should see:
- Successful login and token retrieval
- Successful notification sending
- Successful retrieval of notifications
- Successful retrieval of unread count
- Device token registration (may fail without Firebase setup)

## Troubleshooting

- If login fails, ensure the backend is running and the credentials are correct
- If notification sending fails, check the user ID and authorization token
- If push notifications don't arrive on the device, verify Firebase configuration
- If using the bash script, ensure `jq` is installed for JSON parsing
- Service worker registration errors may occur in development environments

## Security Notes

- Always protect authentication tokens
- Never expose tokens in client-side code in production
- The notification system includes proper authentication and authorization checks
- FCM tokens are stored securely and associated only with the user's account

## Additional Endpoints

You can also test these notification endpoints:

- `GET /api/notifications/unread-count` - Get unread notifications count
- `PATCH /api/notifications/:notificationId/read` - Mark a notification as read
- `PATCH /api/notifications/read` - Mark all notifications as read
- `DELETE /api/notifications/:notificationId` - Delete a notification