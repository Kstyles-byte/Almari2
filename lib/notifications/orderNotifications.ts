import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';

// Define types for order notifications
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'READY_FOR_PICKUP';
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
type PickupStatus = 'PENDING' | 'READY_FOR_PICKUP' | 'PICKED_UP';

interface Order {
  id: string;
  customer_id: string;
  agent_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  pickup_status: PickupStatus;
  pickup_code: string | null;
  total_amount: number;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  vendor_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
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
 * Get user ID from customer, vendor, or agent records
 */
async function getUserIds(customerIds: string[], vendorIds: string[], agentIds: string[]) {
  const supabase = await createSupabaseClient();
  const userIds: Record<string, string> = {};

  // Get customer user IDs
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from('Customer')
      .select('id, user_id')
      .in('id', customerIds);
    
    customers?.forEach(customer => {
      userIds[`customer_${customer.id}`] = customer.user_id;
    });
  }

  // Get vendor user IDs
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('Vendor')
      .select('id, user_id')
      .in('id', vendorIds);
    
    vendors?.forEach(vendor => {
      userIds[`vendor_${vendor.id}`] = vendor.user_id;
    });
  }

  // Get agent user IDs
  if (agentIds.length > 0) {
    const { data: agents } = await supabase
      .from('Agent')
      .select('id, user_id')
      .in('id', agentIds);
    
    agents?.forEach(agent => {
      userIds[`agent_${agent.id}`] = agent.user_id;
    });
  }

  return userIds;
}

/**
 * Send order confirmation notification to customer
 */
export async function sendOrderConfirmationNotification(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, total_amount')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([order.customer_id], [], []);
    const customerUserId = userIds[`customer_${order.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    return await createNotificationFromTemplate(
      'ORDER_CONFIRMATION',
      customerUserId,
      { 
        orderId: order.id,
        totalAmount: order.total_amount 
      },
      {
        orderId: order.id,
        referenceUrl: `/customer/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Order Notifications] Error sending order confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send order confirmation' 
    };
  }
}

/**
 * Send payment confirmation notification to customer
 */
export async function sendPaymentConfirmationNotification(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, total_amount, payment_method')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([order.customer_id], [], []);
    const customerUserId = userIds[`customer_${order.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    return await createNotificationFromTemplate(
      'ORDER_CONFIRMATION', // We can reuse this template or create a specific payment one
      customerUserId,
      { 
        orderId: order.id,
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method 
      },
      {
        orderId: order.id,
        referenceUrl: `/customer/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Order Notifications] Error sending payment confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payment confirmation' 
    };
  }
}

/**
 * Send order status change notification to customer
 */
export async function sendOrderStatusChangeNotification(
  orderId: string, 
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, pickup_code')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([order.customer_id], [], []);
    const customerUserId = userIds[`customer_${order.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    // Determine template based on status
    let templateKey: string;
    switch (newStatus) {
      case 'PROCESSING':
        templateKey = 'ORDER_PROCESSING';
        break;
      case 'READY_FOR_PICKUP':
        templateKey = 'ORDER_READY_FOR_PICKUP';
        break;
      case 'DELIVERED':
        templateKey = 'ORDER_DELIVERED';
        break;
      case 'SHIPPED':
        templateKey = 'ORDER_SHIPPED';
        break;
      case 'CANCELLED':
        templateKey = 'ORDER_CANCELLED';
        break;
      default:
        templateKey = 'ORDER_CONFIRMATION'; // Fallback
    }

    return await createNotificationFromTemplate(
      templateKey,
      customerUserId,
      { 
        orderId: order.id,
        status: newStatus,
        pickupCode: order.pickup_code
      },
      {
        orderId: order.id,
        referenceUrl: `/customer/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Order Notifications] Error sending order status change:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send order status change notification' 
    };
  }
}

/**
 * Send pickup ready notification to customer
 */
export async function sendPickupReadyNotification(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, pickup_code, agent_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([order.customer_id], [], []);
    const customerUserId = userIds[`customer_${order.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    return await createNotificationFromTemplate(
      'ORDER_READY_FOR_PICKUP',
      customerUserId,
      { 
        orderId: order.id,
        pickupCode: order.pickup_code || 'N/A'
      },
      {
        orderId: order.id,
        referenceUrl: `/customer/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Order Notifications] Error sending pickup ready notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send pickup ready notification' 
    };
  }
}

