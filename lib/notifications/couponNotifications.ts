import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';

// Define types for coupon notifications
interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  expiry_date: string | null;
  is_active: boolean;
  usage_count: number;
  usage_limit: number | null;
  vendor_id: string | null;
  min_purchase_amount: number | null;
  created_at: string;
  updated_at: string;
}

interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
}

interface Customer {
  id: string;
  user_id: string;
}

interface CouponApplication {
  couponId: string;
  couponCode: string;
  customerId?: string;
  orderId?: string;
  discountAmount: number;
  success: boolean;
  reason?: string;
}

// Configurable thresholds
const COUPON_THRESHOLDS = {
  USAGE_WARNING_PERCENTAGE: 80, // Send warning when 80% of usage limit is reached
  EXPIRY_WARNING_DAYS: 3, // Send expiry warning 3 days before expiration
  LOW_USAGE_DAYS: 7, // Alert if coupon has low usage after 7 days
  MIN_USAGE_FOR_ALERT: 5 // Minimum usage count to consider for alerts
};

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
 * Get vendor user ID from vendor record
 */
async function getVendorUserId(vendorId: string): Promise<string | null> {
  const supabase = await createSupabaseClient();
  
  const { data: vendor } = await supabase
    .from('Vendor')
    .select('user_id')
    .eq('id', vendorId)
    .single();
    
  return vendor?.user_id || null;
}

/**
 * Get customer user ID from customer record
 */
async function getCustomerUserId(customerId: string): Promise<string | null> {
  const supabase = await createSupabaseClient();
  
  const { data: customer } = await supabase
    .from('Customer')
    .select('user_id')
    .eq('id', customerId)
    .single();
    
  return customer?.user_id || null;
}

/**
 * Get vendor user IDs for multiple vendors
 */
async function getVendorUserIds(vendorIds: string[]): Promise<Record<string, string>> {
  const supabase = await createSupabaseClient();
  const userIds: Record<string, string> = {};

  if (vendorIds.length === 0) return userIds;

  const { data: vendors } = await supabase
    .from('Vendor')
    .select('id, user_id')
    .in('id', vendorIds);
    
  vendors?.forEach(vendor => {
    userIds[vendor.id] = vendor.user_id;
  });

  return userIds;
}

/**
 * Send coupon creation confirmation notification to vendor
 */
export async function sendCouponCreatedNotification(
  couponId: string,
  vendorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get coupon details
    const { data: coupon } = await supabase
      .from('Coupon')
      .select('code, description, discount_type, discount_value, expiry_date, usage_limit')
      .eq('id', couponId)
      .single();
      
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Get vendor user ID
    const vendorUserId = await getVendorUserId(vendorId);
    if (!vendorUserId) {
      throw new Error('Vendor user not found');
    }

    const discountText = coupon.discount_type === 'PERCENTAGE' 
      ? `${coupon.discount_value}% off`
      : `₦${coupon.discount_value.toLocaleString()} off`;

    const result = await createNotificationFromTemplate(
      'COUPON_CREATED',
      vendorUserId,
      {
        couponCode: coupon.code,
        discountText,
        expiryDate: coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'No expiry',
        usageLimit: coupon.usage_limit?.toLocaleString() || 'Unlimited'
      },
      {
        referenceUrl: `/vendor/coupons`
      }
    );

    console.log(`[Coupon Notifications] Created notification sent for coupon ${coupon.code}`);
    return result;
  } catch (error) {
    console.error('[Coupon Notifications] Error sending coupon created notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send coupon created notification' };
  }
}

/**
 * Send coupon expiry warning notification
 */
