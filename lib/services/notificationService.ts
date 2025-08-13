import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

// Define types locally to avoid dependency issues
interface Notification {
  id: string;
  userId: string; // Corresponds to user_id
  title: string;
  message: string;
  type: string; // Corresponds to NotificationType enum
  orderId?: string | null; // Corresponds to order_id
  returnId?: string | null; // Corresponds to return_id
  isRead: boolean; // Corresponds to is_read
  createdAt: string; // Corresponds to created_at
  referenceUrl?: string | null; // URL to redirect user to when clicking the notification
}

// Simplified placeholder types - rely on generated types where possible
interface Order {
  id: string;
  customer_id: string;
  agent_id: string | null;
  pickup_code: string | null;
  // Add other relevant snake_case fields
}

interface OrderItem {
    vendor_id: string; // snake_case
    order_id: string;
    // Add other relevant snake_case fields
}

interface Customer {
  user_id: string;
  id: string;
  // Add other relevant snake_case fields
}

interface Vendor {
  user_id: string;
  id: string;
  // Add other relevant snake_case fields
}

interface Agent {
  user_id: string;
  id: string;
  // Add other relevant snake_case fields
}

interface Return {
    id: string;
    customer_id: string;
    order_id: string | null;
    vendor_id: string; // Might need to fetch this separately or via relation
    // Add other relevant snake_case fields
}

// Define NotificationType type based on the database schema
type NotificationType = Database['public']['Enums']['NotificationType'];

// Only support IN_APP and PUSH channels as specified
type SupportedNotificationChannel = 'IN_APP' | 'PUSH';

// Notification template interface
interface NotificationTemplate {
  title: string;
  message: string;
  type: NotificationType;
  getSubstitutions?: (data: any) => Record<string, string>;
}

// Helper function to get Supabase client - with better error logging
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Log at the time of client creation attempt for debugging
  console.log('[Notification Service] Creating Supabase client:');
  console.log('[Notification Service] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined');
  console.log('[Notification Service] SUPABASE_URL:', process.env.SUPABASE_URL ? 'defined' : 'undefined');
  console.log('[Notification Service] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'defined' : 'undefined');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[Notification Service] Supabase URL or Service Role Key is missing in environment variables");
    throw new Error("Supabase environment variables missing for notification service");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
};

