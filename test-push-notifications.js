async function testPushNotifications() {
    console.log('=== Islamic Zawaj Platform - Push Notification Test ===\n');

    // Configuration
    const BASE_URL = 'http://localhost:5001/api';
    const USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
    const USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword';
    const TARGET_USER_ID = process.env.TARGET_USER_ID || '507f1f77bcf86cd799439011';

    console.log('User credentials:', { email: USER_EMAIL, password: '***', targetUserId: TARGET_USER_ID });
    console.log('');

    try {
        // Step 1: Login to get authentication token
        console.log('1. Logging in to get authentication token...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: USER_EMAIL,
                password: USER_PASSWORD
            })
        });

        const loginData = await loginResponse.json();

        if (loginData.success) {
            const authToken = loginData.token;
            console.log('✓ Login successful');
            console.log(`✓ Token obtained: ${authToken.substring(0, 20)}...`);

            // Step 2: Send notification
            console.log('\n2. Sending test notification...');
            const notificationResponse = await fetch(
                `${BASE_URL}/notifications/send`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: TARGET_USER_ID,
                        title: 'Test Notification',
                        message: 'This is a test push notification from the Node.js script',
                        type: 'system'
                    })
                }
            );

            const notificationData = await notificationResponse.json();

            if (notificationData.success) {
                console.log('✓ Notification sent successfully');
                if (notificationData.data && notificationData.data.notification) {
                    console.log(`✓ Notification ID: ${notificationData.data.notification._id}`);
                }
            } else {
                console.log('✗ Failed to send notification');
                console.log('Response:', notificationData);
            }

            // Step 3: Check user's notifications
            console.log('\n3. Checking user\'s notifications...');
            const notificationsResponse = await fetch(
                `${BASE_URL}/notifications`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const notificationsData = await notificationsResponse.json();

            if (notificationsResponse.status === 200) {
                const notificationCount = notificationsData.data.notifications.length;
                console.log(`✓ Retrieved notifications. Count: ${notificationCount}`);
                if (notificationCount > 0) {
                    const latest = notificationsData.data.notifications[0];
                    console.log(`✓ Latest notification: "${latest.title}" - "${latest.message}"`);
                }
            } else {
                console.log('✗ Failed to retrieve notifications');
                console.log('Response:', notificationsData);
            }

            // Step 4: Check unread notifications count
            console.log('\n4. Checking unread notifications count...');
            const unreadResponse = await fetch(
                `${BASE_URL}/notifications/unread-count`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const unreadData = await unreadResponse.json();

            if (unreadResponse.status === 200) {
                const unreadCount = unreadData.data.count;
                console.log(`✓ Unread notifications count: ${unreadCount}`);
            } else {
                console.log('✗ Failed to get unread count');
                console.log('Response:', unreadData);
            }

            // Step 5: Register a device token (optional)
            console.log('\n5. Testing device token registration (optional)...');
            const mockToken = `test_fcm_token_${Date.now()}`;
            try {
                const tokenResponse = await fetch(
                    `${BASE_URL}/notifications/register-token`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ token: mockToken })
                    }
                );

                const tokenData = await tokenResponse.json();

                if (tokenData.success) {
                    console.log('✓ Device token registered successfully');
                } else {
                    console.log('✗ Device token registration failed (expected without Firebase setup)');
                }
            } catch (error) {
                console.log('✗ Device token registration failed (expected without Firebase setup)');
            }

        } else {
            console.log('✗ Login failed');
            console.log('Response:', loginData);
        }
    } catch (error) {
        console.error('✗ Error during testing:', error.message);
    }

    console.log('\n=== Test Complete ===');
    console.log('\nNote: For push notifications to actually reach the user\'s device,');
    console.log('you need to configure Firebase properly in your backend environment.');
}

// Run the test
testPushNotifications().catch(console.error);