/**
 * Send order picked up confirmation to customer
 */
export async function sendOrderPickedUpNotification(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, actual_pickup_date')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([order.customer_id], [], []);
    const customerUserId = userIds[`customer_${order.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    return await createNotificationFromTemplate(
      'ORDER_PICKED_UP',
      customerUserId,
      { 
        orderId: order.id,
        pickupDate: order.actual_pickup_date
      },
      {
        orderId: order.id,
        referenceUrl: `/customer/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Order Notifications] Error sending order picked up notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send order picked up notification' 
    };
  }
}

/**
 * Send payment failed notification to customer
 */
export async function sendPaymentFailedNotification(orderId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, total_amount')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([order.customer_id], [], []);
    const customerUserId = userIds[`customer_${order.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    return await createNotificationFromTemplate(
      'PAYMENT_FAILED',
      customerUserId,
      { 
        orderId: order.id,
        totalAmount: order.total_amount,
        reason: reason || 'Payment processing error'
      },
      {
        orderId: order.id,
        referenceUrl: `/customer/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Order Notifications] Error sending payment failed notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payment failed notification' 
    };
  }
}

/**
 * Comprehensive order lifecycle notification handler
 * This function handles all order-related notifications based on the event type
 */
export async function handleOrderLifecycleNotification(
  orderId: string,
  eventType: 'order_confirmed' | 'payment_completed' | 'payment_failed' | 'status_changed' | 'pickup_ready' | 'picked_up',
  additionalData?: {
    newStatus?: OrderStatus;
    paymentFailureReason?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Order Notifications] Handling ${eventType} for order ${orderId}`);

    switch (eventType) {
      case 'order_confirmed':
        return await sendOrderConfirmationNotification(orderId);
      
      case 'payment_completed':
        return await sendPaymentConfirmationNotification(orderId);
      
      case 'payment_failed':
        return await sendPaymentFailedNotification(orderId, additionalData?.paymentFailureReason);
      
      case 'status_changed':
        if (!additionalData?.newStatus) {
          throw new Error('New status is required for status_changed event');
        }
        return await sendOrderStatusChangeNotification(orderId, additionalData.newStatus);
      
      case 'pickup_ready':
        return await sendPickupReadyNotification(orderId);
      
      case 'picked_up':
        return await sendOrderPickedUpNotification(orderId);
      
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

  } catch (error) {
    console.error('[Order Notifications] Error handling order lifecycle notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle order lifecycle notification' 
    };
  }
}

/**
 * Integration helper to replace existing order notification calls
 */
export async function notifyOrderStatusChange(orderId: string, newStatus: OrderStatus): Promise<void> {
  const result = await handleOrderLifecycleNotification(orderId, 'status_changed', { newStatus });
  
  if (!result.success) {
    console.error(`[Order Notifications] Failed to send status change notification: ${result.error}`);
    // Don't throw error to avoid blocking the main order update process
  }
}

/**
 * Integration helper for payment notifications
 */
export async function notifyPaymentStatus(orderId: string, paymentStatus: PaymentStatus, reason?: string): Promise<void> {
  let eventType: 'payment_completed' | 'payment_failed';
  
  if (paymentStatus === 'COMPLETED') {
    eventType = 'payment_completed';
  } else if (paymentStatus === 'FAILED') {
    eventType = 'payment_failed';
  } else {
    return; // No notification needed for PENDING or REFUNDED
  }

  const result = await handleOrderLifecycleNotification(orderId, eventType, { 
    paymentFailureReason: reason 
  });
  
  if (!result.success) {
    console.error(`[Order Notifications] Failed to send payment notification: ${result.error}`);
  }
}

/**
 * Integration helper for pickup notifications
 */
export async function notifyPickupStatus(orderId: string, pickupStatus: PickupStatus): Promise<void> {
  let eventType: 'pickup_ready' | 'picked_up' | null = null;
  
  if (pickupStatus === 'READY_FOR_PICKUP') {
    eventType = 'pickup_ready';
  } else if (pickupStatus === 'PICKED_UP') {
    eventType = 'picked_up';
  }

  if (!eventType) return;

  const result = await handleOrderLifecycleNotification(orderId, eventType);
  
  if (!result.success) {
    console.error(`[Order Notifications] Failed to send pickup notification: ${result.error}`);
  }
}