export async function sendCouponExpiryWarning(
  couponId: string,
  vendorId: string,
  daysUntilExpiry: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get coupon details
    const { data: coupon } = await supabase
      .from('Coupon')
      .select('code, expiry_date, usage_count, usage_limit')
      .eq('id', couponId)
      .single();
      
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Get vendor user ID
    const vendorUserId = await getVendorUserId(vendorId);
    if (!vendorUserId) {
      throw new Error('Vendor user not found');
    }

    const result = await createNotificationFromTemplate(
      'COUPON_EXPIRED',
      vendorUserId,
      {
        couponCode: coupon.code,
        daysUntilExpiry,
        usageCount: coupon.usage_count,
        usageLimit: coupon.usage_limit?.toLocaleString() || 'Unlimited'
      },
      {
        referenceUrl: `/vendor/coupons`
      }
    );

    console.log(`[Coupon Notifications] Expiry warning sent for coupon ${coupon.code}, ${daysUntilExpiry} days until expiry`);
    return result;
  } catch (error) {
    console.error('[Coupon Notifications] Error sending coupon expiry warning:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send coupon expiry warning' };
  }
}

/**
 * Send coupon usage threshold alert
 */
export async function sendCouponUsageThresholdAlert(
  couponId: string,
  vendorId: string,
  usagePercentage: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get coupon details
    const { data: coupon } = await supabase
      .from('Coupon')
      .select('code, usage_count, usage_limit')
      .eq('id', couponId)
      .single();
      
    if (!coupon || !coupon.usage_limit) {
      throw new Error('Coupon not found or has no usage limit');
    }

    // Get vendor user ID
    const vendorUserId = await getVendorUserId(vendorId);
    if (!vendorUserId) {
      throw new Error('Vendor user not found');
    }

    const remainingUses = coupon.usage_limit - coupon.usage_count;

    const result = await createNotificationFromTemplate(
      'COUPON_USAGE_THRESHOLD',
      vendorUserId,
      {
        couponCode: coupon.code,
        usagePercentage: Math.round(usagePercentage),
        usageCount: coupon.usage_count,
        usageLimit: coupon.usage_limit,
        remainingUses
      },
      {
        referenceUrl: `/vendor/coupons`
      }
    );

    console.log(`[Coupon Notifications] Usage threshold alert sent for coupon ${coupon.code}, ${usagePercentage}% used`);
    return result;
  } catch (error) {
    console.error('[Coupon Notifications] Error sending coupon usage threshold alert:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send coupon usage threshold alert' };
  }
}

/**
 * Send coupon application success notification to customer
 */
export async function sendCouponAppliedNotification(
  application: CouponApplication,
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get customer user ID
    const customerUserId = await getCustomerUserId(customerId);
    if (!customerUserId) {
      throw new Error('Customer user not found');
    }

    const result = await createNotificationFromTemplate(
      'COUPON_APPLIED',
      customerUserId,
      {
        couponCode: application.couponCode,
        discountAmount: application.discountAmount.toLocaleString(),
        orderId: application.orderId?.substring(0, 8) || 'N/A'
      },
      {
        orderId: application.orderId,
        referenceUrl: application.orderId ? `/customer/orders/${application.orderId}` : '/cart'
      }
    );

    console.log(`[Coupon Notifications] Applied notification sent for coupon ${application.couponCode}, discount: ₦${application.discountAmount}`);
    return result;
  } catch (error) {
    console.error('[Coupon Notifications] Error sending coupon applied notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send coupon applied notification' };
  }
}

/**
 * Send coupon application failure notification to customer
 */
export async function sendCouponFailedNotification(
  application: CouponApplication,
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get customer user ID
    const customerUserId = await getCustomerUserId(customerId);
    if (!customerUserId) {
      throw new Error('Customer user not found');
    }

    const result = await createNotificationFromTemplate(
      'COUPON_FAILED',
      customerUserId,
      {
        couponCode: application.couponCode,
        reason: application.reason || 'Invalid coupon'
      },
      {
        referenceUrl: '/cart'
      }
    );

    console.log(`[Coupon Notifications] Failed notification sent for coupon ${application.couponCode}, reason: ${application.reason}`);
    return result;
  } catch (error) {
    console.error('[Coupon Notifications] Error sending coupon failed notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send coupon failed notification' };
  }
}

