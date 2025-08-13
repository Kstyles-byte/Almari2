import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';

// Define types for payout notifications
type PayoutStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
type PayoutHoldStatus = 'ACTIVE' | 'RELEASED' | 'EXPIRED';

interface Payout {
  id: string;
  vendor_id: string;
  amount: number;
  status: PayoutStatus;
  reference_id: string | null;
  transaction_date: string | null;
  notes: string | null;
  request_amount: number | null;
  approved_amount: number | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  bank_details: any | null;
  created_at: string;
  updated_at: string;
}

interface PayoutHold {
  id: string;
  vendor_id: string;
  payout_id: string | null;
  hold_amount: number;
  reason: string;
  refund_request_ids: string[] | null;
  status: PayoutHoldStatus;
  created_at: string | null;
  released_at: string | null;
  created_by: string | null;
}

interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  commission_rate: number;
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
 * Send payout processed notification to vendor
 */
export async function sendPayoutProcessedNotification(payoutId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get payout details
    const { data: payout, error: payoutError } = await supabase
      .from('Payout')
      .select(`
        id,
        vendor_id,
        amount,
        status,
        reference_id,
        transaction_date,
        vendor:Vendor(
          id,
          user_id,
          store_name
        )
      `)
      .eq('id', payoutId)
      .single();

    if (payoutError || !payout) {
      throw new Error(`Payout not found: ${payoutError?.message}`);
    }

    const vendorUserId = payout.vendor?.user_id;
    if (!vendorUserId) {
      throw new Error('Vendor user ID not found');
    }

    return await createNotificationFromTemplate(
      'PAYOUT_PROCESSED',
      vendorUserId,
      { 
        amount: payout.amount,
        referenceId: payout.reference_id || 'N/A',
        transactionDate: payout.transaction_date
      },
      {
        referenceUrl: `/vendor/payouts`
      }
    );

  } catch (error) {
    console.error('[Payout Notifications] Error sending payout processed notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payout processed notification' 
    };
  }
}

/**
 * Send payout failed notification to vendor
 */
export async function sendPayoutFailedNotification(payoutId: string, failureReason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get payout details
    const { data: payout, error: payoutError } = await supabase
      .from('Payout')
      .select(`
        id,
        vendor_id,
        amount,
        rejection_reason,
        vendor:Vendor(
          id,
          user_id,
          store_name
        )
      `)
      .eq('id', payoutId)
      .single();

    if (payoutError || !payout) {
      throw new Error(`Payout not found: ${payoutError?.message}`);
    }

    const vendorUserId = payout.vendor?.user_id;
    if (!vendorUserId) {
      throw new Error('Vendor user ID not found');
    }

    return await createNotificationFromTemplate(
      'PAYOUT_FAILED',
      vendorUserId,
      { 
        amount: payout.amount,
        reason: failureReason || payout.rejection_reason || 'Processing error'
      },
      {
        referenceUrl: `/vendor/payouts`
      }
    );

  } catch (error) {
    console.error('[Payout Notifications] Error sending payout failed notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payout failed notification' 
    };
  }
}

/**
 * Send payout hold notification to vendor
 */
export async function sendPayoutHoldNotification(payoutHoldId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get payout hold details
    const { data: payoutHold, error: holdError } = await supabase
      .from('PayoutHold')
      .select(`
        id,
        vendor_id,
        hold_amount,
        reason,
        status,
        vendor:Vendor(
          id,
          user_id,
          store_name
        )
      `)
      .eq('id', payoutHoldId)
      .single();

    if (holdError || !payoutHold) {
      throw new Error(`Payout hold not found: ${holdError?.message}`);
    }

    const vendorUserId = payoutHold.vendor?.user_id;
    if (!vendorUserId) {
      throw new Error('Vendor user ID not found');
    }

    return await createNotificationFromTemplate(
      'PAYOUT_ON_HOLD',
      vendorUserId,
      { 
        amount: payoutHold.hold_amount,
        reason: payoutHold.reason
      },
      {
        referenceUrl: `/vendor/payouts`
      }
    );

  } catch (error) {
    console.error('[Payout Notifications] Error sending payout hold notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payout hold notification' 
    };
  }
}

