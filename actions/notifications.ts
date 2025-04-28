"use server";

import { auth } from "../auth";
import { revalidatePath } from "next/cache";
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from "../lib/services/notification";

/**
 * Get user notifications
 */
export async function getUserNotificationsAction(options?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const notifications = await getUserNotifications(session.user.id, options);
    
    return notifications;
  } catch (error) {
    console.error("Error getting user notifications:", error);
    return { error: "Failed to get notifications" };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCountAction() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const result = await getUnreadNotificationCount(session.user.id);
    
    return result;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return { error: "Failed to get unread notification count" };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsReadAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const notificationId = formData.get("notificationId") as string;
    
    if (!notificationId) {
      return { error: "Notification ID is required" };
    }
    
    const result = await markNotificationAsRead(notificationId);
    
    revalidatePath("/notifications");
    
    return result;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsReadAction() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const result = await markAllNotificationsAsRead(session.user.id);
    
    revalidatePath("/notifications");
    
    return result;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: "Failed to mark all notifications as read" };
  }
}

/**
 * Delete notification
 */
export async function deleteNotificationAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const notificationId = formData.get("notificationId") as string;
    
    if (!notificationId) {
      return { error: "Notification ID is required" };
    }
    
    const result = await deleteNotification(notificationId);
    
    revalidatePath("/notifications");
    
    return result;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { error: "Failed to delete notification" };
  }
} 