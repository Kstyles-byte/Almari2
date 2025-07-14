"use server";


import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { revalidatePath } from "next/cache";
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from "../lib/services/notification";

// Define NotificationType type based on Supabase schema to stay in sync with enum values
import type { Database } from "../types/supabase";
type NotificationType = Database['public']['Enums']['NotificationType'];

// Define Notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  order_id?: string | null;
  return_id?: string | null;
  reference_url?: string | null;
}

// Define action result types
type GetUserNotificationsSuccessResult = {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
  error?: undefined;
};

type GetUserNotificationsErrorResult = {
  error: string;
  data?: undefined;
  meta?: undefined;
};

type GetUserNotificationsActionResult = GetUserNotificationsSuccessResult | GetUserNotificationsErrorResult;

/**
 * Creates a Supabase client with server session handling
 */
async function createSupabaseServerClient() {
  try {
    // Await the cookie store first
    const cookieStore = await cookies();
    
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Use the resolved cookieStore directly
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
  } catch (error) {
    console.error("[Notifications Action] Error creating Supabase client:", error);
    throw error;
  }
}

/**
 * Get the authenticated user from Supabase
 */
async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error("[Notifications Action] Auth error:", error.message);
    return null;
  }
  
  return user;
}

/**
 * Get user notifications
 */
export async function getUserNotificationsAction(options?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<GetUserNotificationsActionResult> {
  console.log("[Notifications Action] getUserNotificationsAction called with options:", options);
  
  try {
    // First, check if user is authenticated using Supabase
    const user = await getAuthenticatedUser();
    
    if (!user) {
      console.error("[Notifications Action] Not authenticated");
      return { error: "You must be signed in to view notifications" };
    }
    
    const userId = user.id;
    console.log(`[Notifications Action] Fetching notifications for user: ${userId}`);
    
    const notificationsResult = await getUserNotifications(userId, options);
    
    if ('error' in notificationsResult && notificationsResult.error) {
      console.error("[Notifications Action] Error from service:", notificationsResult.error);
      return { error: notificationsResult.error as string }; 
    }
    
    return notificationsResult as GetUserNotificationsSuccessResult;
  } catch (error) {
    console.error("[Notifications Action] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get notifications";
    return { error: errorMessage };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCountAction() {
  try {
    // First, check if user is authenticated using Supabase
    const user = await getAuthenticatedUser();
    
    if (!user) {
      console.error("[Notifications Action] Not authenticated for count");
      return { error: "You must be signed in to view notifications" };
    }
    
    const userId = user.id;
    console.log(`[Notifications Action] Getting unread count for user: ${userId}`);
    
    const result = await getUnreadNotificationCount(userId);
    
    return result;
  } catch (error) {
    console.error("[Notifications Action] Error getting count:", error);
    return { error: "Failed to get unread notification count" };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsReadAction(formData: FormData) {
  try {
    // First, check if user is authenticated using Supabase
    const user = await getAuthenticatedUser();
    
    if (!user) {
      console.error("[Notifications Action] Not authenticated for marking as read");
      return { error: "You must be signed in to update notifications" };
    }
    
    const notificationId = formData.get("notificationId") as string;
    
    if (!notificationId) {
      return { error: "Notification ID is required" };
    }
    
    console.log(`[Notifications Action] Marking notification as read: ${notificationId}`);
    
    const result = await markNotificationAsRead(notificationId);
    
    // Revalidate both the notifications page and any pages that show notification counts
    revalidatePath("/notifications");
    revalidatePath("/");
    
    return result;
  } catch (error) {
    console.error("[Notifications Action] Error marking as read:", error);
    return { error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsReadAction() {
  try {
    // First, check if user is authenticated using Supabase
    const user = await getAuthenticatedUser();
    
    if (!user) {
      console.error("[Notifications Action] Not authenticated for marking all as read");
      return { error: "You must be signed in to update notifications" };
    }
    
    const userId = user.id;
    console.log(`[Notifications Action] Marking all notifications as read for user: ${userId}`);
    
    const result = await markAllNotificationsAsRead(userId);
    
    // Revalidate both the notifications page and any pages that show notification counts
    revalidatePath("/notifications");
    revalidatePath("/");
    
    return result;
  } catch (error) {
    console.error("[Notifications Action] Error marking all as read:", error);
    return { error: "Failed to mark all notifications as read" };
  }
}

/**
 * Delete notification
 */
export async function deleteNotificationAction(formData: FormData) {
  try {
    // First, check if user is authenticated using Supabase
    const user = await getAuthenticatedUser();
    
    if (!user) {
      console.error("[Notifications Action] Not authenticated for deletion");
      return { error: "You must be signed in to delete notifications" };
    }
    
    const notificationId = formData.get("notificationId") as string;
    
    if (!notificationId) {
      return { error: "Notification ID is required" };
    }
    
    console.log(`[Notifications Action] Deleting notification: ${notificationId}`);
    
    const result = await deleteNotification(notificationId);
    
    // Revalidate the notifications page
    revalidatePath("/notifications");
    
    return result;
  } catch (error) {
    console.error("[Notifications Action] Error deleting notification:", error);
    return { error: "Failed to delete notification" };
  }
} 