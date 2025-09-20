'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../types/supabase';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { pushNotificationService } from '../../lib/services/pushNotificationService';

interface RealtimeNotificationProviderProps {
  children: React.ReactNode;
  enablePush?: boolean;
  enableRealtime?: boolean;
}

export function RealtimeNotificationProvider({ 
  children, 
  enablePush = true,
  enableRealtime = true 
}: RealtimeNotificationProviderProps) {
  const [userId, setUserId] = useState<string | undefined>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    initializeUser();
    if (enablePush) {
      initializePushNotifications();
    }
  }, [enablePush]);

  // Auto-request push permissions for new users
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    if (userId && enablePush) {
      console.log('[RealtimeNotificationProvider] 🚀 Triggering auto-subscription check for user:', userId);
      // Add a small delay to ensure service worker is ready
      setTimeout(() => {
        requestPushPermissionIfNeeded();
      }, 1000);
    }
  }, [userId, enablePush]);

  const initializeUser = async () => {
    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[RealtimeNotificationProvider] Error getting session:', error);
        setIsInitialized(true);
        return;
      }

      if (session?.user) {
        setUserId(session.user.id);
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[RealtimeNotificationProvider] Auth state changed:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            setUserId(session.user.id);
            
            // Request push notification permission and subscribe if enabled
            if (enablePush) {
              try {
                // Use a small delay to allow UI to settle before requesting permission
                setTimeout(() => {
                  requestPushPermissionIfNeeded();
                }, 1000);
              } catch (error) {
                console.error('[RealtimeNotificationProvider] Failed to request push permission:', error);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            if (userId && enablePush) {
              try {
                await pushNotificationService.unsubscribe(userId);
              } catch (error) {
                console.error('[RealtimeNotificationProvider] Failed to unsubscribe from push:', error);
              }
            }
            setUserId(undefined);
          }
        }
      );

      setIsInitialized(true);

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('[RealtimeNotificationProvider] Initialization error:', error);
      setIsInitialized(true);
    }
  };

  const initializePushNotifications = () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.warn('[RealtimeNotificationProvider] Not in browser environment, skipping push initialization');
      return;
    }

    // Setup service worker and message listeners
    pushNotificationService.setupMessageListener();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[RealtimeNotificationProvider] Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('[RealtimeNotificationProvider] Service Worker registration failed:', error);
        });
    }
  };

  const requestPushPermissionIfNeeded = async () => {
    if (!userId || !enablePush) return;

    try {
      const browserInfo = pushNotificationService.getBrowserInfo();
      const currentPermission = pushNotificationService.getPermissionStatus();
      
      console.log(`[RealtimeNotificationProvider] Browser: ${browserInfo.name}, Permission: ${currentPermission}`);
      
      // If permission is already granted, try to subscribe
      if (currentPermission === 'granted') {
        const existingSubscription = await pushNotificationService.getSubscription();
        if (!existingSubscription) {
          console.log('[RealtimeNotificationProvider] Auto-subscribing to push notifications');
          console.log('[RealtimeNotificationProvider] User ID:', userId);
          console.log('[RealtimeNotificationProvider] Browser:', browserInfo.name);
          
          try {
            const subscription = await pushNotificationService.subscribe(userId);
            
            if (!subscription) {
              console.error('[RealtimeNotificationProvider] ❌ Auto-subscription failed - no subscription returned');
              console.error('[RealtimeNotificationProvider] This means the subscribe() call completed but returned null');
              
              if (browserInfo.name === 'brave') {
                console.log('[RealtimeNotificationProvider] Brave auto-subscription failed - likely needs Google services enabled');
              }
              return;
            }
            
            console.log('[RealtimeNotificationProvider] ✅ Auto-subscription successful');
            console.log('[RealtimeNotificationProvider] Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
            
            // Verify subscription was saved to database
            try {
              const verifyResponse = await fetch('/api/push-subscriptions');
              const verifyData = await verifyResponse.json();
              console.log('[RealtimeNotificationProvider] Database verification:', verifyData);
            } catch (verifyError) {
              console.error('[RealtimeNotificationProvider] Failed to verify subscription in database:', verifyError);
            }
            
          } catch (error) {
            console.error('[RealtimeNotificationProvider] ❌ Auto-subscription failed with error:', error);
            if (error instanceof Error) {
              console.error('[RealtimeNotificationProvider] Error details:', error.message);
            }
            console.error('[RealtimeNotificationProvider] This indicates an exception during subscribe()');
          }
        } else {
          console.log('[RealtimeNotificationProvider] ✅ Existing subscription found');
          console.log('[RealtimeNotificationProvider] Endpoint:', existingSubscription.endpoint.substring(0, 50) + '...');
        }
        return;
      }

      // Handle browser-specific permission requests
      if (currentPermission === 'default') {
        if (browserInfo.name === 'edge') {
          // Edge needs explicit user interaction - defer to manual activation
          console.log('[RealtimeNotificationProvider] Edge detected - deferring push setup to user interaction');
          return;
        }
        
        if (browserInfo.name === 'brave') {
          // Brave can be tricky - add delay and try
          console.log('[RealtimeNotificationProvider] Brave detected - requesting permission with delay');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('[RealtimeNotificationProvider] Requesting push notification permission');
        const permission = await pushNotificationService.requestPermission();
        
        if (permission === 'granted') {
          console.log('[RealtimeNotificationProvider] Push permission granted, subscribing');
          
          let subscription;
          // Use fallback method for Brave to handle AbortError
          if (browserInfo.name === 'brave') {
            subscription = await pushNotificationService.subscribeWithFallback(userId);
          } else {
            subscription = await pushNotificationService.subscribe(userId);
          }
          
          if (!subscription && browserInfo.name === 'brave') {
            console.log('[RealtimeNotificationProvider] Brave subscription failed - Google services likely disabled');
            // This is expected behavior for Brave without proper configuration
            // The user will see guidance in the notification settings UI
          } else if (!subscription) {
            console.warn(`[RealtimeNotificationProvider] Push subscription failed on ${browserInfo.name}`);
          } else {
            console.log('[RealtimeNotificationProvider] Push subscription successful');
          }
        } else {
          console.log(`[RealtimeNotificationProvider] Push permission ${permission} on ${browserInfo.name}`);
        }
      }
    } catch (error) {
      console.error('[RealtimeNotificationProvider] Error requesting push permission:', error);
    }
  };

  // Don't render children until we've checked the auth state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <NotificationProvider
      userId={userId}
      enableRealtime={enableRealtime}
      autoSubscribe={true}
    >
      {children}
    </NotificationProvider>
  );
}
