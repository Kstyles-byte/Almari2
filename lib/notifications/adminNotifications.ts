import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';
import type { Database } from '../../types/supabase';

// Define types for admin notifications
interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  short_id: string;
  created_at: string;
}

interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  description?: string;
  bank_name?: string;
  account_number?: string;
  is_approved: boolean;
  created_at: string;
}

interface Customer {
  id: string;
  user_id: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
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
 * Get all admin user IDs from the system
 */
async function getAdminUserIds(): Promise<string[]> {
  const supabase = await createSupabaseClient();
  
  const { data: adminUsers } = await supabase
    .from('User')
    .select('id')
    .eq('role', 'ADMIN');
  
  return adminUsers?.map(user => user.id) || [];
}

/**
 * Send high-value order alert to all admins
 */
export async function sendHighValueOrderAlert(orderId: string, threshold: number = 100000): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customer_id, total_amount, short_id, created_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Check if order amount exceeds threshold
    if (Number(order.total_amount) < threshold) {
      console.log(`[Admin Notifications] Order ${order.short_id} amount (₦${order.total_amount}) below threshold (₦${threshold})`);
      return { success: true }; // Not an error, just below threshold
    }

    // Get customer details
    const { data: customer } = await supabase
      .from('Customer')
      .select(`
        id,
        user_id,
        user:User!inner(
          id,
          email,
          name
        )
      `)
      .eq('id', order.customer_id)
      .single();

    // Get all admin user IDs
    const adminUserIds = await getAdminUserIds();
    
    if (adminUserIds.length === 0) {
      console.log('[Admin Notifications] No admin users found');
      return { success: true }; // Not an error, just no admins to notify
    }

    const customerName = customer?.user?.name || customer?.user?.email || 'Unknown Customer';
    const orderShortId = order.short_id || order.id.substring(0, 8);

    // Create notifications for all admins
    const notifications = adminUserIds.map(adminUserId => ({
      userId: adminUserId,
      title: 'High Value Order Alert',
      message: `High-value order #${orderShortId} (₦${Number(order.total_amount).toLocaleString()}) placed by ${customerName}`,
      type: 'HIGH_VALUE_ORDER_ALERT' as const,
      orderId: order.id,
      referenceUrl: `/admin/orders?search=${orderShortId}`
    }));

    const result = await createBatchNotifications(notifications);
    
    if (!result.success) {
      throw new Error(result.errors?.join(', ') || 'Failed to create batch notifications');
    }

    console.log(`[Admin Notifications] High-value order alert sent for order ${orderShortId} to ${adminUserIds.length} admin(s)`);
    return { success: true };

  } catch (error) {
    console.error('[Admin Notifications] Error sending high-value order alert:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send high-value order alert' 
    };
  }
}

/**
 * Send new vendor application notification to all admins
 */
export async function sendNewVendorApplicationNotification(vendorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get vendor application details
    const { data: vendor, error: vendorError } = await supabase
      .from('Vendor')
      .select(`
        id,
        user_id,
        store_name,
        description,
        bank_name,
        account_number,
        is_approved,
        created_at,
        user:User!inner(
          id,
          email,
          name
        )
      `)
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      throw new Error(`Vendor not found: ${vendorError?.message}`);
    }

    // Only send notification for unapproved vendors (new applications)
    if (vendor.is_approved) {
      console.log(`[Admin Notifications] Vendor ${vendor.store_name} is already approved`);
      return { success: true }; // Not an error, already processed
    }

    // Get all admin user IDs
    const adminUserIds = await getAdminUserIds();
    
    if (adminUserIds.length === 0) {
      console.log('[Admin Notifications] No admin users found');
      return { success: true }; // Not an error, just no admins to notify
    }

    const applicantName = vendor.user?.name || vendor.user?.email || 'Unknown User';

    // Create notifications for all admins
    const notifications = adminUserIds.map(adminUserId => ({
      userId: adminUserId,
      title: 'New Vendor Application',
      message: `${applicantName} applied to become a vendor with store "${vendor.store_name}". Review required.`,
      type: 'NEW_VENDOR_APPLICATION' as const,
      referenceUrl: `/admin/vendors?filter=pending`
    }));

    const result = await createBatchNotifications(notifications);
    
    if (!result.success) {
      throw new Error(result.errors?.join(', ') || 'Failed to create batch notifications');
    }

    console.log(`[Admin Notifications] New vendor application notification sent for ${vendor.store_name} to ${adminUserIds.length} admin(s)`);
    return { success: true };

  } catch (error) {
    console.error('[Admin Notifications] Error sending new vendor application notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send new vendor application notification' 
    };
  }
}

/**
 * Send batch admin notifications for multiple high-value orders
 */
export async function sendBatchHighValueOrderAlerts(
  orderIds: string[],
  threshold: number = 100000
): Promise<{ success: boolean; error?: string; results: Array<{ orderId: string; success: boolean; error?: string }> }> {
  const results: Array<{ orderId: string; success: boolean; error?: string }> = [];
  let overallSuccess = true;

  for (const orderId of orderIds) {
    const result = await sendHighValueOrderAlert(orderId, threshold);
    
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
    error: overallSuccess ? undefined : 'Some high-value order alerts failed to send',
    results
  };
}

/**
 * Send batch new vendor application notifications
 */
export async function sendBatchNewVendorApplicationNotifications(
  vendorIds: string[]
): Promise<{ success: boolean; error?: string; results: Array<{ vendorId: string; success: boolean; error?: string }> }> {
  const results: Array<{ vendorId: string; success: boolean; error?: string }> = [];
  let overallSuccess = true;

  for (const vendorId of vendorIds) {
    const result = await sendNewVendorApplicationNotification(vendorId);
    
    results.push({
      vendorId,
      success: result.success,
      error: result.error
    });

    if (!result.success) {
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    error: overallSuccess ? undefined : 'Some vendor application notifications failed to send',
    results
  };
}

/**
 * Comprehensive admin notification handler
 * This function handles all admin-related notifications based on the event type
 */
export async function handleAdminNotification(
  eventType: 'high_value_order' | 'new_vendor_application',
  entityId: string,
  additionalData?: {
    threshold?: number; // For high-value orders
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Admin Notifications] Handling ${eventType} for entity ${entityId}`);

    switch (eventType) {
      case 'high_value_order':
        return await sendHighValueOrderAlert(entityId, additionalData?.threshold);
      
      case 'new_vendor_application':
        return await sendNewVendorApplicationNotification(entityId);
      
      default:
        throw new Error(`Unsupported admin notification event type: ${eventType}`);
    }

  } catch (error) {
    console.error('[Admin Notifications] Error handling admin notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle admin notification' 
    };
  }
}

/**
 * Integration helper for high-value order detection
 */
export async function notifyHighValueOrder(orderId: string, threshold: number = 100000): Promise<void> {
  const result = await handleAdminNotification('high_value_order', orderId, { threshold });
  
  if (!result.success) {
    console.error(`[Admin Notifications] Failed to send high-value order notification: ${result.error}`);
    // Don't throw error to avoid blocking the main order process
  }
}

/**
 * Integration helper for new vendor applications
 */
export async function notifyNewVendorApplication(vendorId: string): Promise<void> {
  const result = await handleAdminNotification('new_vendor_application', vendorId);
  
  if (!result.success) {
    console.error(`[Admin Notifications] Failed to send vendor application notification: ${result.error}`);
    // Don't throw error to avoid blocking the main vendor application process
  }
}
