// Service Worker for Push Notifications
// almari-app/public/sw.js

const CACHE_NAME = 'almari-notifications-v1';
const NOTIFICATION_TAG = 'almari-notification';

// Install event
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching notification assets');
      return cache.addAll([
        '/icons/notification-icon.png',
        '/icons/notification-badge.png',
        '/icons/view-icon.png'
      ]).catch((error) => {
        console.warn('[ServiceWorker] Failed to cache some assets:', error);
      });
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event);
  
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icons/notification-icon.png',
    badge: '/icons/notification-badge.png',
    tag: NOTIFICATION_TAG,
    data: {},
    actions: [],
    requireInteraction: false
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
      console.log('[ServiceWorker] Push payload:', payload);
    } catch (error) {
      console.warn('[ServiceWorker] Failed to parse push payload:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Customize notification based on type
  if (notificationData.data && notificationData.data.type) {
    const notificationType = notificationData.data.type;
    
    switch (notificationType) {
      case 'ORDER_STATUS_CHANGE':
        notificationData.actions = [
          { action: 'view_order', title: 'View Order', icon: '/icons/view-icon.png' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        notificationData.requireInteraction = false;
        break;
        
      case 'PICKUP_READY':
        notificationData.actions = [
          { action: 'view_pickup', title: 'View Details', icon: '/icons/view-icon.png' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        notificationData.requireInteraction = true;
        break;
        
      case 'NEW_ORDER_VENDOR':
        notificationData.actions = [
          { action: 'view_vendor_orders', title: 'View Orders', icon: '/icons/view-icon.png' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        notificationData.requireInteraction = true;
        break;
        
      case 'REFUND_PROCESSED':
        notificationData.actions = [
          { action: 'view_refunds', title: 'View Refunds', icon: '/icons/view-icon.png' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        notificationData.requireInteraction = false;
        break;
        
      case 'LOW_STOCK_ALERT':
        notificationData.actions = [
          { action: 'view_inventory', title: 'View Inventory', icon: '/icons/view-icon.png' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        notificationData.requireInteraction = false;
        break;
        
      default:
        notificationData.actions = [
          { action: 'view', title: 'View', icon: '/icons/view-icon.png' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        break;
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: false,
      timestamp: Date.now()
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  let targetUrl = '/notifications'; // Default URL
  
  // Handle different actions
  if (action === 'dismiss') {
    console.log('[ServiceWorker] Notification dismissed');
    return;
  }
  
  // Determine target URL based on action and data
  if (data.url) {
    targetUrl = data.url;
  } else if (action === 'view_order' || data.orderId) {
    targetUrl = `/customer/orders/${data.orderId || ''}`;
  } else if (action === 'view_pickup') {
    targetUrl = '/agent/orders';
  } else if (action === 'view_vendor_orders') {
    targetUrl = '/vendor/orders';
  } else if (action === 'view_refunds' || data.returnId) {
    targetUrl = `/customer/refunds/${data.returnId || ''}`;
  } else if (action === 'view_inventory') {
    targetUrl = '/vendor/products';
  } else if (data.notificationId) {
    targetUrl = `/notifications?highlight=${data.notificationId}`;
  }
  
  console.log('[ServiceWorker] Opening URL:', targetUrl);
  
  // Handle the click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if the app is already open
      for (let client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action: action,
            data: data,
            url: targetUrl
          });
          return;
        }
      }
      
      // Open new window if app is not open
      return clients.openWindow(targetUrl);
    })
  );
});

// Background sync for offline support
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications when back online
async function syncNotifications() {
  try {
    console.log('[ServiceWorker] Syncing notifications...');
    
    // Get pending notifications from IndexedDB or localStorage
    // This is a placeholder - implement based on your offline strategy
    const pendingNotifications = await getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      await fetch('/api/notifications/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      });
    }
    
    // Clear pending notifications
    await clearPendingNotifications();
    
    console.log('[ServiceWorker] Notifications synced successfully');
  } catch (error) {
    console.error('[ServiceWorker] Failed to sync notifications:', error);
  }
}

// Placeholder functions for offline notification storage
async function getPendingNotifications() {
  // Implement IndexedDB or localStorage retrieval
  return [];
}

async function clearPendingNotifications() {
  // Implement clearing of stored notifications
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error handler
self.addEventListener('error', (event) => {
  console.error('[ServiceWorker] Error:', event.error);
});

// Unhandled promise rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('[ServiceWorker] Unhandled promise rejection:', event.reason);
});

console.log('[ServiceWorker] Service worker script loaded');
