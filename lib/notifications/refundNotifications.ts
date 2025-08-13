import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';
import type { Database } from '../../types/supabase';

// Define types for refund notifications
type RefundRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

interface RefundRequest {
  id: string;
  return_id: string | null;
  customer_id: string;
  vendor_id: string;
  order_id: string;
  order_item_id: string;
  reason: string;
  description: string | null;
  refund_amount: number;
  status: RefundRequestStatus;
  vendor_response: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
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

interface Order {
  id: string;
  customer_id: string;
  short_id: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  vendor_id: string;
  product: {
    name: string;
  };
}

/**
 * Create Supabase SSR client for notifications
 */
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
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
 * Send refund request confirmation notification to customer
 */
export async function sendRefundRequestConfirmationNotification(refundRequestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get refund request details
    const { data: refundRequest, error: refundError } = await supabase
      .from('RefundRequest')
      .select(`
        id,
        customer_id,
        order_id,
        refund_amount,
        order:Order(id, short_id),
        orderItem:OrderItem(
          id,
          product:Product(name)
        )
      `)
      .eq('id', refundRequestId)
      .single();

    if (refundError || !refundRequest) {
      throw new Error(`Refund request not found: ${refundError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([refundRequest.customer_id], []);
    const customerUserId = userIds[`customer_${refundRequest.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    const productName = refundRequest.orderItem?.product?.name || 'Unknown Product';
    const orderShortId = refundRequest.order?.short_id || refundRequest.order_id.substring(0, 8);

    return await createNotificationFromTemplate(
      'REFUND_REQUEST_SUBMITTED',
      customerUserId,
      { 
        orderId: orderShortId,
        productName,
        refundAmount: refundRequest.refund_amount
      },
      {
        orderId: refundRequest.order_id,
        returnId: refundRequest.return_id,
        referenceUrl: `/customer/refunds`
      }
    );

  } catch (error) {
    console.error('[Refund Notifications] Error sending refund request confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send refund request confirmation' 
    };
  }
}

/**
 * Send vendor action required notification for new refund request
 */
export async function sendVendorActionRequiredNotification(refundRequestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get refund request details
    const { data: refundRequest, error: refundError } = await supabase
      .from('RefundRequest')
      .select(`
        id,
        vendor_id,
        order_id,
        refund_amount,
        reason,
        order:Order(id, short_id),
        orderItem:OrderItem(
          id,
          product:Product(name)
        )
      `)
      .eq('id', refundRequestId)
      .single();

    if (refundError || !refundRequest) {
      throw new Error(`Refund request not found: ${refundError?.message}`);
    }

    // Get vendor user ID
    const userIds = await getUserIds([], [refundRequest.vendor_id]);
    const vendorUserId = userIds[`vendor_${refundRequest.vendor_id}`];

    if (!vendorUserId) {
      throw new Error('Vendor user ID not found');
    }

    const productName = refundRequest.orderItem?.product?.name || 'Unknown Product';
    const orderShortId = refundRequest.order?.short_id || refundRequest.order_id.substring(0, 8);

    return await createNotificationFromTemplate(
      'REFUND_VENDOR_ACTION_REQUIRED',
      vendorUserId,
      { 
        orderId: orderShortId,
        productName,
        refundAmount: refundRequest.refund_amount,
        reason: refundRequest.reason
      },
      {
        orderId: refundRequest.order_id,
        returnId: refundRequest.return_id,
        referenceUrl: `/vendor/refunds`
      }
    );

  } catch (error) {
    console.error('[Refund Notifications] Error sending vendor action required notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send vendor action required notification' 
    };
  }
}

/**
 * Send refund approval notification to customer
 */
export async function sendRefundApprovalNotification(refundRequestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get refund request details
    const { data: refundRequest, error: refundError } = await supabase
      .from('RefundRequest')
      .select(`
        id,
        customer_id,
        order_id,
        refund_amount,
        vendor_response,
        order:Order(id, short_id),
        orderItem:OrderItem(
          id,
          product:Product(name)
        )
      `)
      .eq('id', refundRequestId)
      .single();

    if (refundError || !refundRequest) {
      throw new Error(`Refund request not found: ${refundError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([refundRequest.customer_id], []);
    const customerUserId = userIds[`customer_${refundRequest.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    const productName = refundRequest.orderItem?.product?.name || 'Unknown Product';
    const orderShortId = refundRequest.order?.short_id || refundRequest.order_id.substring(0, 8);

    return await createNotificationFromTemplate(
      'REFUND_APPROVED',
      customerUserId,
      { 
        orderId: orderShortId,
        productName,
        refundAmount: refundRequest.refund_amount,
        vendorResponse: refundRequest.vendor_response
      },
      {
        orderId: refundRequest.order_id,
        returnId: refundRequest.return_id,
        referenceUrl: `/customer/refunds`
      }
    );

  } catch (error) {
    console.error('[Refund Notifications] Error sending refund approval notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send refund approval notification' 
    };
  }
}

/**
 * Send refund rejection notification to customer
 */
export async function sendRefundRejectionNotification(refundRequestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get refund request details
    const { data: refundRequest, error: refundError } = await supabase
      .from('RefundRequest')
      .select(`
        id,
        customer_id,
        order_id,
        vendor_response,
        order:Order(id, short_id),
        orderItem:OrderItem(
          id,
          product:Product(name)
        )
      `)
      .eq('id', refundRequestId)
      .single();

    if (refundError || !refundRequest) {
      throw new Error(`Refund request not found: ${refundError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([refundRequest.customer_id], []);
    const customerUserId = userIds[`customer_${refundRequest.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    const productName = refundRequest.orderItem?.product?.name || 'Unknown Product';
    const orderShortId = refundRequest.order?.short_id || refundRequest.order_id.substring(0, 8);

    return await createNotificationFromTemplate(
      'REFUND_REJECTED',
      customerUserId,
      { 
        orderId: orderShortId,
        productName,
        reason: refundRequest.vendor_response || 'No reason provided'
      },
      {
        orderId: refundRequest.order_id,
        returnId: refundRequest.return_id,
        referenceUrl: `/customer/refunds`
      }
    );

  } catch (error) {
    console.error('[Refund Notifications] Error sending refund rejection notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send refund rejection notification' 
    };
  }
}

/**
 * Send refund processing status update notification to customer
 */
export async function sendRefundProcessingNotification(refundRequestId: string, status: RefundRequestStatus): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get refund request details
    const { data: refundRequest, error: refundError } = await supabase
      .from('RefundRequest')
      .select(`
        id,
        customer_id,
        order_id,
        refund_amount,
        order:Order(id, short_id),
        orderItem:OrderItem(
          id,
          product:Product(name)
        )
      `)
      .eq('id', refundRequestId)
      .single();

    if (refundError || !refundRequest) {
      throw new Error(`Refund request not found: ${refundError?.message}`);
    }

    // Get customer user ID
    const userIds = await getUserIds([refundRequest.customer_id], []);
    const customerUserId = userIds[`customer_${refundRequest.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    const productName = refundRequest.orderItem?.product?.name || 'Unknown Product';
    const orderShortId = refundRequest.order?.short_id || refundRequest.order_id.substring(0, 8);

    // Determine template based on status
    let templateKey: string;
    switch (status) {
      case 'PROCESSING':
        templateKey = 'REFUND_PROCESSING';
        break;
      case 'COMPLETED':
        templateKey = 'REFUND_PROCESSED';
        break;
      default:
        templateKey = 'REFUND_STATUS_UPDATE';
    }

    return await createNotificationFromTemplate(
      templateKey,
      customerUserId,
      { 
        orderId: orderShortId,
        productName,
        refundAmount: refundRequest.refund_amount,
        status: status.toLowerCase()
      },
      {
        orderId: refundRequest.order_id,
        returnId: refundRequest.return_id,
        referenceUrl: `/customer/refunds`
      }
    );

  } catch (error) {
    console.error('[Refund Notifications] Error sending refund processing notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send refund processing notification' 
    };
  }
}

/**
 * Send refund pickup scheduled notification to customer and agent
 */
export async function sendRefundPickupScheduledNotification(refundRequestId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get refund request details
    const { data: refundRequest, error: refundError } = await supabase
      .from('RefundRequest')
      .select(`
        id,
        customer_id,
        order_id,
        return:Return(
          id,
          customer:Customer(
            id,
            user_id
          )
        ),
        order:Order(id, short_id),
        orderItem:OrderItem(
          id,
          product:Product(name)
        )
      `)
      .eq('id', refundRequestId)
      .single();

    if (refundError || !refundRequest) {
      throw new Error(`Refund request not found: ${refundError?.message}`);
    }

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('Agent')
      .select('id, user_id, name')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentError?.message}`);
    }

    const productName = refundRequest.orderItem?.product?.name || 'Unknown Product';
    const orderShortId = refundRequest.order?.short_id || refundRequest.order_id.substring(0, 8);

    // Get user IDs
    const userIds = await getUserIds([refundRequest.customer_id], []);
    const customerUserId = userIds[`customer_${refundRequest.customer_id}`];

    if (!customerUserId) {
      throw new Error('Customer user ID not found');
    }

    // Send notification to customer
    const customerNotification = await createNotificationFromTemplate(
      'REFUND_PICKUP_SCHEDULED',
      customerUserId,
      { 
        orderId: orderShortId,
        productName,
        agentName: agent.name
      },
      {
        orderId: refundRequest.order_id,
        returnId: refundRequest.return_id,
        referenceUrl: `/customer/refunds`
      }
    );

    // Send notification to agent
    const agentNotification = await createNotificationFromTemplate(
      'RETURN_PICKUP_ASSIGNMENT',
      agent.user_id,
      { 
        returnId: refundRequest.return_id || refundRequestId,
        orderId: orderShortId,
        productName
      },
      {
        orderId: refundRequest.order_id,
        returnId: refundRequest.return_id,
        referenceUrl: `/agent/orders`
      }
    );

    // Return success if at least one notification was sent
    return {
      success: customerNotification.success || agentNotification.success,
      error: !customerNotification.success && !agentNotification.success 
        ? 'Failed to send notifications to customer and agent'
        : undefined
    };

  } catch (error) {
    console.error('[Refund Notifications] Error sending refund pickup scheduled notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send refund pickup scheduled notification' 
    };
  }
}

/**
 * Send batch refund notifications for multiple refund requests
 */
export async function sendBatchRefundNotifications(
  refundRequestIds: string[],
  notificationType: 'request_submitted' | 'vendor_action_required' | 'approved' | 'rejected' | 'processing' | 'completed'
): Promise<{ success: boolean; error?: string; results: Array<{ refundRequestId: string; success: boolean; error?: string }> }> {
  const results: Array<{ refundRequestId: string; success: boolean; error?: string }> = [];
  let overallSuccess = true;

  for (const refundRequestId of refundRequestIds) {
    let result: { success: boolean; error?: string };

    switch (notificationType) {
      case 'request_submitted':
        result = await sendRefundRequestConfirmationNotification(refundRequestId);
        break;
      case 'vendor_action_required':
        result = await sendVendorActionRequiredNotification(refundRequestId);
        break;
      case 'approved':
        result = await sendRefundApprovalNotification(refundRequestId);
        break;
      case 'rejected':
        result = await sendRefundRejectionNotification(refundRequestId);
        break;
      case 'processing':
        result = await sendRefundProcessingNotification(refundRequestId, 'PROCESSING');
        break;
      case 'completed':
        result = await sendRefundProcessingNotification(refundRequestId, 'COMPLETED');
        break;
      default:
        result = { success: false, error: `Unsupported notification type: ${notificationType}` };
    }

    results.push({
      refundRequestId,
      success: result.success,
      error: result.error
    });

    if (!result.success) {
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    error: overallSuccess ? undefined : 'Some refund notifications failed to send',
    results
  };
}

/**
 * Comprehensive refund notification handler
 * This function handles all refund-related notifications based on the event type
 */
export async function handleRefundNotification(
  refundRequestId: string,
  eventType: 'request_submitted' | 'vendor_action_required' | 'approved' | 'rejected' | 'processing' | 'completed' | 'pickup_scheduled',
  additionalData?: {
    status?: RefundRequestStatus;
    agentId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Refund Notifications] Handling ${eventType} for refund request ${refundRequestId}`);

    switch (eventType) {
      case 'request_submitted':
        const submitResult = await sendRefundRequestConfirmationNotification(refundRequestId);
        const vendorResult = await sendVendorActionRequiredNotification(refundRequestId);
        return {
          success: submitResult.success || vendorResult.success,
          error: !submitResult.success && !vendorResult.success 
            ? 'Failed to send both customer and vendor notifications'
            : undefined
        };
      
      case 'vendor_action_required':
        return await sendVendorActionRequiredNotification(refundRequestId);
      
      case 'approved':
        return await sendRefundApprovalNotification(refundRequestId);
      
      case 'rejected':
        return await sendRefundRejectionNotification(refundRequestId);
      
      case 'processing':
        return await sendRefundProcessingNotification(refundRequestId, 'PROCESSING');
      
      case 'completed':
        return await sendRefundProcessingNotification(refundRequestId, 'COMPLETED');
      
      case 'pickup_scheduled':
        if (!additionalData?.agentId) {
          throw new Error('Agent ID is required for pickup_scheduled event');
        }
        return await sendRefundPickupScheduledNotification(refundRequestId, additionalData.agentId);
      
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

  } catch (error) {
    console.error('[Refund Notifications] Error handling refund notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle refund notification' 
    };
  }
}

/**
 * Integration helper to replace existing refund notification calls
 */
export async function notifyRefundStatusChange(refundRequestId: string, newStatus: RefundRequestStatus): Promise<void> {
  let eventType: 'approved' | 'rejected' | 'processing' | 'completed';
  
  switch (newStatus) {
    case 'APPROVED':
      eventType = 'approved';
      break;
    case 'REJECTED':
      eventType = 'rejected';
      break;
    case 'PROCESSING':
      eventType = 'processing';
      break;
    case 'COMPLETED':
      eventType = 'completed';
      break;
    default:
      console.log(`[Refund Notifications] No notification needed for status: ${newStatus}`);
      return;
  }

  const result = await handleRefundNotification(refundRequestId, eventType);
  if (!result.success) {
    console.error(`[Refund Notifications] Failed to send notification for status change: ${result.error}`);
  }
}
