'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../types/supabase';
// Removed direct notification service imports - now using API routes instead

type Notification = Database['public']['Tables']['Notification']['Row'];

interface UseNotificationsOptions {
  userId?: string;
  enableRealtime?: boolean;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  isConnected: boolean;
}

interface UseNotificationsReturn extends NotificationState {
  // Actions
  fetchNotifications: () => Promise<void>;
  fetchMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshCount: () => Promise<void>;
  // Realtime controls
  subscribe: () => void;
  unsubscribe: () => void;
  reconnect: () => void;
}

const createSupabaseClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    userId,
    enableRealtime = true,
    page = 1,
    limit = 10,
    unreadOnly = false
  } = options;

  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    hasMore: false,
    currentPage: page,
    isConnected: false
  });

  const supabaseClient = useRef<ReturnType<typeof createSupabaseClient> | null>(null);
  const subscriptionRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 5;
  const retryCount = useRef(0);

  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseClient.current) {
      supabaseClient.current = createSupabaseClient();
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (currentPage = page) => {
    if (!userId || !supabaseClient.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      });

      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      setState(prev => ({
        ...prev,
        notifications: result.data,
        hasMore: result.pagination.hasNextPage,
        currentPage: currentPage,
        loading: false
      }));
    } catch (error) {
      console.error('[useNotifications] Error fetching notifications:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        loading: false
      }));
    }
  }, [userId, limit, unreadOnly]);

  // Fetch more notifications (pagination)
  const fetchMore = useCallback(async () => {
    if (!userId || !supabaseClient.current || state.loading || !state.hasMore) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const nextPage = state.currentPage + 1;
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      });

      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      setState(prev => ({
        ...prev,
        notifications: [...prev.notifications, ...result.data],
        hasMore: result.pagination.hasNextPage,
        currentPage: nextPage,
        loading: false
      }));
    } catch (error) {
      console.error('[useNotifications] Error fetching more notifications:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch more notifications',
        loading: false
      }));
    }
  }, [userId, limit, unreadOnly]);

  // Refresh unread count
  const refreshCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/notifications?action=count');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setState(prev => ({ ...prev, unreadCount: result.count || 0 }));
    } catch (error) {
      console.error('[useNotifications] Error refreshing count:', error);
    }
  }, [userId]);

  // Mark notification as read with optimistic update
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    // Optimistic update
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1)
    }));

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Revert optimistic update on failure
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: false }
              : notification
          ),
          unreadCount: prev.unreadCount + 1
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('[useNotifications] Error marking notification as read:', error);
    }
  }, [userId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    // Optimistic update
    const previousUnreadCount = state.unreadCount;
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification => ({ ...notification, is_read: true })),
      unreadCount: 0
    }));

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Revert optimistic update on failure
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification => 
            notification.is_read ? notification : { ...notification, is_read: false }
          ),
          unreadCount: previousUnreadCount
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('[useNotifications] Error marking all notifications as read:', error);
    }
  }, [userId, state.unreadCount]);

  // Setup realtime subscription
  const subscribe = useCallback(() => {
    if (!userId || !supabaseClient.current || !enableRealtime || subscriptionRef.current) return;

    console.log('[useNotifications] Setting up realtime subscription for user:', userId);

    const channel = supabaseClient.current
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Notification',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[useNotifications] Realtime notification received:', payload.eventType, payload);

          switch (payload.eventType) {
            case 'INSERT':
              // Add new notification at the beginning
              setState(prev => ({
                ...prev,
                notifications: [payload.new as Notification, ...prev.notifications],
                unreadCount: prev.unreadCount + 1
              }));
              break;

            case 'UPDATE':
              // Update existing notification
              setState(prev => ({
                ...prev,
                notifications: prev.notifications.map(notification =>
                  notification.id === payload.new.id ? payload.new as Notification : notification
                ),
                // Recalculate unread count if read status changed
                unreadCount: payload.old.is_read !== payload.new.is_read
                  ? payload.new.is_read 
                    ? Math.max(0, prev.unreadCount - 1)
                    : prev.unreadCount + 1
                  : prev.unreadCount
              }));
              break;

            case 'DELETE':
              // Remove deleted notification
              setState(prev => ({
                ...prev,
                notifications: prev.notifications.filter(notification => notification.id !== payload.old.id),
                unreadCount: payload.old.is_read ? prev.unreadCount : Math.max(0, prev.unreadCount - 1)
              }));
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('[useNotifications] Subscription status:', status);
        
        setState(prev => ({ 
          ...prev, 
          isConnected: status === 'SUBSCRIBED',
          error: status === 'CLOSED' ? 'Connection lost' : null
        }));

        if (status === 'SUBSCRIBED') {
          retryCount.current = 0;
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        }

        if (status === 'CLOSED' && retryCount.current < maxRetries) {
          // Attempt to reconnect after a delay
          retryCount.current += 1;
          const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000); // Exponential backoff, max 30s
          
          retryTimeoutRef.current = setTimeout(() => {
            console.log(`[useNotifications] Reconnecting... (attempt ${retryCount.current}/${maxRetries})`);
            unsubscribe();
            subscribe();
          }, delay);
        }
      });

    subscriptionRef.current = channel;
  }, [userId, enableRealtime]);

  // Unsubscribe from realtime
  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('[useNotifications] Unsubscribing from realtime');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // Manual reconnection
  const reconnect = useCallback(() => {
    console.log('[useNotifications] Manual reconnection requested');
    retryCount.current = 0;
    unsubscribe();
    subscribe();
  }, [subscribe, unsubscribe]);

  // Initial setup and cleanup
  useEffect(() => {
    if (userId) {
      fetchNotifications();
      refreshCount();
      if (enableRealtime) {
        subscribe();
      }
    }

    return () => {
      unsubscribe();
    };
  }, [userId, enableRealtime, fetchNotifications, refreshCount, subscribe, unsubscribe]); // Only re-run when userId or enableRealtime changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    ...state,
    fetchNotifications,
    fetchMore,
    markAsRead,
    markAllAsRead,
    refreshCount,
    subscribe,
    unsubscribe,
    reconnect
  };
}
