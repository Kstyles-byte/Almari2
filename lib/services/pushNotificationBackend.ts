import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

type NotificationType = Database['public']['Enums']['NotificationType'];

interface PushSubscriptionData {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidEmail = process.env.VAPID_EMAIL || 'noreply@almari.store';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('[PushNotificationBackend] VAPID keys not configured');
} else {
  webpush.setVapidDetails(
    `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('[PushNotificationBackend] VAPID keys configured successfully');
}

// Helper function to get Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase environment variables missing for push notification backend");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
};

/**
 * Get all active push subscriptions for a user
 */
async function getUserPushSubscriptions(userId: string): Promise<PushSubscriptionData[]> {
  try {
    const supabase = getSupabaseClient();
    
    const { data: subscriptions, error } = await supabase
      .from('PushSubscription')
      .select('endpoint, p256dh_key, auth_key')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('[PushNotificationBackend] Error fetching subscriptions:', error.message);
      return [];
    }

    return (subscriptions as PushSubscriptionData[]) || [];
  } catch (error) {
    console.error('[PushNotificationBackend] Error in getUserPushSubscriptions:', error);
    return [];
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: {
      notificationId?: string;
      type?: NotificationType;
      url?: string;
      orderId?: string;
      returnId?: string;
    };
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
    requireInteraction?: boolean;
  }
): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[PushNotificationBackend] VAPID keys not configured');
      return { success: false, error: 'VAPID keys not configured' };
    }

    console.log(`[PushNotificationBackend] Sending push notification to user: ${userId}`);
    
    // Get user's push subscriptions
    const subscriptions = await getUserPushSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log(`[PushNotificationBackend] No active push subscriptions found for user: ${userId}`);
      return { success: true, sent: 0 };
    }

    // Prepare push payload
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/notification-icon.png',
      badge: payload.badge || '/icons/notification-badge.png',
      tag: payload.tag || 'almari-notification',
      data: payload.data || {},
      actions: payload.actions || [
        { action: 'view', title: 'View', icon: '/icons/view-icon.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: payload.requireInteraction || false,
      timestamp: Date.now()
    });

    let sentCount = 0;
    const failedSubscriptions: string[] = [];

    // Send to all user's subscriptions
    for (const subscription of subscriptions) {
      try {
        // Fix FCM endpoint format if needed
        let correctedEndpoint = subscription.endpoint;
        
        // Transform old FCM format to new format
        if (correctedEndpoint.includes('fcm.googleapis.com/fcm/send/')) {
          correctedEndpoint = correctedEndpoint.replace(
            'https://fcm.googleapis.com/fcm/send/',
            'https://fcm.googleapis.com/wp/'
          );
          console.log(`[PushNotificationBackend] Converted FCM endpoint format from /fcm/send/ to /wp/`);
        }
        
        // Reconstruct the push subscription object in the correct format for webpush
        const pushSubscription = {
          endpoint: correctedEndpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        };

        console.log(`[PushNotificationBackend] Attempting to send to endpoint: ${correctedEndpoint.substring(0, 50)}...`);
        console.log(`[PushNotificationBackend] P256DH key length: ${subscription.p256dh_key.length}`);
        console.log(`[PushNotificationBackend] Auth key length: ${subscription.auth_key.length}`);

        await webpush.sendNotification(pushSubscription, pushPayload);
        sentCount++;
        console.log(`[PushNotificationBackend] Push notification sent successfully to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
        
        // Update last_used_at
        await updateSubscriptionLastUsed(userId, subscription.endpoint);
        
      } catch (error) {
        console.error(`[PushNotificationBackend] Failed to send to endpoint ${subscription.endpoint.substring(0, 50)}...:`, error);
        failedSubscriptions.push(subscription.endpoint);
        
        // Handle different error types
        if (error instanceof Error) {
          // If subscription is invalid (410 Gone or 404 Not Found), mark as inactive
          if (error.message.includes('410') || error.message.includes('404')) {
            console.log(`[PushNotificationBackend] Marking subscription as inactive due to ${error.message.includes('410') ? '410 Gone' : '404 Not Found'} error`);
            await deactivateSubscription(userId, subscription.endpoint);
          }
          
          // Log additional context for FCM-specific errors
          if (error.message.includes('Received unexpected response code')) {
            console.error(`[PushNotificationBackend] FCM Error Details:`, {
              originalEndpoint: subscription.endpoint,
              correctedEndpoint: subscription.endpoint,
              errorMessage: error.message
            });
          }
        }
      }
    }

    console.log(`[PushNotificationBackend] Push notification summary - Sent: ${sentCount}, Failed: ${failedSubscriptions.length}`);
    
    return { 
      success: sentCount > 0 || failedSubscriptions.length === 0, 
      sent: sentCount,
      error: failedSubscriptions.length > 0 ? `Failed to send to ${failedSubscriptions.length} subscriptions` : undefined
    };
    
  } catch (error) {
    console.error('[PushNotificationBackend] Error in sendPushNotification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send push notification' 
    };
  }
}

