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
  private browserInfo: any = { name: 'unknown', needsUserInteraction: true, supportsVapid: true };

  constructor() {
    // Only initialize browser-specific features on the client side
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.browserInfo = this.detectBrowser();
      this.checkSupport();
    }
  }

  /**
   * Detect browser type for specific handling
   */
  private detectBrowser() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return { name: 'unknown', needsUserInteraction: true, supportsVapid: true };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check for Brave browser using multiple methods
    if (this.isBraveBrowser(userAgent)) {
      return { name: 'brave', needsUserInteraction: true, supportsVapid: true };
    } else if (userAgent.includes('edg/')) {
      return { name: 'edge', needsUserInteraction: true, supportsVapid: true };
    } else if (userAgent.includes('chrome')) {
      return { name: 'chrome', needsUserInteraction: false, supportsVapid: true };
    } else if (userAgent.includes('firefox')) {
      return { name: 'firefox', needsUserInteraction: false, supportsVapid: true };
    } else if (userAgent.includes('safari')) {
      return { name: 'safari', needsUserInteraction: true, supportsVapid: false };
    } else {
      return { name: 'unknown', needsUserInteraction: true, supportsVapid: true };
    }
  }

  /**
   * Comprehensive Brave browser detection
   */
  private isBraveBrowser(userAgent: string): boolean {
    // Method 1: Check for navigator.brave (most reliable)
    if (typeof navigator !== 'undefined' && (navigator as any).brave && (navigator as any).brave.isBrave) {
      console.log('[PushNotificationService] Brave detected via navigator.brave');
      return true;
    }

    // Method 2: Check user agent string patterns specific to Brave
    if (userAgent.includes('brave')) {
      console.log('[PushNotificationService] Brave detected via user agent string');
      return true;
    }

    // Method 3: Check for Brave-specific patterns in user agent
    // Brave often includes "Chrome" but has specific versioning patterns
    if (userAgent.includes('chrome') && !userAgent.includes('edge')) {
      // Check for Brave-specific patterns or absence of certain Chrome patterns
      try {
        // Method 4: Feature detection - check if Brave-specific APIs exist
        if (typeof navigator !== 'undefined') {
          // Brave has specific wallet and crypto APIs
          const hasBraveWallet = 'ethereum' in window && (window as any).ethereum?.isBrave;
          const hasBraveShields = (navigator as any).brave;
          
          if (hasBraveWallet || hasBraveShields) {
            console.log('[PushNotificationService] Brave detected via feature detection');
            return true;
          }
        }
      } catch (error) {
        // Feature detection failed, continue with other methods
      }
    }

    return false;
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.isSupported = false;
      return false;
    }

    const basicSupport = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    
    // Additional browser-specific checks
    if (basicSupport) {
      if (this.browserInfo.name === 'safari' && !this.browserInfo.supportsVapid) {
        console.warn('[PushNotificationService] Safari does not support VAPID keys');
        this.isSupported = false;
      } else {
        this.isSupported = true;
      }
    } else {
      this.isSupported = false;
    }
    
    console.log('[PushNotificationService] Browser support check:', {
      browser: this.browserInfo.name,
      isSupported: this.isSupported,
      basicSupport,
      vapidSupport: this.browserInfo.supportsVapid
    });
    
    return this.isSupported;
  }

  /**
   * Get browser compatibility info
   */
  getBrowserInfo() {
    return {
      ...this.browserInfo,
      isSupported: this.isSupported,
      message: this.getBrowserMessage()
    };
  }

  /**
   * Get browser-specific message
   */
  private getBrowserMessage(): string {
    switch (this.browserInfo.name) {
      case 'brave':
        return 'Brave Browser detected. To enable push notifications: Go to brave://settings/privacy and turn on "Use Google services for push messaging". Brave shields may also block notifications.';
      case 'edge':
        return 'Microsoft Edge detected. You may need to interact with the page before enabling notifications.';
      case 'safari':
        return 'Safari has limited push notification support. Some features may not work as expected.';
      case 'firefox':
        return 'Firefox detected. Full push notification support available.';
      case 'chrome':
        return 'Chrome detected. Full push notification support available.';
      default:
        return 'Your browser may have limited push notification support.';
    }
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported || typeof window === 'undefined') return 'denied';
    return Notification.permission;
  }

  /**
   * Check if push notifications are enabled
   */
  isEnabled(): boolean {
    return this.isSupported && this.getPermissionStatus() === 'granted';
  }

  /**
   * Request notification permission with browser-specific handling
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported || typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.warn('[PushNotificationService] Push notifications not supported or not in browser environment');
      return 'denied';
    }

    try {
      console.log(`[PushNotificationService] Requesting permission on ${this.browserInfo.name}`);
      
      // Edge and Brave need user interaction
      if (this.browserInfo.needsUserInteraction) {
        // Wait a bit to ensure user has interacted with the page
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const permission = await Notification.requestPermission();
      console.log('[PushNotificationService] Permission status:', permission);
      
      // Log browser-specific messages
      if (permission === 'denied' && this.browserInfo.name === 'brave') {
        console.warn('[PushNotificationService] Brave: Permission denied. Check Brave Shield settings.');
      } else if (permission === 'default' && this.browserInfo.name === 'edge') {
        console.warn('[PushNotificationService] Edge: Permission not granted. Try clicking on a button first.');
      }
      
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
    if (!this.isSupported || typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.warn('[PushNotificationService] Service workers not supported or not in browser environment');
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
   * Subscribe to push notifications with browser-specific handling
   */
  async subscribe(userId: string, retryCount = 0): Promise<PushSubscription | null> {
    if (!this.vapidPublicKey) {
      console.error('[PushNotificationService] VAPID public key not configured');
      return null;
    }

    const maxRetries = this.browserInfo.name === 'brave' ? 2 : 1;

    try {
      console.log(`[PushNotificationService] Subscribing on ${this.browserInfo.name} (attempt ${retryCount + 1})`);
      
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

      // Wait for service worker to be fully ready
      await navigator.serviceWorker.ready;

      // Browser-specific subscription options
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
      const subscriptionOptions = {
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      };

      // Subscribe to push manager
      const subscription = await this.registration.pushManager.subscribe(subscriptionOptions);

      console.log('[PushNotificationService] Push subscription created:', subscription);

      // Save subscription to database
      await this.saveSubscription(userId, subscription);

      return subscription;
    } catch (error) {
      console.error(`[PushNotificationService] Failed to subscribe on ${this.browserInfo.name}:`, error);
      
      // Handle browser-specific errors
      if (error instanceof Error) {
        if (error.name === 'AbortError' && this.browserInfo.name === 'brave') {
          console.error('[PushNotificationService] Brave push service error - Google services for push messaging likely disabled');
          console.error('[PushNotificationService] To fix: Go to brave://settings/privacy and enable "Use Google services for push messaging"');
          
          if (retryCount < maxRetries) {
            console.log(`[PushNotificationService] Retrying subscription on Brave (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Longer wait for Brave
            return this.subscribe(userId, retryCount + 1);
          } else {
            console.error('[PushNotificationService] Brave: Max retries reached. Push notifications require enabling Google services in brave://settings/privacy');
            // Return null instead of throwing to allow graceful degradation
            return null;
          }
        } else if (error.name === 'NotSupportedError' && this.browserInfo.name === 'edge') {
          console.warn('[PushNotificationService] Edge: Push not supported or permission required');
        }
      }
      
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      if (!this.registration) {
        this.registration = (await navigator.serviceWorker.getRegistration('/')) || null;
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
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return null;
    }

    try {
      if (!this.registration) {
        this.registration = (await navigator.serviceWorker.getRegistration('/')) || null;
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
        const notificationOptions: any = {
          body: payload.body,
          icon: payload.icon || '/icons/notification-icon.png',
          badge: payload.badge || '/icons/notification-badge.png',
          tag: payload.tag,
          data: payload.data,
          requireInteraction: payload.requireInteraction || false,
          silent: false
        };
        
        // Add actions if supported
        if (payload.actions && payload.actions.length > 0) {
          notificationOptions.actions = payload.actions;
        }
        
        await this.registration.showNotification(payload.title, notificationOptions);
      } else {
        // Fallback to basic notification (limited options)
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/notification-icon.png',
          tag: payload.tag,
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
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

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
      const subscriptionData = {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
          }
        }
      };

      // Save to database via API
      console.log('[PushNotificationService] Attempting to save subscription to database...');
      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      console.log('[PushNotificationService] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PushNotificationService] API error response:', errorText);
        throw new Error(`Failed to save subscription: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('[PushNotificationService] API response:', responseData);
      console.log('[PushNotificationService] Subscription saved to database for user:', userId);
      
      // Also keep localStorage as fallback for offline scenarios
      localStorage.setItem(
        `push_subscription_${userId}`, 
        JSON.stringify(subscriptionData.subscription)
      );
      
    } catch (error) {
      console.error('[PushNotificationService] Failed to save subscription:', error);
      throw error; // Re-throw the error so the caller knows it failed
    }
  }

  /**
   * Remove subscription from database
   */
  private async removeSubscription(userId: string): Promise<void> {
    try {
      // Get current subscription to get endpoint
      const subscription = await this.getSubscription();
      if (subscription) {
        // Remove from database via API
        const response = await fetch('/api/push-subscriptions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });

        if (!response.ok) {
          console.warn('[PushNotificationService] Failed to remove subscription from database:', response.status);
        }
      }

      // Also remove from localStorage
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
   * Check if Brave browser needs configuration for push notifications
   */
  checkBraveConfiguration(): { needsConfiguration: boolean; message: string } {
    if (this.browserInfo.name !== 'brave') {
      return { needsConfiguration: false, message: '' };
    }

    // If we're in Brave and getting errors, provide configuration guidance
    const message = `
      Brave Browser Configuration Required:
      
      1. Open a new tab and go to: brave://settings/privacy
      2. Scroll down to "Privacy and security"
      3. Enable "Use Google services for push messaging"
      4. Restart your browser
      5. Try enabling notifications again
      
      Note: This is required because Brave disables Google services by default for privacy.
    `;

    return { needsConfiguration: true, message };
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

  /**
   * Alternative subscription method for problematic browsers
   */
  async subscribeWithFallback(userId: string): Promise<PushSubscription | null> {
    try {
      // Try normal subscription first
      return await this.subscribe(userId);
    } catch (error) {
      console.log('[PushNotificationService] Normal subscription failed, trying fallback');
      
      if (this.browserInfo.name === 'brave') {
        return await this.subscribeBraveCompatible(userId);
      }
      
      return null;
    }
  }

  /**
   * Brave-specific subscription method
   */
  private async subscribeBraveCompatible(userId: string): Promise<PushSubscription | null> {
    try {
      // Unregister existing service worker first
      const existingRegistration = await navigator.serviceWorker.getRegistration('/');
      if (existingRegistration) {
        await existingRegistration.unregister();
      }

      // Re-register with different scope
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      await navigator.serviceWorker.ready;
      
      // Try subscription with longer timeout
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey!);
      const subscriptionPromise = registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Subscription timeout')), 10000);
      });

      const subscription = await Promise.race([subscriptionPromise, timeoutPromise]);
      
      await this.saveSubscription(userId, subscription);
      this.registration = registration;
      
      return subscription;
    } catch (error) {
      console.error('[PushNotificationService] Brave-compatible subscription failed:', error);
      return null;
    }
  }
}

// Export singleton instance - only create on client side
let _instance: PushNotificationService | null = null;

export const pushNotificationService = (() => {
  if (typeof window === 'undefined') {
    // Return a mock instance for server-side rendering
    return {
      isEnabled: () => false,
      getPermissionStatus: () => 'denied' as NotificationPermission,
      requestPermission: async () => 'denied' as NotificationPermission,
      subscribe: async () => null,
      unsubscribe: async () => false,
      showLocalNotification: async () => {},
      getBrowserInfo: () => ({ name: 'unknown', isSupported: false, needsUserInteraction: true, supportsVapid: true, message: 'Server-side rendering' }),
      testNotification: async () => {},
      subscribeWithFallback: async () => null
    } as any;
  }
  
  if (!_instance) {
    _instance = new PushNotificationService();
  }
  return _instance;
})();

// Export class for testing
export { PushNotificationService };

// Export types
export type { PushNotificationPayload, PushSubscriptionData };
