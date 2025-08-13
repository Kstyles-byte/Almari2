import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';

// Define types for payment notifications
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_reference: string | null;
  short_id: string | null;
}

interface OrderItem {
  id: string;
  order_id: string;
  vendor_id: string;
  quantity: number;
  price_at_purchase: number;
  commission_amount: number | null;
  commission_rate: number | null;
}

interface Customer {
  id: string;
  user_id: string;
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
 * Get user IDs from customer and vendor records
 */
async function getUserIds(customerIds: string[], vendorIds: string[]) {
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

  return userIds;
}

/**
 * Send payment success confirmation notification to customer
 */
export async function sendPaymentSuccessNotification(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, total_amount, payment_method, payment_reference, short_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([order.customer_id], []);
    const customerUserId = userIds[`customer_${order.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    return await createNotificationFromTemplate(
      'PAYMENT_SUCCESS',
      customerUserId,
      { 
        orderId: order.short_id || order.id.substring(0, 8),
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method || 'N/A',
        paymentReference: order.payment_reference || 'N/A'
      },
      {
        orderId: order.id,
        referenceUrl: `/customer/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Payment Notifications] Error sending payment success notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payment success notification' 
    };
  }
}

/**
 * Send payment failed notification to customer
 */
export async function sendPaymentFailedNotification(orderId: string, failureReason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, total_amount, payment_method, short_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([order.customer_id], []);
    const customerUserId = userIds[`customer_${order.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    return await createNotificationFromTemplate(
      'PAYMENT_FAILED',
      customerUserId,
      { 
        orderId: order.short_id || order.id.substring(0, 8),
        totalAmount: order.total_amount,
        reason: failureReason || 'Payment processing error'
      },
      {
        orderId: order.id,
        referenceUrl: `/customer/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Payment Notifications] Error sending payment failed notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payment failed notification' 
    };
  }
}

/**
 * Send payment received notification to vendors for their order items
 */
export async function sendPaymentReceivedNotification(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details and related order items
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        id,
        customer_id,
        total_amount,
        short_id,
        orderItems:OrderItem(
          id,
          vendor_id,
          quantity,
          price_at_purchase,
          commission_amount,
          product:Product(
            name
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    if (!order.orderItems || order.orderItems.length === 0) {
      throw new Error('No order items found');
    }

    // Group order items by vendor
    const vendorItems: Record<string, any[]> = {};
    order.orderItems.forEach((item: any) => {
      if (!vendorItems[item.vendor_id]) {
        vendorItems[item.vendor_id] = [];
      }
      vendorItems[item.vendor_id].push(item);
    });

    const vendorIds = Object.keys(vendorItems);
    const userIds = await getUserIds([], vendorIds);

    // Send notifications to each vendor
    const notifications = [];
    for (const vendorId of vendorIds) {
      const vendorUserId = userIds[`vendor_${vendorId}`];
      if (!vendorUserId) {
        console.warn(`[Payment Notifications] Vendor user ID not found for vendor: ${vendorId}`);
        continue;
      }

      const items = vendorItems[vendorId];
      const vendorEarnings = items.reduce((total, item) => {
        const itemTotal = item.quantity * item.price_at_purchase;
        const commission = item.commission_amount || 0;
        return total + (itemTotal - commission);
      }, 0);

      const productNames = items.map((item: any) => item.product?.name || 'Unknown Product').join(', ');

      notifications.push({
        userId: vendorUserId,
        title: 'Payment Received',
        message: `Payment received for order #${order.short_id || order.id.substring(0, 8)}. Your earnings: ₦${vendorEarnings.toLocaleString()}`,
        type: 'PAYMENT_RECEIVED' as any, // Cast to any to handle database type
        orderId: order.id,
        referenceUrl: `/vendor/orders/${order.id}`
      });
    }

    if (notifications.length === 0) {
      throw new Error('No vendor notifications to send');
    }

    const result = await createBatchNotifications(notifications);
    return { 
      success: result.success, 
      error: result.errors?.join(', ') 
    };

  } catch (error) {
    console.error('[Payment Notifications] Error sending payment received notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payment received notifications' 
    };
  }
}

/**
 * Send batch payment notifications for multiple orders
 */
export async function sendBatchPaymentNotifications(
  orderIds: string[],
  notificationType: 'success' | 'failed' | 'received'
): Promise<{ success: boolean; error?: string; results: Array<{ orderId: string; success: boolean; error?: string }> }> {
  const results: Array<{ orderId: string; success: boolean; error?: string }> = [];
  let overallSuccess = true;

  for (const orderId of orderIds) {
    let result: { success: boolean; error?: string };

    switch (notificationType) {
      case 'success':
        result = await sendPaymentSuccessNotification(orderId);
        break;
      case 'failed':
        result = await sendPaymentFailedNotification(orderId);
        break;
      case 'received':
        result = await sendPaymentReceivedNotification(orderId);
        break;
      default:
        result = { success: false, error: `Unsupported notification type: ${notificationType}` };
    }

    results.push({
      orderId,
      success: result.success,
      error: result.error
    });

    if (!result.success) {
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    error: overallSuccess ? undefined : 'Some payment notifications failed to send',
    results
  };
}

/**
 * Comprehensive payment notification handler
 * This function handles all payment-related notifications based on the event type
 */
export async function handlePaymentNotification(
  orderId: string,
  eventType: 'success' | 'failed' | 'received',
  additionalData?: {
    failureReason?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Payment Notifications] Handling ${eventType} for order ${orderId}`);

    switch (eventType) {
      case 'success':
        return await sendPaymentSuccessNotification(orderId);
      
      case 'failed':
        return await sendPaymentFailedNotification(orderId, additionalData?.failureReason);
      
      case 'received':
        return await sendPaymentReceivedNotification(orderId);
      
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

  } catch (error) {
    console.error('[Payment Notifications] Error handling payment notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle payment notification' 
    };
  }
}

/**
 * Integration helper to replace existing payment notification calls
 */
export async function notifyPaymentStatusChange(orderId: string, paymentStatus: PaymentStatus, failureReason?: string): Promise<void> {
  let eventType: 'success' | 'failed' | 'received' | null = null;
  
  if (paymentStatus === 'COMPLETED') {
    // Send both success to customer and received to vendors
    const customerResult = await handlePaymentNotification(orderId, 'success');
    const vendorResult = await handlePaymentNotification(orderId, 'received');
    
    if (!customerResult.success) {
      console.error(`[Payment Notifications] Failed to send customer success notification: ${customerResult.error}`);
    }
    if (!vendorResult.success) {
      console.error(`[Payment Notifications] Failed to send vendor received notifications: ${vendorResult.error}`);
    }
    return;
  } else if (paymentStatus === 'FAILED') {
    eventType = 'failed';
  }

  if (!eventType) {
    console.log(`[Payment Notifications] No notification needed for payment status: ${paymentStatus}`);
    return;
  }

  const result = await handlePaymentNotification(orderId, eventType, { failureReason });
  if (!result.success) {
    console.error(`[Payment Notifications] Failed to send payment notification: ${result.error}`);
  }
}
