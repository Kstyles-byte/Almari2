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

// Helper function to get Supabase client - with better error logging
const getSupabaseClient = () => {
  // Check if we're running on the server side
  if (typeof window !== 'undefined') {
    throw new Error("Notification service should only be used on the server side");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Log at the time of client creation attempt for debugging
  console.log('[Notification Service] Creating Supabase client on server side:');
  console.log('[Notification Service] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined');
  console.log('[Notification Service] SUPABASE_URL:', process.env.SUPABASE_URL ? 'defined' : 'undefined');
  console.log('[Notification Service] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'defined' : 'undefined');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[Notification Service] Supabase URL or Service Role Key is missing in environment variables");
    console.error("[Notification Service] Available env vars:", Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    throw new Error("Supabase environment variables missing for notification service");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
};

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
 * Create Order Status Notification
 */
export async function createOrderStatusNotification(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Creating order status notification for order ID: ${orderId}, status: ${status}`);
    
    // Get order details to determine customer ID and vendor ID
    const { data: orderData, error: orderError } = await supabase
      .from('Order')
      .select(`
        id, 
        customer_id, 
        OrderItem (vendor_id)
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error("[Notification Service] Error fetching order details:", orderError.message);
      throw new Error(`Failed to fetch order details: ${orderError.message}`);
    }

    if (!orderData) {
      console.error("[Notification Service] Order not found:", orderId);
      throw new Error(`Order not found: ${orderId}`);
    }

    // Get customer user ID from the Customer table
    const { data: customerData, error: customerError } = await supabase
      .from('Customer')
      .select('user_id')
      .eq('id', orderData.customer_id)
      .single();

    if (customerError) {
      console.error("[Notification Service] Error fetching customer details:", customerError.message);
      throw new Error(`Failed to fetch customer details: ${customerError.message}`);
    }

    if (!customerData) {
      console.error("[Notification Service] Customer not found:", orderData.customer_id);
      throw new Error(`Customer not found: ${orderData.customer_id}`);
    }

    // Create status message based on order status
    let title: string;
    let message: string;

    switch (status.toUpperCase()) {
      case 'PENDING':
        title = 'Order Received';
        message = `Your order #${orderId} has been received and is pending processing.`;
        break;
      case 'PROCESSING':
        title = 'Order Processing';
        message = `Your order #${orderId} is now being processed.`;
        break;
      case 'READY_FOR_PICKUP':
        title = 'Order Ready for Pickup';
        message = `Your order #${orderId} is ready for pickup.`;
        break;
      case 'PICKED_UP':
        title = 'Order Picked Up';
        message = `Your order #${orderId} has been picked up.`;
        break;
      case 'CANCELLED':
        title = 'Order Cancelled';
        message = `Your order #${orderId} has been cancelled.`;
        break;
      case 'COMPLETED':
        title = 'Order Completed';
        message = `Your order #${orderId} has been completed. Thank you for shopping with us!`;
        break;
      default:
        title = 'Order Update';
        message = `Your order #${orderId} status has been updated to ${status}.`;
    }

    // Create the notification
    await createNotification({
      userId: customerData.user_id,
      title,
      message,
      type: 'ORDER_STATUS_CHANGE',
      orderId,
      referenceUrl: `/orders/${orderId}`
    });

    return { success: true };
  } catch (error) {
    console.error("[Notification Service] Error creating order status notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create order status notification" };
  }
}

/**
 * Create Return Status Notification
 */
export async function createReturnStatusNotification(returnId: string, status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Creating return status notification for return ID: ${returnId}, status: ${status}`);
    
    // Get return details to determine customer ID
    const { data: returnData, error: returnError } = await supabase
      .from('Return')
      .select('id, customer_id, order_id')
      .eq('id', returnId)
      .single();

    if (returnError) {
      console.error("[Notification Service] Error fetching return details:", returnError.message);
      throw new Error(`Failed to fetch return details: ${returnError.message}`);
    }

    if (!returnData) {
      console.error("[Notification Service] Return not found:", returnId);
      throw new Error(`Return not found: ${returnId}`);
    }

    // Get customer user ID from the Customer table
    const { data: customerData, error: customerError } = await supabase
      .from('Customer')
      .select('user_id')
      .eq('id', returnData.customer_id)
      .single();

    if (customerError) {
      console.error("[Notification Service] Error fetching customer details:", customerError.message);
      throw new Error(`Failed to fetch customer details: ${customerError.message}`);
    }

    if (!customerData) {
      console.error("[Notification Service] Customer not found:", returnData.customer_id);
      throw new Error(`Customer not found: ${returnData.customer_id}`);
    }

    // Create status message based on return status
    let title: string;
    let message: string;
    let type: NotificationType;

    switch (status) {
      case 'REQUESTED':
        title = 'Return Requested';
        message = `Your return request for order #${returnData.order_id} has been submitted.`;
        type = 'RETURN_REQUESTED';
        break;
      case 'APPROVED':
        title = 'Return Approved';
        message = `Your return request for order #${returnData.order_id} has been approved.`;
        type = 'RETURN_APPROVED';
        break;
      case 'REJECTED':
        title = 'Return Rejected';
        message = `Unfortunately, your return request for order #${returnData.order_id} has been rejected.`;
        type = 'RETURN_REJECTED';
        break;
      case 'COMPLETED':
        title = 'Return Completed';
        message = `Your return for order #${returnData.order_id} has been completed. Your refund has been processed.`;
        type = 'REFUND_PROCESSED';
        break;
      default:
        title = 'Return Update';
        message = `Your return request for order #${returnData.order_id} has been updated.`;
        type = 'RETURN_REQUESTED';
    }

    // Create the notification
    await createNotification({
      userId: customerData.user_id,
      title,
      message,
      type,
      returnId,
      orderId: returnData.order_id,
      referenceUrl: `/returns/${returnId}`
    });

    return { success: true };
  } catch (error) {
    console.error("[Notification Service] Error creating return status notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create return status notification" };
  }
}

