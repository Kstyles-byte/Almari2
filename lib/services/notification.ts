import { createClient } from '@supabase/supabase-js';
import type { Notification, Order, Customer, Vendor, Agent } from '../../types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for notification service.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define NotificationType enum (adjust values based on your actual needs/enums)
type NotificationType = 
  | "ORDER_STATUS_CHANGE"
  | "PICKUP_READY"
  | "ORDER_PICKED_UP"
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_REJECTED"
  | "REFUND_PROCESSED"
  | "PRODUCT_APPROVED" // Added based on other actions
  | "PRODUCT_REJECTED" // Added based on other actions
  | "PRODUCT_STATUS_UPDATED" // Added based on other actions
  | "PRODUCT_UPDATED" // Added based on other actions
  | "PRODUCT_DELETED"; // Added based on other actions

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
}): Promise<{ success: boolean; notification?: Notification | null; error?: string }> {
  try {
    // Map NotificationType to string if needed by DB schema
    const insertData = {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type as string,
      orderId: data.orderId || null, // Ensure null is passed if undefined
      returnId: data.returnId || null,
      isRead: false, // Default to unread
      // createdAt/updatedAt handled by DB
    };

    const { data: notification, error } = await supabase
      .from('Notification') // Ensure table name matches
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
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (options?.unreadOnly) {
      where.isRead = false;
    }

    // Fetch notifications with relations
    const { data: notifications, error: fetchError } = await supabase
      .from('Notification')
      .select(`
        *,
        Order:orderId (*), 
        Return:returnId (*)
      `)
      .eq('userId', userId)
      .eq('isRead', options?.unreadOnly === true) // Use strict boolean check
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (fetchError) {
        console.error("Error fetching user notifications:", fetchError.message);
        throw fetchError;
    }

    // Get total count separately
    const { count, error: countError } = await supabase
      .from('Notification')
      .select('*' , { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('isRead', options?.unreadOnly === true);

    if (countError) {
        console.error("Error fetching notification count:", countError.message);
        throw countError;
    }

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
    // Return default structure on error
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
  try {
    const { count, error } = await supabase
      .from('Notification')
      .select('*' , { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('isRead', false);

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
  try {
    const { data: notification, error } = await supabase
      .from('Notification')
      .update({ isRead: true })
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
  try {
    await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', userId)
      .eq('isRead', false);
    
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
  try {
    await supabase
      .from('Notification')
      .delete()
      .eq('id', notificationId);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { error: "Failed to delete notification" };
  }
}

/**
 * Create order status change notification(s) for relevant users
 */
export async function createOrderStatusNotification(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get order details including related user IDs using Supabase
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        id,
        customerId, 
        agentId,
        Customer:customerId ( userId ),
        Agent:agentId ( userId ),
        OrderItem ( vendorId, Vendor:vendorId ( userId ) )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
        console.error("Error fetching order for notification:", orderError.message);
        if (orderError.code === 'PGRST116') return { success: false, error: "Order not found" };
        throw new Error(`Failed to fetch order details: ${orderError.message}`);
    }
    if (!order) {
      return { success: false, error: "Order not found (post-fetch check)" };
    }

    // Cast to any for easier nested access, or use optional chaining
    const orderData = order as any;

    // Determine notification details based on status
    let title = "Order Status Updated";
    let message = `Your order #${orderData.id} has been updated to ${status}.`;
    let type: NotificationType = "ORDER_STATUS_CHANGE";

    if (status === 'PAYMENT_FAILED') {
        title = "Payment Failed";
        message = `Payment for your order #${orderData.id} failed. Please try again.`;
    } else if (status === 'PROCESSING') {
        title = "Order Processing";
        message = `Your order #${orderData.id} is now being processed.`;
    } // Add more cases 

    // --- Create notifications --- 
    const notificationPromises: Promise<any>[] = [];

    // 1. Customer notification (Use optional chaining/safe access)
    const customerUserId = orderData.Customer?.userId;
    if (customerUserId) {
        notificationPromises.push(createNotification({
            userId: customerUserId,
            title: title,
            message: message,
            type: type,
            orderId: orderData.id,
        }));
    } else if (orderData.customerId) {
        console.warn(`Could not find customer user ID for customer ${orderData.customerId} on order ${orderData.id}`);
    }

    // 2. Vendor notifications (Use optional chaining/safe access)
    const vendorUserIds = new Set<string>();
    orderData.OrderItem?.forEach((item: any) => { // Assert item as any or define inline type
        if (item.Vendor?.userId) {
            vendorUserIds.add(item.Vendor.userId);
        }
    });

    vendorUserIds.forEach(vendorUserId => {
        notificationPromises.push(createNotification({
            userId: vendorUserId,
            title: title,
            message: `Order #${orderData.id} involving your product(s) has been updated to ${status}.`, 
            type: type,
            orderId: orderData.id,
        }));
    });

    // 3. Agent notification (Use optional chaining/safe access)
    const agentUserId = orderData.Agent?.userId;
    if (orderData.agentId && agentUserId) {
         notificationPromises.push(createNotification({
            userId: agentUserId,
            title: title,
            message: `Order #${orderData.id} assigned to you has been updated to ${status}.`, 
            type: type,
            orderId: orderData.id,
        }));
    } else if (orderData.agentId) {
        console.warn(`Could not find agent user ID for agent ${orderData.agentId} on order ${orderData.id}`);
    }

    // Wait for all notifications to be created
    const results = await Promise.allSettled(notificationPromises);
    
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`Failed to create notification ${index}:`, result.reason);
        } else if (result.value && !result.value.success) {
             console.error(`Failed to create notification ${index} (service error):`, result.value.error);
        }
    });

    return { success: true };

  } catch (error) {
    console.error("Error creating order status notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create order status notification" };
  }
}

/**
 * Create pickup status change notification
 */
export async function createPickupStatusNotification(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get order with customer and agent
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        id, 
        customerId, 
        agentId, 
        Customer:customerId ( userId ), 
        Agent:agentId ( userId, name, location )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
        console.error("Error fetching order for pickup notification:", orderError?.message);
        return { success: false, error: "Order not found" };
    }

    // Use optional chaining for safe access
    const orderData = order as any; // Cast for easier access or use explicit checks
    const customerUserId = orderData.Customer?.userId;
    const agentUserId = orderData.Agent?.userId;
    const agentName = orderData.Agent?.name || 'the agent location';
    const agentLocation = orderData.Agent?.location || 'specified location';

    if (status === "READY_FOR_PICKUP") {
      // Notify customer
      if (customerUserId) {
          await createNotification({
            userId: customerUserId,
            title: "Order Ready for Pickup",
            message: `Your order #${orderData.id} is ready for pickup at ${agentName} (${agentLocation})`,
            type: "PICKUP_READY",
            orderId,
          });
      }
    } else if (status === "COMPLETED") { // Assuming status matches enum/logic
      // Notify customer
      if (customerUserId) {
          await createNotification({
            userId: customerUserId,
            title: "Order Picked Up",
            message: `Your order #${orderData.id} has been picked up`,
            type: "ORDER_PICKED_UP",
            orderId,
          });
      }
      // Notify agent
      if (agentUserId) {
          await createNotification({
            userId: agentUserId,
            title: "Order Picked Up",
            message: `Order #${orderData.id} has been picked up by the customer`,
            type: "ORDER_PICKED_UP",
            orderId,
          });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating pickup status notification:", error);
    return { success: false, error: "Failed to create pickup status notification" };
  }
}

/**
 * Create return status change notification
 */
export async function createReturnStatusNotification(returnId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get return with related entities
    const { data: returnData, error: returnError } = await supabase
      .from('Return') // Assuming table name is 'Return'
      .select(`
        id,
        customerId,
        vendorId,
        agentId,
        orderId,
        productId,
        Customer:customerId ( userId ),
        Vendor:vendorId ( userId ),
        Agent:agentId ( userId ),
        Product:productId ( name )
      `)
      .eq('id', returnId)
      .single();

    if (returnError || !returnData) {
        console.error("Error fetching return for notification:", returnError?.message);
        return { success: false, error: "Return request not found" };
    }

    // Use optional chaining for safe access
    const returnInfo = returnData as any; // Cast for easier access or use explicit checks
    const customerUserId = returnInfo.Customer?.userId;
    const vendorUserId = returnInfo.Vendor?.userId;
    const agentUserId = returnInfo.Agent?.userId;
    const productName = returnInfo.Product?.name || 'the product';

    if (status === "REQUESTED") {
      // Notify vendor
      if(vendorUserId) {
          await createNotification({
            userId: vendorUserId,
            title: "Return Requested",
            message: `A return has been requested for product ${productName} from order #${returnInfo.orderId}`,
            type: "RETURN_REQUESTED",
            returnId,
          });
      }
      // Notify agent (if applicable to your return flow)
      if(agentUserId) {
          await createNotification({
            userId: agentUserId,
            title: "Return Requested",
            message: `A return has been requested for product ${productName} from order #${returnInfo.orderId}`,
            type: "RETURN_REQUESTED",
            returnId,
          });
      }
    } else if (status === "APPROVED") {
      // Notify customer
      if (customerUserId) {
          await createNotification({
            userId: customerUserId,
            title: "Return Approved",
            message: `Your return request for product ${productName} has been approved`,
            type: "RETURN_APPROVED",
            returnId,
          });
      }
      // Notify agent (if applicable)
      if (agentUserId) {
          await createNotification({
            userId: agentUserId,
            title: "Return Approved",
            message: `Return for product ${productName} from order #${returnInfo.orderId} has been approved`,
            type: "RETURN_APPROVED",
            returnId,
          });
      }
    } else if (status === "REJECTED") {
      // Notify customer
      if (customerUserId) {
          await createNotification({
            userId: customerUserId,
            title: "Return Rejected",
            message: `Your return request for product ${productName} has been rejected`,
            type: "RETURN_REJECTED",
            returnId,
          });
      }
    } else if (status === "REFUND_PROCESSED") {
      // Notify customer
      if (customerUserId) {
          await createNotification({
            userId: customerUserId,
            title: "Refund Processed",
            message: `Your refund for product ${productName} has been processed`,
            type: "REFUND_PROCESSED",
            returnId,
          });
      }
      // Notify vendor
      if (vendorUserId) {
          await createNotification({
            userId: vendorUserId,
            title: "Refund Processed",
            message: `Refund for product ${productName} from order #${returnInfo.orderId} has been processed`,
            type: "REFUND_PROCESSED",
            returnId,
          });
      }
    } // Add more statuses as needed

    return { success: true };
  } catch (error) {
    console.error("Error creating return status notification:", error);
    return { success: false, error: "Failed to create return status notification" };
  }
} 