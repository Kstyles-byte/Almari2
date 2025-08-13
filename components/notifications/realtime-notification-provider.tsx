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
    initializeUser();
    if (enablePush) {
      initializePushNotifications();
    }
  }, [enablePush]);

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
            
            // Auto-subscribe to push notifications if enabled
            if (enablePush && pushNotificationService.isEnabled()) {
              try {
                await pushNotificationService.subscribe(session.user.id);
              } catch (error) {
                console.error('[RealtimeNotificationProvider] Failed to auto-subscribe to push:', error);
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