/**
 * Check and send expiry warnings for coupons expiring soon
 */
export async function checkAndSendExpiryWarnings(): Promise<{ success: boolean; warningsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Calculate the date threshold for expiry warnings
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + COUPON_THRESHOLDS.EXPIRY_WARNING_DAYS);
    
    // Get active coupons expiring within the warning period
    const { data: expiringCoupons } = await supabase
      .from('Coupon')
      .select('id, code, vendor_id, expiry_date, usage_count, usage_limit')
      .eq('is_active', true)
      .not('vendor_id', 'is', null)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', warningDate.toISOString())
      .gte('expiry_date', new Date().toISOString());

    if (!expiringCoupons || expiringCoupons.length === 0) {
      console.log('[Coupon Notifications] No coupons expiring soon found');
      return { success: true, warningsSent: 0 };
    }

    // Get vendor user IDs
    const vendorIds = [...new Set(expiringCoupons.map(c => c.vendor_id).filter(Boolean))];
    const vendorUserIds = await getVendorUserIds(vendorIds as string[]);

    // Create notifications for each expiring coupon
    const notifications = expiringCoupons.map(coupon => {
      const daysUntilExpiry = Math.ceil(
        (new Date(coupon.expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        userId: vendorUserIds[coupon.vendor_id!],
        title: 'Coupon Expiring Soon',
        message: `Your coupon "${coupon.code}" expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. Used ${coupon.usage_count} times.`,
        type: 'COUPON_EXPIRED' as const,
        referenceUrl: `/vendor/coupons`
      };
    }).filter(notification => notification.userId);

    if (notifications.length > 0) {
      const result = await createBatchNotifications(notifications);
      console.log(`[Coupon Notifications] Sent ${result.created || 0} expiry warnings`);
      return { success: result.success, warningsSent: result.created };
    }

    return { success: true, warningsSent: 0 };
  } catch (error) {
    console.error('[Coupon Notifications] Error checking expiry warnings:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check expiry warnings' };
  }
}

/**
 * Check and send usage threshold alerts for coupons nearing their limit
 */
export async function checkAndSendUsageThresholdAlerts(): Promise<{ success: boolean; alertsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get active coupons with usage limits
    const { data: couponsWithLimits } = await supabase
      .from('Coupon')
      .select('id, code, vendor_id, usage_count, usage_limit')
      .eq('is_active', true)
      .not('vendor_id', 'is', null)
      .not('usage_limit', 'is', null)
      .gt('usage_limit', 0);

    if (!couponsWithLimits || couponsWithLimits.length === 0) {
      console.log('[Coupon Notifications] No coupons with usage limits found');
      return { success: true, alertsSent: 0 };
    }

    // Filter coupons that have reached the usage threshold
    const couponsNearLimit = couponsWithLimits.filter(coupon => {
      const usagePercentage = (coupon.usage_count / coupon.usage_limit!) * 100;
      return usagePercentage >= COUPON_THRESHOLDS.USAGE_WARNING_PERCENTAGE && usagePercentage < 100;
    });

    if (couponsNearLimit.length === 0) {
      console.log('[Coupon Notifications] No coupons near usage limit found');
      return { success: true, alertsSent: 0 };
    }

    // Get vendor user IDs
    const vendorIds = [...new Set(couponsNearLimit.map(c => c.vendor_id).filter(Boolean))];
    const vendorUserIds = await getVendorUserIds(vendorIds as string[]);

    // Create notifications for each coupon near limit
    const notifications = couponsNearLimit.map(coupon => {
      const usagePercentage = Math.round((coupon.usage_count / coupon.usage_limit!) * 100);
      const remainingUses = coupon.usage_limit! - coupon.usage_count;

      return {
        userId: vendorUserIds[coupon.vendor_id!],
        title: 'Coupon Usage Alert',
        message: `Your coupon "${coupon.code}" is ${usagePercentage}% used (${coupon.usage_count}/${coupon.usage_limit}). ${remainingUses} uses remaining.`,
        type: 'COUPON_USAGE_THRESHOLD' as const,
        referenceUrl: `/vendor/coupons`
      };
    }).filter(notification => notification.userId);

    if (notifications.length > 0) {
      const result = await createBatchNotifications(notifications);
      console.log(`[Coupon Notifications] Sent ${result.created || 0} usage threshold alerts`);
      return { success: result.success, alertsSent: result.created };
    }

    return { success: true, alertsSent: 0 };
  } catch (error) {
    console.error('[Coupon Notifications] Error checking usage threshold alerts:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check usage threshold alerts' };
  }
}

