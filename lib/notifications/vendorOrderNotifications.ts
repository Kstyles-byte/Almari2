import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';

// Define types for vendor notifications
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'READY_FOR_PICKUP';
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

interface OrderWithItems {
  id: string;
  customer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
  OrderItem: OrderItem[];
}

interface OrderItem {
  id: string;
  order_id: string;
  vendor_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  Product?: {
    id: string;
    name: string;
  };
}

interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
}

/**
 * Create Supabase SSR client for notifications
 */
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Get vendor user IDs from vendor IDs
 */
async function getVendorUserIds(vendorIds: string[]): Promise<Record<string, string>> {
  const supabase = await createSupabaseClient();
  const userIds: Record<string, string> = {};

  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('Vendor')
      .select('id, user_id')
      .in('id', vendorIds);
    
    vendors?.forEach(vendor => {
      userIds[vendor.id] = vendor.user_id;
    });
  }

  return userIds;
}

/**
 * Send new order notification to vendors
 */
export async function sendNewOrderNotificationToVendors(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order with items and vendor information
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        id,
        customer_id,
        total_amount,
        created_at,
        OrderItem (
          id,
          vendor_id,
          product_id,
          quantity,
          price_at_purchase,
          Product (
            id,
            name
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Group order items by vendor
    const vendorItems: Record<string, OrderItem[]> = {};
    order.OrderItem.forEach(item => {
      if (!vendorItems[item.vendor_id]) {
        vendorItems[item.vendor_id] = [];
      }
      vendorItems[item.vendor_id].push(item);
    });

    const vendorIds = Object.keys(vendorItems);
    const vendorUserIds = await getVendorUserIds(vendorIds);

    // Create notifications for each vendor
    const notifications = [];
    for (const vendorId of vendorIds) {
      const userId = vendorUserIds[vendorId];
      if (!userId) continue;

      const vendorItems_forVendor = vendorItems[vendorId];
      const vendorTotal = vendorItems_forVendor.reduce(
        (sum, item) => sum + (item.price_at_purchase * item.quantity), 
        0
      );

      notifications.push({
        userId,
        title: 'New Order Received',
        message: `You have received a new order #${order.id.substring(0, 8)} with ${vendorItems_forVendor.length} item(s) worth ₦${vendorTotal.toLocaleString()}.`,
        type: 'NEW_ORDER_VENDOR' as const,
        orderId: order.id,
        referenceUrl: `/vendor/orders/${order.id}`
      });
    }

    if (notifications.length === 0) {
      return { success: true }; // No vendors to notify
    }

    const result = await createBatchNotifications(notifications);
    
    if (!result.success) {
      throw new Error(`Failed to create batch notifications: ${result.errors?.join(', ')}`);
    }

    console.log(`[Vendor Notifications] Sent new order notifications to ${notifications.length} vendors for order ${orderId}`);
    return { success: true };

  } catch (error) {
    console.error('[Vendor Notifications] Error sending new order notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send new order notifications to vendors' 
    };
  }
}

/**
 * Send order processing reminder to vendors
 */
export async function sendOrderProcessingReminder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order items that are still pending
    const { data: orderItems, error: itemsError } = await supabase
      .from('OrderItem')
      .select(`
        id,
        vendor_id,
        status,
        Product (
          name
        )
      `)
      .eq('order_id', orderId)
      .eq('status', 'PENDING');

    if (itemsError) {
      throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    if (!orderItems || orderItems.length === 0) {
      return { success: true }; // No pending items to remind about
    }

    // Group by vendor
    const vendorItems: Record<string, typeof orderItems> = {};
    orderItems.forEach(item => {
      if (!vendorItems[item.vendor_id]) {
        vendorItems[item.vendor_id] = [];
      }
      vendorItems[item.vendor_id].push(item);
    });

    const vendorIds = Object.keys(vendorItems);
    const vendorUserIds = await getVendorUserIds(vendorIds);

    // Create notifications for each vendor with pending items
    const notifications = [];
    for (const vendorId of vendorIds) {
      const userId = vendorUserIds[vendorId];
      if (!userId) continue;

      const pendingItems = vendorItems[vendorId];
      const productNames = pendingItems.map(item => item.Product?.name).filter(Boolean).join(', ');

      notifications.push({
        userId,
        title: 'Order Processing Reminder',
        message: `Please process order #${orderId.substring(0, 8)}. Pending items: ${productNames}`,
        type: 'ORDER_STATUS_CHANGE' as const,
        orderId,
        referenceUrl: `/vendor/orders/${orderId}`
      });
    }

    if (notifications.length === 0) {
      return { success: true };
    }

    const result = await createBatchNotifications(notifications);
    
    if (!result.success) {
      throw new Error(`Failed to create batch notifications: ${result.errors?.join(', ')}`);
    }

    console.log(`[Vendor Notifications] Sent processing reminders to ${notifications.length} vendors for order ${orderId}`);
    return { success: true };

  } catch (error) {
    console.error('[Vendor Notifications] Error sending processing reminders:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send processing reminders' 
    };
  }
}

/**
 * Send payment received notification to vendors
 */