// Notification templates system
const notificationTemplates: Record<string, NotificationTemplate> = {
  // Order lifecycle templates
  ORDER_CONFIRMATION: {
    title: 'Order Confirmed',
    message: 'Your order #{orderId} has been confirmed and is being processed.',
    type: 'ORDER_STATUS_CHANGE',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  ORDER_PROCESSING: {
    title: 'Order Processing',
    message: 'Your order #{orderId} is now being prepared.',
    type: 'ORDER_STATUS_CHANGE',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  ORDER_READY_FOR_PICKUP: {
    title: 'Order Ready for Pickup',
    message: 'Your order #{orderId} is ready! Pickup code: {pickupCode}',
    type: 'PICKUP_READY',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      pickupCode: data.pickupCode || 'N/A'
    })
  },
  
  ORDER_PICKED_UP: {
    title: 'Order Picked Up',
    message: 'Your order #{orderId} has been successfully picked up.',
    type: 'ORDER_PICKED_UP',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  // Refund templates
  REFUND_REQUEST_SUBMITTED: {
    title: 'Refund Request Submitted',
    message: 'Your refund request for order #{orderId} has been submitted and is under review.',
    type: 'RETURN_REQUESTED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  REFUND_APPROVED: {
    title: 'Refund Approved',
    message: 'Your refund request for order #{orderId} has been approved. Processing will begin shortly.',
    type: 'RETURN_APPROVED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  REFUND_PROCESSED: {
    title: 'Refund Processed',
    message: 'Your refund for order #{orderId} has been processed successfully.',
    type: 'REFUND_PROCESSED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  // Vendor templates
  NEW_ORDER_VENDOR: {
    title: 'New Order Received',
    message: 'You have received a new order #{orderId}. Please prepare items for pickup.',
    type: 'NEW_ORDER_VENDOR',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  LOW_STOCK_ALERT: {
    title: 'Low Stock Alert',
    message: 'Your product "{productName}" is running low on stock (current: {currentStock}).',
    type: 'LOW_STOCK_ALERT',
    getSubstitutions: (data) => ({
      productName: data.productName || 'Unknown Product',
      currentStock: data.currentStock?.toString() || '0'
    })
  },
  
  PAYOUT_PROCESSED: {
    title: 'Payout Processed',
    message: 'Your payout of ₦{amount} has been processed successfully.',
    type: 'PAYOUT_PROCESSED',
    getSubstitutions: (data) => ({
      amount: data.amount?.toLocaleString() || '0'
    })
  },
  
  // Agent templates
  NEW_PICKUP_ASSIGNMENT: {
    title: 'New Pickup Assignment',
    message: 'You have been assigned a new pickup for order #{orderId}.',
    type: 'NEW_PICKUP_ASSIGNMENT',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  // Admin templates
  HIGH_VALUE_ORDER_ALERT: {
    title: 'High Value Order Alert',
    message: 'A high-value order #{orderId} (₦{amount}) has been placed.',
    type: 'HIGH_VALUE_ORDER_ALERT',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      amount: data.amount?.toLocaleString() || '0'
    })
  }
};

/**
 * Apply template substitutions to a string
 */
function applyTemplateSubstitutions(template: string, substitutions: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(substitutions)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Create notification from template
 */
export async function createNotificationFromTemplate(
  templateKey: string,
  userId: string,
  data: any,
  options?: {
    orderId?: string | null;
    returnId?: string | null;
    referenceUrl?: string | null;
  }
): Promise<{ success: boolean; notification?: any; error?: string }> {
  try {
    const template = notificationTemplates[templateKey];
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    const substitutions = template.getSubstitutions ? template.getSubstitutions(data) : {};
    
    const title = applyTemplateSubstitutions(template.title, substitutions);
    const message = applyTemplateSubstitutions(template.message, substitutions);

    return await createNotification({
      userId,
      title,
      message,
      type: template.type,
      orderId: options?.orderId,
      returnId: options?.returnId,
      referenceUrl: options?.referenceUrl
    });
  } catch (error) {
    console.error("[Notification Service] Error creating notification from template:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create notification from template" };
  }
}

/**
 * Create multiple notifications in batch
 */
export async function createBatchNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    orderId?: string | null;
    returnId?: string | null;
    referenceUrl?: string | null;
  }>
): Promise<{ success: boolean; created?: number; errors?: string[] }> {
  const supabase = getSupabaseClient();
  const errors: string[] = [];
  let created = 0;

  try {
    console.log(`[Notification Service] Creating batch of ${notifications.length} notifications`);
    
    // Map to database format
    const insertData = notifications.map(notification => ({
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      order_id: notification.orderId || null,
      return_id: notification.returnId || null,
      reference_url: notification.referenceUrl || null,
      is_read: false
    }));

    const { data, error } = await supabase
      .from('Notification')
      .insert(insertData)
      .select();

    if (error) {
      console.error("[Notification Service] Error creating batch notifications:", error.message);
      throw new Error(`Failed to create batch notifications: ${error.message}`);
    }

    created = data?.length || 0;
    console.log(`[Notification Service] Successfully created ${created} notifications`);

    return { success: true, created };
  } catch (error) {
    console.error("[Notification Service] Error in createBatchNotifications:", error);
    errors.push(error instanceof Error ? error.message : "Failed to create batch notifications");
    return { success: false, created, errors };
  }
}

/**
 * Create a new notification
 */
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string | null;
  returnId?: string | null;
  referenceUrl?: string | null;
}): Promise<{ success: boolean; notification?: any; error?: string }> {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Creating notification for user ID: ${data.userId}`);
    
    // Check user preference first
    const prefEnabled = await isPreferenceEnabled(data.userId, data.type, 'IN_APP');
    if (!prefEnabled) {
      console.log(`[Notification Service] Preference disabled for user ${data.userId} and type ${data.type}`);
      return { success: true }; // Not an error, just skip
    }
    
    // Map camelCase to snake_case for database fields
    const insertData = {
      user_id: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      order_id: data.orderId || null,
      return_id: data.returnId || null,
      reference_url: data.referenceUrl || null,
      is_read: false // Default to unread
    };

    const { data: notification, error } = await supabase
      .from('Notification')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("[Notification Service] Error creating notification:", error.message);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return { success: true, notification };
  } catch (error) {
    console.error("[Notification Service] Error in createNotification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create notification" };
  }
}

/**
 * Get user notifications with pagination
 */
export async function getUserNotifications(userId: string, options?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Getting notifications for user ID: ${userId}, options:`, options);
    
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build the query conditionally
    let query = supabase
      .from('Notification')
      .select(`
        *,
        Order:order_id (*), 
        Return:return_id (*)
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (options?.unreadOnly === true) {
      query = query.eq('is_read', false);
    }

    query = query.order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    const { data: notifications, error: fetchError, count } = await query;

    if (fetchError) {
      console.error("[Notification Service] Error fetching user notifications:", fetchError.message);
      throw fetchError;
    }

    console.log(`[Notification Service] Found ${notifications?.length || 0} notifications for user ID: ${userId}`);
    
    return {
      data: notifications || [],
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
      },
    };
  } catch (error) {
    console.error("[Notification Service] Error in getUserNotifications:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to get user notifications",
      data: [],
      meta: {
        total: 0,
        page: options?.page || 1,
        limit: options?.limit || 10,
        pageCount: 0,
      },
    };
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<{ success: boolean; count?: number | null; error?: string }> {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Getting unread notification count for user ID: ${userId}`);
    
    const { count, error } = await supabase
      .from('Notification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error("[Notification Service] Error getting unread notification count:", error.message);
      throw error;
    }

    console.log(`[Notification Service] Found ${count || 0} unread notifications for user ID: ${userId}`);
    
    return { success: true, count };
  } catch (error) {
    console.error("[Notification Service] Error in getUnreadNotificationCount:", error);
    return { success: false, error: "Failed to get unread notification count" };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Marking notification as read: ${notificationId}`);
    
    const { data: notification, error } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error("[Notification Service] Error marking notification as read:", error.message);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return { success: true, notification };
  } catch (error) {
    console.error("[Notification Service] Error in markNotificationAsRead:", error);
    return { error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Marking all notifications as read for user ID: ${userId}`);
    
    const { error } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error("[Notification Service] Error marking all notifications as read:", error.message);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Notification Service] Error in markAllNotificationsAsRead:", error);
    return { error: "Failed to mark all notifications as read" };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Deleting notification: ${notificationId}`);
    
    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error("[Notification Service] Error deleting notification:", error.message);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Notification Service] Error in deleteNotification:", error);
    return { error: "Failed to delete notification" };
  }
}

/**
 * Helper to check if a notification preference is enabled (IN_APP or PUSH channels only)
 */
export async function isPreferenceEnabled(userId: string, type: NotificationType, channel: SupportedNotificationChannel = 'IN_APP'): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('NotificationPreference')
      .select('enabled')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('channel', channel)
      .single();
    if (error && error.code !== 'PGRST116') {
      // PGRST116 => no rows found
      console.error('[Notification Service] Error fetching preference:', error.message);
    }
    // If no row, default to enabled
    return data ? data.enabled : true;
  } catch (err) {
    console.error('[Notification Service] Preference check error', err);
    return true;
  }
}

/**
 * Get notification categories for filtering
 */
export function getNotificationCategories(): Array<{ value: NotificationType; label: string; description: string }> {
  return [
    { value: 'ORDER_STATUS_CHANGE', label: 'Order Updates', description: 'Order status changes and updates' },
    { value: 'PICKUP_READY', label: 'Pickup Ready', description: 'Order ready for pickup' },
    { value: 'ORDER_PICKED_UP', label: 'Order Picked Up', description: 'Order successfully picked up' },
    { value: 'RETURN_REQUESTED', label: 'Return Requests', description: 'Return and refund requests' },
    { value: 'RETURN_APPROVED', label: 'Return Approved', description: 'Return requests approved' },
    { value: 'RETURN_REJECTED', label: 'Return Rejected', description: 'Return requests rejected' },
    { value: 'REFUND_PROCESSED', label: 'Refund Processed', description: 'Refunds processed successfully' },
    { value: 'PAYMENT_FAILED', label: 'Payment Issues', description: 'Payment failures and issues' },
    { value: 'NEW_ORDER_VENDOR', label: 'New Orders', description: 'New orders received (vendors)' },
    { value: 'PAYOUT_PROCESSED', label: 'Payouts', description: 'Payout processing updates' },
    { value: 'LOW_STOCK_ALERT', label: 'Stock Alerts', description: 'Low stock and inventory alerts' },
    { value: 'NEW_PICKUP_ASSIGNMENT', label: 'Pickup Assignments', description: 'New pickup assignments (agents)' }
  ];
}

// Export legacy functions for backward compatibility
export {
  createNotification as createTypedNotification,
  createNotificationFromTemplate as createOrderStatusNotification,
  createNotificationFromTemplate as createReturnStatusNotification,
  createNotificationFromTemplate as createPickupStatusNotification
};