/**
 * Handle coupon application notification (success or failure)
 */
export async function handleCouponApplicationNotification(
  application: CouponApplication,
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Coupon Notifications] Handling coupon application: ${application.couponCode}, success: ${application.success}`);

    if (application.success) {
      return await sendCouponAppliedNotification(application, customerId);
    } else {
      return await sendCouponFailedNotification(application, customerId);
    }
  } catch (error) {
    console.error('[Coupon Notifications] Error handling coupon application notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle coupon application notification' 
    };
  }
}

/**
 * Monitor coupon usage and send threshold alerts
 */
export async function handleCouponUsageUpdate(
  couponId: string,
  oldUsageCount: number,
  newUsageCount: number
): Promise<{ success: boolean; notificationsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get coupon details
    const { data: coupon } = await supabase
      .from('Coupon')
      .select('vendor_id, code, usage_limit, is_active')
      .eq('id', couponId)
      .single();
      
    if (!coupon || !coupon.is_active || !coupon.usage_limit || !coupon.vendor_id) {
      return { success: true, notificationsSent: 0 };
    }

    let notificationsSent = 0;

    // Check if coupon crossed the usage threshold
    const oldUsagePercentage = (oldUsageCount / coupon.usage_limit) * 100;
    const newUsagePercentage = (newUsageCount / coupon.usage_limit) * 100;

    if (oldUsagePercentage < COUPON_THRESHOLDS.USAGE_WARNING_PERCENTAGE && 
        newUsagePercentage >= COUPON_THRESHOLDS.USAGE_WARNING_PERCENTAGE) {
      const result = await sendCouponUsageThresholdAlert(couponId, coupon.vendor_id, newUsagePercentage);
      if (result.success) notificationsSent++;
    }

    console.log(`[Coupon Notifications] Processed usage update for coupon ${coupon.code}: ${oldUsageCount} -> ${newUsageCount}, sent ${notificationsSent} notifications`);
    return { success: true, notificationsSent };
  } catch (error) {
    console.error('[Coupon Notifications] Error handling coupon usage update:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to handle coupon usage update' };
  }
}

/**
 * Run comprehensive coupon check (for cron jobs)
 */
export async function runCouponCheck(): Promise<{ success: boolean; totalAlerts?: number; error?: string }> {
  try {
    console.log('[Coupon Notifications] Starting comprehensive coupon check');
    
    const [expiryResult, usageResult] = await Promise.all([
      checkAndSendExpiryWarnings(),
      checkAndSendUsageThresholdAlerts()
    ]);

    const totalAlerts = (expiryResult.warningsSent || 0) + (usageResult.alertsSent || 0);

    console.log(`[Coupon Notifications] Coupon check completed. Total alerts sent: ${totalAlerts}`);
    
    return { 
      success: expiryResult.success && usageResult.success, 
      totalAlerts 
    };
  } catch (error) {
    console.error('[Coupon Notifications] Error in comprehensive coupon check:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to run coupon check' };
  }
}

// Export coupon thresholds for configuration
export { COUPON_THRESHOLDS };