/**
 * Send payout hold released notification to vendor
 */
export async function sendPayoutHoldReleasedNotification(payoutHoldId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get payout hold details
    const { data: payoutHold, error: holdError } = await supabase
      .from('PayoutHold')
      .select(`
        id,
        vendor_id,
        hold_amount,
        reason,
        released_at,
        vendor:Vendor(
          id,
          user_id,
          store_name
        )
      `)
      .eq('id', payoutHoldId)
      .single();

    if (holdError || !payoutHold) {
      throw new Error(`Payout hold not found: ${holdError?.message}`);
    }

    const vendorUserId = payoutHold.vendor?.user_id;
    if (!vendorUserId) {
      throw new Error('Vendor user ID not found');
    }

    return await createNotificationFromTemplate(
      'PAYOUT_HOLD_RELEASED',
      vendorUserId,
      { 
        amount: payoutHold.hold_amount,
        releasedDate: payoutHold.released_at
      },
      {
        referenceUrl: `/vendor/payouts`
      }
    );

  } catch (error) {
    console.error('[Payout Notifications] Error sending payout hold released notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payout hold released notification' 
    };
  }
}

/**
 * Send minimum payout threshold reached notification to vendor
 */
export async function sendMinimumPayoutReachedNotification(vendorId: string, currentEarnings: number, minimumThreshold: number): Promise<{ success: boolean; error?: string }> {
  try {
    const vendorUserId = await getVendorUserId(vendorId);
    if (!vendorUserId) {
      throw new Error('Vendor user ID not found');
    }

    return await createNotificationFromTemplate(
      'MINIMUM_PAYOUT_REACHED',
      vendorUserId,
      { 
        currentEarnings,
        minimumThreshold
      },
      {
        referenceUrl: `/vendor/payouts`
      }
    );

  } catch (error) {
    console.error('[Payout Notifications] Error sending minimum payout reached notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send minimum payout reached notification' 
    };
  }
}

/**
 * Send commission rate change notification to vendor
 */
export async function sendCommissionRateChangeNotification(vendorId: string, oldRate: number, newRate: number): Promise<{ success: boolean; error?: string }> {
  try {
    const vendorUserId = await getVendorUserId(vendorId);
    if (!vendorUserId) {
      throw new Error('Vendor user ID not found');
    }

    return await createNotificationFromTemplate(
      'COMMISSION_RATE_CHANGED',
      vendorUserId,
      { 
        oldRate: (oldRate * 100).toFixed(1),
        newRate: (newRate * 100).toFixed(1)
      },
      {
        referenceUrl: `/vendor/settings`
      }
    );

  } catch (error) {
    console.error('[Payout Notifications] Error sending commission rate change notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send commission rate change notification' 
    };
  }
}

/**
 * Send batch payout notifications for multiple payouts
 */
