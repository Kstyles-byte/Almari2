'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types/supabase';
import { useNotifications } from '../lib/hooks/useNotifications';

type Notification = Database['public']['Tables']['Notification']['Row'];

// Notification state interface
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  hasMore: boolean;
  currentPage: number;
}

// Action types
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'APPEND_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  isConnected: false,
  hasMore: false,
  currentPage: 1
};

// Reducer function
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };

    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id ? action.payload : notification
        )
      };

    case 'REMOVE_NOTIFICATION':
      const notificationToRemove = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
        unreadCount: notificationToRemove && !notificationToRemove.is_read 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount
      };

    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };

    case 'MARK_AS_READ':
      const wasUnread = state.notifications.find(n => n.id === action.payload && !n.is_read);
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, is_read: true }
            : notification
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };

    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({ ...notification, is_read: true })),
        unreadCount: 0
      };

    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };

    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };

    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };

    case 'APPEND_NOTIFICATIONS':
      return {
        ...state,
        notifications: [...state.notifications, ...action.payload]
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context interface
interface NotificationContextValue extends NotificationState {
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
  // Additional utilities
  getNotificationById: (id: string) => Notification | undefined;
  getUnreadNotifications: () => Notification[];
  filterNotificationsByType: (type: string) => Notification[];
}

// Create context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider component interface
interface NotificationProviderProps {
  children: ReactNode;
  userId?: string;
  enableRealtime?: boolean;
  autoSubscribe?: boolean;
}

// Create Supabase client helper
const createSupabaseClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Provider component
export function NotificationProvider({ 
  children, 
  userId, 
  enableRealtime = true,
  autoSubscribe = true 
}: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Use the custom useNotifications hook for all operations
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    hasMore,
    currentPage,
    fetchNotifications,
    fetchMore,
    markAsRead,
    markAllAsRead,
    refreshCount,
    subscribe,
    unsubscribe,
    reconnect
  } = useNotifications({
    userId,
    enableRealtime,
    page: state.currentPage,
    limit: 10
  });

  // Sync the hook state with the context state
  useEffect(() => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  }, [notifications]);

  useEffect(() => {
    dispatch({ type: 'SET_UNREAD_COUNT', payload: unreadCount });
  }, [unreadCount]);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [loading]);

  useEffect(() => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, [error]);

  useEffect(() => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: isConnected });
  }, [isConnected]);

  useEffect(() => {
    dispatch({ type: 'SET_HAS_MORE', payload: hasMore });
  }, [hasMore]);

  useEffect(() => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPage });
  }, [currentPage]);

  // Auto-subscribe on mount if enabled
  useEffect(() => {
    if (userId && autoSubscribe && enableRealtime) {
      subscribe();
    }

    return () => {
      if (autoSubscribe) {
        unsubscribe();
      }
    };
  }, [userId, autoSubscribe, enableRealtime, subscribe, unsubscribe]);

  // Utility functions
  const getNotificationById = (id: string): Notification | undefined => {
    return state.notifications.find(notification => notification.id === id);
  };

  const getUnreadNotifications = (): Notification[] => {
    return state.notifications.filter(notification => !notification.is_read);
  };

  const filterNotificationsByType = (type: string): Notification[] => {
    return state.notifications.filter(notification => notification.type === type);
  };

  // Context value
  const contextValue: NotificationContextValue = {
    ...state,
    fetchNotifications,
    fetchMore,
    markAsRead,
    markAllAsRead,
    refreshCount,
    subscribe,
    unsubscribe,
    reconnect,
    getNotificationById,
    getUnreadNotifications,
    filterNotificationsByType
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use the notification context
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
}

// Higher-order component for convenience
export function withNotificationProvider<P extends object>(
  Component: React.ComponentType<P>,
  providerProps?: Omit<NotificationProviderProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <NotificationProvider {...providerProps}>
        <Component {...props} />
      </NotificationProvider>
    );
  };
}

// Additional hooks for specific use cases
export function useNotificationCount() {
  const { unreadCount, refreshCount } = useNotificationContext();
  return { unreadCount, refreshCount };
}

export function useNotificationActions() {
  const { markAsRead, markAllAsRead, fetchNotifications, fetchMore } = useNotificationContext();
  return { markAsRead, markAllAsRead, fetchNotifications, fetchMore };
}

export function useNotificationConnection() {
  const { isConnected, subscribe, unsubscribe, reconnect } = useNotificationContext();
  return { isConnected, subscribe, unsubscribe, reconnect };
}

// Export types for external use
export type { NotificationState, NotificationAction, NotificationContextValue };
