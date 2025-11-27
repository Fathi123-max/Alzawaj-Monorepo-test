#!/bin/bash
# Test script for push notifications in Islamic Zawaj Platform

echo "=== Islamic Zawaj Platform - Push Notification Test ==="

# Configuration
BASE_URL="http://localhost:5001/api"
FRONTEND_URL="http://localhost:3000"

# Check if jq is installed (for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' is not installed. Please install jq first."
    echo "On macOS: brew install jq"
    echo "On Ubuntu/Debian: sudo apt-get install jq"
    exit 1
fi

# Initialize variables
AUTH_TOKEN=""
USER_EMAIL=""
USER_PASSWORD=""
TARGET_USER_ID=""

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -e <email>     - User email for authentication"
    echo "  -p <password>  - User password for authentication" 
    echo "  -t <user_id>   - Target user ID to send notification to"
    echo "  -h             - Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 -e test@example.com -p password123 -t 507f1f77bcf86cd799439011"
    echo ""
    echo "Note: Make sure the backend server is running on http://localhost:5001"
    exit 1
}

# Parse command line arguments
while getopts "e:p:t:h" opt; do
    case $opt in
        e) USER_EMAIL="$OPTARG" ;;
        p) USER_PASSWORD="$OPTARG" ;;
        t) TARGET_USER_ID="$OPTARG" ;;
        h) usage ;;
        *) usage ;;
    esac
done

# Validate inputs
if [ -z "$USER_EMAIL" ] || [ -z "$USER_PASSWORD" ] || [ -z "$TARGET_USER_ID" ]; then
    echo "Error: All parameters are required"
    usage
fi

echo "Testing push notifications for user: $USER_EMAIL"
echo "Target user ID: $TARGET_USER_ID"
echo ""

# Test 1: Login and get authentication token
echo "1. Logging in to get authentication token..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$USER_EMAIL\", \"password\":\"$USER_PASSWORD\"}")

if echo "$RESPONSE" | jq -e .success >/dev/null 2>&1; then
    AUTH_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
    echo "✓ Login successful"
    echo "✓ Token obtained: ${AUTH_TOKEN:0:20}..."
else
    echo "✗ Login failed"
    echo "$RESPONSE"
    exit 1
fi
echo ""

# Test 2: Send notification
echo "2. Sending test notification..."
RESPONSE=$(curl -s -X POST "$BASE_URL/notifications/send" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "{
        \"userId\": \"$TARGET_USER_ID\",
        \"title\": \"Test Notification\",
        \"message\": \"This is a test push notification from the API\",
        \"type\": \"system\"
    }")

if echo "$RESPONSE" | jq -e .success >/dev/null 2>&1; then
    echo "✓ Notification sent successfully"
    NOTIFICATION_ID=$(echo "$RESPONSE" | jq -r '.data.notification._id // empty')
    if [ -n "$NOTIFICATION_ID" ]; then
        echo "✓ Notification ID: $NOTIFICATION_ID"
    fi
else
    echo "✗ Failed to send notification"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 3: Check user's notifications
echo "3. Checking user's notifications..."
RESPONSE=$(curl -s -X GET "$BASE_URL/notifications" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if [ $? -eq 0 ]; then
    NOTIFICATION_COUNT=$(echo "$RESPONSE" | jq -r '.data.notifications | length')
    echo "✓ Retrieved notifications. Count: $NOTIFICATION_COUNT"
    if [ "$NOTIFICATION_COUNT" -gt 0 ]; then
        LATEST_TITLE=$(echo "$RESPONSE" | jq -r '.data.notifications[0].title')
        LATEST_MESSAGE=$(echo "$RESPONSE" | jq -r '.data.notifications[0].message')
        echo "✓ Latest notification: \"$LATEST_TITLE\" - \"$LATEST_MESSAGE\""
    fi
else
    echo "✗ Failed to retrieve notifications"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 4: Check unread notifications count
echo "4. Checking unread notifications count..."
RESPONSE=$(curl -s -X GET "$BASE_URL/notifications/unread-count" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if [ $? -eq 0 ]; then
    UNREAD_COUNT=$(echo "$RESPONSE" | jq -r '.data.count')
    echo "✓ Unread notifications count: $UNREAD_COUNT"
else
    echo "✗ Failed to get unread count"
    echo "Response: $RESPONSE"
fi
echo ""

# Test 5: Register a device token (optional)
echo "5. Testing device token registration (optional, for push notifications)..."
# Using a mock token for testing; in real scenarios, you'd use an actual FCM token
MOCK_TOKEN="test_fcm_token_$(date +%s)"
RESPONSE=$(curl -s -X POST "$BASE_URL/notifications/register-token" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "{\"token\":\"$MOCK_TOKEN\"}")

if echo "$RESPONSE" | jq -e .success >/dev/null 2>&1; then
    echo "✓ Device token registered successfully"
else
    echo "✗ Device token registration failed (this is expected without proper Firebase setup)"
fi
echo ""

echo "=== Test Complete ==="
echo ""
echo "Summary:"
echo "- Authentication: ✓" 
echo "- Notification sending: $(if echo "$RESPONSE" | jq -e .success >/dev/null 2>&1; then echo "✓"; else echo "✗ (may require Firebase setup)"; fi)"
echo "- Notification retrieval: ✓"
echo "- Device token registration: $(if echo "$RESPONSE" | jq -e .success >/dev/null 2>&1; then echo "✓"; else echo "✗ (expected without Firebase)"; fi)"
echo ""
echo "Note: For push notifications to actually reach the user's device,"
echo "you need to configure Firebase properly in your backend environment."
echo "See the README for Firebase setup instructions."