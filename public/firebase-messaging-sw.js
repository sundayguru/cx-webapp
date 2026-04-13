// Firebase messaging service worker
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js',
);

// Initialize Firebase by fetching config from API endpoint
// Service workers cannot access import.meta.env, so we fetch from the API
const initializeFirebase = async () => {
  try {
    // Fetch Firebase config from API endpoint
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.status}`);
    }

    const config = await response.json();

    // Validate config
    if (!config.apiKey || !config.projectId) {
      throw new Error('Firebase configuration is incomplete');
    }

    // Initialize Firebase
    firebase.initializeApp(config);
    return firebase.messaging();
  } catch (error) {
    console.error('Failed to initialize Firebase in service worker:', error);
    throw error;
  }
};

// Initialize Firebase and set up message handlers
initializeFirebase()
  .then((messaging) => {
    console.log('Firebase initialized in service worker');

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('Received background message:', payload);

      const notificationTitle =
        payload.notification?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/favicon.ico',
        badge: payload.notification?.badge || '/favicon.ico',
        tag: payload.notification?.tag || 'default',
        data: payload.data || {},
        actions: payload.notification?.actions || [],
        requireInteraction: true,
        silent: false,
      };

      // Show notification
      return self.registration.showNotification(
        notificationTitle,
        notificationOptions,
      );
    });
  })
  .catch((error) => {
    console.error('Failed to initialize Firebase in service worker:', error);
  });

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Handle notification actions
  if (event.action) {
    // Handle specific actions
    console.log('Action clicked:', event.action);
  } else {
    // Default click behavior - open the app
    event.waitUntil(clients.openWindow('/'));
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
