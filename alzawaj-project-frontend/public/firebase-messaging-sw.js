// Import the Firebase app and messaging libraries for service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Handle background push notifications
self.addEventListener('push', function(event) {
  console.log('Received background push message ', event);

  try {
    const payload = event.data.json();

    const notificationTitle = payload.notification ? payload.notification.title : 'Notification';
    const notificationOptions = {
      body: payload.notification && payload.notification.body ? payload.notification.body : '',
      icon: '/logo.png', // Use your app's logo
      data: payload.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (err) {
    console.error('Error handling push event:', err);

    // Fallback notification if parsing fails
    event.waitUntil(
      self.registration.showNotification('Notification', {
        body: 'You have a new notification',
        icon: '/logo.png'
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received.');

  event.notification.close();

  // Open the app when notification is clicked
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});