export async function sendPaymentReceivedNotification(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        id,
        total_amount,
        payment_method,
        OrderItem (
          id,
          vendor_id,
          quantity,
          price_at_purchase
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Group order items by vendor and calculate earnings
    const vendorEarnings: Record<string, number> = {};
    order.OrderItem.forEach(item => {
      const earnings = item.price_at_purchase * item.quantity;
      if (!vendorEarnings[item.vendor_id]) {
        vendorEarnings[item.vendor_id] = 0;
      }
      vendorEarnings[item.vendor_id] += earnings;
    });

    const vendorIds = Object.keys(vendorEarnings);
    const vendorUserIds = await getVendorUserIds(vendorIds);

    // Create notifications for each vendor
    const notifications = [];
    for (const vendorId of vendorIds) {
      const userId = vendorUserIds[vendorId];
      if (!userId) continue;

      const earnings = vendorEarnings[vendorId];

      notifications.push({
        userId,
        title: 'Payment Received',
        message: `Payment received for order #${order.id.substring(0, 8)}. Your earnings: ₦${earnings.toLocaleString()}`,
        type: 'PAYMENT_RECEIVED' as const,
        orderId: order.id,
        referenceUrl: `/vendor/orders/${order.id}`
      });
    }

    if (notifications.length === 0) {
      return { success: true };
    }

    const result = await createBatchNotifications(notifications);
    
    if (!result.success) {
      throw new Error(`Failed to create batch notifications: ${result.errors?.join(', ')}`);
    }

    console.log(`[Vendor Notifications] Sent payment received notifications to ${notifications.length} vendors for order ${orderId}`);
    return { success: true };

  } catch (error) {
    console.error('[Vendor Notifications] Error sending payment received notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payment received notifications' 
    };
  }
}

/**
 * Send bulk order notifications to multiple vendors
 */
export async function sendBulkVendorOrderNotifications(
  orderIds: string[],
  notificationType: 'new_order' | 'payment_received' | 'processing_reminder'
): Promise<{ success: boolean; error?: string; results: Array<{ orderId: string; success: boolean; error?: string }> }> {
  const results: Array<{ orderId: string; success: boolean; error?: string }> = [];
  let overallSuccess = true;

  for (const orderId of orderIds) {
    try {
      let result: { success: boolean; error?: string };

      switch (notificationType) {
        case 'new_order':
          result = await sendNewOrderNotificationToVendors(orderId);
          break;
        case 'payment_received':
          result = await sendPaymentReceivedNotification(orderId);
          break;
        case 'processing_reminder':
          result = await sendOrderProcessingReminder(orderId);
          break;
        default:
          result = { success: false, error: `Unknown notification type: ${notificationType}` };
      }

      results.push({ orderId, ...result });
      
      if (!result.success) {
        overallSuccess = false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ orderId, success: false, error: errorMessage });
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    error: overallSuccess ? undefined : 'Some notifications failed to send',
    results
  };
}

/**
 * Comprehensive vendor order notification handler
 */
export async function handleVendorOrderNotification(
  orderId: string,
  eventType: 'new_order' | 'payment_received' | 'processing_reminder',
  additionalData?: {
    reminderHours?: number; // For processing reminders
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Vendor Notifications] Handling ${eventType} for order ${orderId}`);

    switch (eventType) {
      case 'new_order':
        return await sendNewOrderNotificationToVendors(orderId);
      
      case 'payment_received':
        return await sendPaymentReceivedNotification(orderId);
      
      case 'processing_reminder':
        return await sendOrderProcessingReminder(orderId);
      
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

  } catch (error) {
    console.error('[Vendor Notifications] Error handling vendor order notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle vendor order notification' 
    };
  }
}

/**
 * Integration helper for new order notifications
 */
export async function notifyVendorsNewOrder(orderId: string): Promise<void> {
  const result = await handleVendorOrderNotification(orderId, 'new_order');
  
  if (!result.success) {
    console.error(`[Vendor Notifications] Failed to send new order notification: ${result.error}`);
    // Don't throw error to avoid blocking the main order process
  }
}

/**
 * Integration helper for payment notifications
 */
export async function notifyVendorsPaymentReceived(orderId: string): Promise<void> {
  const result = await handleVendorOrderNotification(orderId, 'payment_received');
  
  if (!result.success) {
    console.error(`[Vendor Notifications] Failed to send payment received notification: ${result.error}`);
  }
}

/**
 * Integration helper for processing reminders
 */
export async function notifyVendorsProcessingReminder(orderId: string): Promise<void> {
  const result = await handleVendorOrderNotification(orderId, 'processing_reminder');
  
  if (!result.success) {
    console.error(`[Vendor Notifications] Failed to send processing reminder: ${result.error}`);
  }
}

/**
 * Helper to notify vendors about order status changes that affect them
 */
export async function notifyVendorsOrderStatusChange(orderId: string, newStatus: OrderStatus): Promise<void> {
  // Vendors typically need to know about cancellations and when orders are ready for pickup
  if (newStatus === 'CANCELLED' || newStatus === 'READY_FOR_PICKUP') {
    try {
      const supabase = await createSupabaseClient();
      
      // Get vendors involved in this order
      const { data: orderItems, error } = await supabase
        .from('OrderItem')
        .select('vendor_id')
        .eq('order_id', orderId);

      if (error || !orderItems) {
        console.error('[Vendor Notifications] Failed to fetch order items for status change:', error?.message);
        return;
      }

      const vendorIds = [...new Set(orderItems.map(item => item.vendor_id))];
      const vendorUserIds = await getVendorUserIds(vendorIds);

      const notifications = vendorIds.map(vendorId => {
        const userId = vendorUserIds[vendorId];
        if (!userId) return null;

        return {
          userId,
          title: 'Order Status Update',
          message: `Order #${orderId.substring(0, 8)} status changed to ${newStatus}`,
          type: 'ORDER_STATUS_CHANGE' as const,
          orderId,
          referenceUrl: `/vendor/orders/${orderId}`
        };
      }).filter(Boolean);

      if (notifications.length > 0) {
        await createBatchNotifications(notifications as any[]);
      }

    } catch (error) {
      console.error('[Vendor Notifications] Error notifying vendors of status change:', error);
    }
  }
}