export async function sendBatchPayoutNotifications(
  payoutIds: string[],
  notificationType: 'processed' | 'failed' | 'hold_created' | 'hold_released'
): Promise<{ success: boolean; error?: string; results: Array<{ payoutId: string; success: boolean; error?: string }> }> {
  const results: Array<{ payoutId: string; success: boolean; error?: string }> = [];
  let overallSuccess = true;

  for (const payoutId of payoutIds) {
    let result: { success: boolean; error?: string };

    switch (notificationType) {
      case 'processed':
        result = await sendPayoutProcessedNotification(payoutId);
        break;
      case 'failed':
        result = await sendPayoutFailedNotification(payoutId);
        break;
      default:
        result = { success: false, error: `Unsupported notification type: ${notificationType}` };
    }

    results.push({
      payoutId,
      success: result.success,
      error: result.error
    });

    if (!result.success) {
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    error: overallSuccess ? undefined : 'Some payout notifications failed to send',
    results
  };
}

/**
 * Comprehensive payout notification handler
 * This function handles all payout-related notifications based on the event type
 */
export async function handlePayoutNotification(
  payoutId: string,
  eventType: 'processed' | 'failed' | 'hold_created' | 'hold_released' | 'minimum_reached' | 'commission_changed',
  additionalData?: {
    failureReason?: string;
    payoutHoldId?: string;
    vendorId?: string;
    currentEarnings?: number;
    minimumThreshold?: number;
    oldCommissionRate?: number;
    newCommissionRate?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Payout Notifications] Handling ${eventType} for payout ${payoutId}`);

    switch (eventType) {
      case 'processed':
        return await sendPayoutProcessedNotification(payoutId);
      
      case 'failed':
        return await sendPayoutFailedNotification(payoutId, additionalData?.failureReason);
      
      case 'hold_created':
        if (!additionalData?.payoutHoldId) {
          throw new Error('Payout hold ID is required for hold_created event');
        }
        return await sendPayoutHoldNotification(additionalData.payoutHoldId);
      
      case 'hold_released':
        if (!additionalData?.payoutHoldId) {
          throw new Error('Payout hold ID is required for hold_released event');
        }
        return await sendPayoutHoldReleasedNotification(additionalData.payoutHoldId);
      
      case 'minimum_reached':
        if (!additionalData?.vendorId || !additionalData?.currentEarnings || !additionalData?.minimumThreshold) {
          throw new Error('Vendor ID, current earnings, and minimum threshold are required for minimum_reached event');
        }
        return await sendMinimumPayoutReachedNotification(
          additionalData.vendorId, 
          additionalData.currentEarnings, 
          additionalData.minimumThreshold
        );
      
      case 'commission_changed':
        if (!additionalData?.vendorId || additionalData?.oldCommissionRate === undefined || additionalData?.newCommissionRate === undefined) {
          throw new Error('Vendor ID, old rate, and new rate are required for commission_changed event');
        }
        return await sendCommissionRateChangeNotification(
          additionalData.vendorId, 
          additionalData.oldCommissionRate, 
          additionalData.newCommissionRate
        );
      
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

  } catch (error) {
    console.error('[Payout Notifications] Error handling payout notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle payout notification' 
    };
  }
}

/**
 * Integration helper to replace existing payout notification calls
 */
export async function notifyPayoutStatusChange(payoutId: string, newStatus: PayoutStatus, failureReason?: string): Promise<void> {
  let eventType: 'processed' | 'failed' | null = null;
  
  if (newStatus === 'COMPLETED') {
    eventType = 'processed';
  } else if (newStatus === 'FAILED') {
    eventType = 'failed';
  }

  if (!eventType) {
    console.log(`[Payout Notifications] No notification needed for status: ${newStatus}`);
    return;
  }

  const result = await handlePayoutNotification(payoutId, eventType, { failureReason });
  if (!result.success) {
    console.error(`[Payout Notifications] Failed to send notification for status change: ${result.error}`);
  }
}

/**
 * Integration helper for payout hold notifications
 */
export async function notifyPayoutHoldStatusChange(payoutHoldId: string, holdStatus: PayoutHoldStatus): Promise<void> {
  let eventType: 'hold_created' | 'hold_released' | null = null;
  
  if (holdStatus === 'ACTIVE') {
    eventType = 'hold_created';
  } else if (holdStatus === 'RELEASED') {
    eventType = 'hold_released';
  }

  if (!eventType) {
    console.log(`[Payout Notifications] No notification needed for hold status: ${holdStatus}`);
    return;
  }

  const result = await handlePayoutNotification('', eventType, { payoutHoldId });
  if (!result.success) {
    console.error(`[Payout Notifications] Failed to send hold notification: ${result.error}`);
  }
}
