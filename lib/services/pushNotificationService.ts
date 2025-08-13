'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../types/supabase';

type NotificationType = Database['public']['Enums']['NotificationType'];

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: {
    notificationId?: string;
    type?: NotificationType;
    url?: string;
    orderId?: string;
    returnId?: string;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
}

class PushNotificationService {
  private supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  private isSupported = false;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): boolean {
    this.isSupported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    
    return this.isSupported;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  /**
   * Check if push notifications are enabled
   */
  isEnabled(): boolean {
    return this.isSupported && this.getPermissionStatus() === 'granted';
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('[PushNotificationService] Push notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[PushNotificationService] Permission status:', permission);
      return permission;
    } catch (error) {
      console.error('[PushNotificationService] Error requesting permission:', error);
      return 'denied';
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.warn('[PushNotificationService] Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PushNotificationService] Service worker registered:', registration);
      this.registration = registration;

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      return registration;
    } catch (error) {
      console.error('[PushNotificationService] Service worker registration failed:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.vapidPublicKey) {
      console.error('[PushNotificationService] VAPID public key not configured');
      return null;
    }

    try {
      // Ensure we have permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('[PushNotificationService] Permission not granted');
        return null;
      }

      // Register service worker if not already done
      if (!this.registration) {
        this.registration = await this.registerServiceWorker();
        if (!this.registration) {
          throw new Error('Failed to register service worker');
        }
      }

      // Subscribe to push manager
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('[PushNotificationService] Push subscription created:', subscription);

      // Save subscription to database
      await this.saveSubscription(userId, subscription);

      return subscription;
    } catch (error) {
      console.error('[PushNotificationService] Failed to subscribe:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.getRegistration('/');
      }

      if (!this.registration) {
        console.warn('[PushNotificationService] No service worker registration found');
        return false;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      if (!subscription) {
        console.warn('[PushNotificationService] No active subscription found');
        return true; // Already unsubscribed
      }

      // Unsubscribe from push manager
      const success = await subscription.unsubscribe();
      if (success) {
        console.log('[PushNotificationService] Successfully unsubscribed');
        // Remove subscription from database
        await this.removeSubscription(userId);
      }

      return success;
    } catch (error) {
      console.error('[PushNotificationService] Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.getRegistration('/');
      }

      if (!this.registration) {
        return null;
      }

      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[PushNotificationService] Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Show local notification (fallback)
   */
  async showLocalNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('[PushNotificationService] Notifications not enabled');
      return;
    }

    try {
      if (!this.registration) {
        this.registration = await this.registerServiceWorker();
      }

      if (this.registration) {
        // Show via service worker for consistency
        await this.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/notification-icon.png',
          badge: payload.badge || '/icons/notification-badge.png',
          image: payload.image,
          tag: payload.tag,
          data: payload.data,
          actions: payload.actions,
          requireInteraction: payload.requireInteraction || false,
          silent: false
        });
      } else {
        // Fallback to basic notification
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/notification-icon.png',
          tag: payload.tag,
          data: payload.data,
          requireInteraction: payload.requireInteraction || false,
          silent: false
        });
      }
    } catch (error) {
      console.error('[PushNotificationService] Failed to show notification:', error);
    }
  }

  /**
   * Setup message listener for service worker communication
   */
  setupMessageListener(): void {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[PushNotificationService] Message from service worker:', event.data);
      
      if (event.data.type === 'NOTIFICATION_CLICK') {
        const { data } = event.data;
        this.handleNotificationClick(data);
      }
    });
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(data: any): void {
    console.log('[PushNotificationService] Notification clicked:', data);
    
    if (data.url) {
      // Navigate to the URL
      window.open(data.url, '_blank');
    } else if (data.notificationId) {
      // Handle specific notification
      this.markNotificationAsRead(data.notificationId);
    }
  }

  /**
   * Mark notification as read
   */
  private async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // You can call your notification service here
      console.log('[PushNotificationService] Marking notification as read:', notificationId);
      // await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('[PushNotificationService] Failed to mark notification as read:', error);
    }
  }

  /**
   * Save subscription to database
   */
  private async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Store in a push_subscriptions table (you might need to create this)
      // For now, we'll store it in localStorage as a fallback
      localStorage.setItem(
        `push_subscription_${userId}`, 
        JSON.stringify(subscriptionData)
      );

      console.log('[PushNotificationService] Subscription saved for user:', userId);
    } catch (error) {
      console.error('[PushNotificationService] Failed to save subscription:', error);
    }
  }

  /**
   * Remove subscription from database
   */
  private async removeSubscription(userId: string): Promise<void> {
    try {
      localStorage.removeItem(`push_subscription_${userId}`);
      console.log('[PushNotificationService] Subscription removed for user:', userId);
    } catch (error) {
      console.error('[PushNotificationService] Failed to remove subscription:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Test notification (for development)
   */
  async testNotification(): Promise<void> {
    await this.showLocalNotification({
      title: 'Test Notification',
      body: 'This is a test notification from Almari',
      icon: '/icons/notification-icon.png',
      tag: 'test',
      data: {
        type: 'ORDER_STATUS_CHANGE',
        url: '/notifications'
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export class for testing
export { PushNotificationService };

// Export types
export type { PushNotificationPayload, PushSubscriptionData };