/**
 * Update subscription last used timestamp
 */
async function updateSubscriptionLastUsed(userId: string, endpoint: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    await supabase
      .from('PushSubscription')
      .update({ last_used_at: new Date().toISOString() } as any)
      .eq('user_id', userId)
      .eq('endpoint', endpoint);
      
  } catch (error) {
    console.error('[PushNotificationBackend] Error updating subscription last used:', error);
  }
}

/**
 * Deactivate invalid subscription
 */
async function deactivateSubscription(userId: string, endpoint: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    await supabase
      .from('PushSubscription')
      .update({ is_active: false } as any)
      .eq('user_id', userId)
      .eq('endpoint', endpoint);
      
    console.log(`[PushNotificationBackend] Deactivated invalid subscription for user: ${userId}`);
  } catch (error) {
    console.error('[PushNotificationBackend] Error deactivating subscription:', error);
  }
}

/**
 * Save push subscription to database
 */
export async function savePushSubscription(
  userId: string, 
  subscription: PushSubscription,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    
    const subscriptionData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh_key: Buffer.from(subscription.getKey('p256dh')!).toString('base64'),
      auth_key: Buffer.from(subscription.getKey('auth')!).toString('base64'),
      user_agent: userAgent || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      is_active: true
    };

    // Upsert subscription (update if exists, insert if new)
    const { error } = await supabase
      .from('PushSubscription')
      .upsert(subscriptionData as any, {
        onConflict: 'user_id,endpoint',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('[PushNotificationBackend] Error saving subscription:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[PushNotificationBackend] Subscription saved for user: ${userId}`);
    return { success: true };
    
  } catch (error) {
    console.error('[PushNotificationBackend] Error in savePushSubscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save subscription' 
    };
  }
}

/**
 * Remove push subscription from database
 */
export async function removePushSubscription(
  userId: string, 
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('PushSubscription')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[PushNotificationBackend] Error removing subscription:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[PushNotificationBackend] Subscription removed for user: ${userId}`);
    return { success: true };
    
  } catch (error) {
    console.error('[PushNotificationBackend] Error in removePushSubscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove subscription' 
    };
  }
}

/**
 * Send push notification based on notification type with appropriate formatting
 */
export async function sendTypedPushNotification(
  userId: string,
  notificationData: {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    orderId?: string | null;
    returnId?: string | null;
    referenceUrl?: string | null;
  }
): Promise<{ success: boolean; sent?: number; error?: string }> {
  
  // Customize payload based on notification type
  let actions: Array<{ action: string; title: string; icon?: string }> = [];
  let requireInteraction = false;
  let icon = '/icons/notification-icon.png';
  
  switch (notificationData.type) {
    case 'ORDER_STATUS_CHANGE':
      icon = '/icons/order-icon.png';
      actions = [
        { action: 'view_order', title: 'View Order', icon: '/icons/view-icon.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
      break;
      
    case 'PICKUP_READY':
      icon = '/icons/pickup-icon.png';
      actions = [
        { action: 'view_pickup', title: 'View Details', icon: '/icons/view-icon.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
      requireInteraction = true;
      break;
      
    case 'NEW_ORDER_VENDOR':
      icon = '/icons/vendor-icon.png';
      actions = [
        { action: 'view_vendor_orders', title: 'View Orders', icon: '/icons/view-icon.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
      requireInteraction = true;
      break;
      
    case 'REFUND_PROCESSED':
      icon = '/icons/refund-icon.png';
      actions = [
        { action: 'view_refunds', title: 'View Refunds', icon: '/icons/view-icon.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
      break;
      
    default:
      actions = [
        { action: 'view', title: 'View', icon: '/icons/view-icon.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
      break;
  }

  return await sendPushNotification(userId, {
    title: notificationData.title,
    body: notificationData.message,
    icon,
    badge: '/icons/notification-badge.png',
    tag: `notification-${notificationData.id}`,
    data: {
      notificationId: notificationData.id,
      type: notificationData.type,
      url: notificationData.referenceUrl || '/notifications',
      orderId: notificationData.orderId || undefined,
      returnId: notificationData.returnId || undefined
    },
    actions,
    requireInteraction
  });
}

export default {
  sendPushNotification,
  sendTypedPushNotification,
  savePushSubscription,
  removePushSubscription
};
