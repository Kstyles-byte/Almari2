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
  // No updatedAt needed, assuming DB handles it or not required here
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

// Helper function to get Supabase client
const getSupabaseClient = () => {
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Log at the time of client creation attempt
  console.log('Attempting to create Supabase client (Notification Service):');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'defined' : 'undefined'); // Check both possible URL vars
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'defined' : 'undefined');

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Supabase URL or Service Role Key is missing in environment variables when creating client for notification service.");
    throw new Error("Supabase environment variables missing for notification service.");
  }

  // Remove placeholder logic
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
  orderId?: string | null; // Allow null
  returnId?: string | null; // Allow null
  referenceUrl?: string | null; // Added referenceUrl
}): Promise<{ success: boolean; notification?: any; error?: string }> {
  const supabase = getSupabaseClient(); // Get client instance
  try {
    // Map camelCase to snake_case for database fields
    const insertData = {
      user_id: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      order_id: data.orderId || null, // Ensure null is passed if undefined
      return_id: data.returnId || null,
      reference_url: data.referenceUrl || null, // Added reference_url
      is_read: false, // Default to unread
      // created_at handled by DB
    };

    const { data: notification, error } = await supabase
      .from('Notification')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error.message);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return { success: true, notification };
  } catch (error) {
    console.error("Error in createNotification service:", error);
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
  const supabase = getSupabaseClient(); // Get client instance
  try {
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
        console.error("Error fetching user notifications:", fetchError.message);
        throw fetchError;
    }

    // Note: The count comes from the same query now due to { count: 'exact' }

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
    console.error("Error in getUserNotifications service:", error);
    return {
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
  const supabase = getSupabaseClient(); // Get client instance
  try {
    const { count, error } = await supabase
      .from('Notification')
      .select('*' , { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
        console.error("Error getting unread notification count:", error.message);
        throw error;
    }

    return { success: true, count };
  } catch (error) {
    console.error("Error in getUnreadNotificationCount service:", error);
    return { success: false, error: "Failed to get unread notification count" };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = getSupabaseClient(); // Get client instance
  try {
    const { data: notification, error } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error("Error marking notification as read:", error.message);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return { success: true, notification };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = getSupabaseClient(); // Get client instance
  try {
    const { error } = await supabase // Destructure only error if data is not needed
      .from('Notification')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
     if (error) {
       console.error("Error marking all notifications as read:", error.message);
       throw new Error(`Failed to mark all notifications as read: ${error.message}`);
     }
    
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: "Failed to mark all notifications as read" };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const supabase = getSupabaseClient(); // Get client instance
  try {
    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      console.error("Error deleting notification:", error.message);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { error: "Failed to delete notification" };
  }
}

// --- Helper functions to create specific notification types --- //

// Helper to fetch order details (customer ID, vendor ID)
async function getOrderDetails(orderId: string): Promise<{ customerId?: string; vendorId?: string; error?: string }> {
  const supabase = getSupabaseClient(); // Get client instance
  try {
     // Fetch the OrderItem first to get vendorId, then the Order for customerId
     // Ensure selected columns match the actual schema (snake_case)
     const { data: orderItem, error: itemError } = await supabase
      .from('OrderItem')
      .select('vendor_id, order_id') // Use snake_case
      .eq('order_id', orderId)
      .limit(1) // Assuming one item is enough to get vendorId
      .maybeSingle(); // Use maybeSingle if it might not exist

    if (itemError) {
        console.error('Error fetching order item for details:', itemError?.message);
        // Attempt to fetch Order directly as fallback
        const { data: orderData, error: orderError } = await supabase
            .from('Order')
            .select('customer_id') // Use snake_case
            .eq('id', orderId)
            .maybeSingle();
        if (orderError || !orderData) {
            console.error('Error fetching order details directly:', orderError?.message);
            return { error: 'Failed to fetch order details' };
        }
        // Important: Check if customer_id exists before returning
        return { customerId: orderData.customer_id };
    }

    // If orderItem was fetched successfully
    if (!orderItem) {
        console.error('Order item not found for order:', orderId);
        return { error: 'Order item details not found' };
    }

    // Now fetch the Order for customer_id using the order_id from the item
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('customer_id') // Use snake_case
      .eq('id', orderItem.order_id) // Use snake_case from fetched item
      .maybeSingle();

    if (orderError || !order) {
      console.error('Error fetching order for customer ID:', orderError?.message);
      // Return vendorId even if customer fetch fails
      return { vendorId: orderItem.vendor_id, error: 'Failed to fetch customer ID' };
    }

    // Both IDs fetched successfully
    return { customerId: order.customer_id, vendorId: orderItem.vendor_id };

  } catch (error) {
      console.error('Unexpected error in getOrderDetails:', error);
      return { error: 'Failed to fetch order details' };
  }
}

/**
 * Create Order Status Notification (for Customer & Vendor)
 */
export async function createOrderStatusNotification(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
   const supabase = getSupabaseClient(); // Get client instance
  try {
    const details = await getOrderDetails(orderId);
    // Check if BOTH IDs are present
    if (details.error || !details.customerId || !details.vendorId) {
      console.error(`Missing details for order ${orderId}:`, details);
      return { success: false, error: details.error || "Missing customer/vendor ID for notification." };
    }

    const { customerId, vendorId } = details;

    // Customize messages based on status
    let customerMessage = '';
    let vendorMessage = '';
    // Use the correct NotificationType values based on your ENUM definition
    let notificationType: NotificationType;

    switch (status.toUpperCase()) { // Convert status to uppercase for case-insensitivity
      case 'PLACED': // Assuming PLACED corresponds to ORDER_STATUS_CHANGE or a specific type
        customerMessage = `Your order #${orderId.substring(0, 6)} has been placed.`;
        vendorMessage = `New order #${orderId.substring(0, 6)} received.`;
        notificationType = 'ORDER_STATUS_CHANGE'; // Example: Use a general type
        break;
      case 'PROCESSING':
        customerMessage = `Your order #${orderId.substring(0, 6)} is being processed.`;
        vendorMessage = `Order #${orderId.substring(0, 6)} is now processing.`;
        notificationType = 'ORDER_STATUS_CHANGE';
        break;
      case 'SHIPPED': // Assuming 'SHIPPED' means ready for pickup agent
        customerMessage = `Your order #${orderId.substring(0, 6)} is ready for pickup.`; // Changed message slightly
        vendorMessage = `Order #${orderId.substring(0, 6)} is marked as ready for agent pickup.`;
        notificationType = 'PICKUP_READY'; // This seems more appropriate if SHIPPED means ready for pickup
        break;
      case 'DELIVERED': // Assuming 'DELIVERED' means picked up by customer
        customerMessage = `Your order #${orderId.substring(0, 6)} has been picked up.`;
        vendorMessage = `Order #${orderId.substring(0, 6)} has been picked up by the customer.`;
        notificationType = 'ORDER_PICKED_UP'; // Use the specific type
        break;
      case 'CANCELLED':
        customerMessage = `Your order #${orderId.substring(0, 6)} has been cancelled.`;
        vendorMessage = `Order #${orderId.substring(0, 6)} has been cancelled.`;
        notificationType = 'ORDER_STATUS_CHANGE';
        break;
       case 'PAYMENT_FAILED':
        customerMessage = `Payment for order #${orderId.substring(0, 6)} failed. Please update payment.`;
        vendorMessage = `Payment failed for order #${orderId.substring(0, 6)}.`;
        notificationType = 'ORDER_STATUS_CHANGE'; // Use a general type, or create specific one
        break;
      default:
        console.warn(`Unknown order status for notification: ${status}`);
        return { success: true }; // Don't create notification for unknown status
    }

    // Create notification for Customer
    await createNotification({
      userId: customerId,
      title: `Order Update`, // Simplified title
      message: customerMessage,
      type: notificationType,
      orderId: orderId,
      referenceUrl: `/orders/${orderId}` // Example reference URL
    });

    // Fetch Vendor's user_id
    const { data: vendorUser, error: vendorUserError } = await supabase
      .from('Vendor')
      .select('user_id')
      .eq('id', vendorId)
      .single();

    if (vendorUserError || !vendorUser) {
        console.error(`Could not fetch user ID for vendor ${vendorId}`);
        // Proceed without vendor notification or return error?
    } else {
        await createNotification({
          userId: vendorUser.user_id, // Send to Vendor's user_id
          title: `Order Update`, // Simplified title
          message: vendorMessage,
          type: notificationType,
          orderId: orderId,
          referenceUrl: `/vendor/orders/${orderId}` // Example reference URL
        });
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating order status notification:", error);
    return { success: false, error: "Failed to create order status notification" };
  }
}

/**
 * Create Pickup Status Notification (for Customer & Agent)
 */
export async function createPickupStatusNotification(orderId: string, status: 'PICKUP_READY' | 'ORDER_PICKED_UP'): Promise<{ success: boolean; error?: string }> {
   const supabase = getSupabaseClient(); // Get client instance
  try {
     // Need Customer ID and Agent ID for the order
     // Use snake_case for column names
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('customer_id, agent_id, pickup_code') // Fetch necessary IDs and code (snake_case)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
        console.error("Error fetching order for pickup notification or missing data:", orderError?.message);
        return { success: false, error: "Failed to get order details for pickup notification." };
    }

    // Check for null/undefined IDs
    if (!order.customer_id || !order.agent_id) {
        console.error(`Missing customer_id (${order.customer_id}) or agent_id (${order.agent_id}) for order ${orderId}`);
        return { success: false, error: "Order is missing customer or agent assignment." };
    }

    const { customer_id, agent_id, pickup_code } = order; // Use snake_case variables

    let customerMessage = '';
    let agentMessage = '';
    const notificationType: NotificationType = status; // Type is directly the status here

    switch (status) {
      case 'PICKUP_READY':
        customerMessage = `Your order #${orderId.substring(0, 6)} is ready for pickup! Your code is ${pickup_code || 'N/A'}.`;
        agentMessage = `Order #${orderId.substring(0, 6)} is ready for customer pickup.`;
        break;
      case 'ORDER_PICKED_UP':
        customerMessage = `Your order #${orderId.substring(0, 6)} has been successfully picked up.`;
        agentMessage = `Order #${orderId.substring(0, 6)} was successfully picked up by the customer.`;
        break;
      default:
        // Should not happen with the explicit type in the function signature
        console.warn(`Unknown pickup status for notification: ${status}`);
        return { success: true };
    }

    // Fetch Customer's user_id
    const { data: customerUser, error: customerUserError } = await supabase
      .from('Customer')
      .select('user_id')
      .eq('id', customer_id)
      .single();

    if (customerUserError || !customerUser) {
        console.error(`Could not fetch user ID for customer ${customer_id}`);
        // Decide how to handle - maybe skip customer notification?
    } else {
          await createNotification({
            userId: customerUser.user_id,
            title: 'Pickup Update',
            message: customerMessage,
            type: notificationType,
            orderId: orderId,
            referenceUrl: `/orders/${orderId}`
        });
    }

    // Fetch Agent's user_id
    const { data: agentUser, error: agentUserError } = await supabase
      .from('Agent')
      .select('user_id')
      .eq('id', agent_id)
      .single();

    if (agentUserError || !agentUser) {
        console.error(`Could not fetch user ID for agent ${agent_id}`);
        // Decide how to handle - maybe skip agent notification?
    } else {
          await createNotification({
            userId: agentUser.user_id, // Send to Agent's user_id
            title: 'Pickup Update',
            message: agentMessage,
            type: notificationType,
            orderId: orderId,
            referenceUrl: `/agent/orders/${orderId}`
        });
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating pickup status notification:", error);
    return { success: false, error: "Failed to create pickup status notification" };
  }
}

/**
 * Create Return Status Notification (for Customer, Vendor)
 * Requires fetching multiple related user IDs.
 */
export async function createReturnStatusNotification(returnId: string, status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'): Promise<{ success: boolean; error?: string }> {
   const supabase = getSupabaseClient(); // Get client instance
  try {
    // Fetch Return details along with related IDs (using snake_case)
    const { data: returnData, error: returnError } = await supabase
      .from('Return')
      .select(`
        id,
        customer_id,
        order_id,
        vendor_id
      `)
      .eq('id', returnId)
      .maybeSingle();

    if (returnError || !returnData) {
        console.error("Error fetching return details or return not found:", returnError?.message);
        return { success: false, error: "Failed to get return details for notification." };
     }

     // Ensure necessary IDs exist
     if (!returnData.customer_id || !returnData.vendor_id || !returnData.order_id) {
         console.error(`Missing IDs in return data for return ${returnId}:`, returnData);
         return { success: false, error: "Return data incomplete." };
     }

    const { customer_id, vendor_id, order_id } = returnData;

    let customerMessage = '';
    let vendorMessage = '';
    // Map the incoming status to the correct NotificationType ENUM
    let notificationType: NotificationType;

    switch (status) {
      case 'REQUESTED':
        customerMessage = `Your return request for order #${order_id.substring(0, 6)} has been received.`;
        vendorMessage = `Return requested for order #${order_id.substring(0, 6)}.`;
        notificationType = 'RETURN_REQUESTED';
        break;
      case 'APPROVED':
        customerMessage = `Your return request for order #${order_id.substring(0, 6)} has been approved. Please drop off the item.`;
        vendorMessage = `Return approved for order #${order_id.substring(0, 6)}.`;
        notificationType = 'RETURN_APPROVED';
        break;
      case 'REJECTED':
        customerMessage = `Your return request for order #${order_id.substring(0, 6)} has been rejected.`;
        vendorMessage = `Return rejected for order #${order_id.substring(0, 6)}.`;
        notificationType = 'RETURN_REJECTED';
        break;
      // Assuming REFUND_PROCESSED covers the 'COMPLETED' state
      case 'COMPLETED':
        customerMessage = `Your return for order #${order_id.substring(0, 6)} is complete and refund has been processed.`;
        vendorMessage = `Return process completed for order #${order_id.substring(0, 6)}.`;
        notificationType = 'REFUND_PROCESSED'; // Use REFUND_PROCESSED from ENUM
        break;
      default:
        console.warn(`Unknown return status for notification: ${status}`);
        return { success: true };
    }

    // Fetch Customer's user_id
    const { data: customerUser, error: customerUserError } = await supabase
      .from('Customer')
      .select('user_id')
      .eq('id', customer_id)
      .single();

    if (!customerUserError && customerUser) {
          await createNotification({
          userId: customerUser.user_id,
          title: 'Return Update',
          message: customerMessage,
          type: notificationType,
          orderId: order_id,
          returnId: returnId,
          referenceUrl: `/returns/${returnId}`
        });
    } else {
         console.error(`Could not fetch user ID for customer ${customer_id}`);
    }

    // Fetch Vendor's user_id
    const { data: vendorUser, error: vendorUserError } = await supabase
      .from('Vendor')
      .select('user_id')
      .eq('id', vendor_id)
      .single();

     if (!vendorUserError && vendorUser) {
          await createNotification({
          userId: vendorUser.user_id,
          title: 'Return Update',
          message: vendorMessage,
          type: notificationType,
          orderId: order_id,
          returnId: returnId,
          referenceUrl: `/vendor/returns/${returnId}`
        });
     } else {
         console.error(`Could not fetch user ID for vendor ${vendor_id}`);
     }

    return { success: true };
  } catch (error) {
    console.error("Error creating return status notification:", error);
    return { success: false, error: "Failed to create return status notification" };
  }
} 