/**
 * Create Pickup Status Notification (for Customer & Agent)
 */
export async function createPickupStatusNotification(orderId: string, status: 'PICKUP_READY' | 'ORDER_PICKED_UP'): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Creating pickup status notification for order ID: ${orderId}, status: ${status}`);
    
    // Fetch order details including customer and agent IDs, and pickup code
    const { data: orderData, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, agent_id, pickup_code')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error("[Notification Service] Error fetching order details for pickup:", orderError.message);
      throw new Error(`Failed to fetch order details: ${orderError.message}`);
    }

    if (!orderData) {
      console.error("[Notification Service] Order not found for pickup notification:", orderId);
      throw new Error(`Order not found: ${orderId}`);
    }

    if (!orderData.customer_id) {
      console.error("[Notification Service] Missing customer ID for pickup notification on order:", orderId);
      // Decide if we should proceed without customer notification or fail
      // For now, we'll log and attempt agent notification if possible
    }

    // Declare title variable here
    let title: string;
    // Create messages based on status
    let customerMessage = '';
    let agentMessage = '';
    let notificationType: NotificationType = status; // Type matches status directly here

    switch (status) {
      case 'PICKUP_READY':
        title = 'Order Ready for Pickup';
        customerMessage = `Your order #${orderId.substring(0, 6)} is ready for pickup! Your code is: ${orderData.pickup_code || 'N/A'}`;
        agentMessage = `Order #${orderId.substring(0, 6)} is ready for customer pickup.`;
        break;
      case 'ORDER_PICKED_UP':
        title = 'Order Picked Up';
        customerMessage = `Your order #${orderId.substring(0, 6)} has been picked up successfully.`;
        agentMessage = `Order #${orderId.substring(0, 6)} was picked up by the customer.`;
        break;
      default:
        // Should not happen due to TypeScript type checking
        console.warn(`[Notification Service] Unexpected pickup status: ${status}`);
        return { success: true }; // Or throw an error?
    }

    // --- Notify Customer ---
    if (orderData.customer_id) {
      // Get customer user ID
      const { data: customerData, error: customerError } = await supabase
        .from('Customer')
        .select('user_id')
        .eq('id', orderData.customer_id)
        .single();

      if (customerError || !customerData) {
        console.error(`[Notification Service] Error fetching user ID for customer ${orderData.customer_id}:`, customerError?.message);
      } else {
        await createNotification({
          userId: customerData.user_id,
          title, // Now title is accessible
          message: customerMessage,
          type: notificationType,
          orderId,
          referenceUrl: `/orders/${orderId}`
        });
      }
    }

    // --- Notify Agent (if assigned) ---
    if (orderData.agent_id) {
      // Get agent user ID
      const { data: agentData, error: agentError } = await supabase
        .from('Agent')
        .select('user_id')
        .eq('id', orderData.agent_id)
        .single();

      if (agentError || !agentData) {
        console.error(`[Notification Service] Error fetching user ID for agent ${orderData.agent_id}:`, agentError?.message);
      } else {
        await createNotification({
          userId: agentData.user_id,
          title, // Now title is accessible
          message: agentMessage,
          type: notificationType,
          orderId,
          referenceUrl: `/agent/orders/${orderId}` // Agent specific URL
        });
      }
    } else {
       console.warn(`[Notification Service] No agent assigned to order ${orderId} for pickup notification.`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Notification Service] Error creating pickup status notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create pickup status notification" };
  }
} 

// --- NEW GENERATOR HELPERS (2025-07-13) ---

/**
 * Generic helper to create a notification only if the recipient has enabled it
 */
export async function createTypedNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string | null;
  returnId?: string | null;
  referenceUrl?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check user preference – if disabled for IN_APP channel we skip
    const prefEnabled = await isPreferenceEnabled(params.userId, params.type, 'IN_APP');
    if (!prefEnabled) {
      console.log(`[Notification Service] Preference disabled for user ${params.userId} and type ${params.type}`);
      return { success: true }; // Not an error, just skip
    }

    const result = await createNotification({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      orderId: params.orderId,
      returnId: params.returnId,
      referenceUrl: params.referenceUrl,
    });
    return result.success ? { success: true } : { success: false, error: result.error };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create notification' };
  }
}

/**
 * Helper to check if a notification preference is enabled (IN_APP channel only for now)
 */
export async function isPreferenceEnabled(userId: string, type: NotificationType, channel: 'IN_APP' | 'EMAIL' | 'SMS' = 'IN_APP'): Promise<boolean> {
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

// Example new generators
export async function createPaymentFailureNotification(orderId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId,
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please try again or use a different method.',
    type: 'PAYMENT_FAILED',
    orderId,
    referenceUrl: `/customer/orders/${orderId}`,
  });
}

export async function createVendorNewOrderNotification(vendorUserId: string, orderId: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'New Order Received',
    message: 'You have a new order to fulfill. Please prepare items for drop-off.',
    type: 'NEW_ORDER_VENDOR',
    orderId,
    referenceUrl: `/vendor/orders/${orderId}`,
  });
}

export async function createShipmentNotification(userId: string, orderId: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId,
    title: 'Order Shipped',
    message: 'Your order has been shipped and is on its way to the pickup point.',
    type: 'ORDER_SHIPPED',
    orderId,
    referenceUrl: `/customer/orders/${orderId}`,
  });
}

// Additional helpers can be added similarly for each new NotificationType. 