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
  referenceUrl?: string | null; // URL to redirect user to when clicking the notification
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

// Only support IN_APP and SMS channels as specified (EMAIL available but not used in this project)
type SupportedNotificationChannel = 'IN_APP' | 'SMS';

// Notification template interface
interface NotificationTemplate {
  title: string;
  message: string;
  type: NotificationType;
  getSubstitutions?: (data: any) => Record<string, string>;
}

// Helper function to get Supabase client - with better error logging
const getSupabaseClient = () => {
  // Check if we're running on the server side
  if (typeof window !== 'undefined') {
    throw new Error("Notification service should only be used on the server side");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Log at the time of client creation attempt for debugging
  console.log('[Notification Service] Creating Supabase client on server side:');
  console.log('[Notification Service] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined');
  console.log('[Notification Service] SUPABASE_URL:', process.env.SUPABASE_URL ? 'defined' : 'undefined');
  console.log('[Notification Service] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'defined' : 'undefined');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[Notification Service] Supabase URL or Service Role Key is missing in environment variables");
    console.error("[Notification Service] Available env vars:", Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    throw new Error("Supabase environment variables missing for notification service");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
};

// Notification templates system
const notificationTemplates: Record<string, NotificationTemplate> = {
  // Order lifecycle templates
  ORDER_CONFIRMATION: {
    title: 'Order Confirmed',
    message: 'Your order #{orderId} has been confirmed and is being processed.',
    type: 'ORDER_STATUS_CHANGE',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  ORDER_PROCESSING: {
    title: 'Order Processing',
    message: 'Your order #{orderId} is now being prepared.',
    type: 'ORDER_STATUS_CHANGE',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  ORDER_READY_FOR_PICKUP: {
    title: 'Order Ready for Pickup',
    message: 'Your order #{orderId} is ready! Pickup code: {pickupCode}',
    type: 'PICKUP_READY',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      pickupCode: data.pickupCode || 'N/A'
    })
  },
  
  ORDER_PICKED_UP: {
    title: 'Order Picked Up',
    message: 'Your order #{orderId} has been successfully picked up.',
    type: 'ORDER_PICKED_UP',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  // Refund templates
  REFUND_REQUEST_SUBMITTED: {
    title: 'Refund Request Submitted',
    message: 'Your refund request for order #{orderId} has been submitted and is under review.',
    type: 'RETURN_REQUESTED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  REFUND_APPROVED: {
    title: 'Refund Approved',
    message: 'Your refund request for order #{orderId} has been approved. Processing will begin shortly.',
    type: 'RETURN_APPROVED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  REFUND_PROCESSED: {
    title: 'Refund Processed',
    message: 'Your refund for order #{orderId} has been processed successfully.',
    type: 'REFUND_PROCESSED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },

  REFUND_REJECTED: {
    title: 'Refund Request Rejected',
    message: 'Your refund request for {productName} from order #{orderId} has been rejected. Reason: {reason}',
    type: 'RETURN_REJECTED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      productName: data.productName || 'Unknown Product',
      reason: data.reason || 'No reason provided'
    })
  },

  REFUND_VENDOR_ACTION_REQUIRED: {
    title: 'Refund Request Requires Action',
    message: 'A refund request for {productName} (Order #{orderId}) requires your review. Amount: ₦{refundAmount}',
    type: 'RETURN_VENDOR_ACTION_REQUIRED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      productName: data.productName || 'Unknown Product',
      refundAmount: data.refundAmount?.toLocaleString() || '0'
    })
  },

  REFUND_PROCESSING: {
    title: 'Refund Being Processed',
    message: 'Your refund for {productName} from order #{orderId} is now being processed.',
    type: 'REFUND_PROCESSED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      productName: data.productName || 'Unknown Product'
    })
  },

  REFUND_STATUS_UPDATE: {
    title: 'Refund Status Update',
    message: 'Your refund for {productName} from order #{orderId} status has been updated to: {status}',
    type: 'REFUND_PROCESSED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      productName: data.productName || 'Unknown Product',
      status: data.status || 'Unknown'
    })
  },

  REFUND_PICKUP_SCHEDULED: {
    title: 'Refund Pickup Scheduled',
    message: 'Your refund pickup for {productName} from order #{orderId} has been scheduled. Agent {agentName} will collect the item.',
    type: 'RETURN_PICKUP_ASSIGNMENT',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      productName: data.productName || 'Unknown Product',
      agentName: data.agentName || 'Unknown Agent'
    })
  },
  
  // Vendor templates
  NEW_ORDER_VENDOR: {
    title: 'New Order Received',
    message: 'You have received a new order #{orderId}. Please prepare items for pickup.',
    type: 'NEW_ORDER_VENDOR',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },
  
  LOW_STOCK_ALERT: {
    title: 'Low Stock Alert',
    message: 'Your product "{productName}" is running low on stock (current: {currentStock}).',
    type: 'LOW_STOCK_ALERT',
    getSubstitutions: (data) => ({
      productName: data.productName || 'Unknown Product',
      currentStock: data.currentStock?.toString() || '0'
    })
  },
  
  PAYOUT_PROCESSED: {
    title: 'Payout Processed',
    message: 'Your payout of ₦{amount} has been processed successfully.',
    type: 'PAYOUT_PROCESSED',
    getSubstitutions: (data) => ({
      amount: data.amount?.toLocaleString() || '0'
    })
  },

  PAYOUT_FAILED: {
    title: 'Payout Failed',
    message: 'Your payout of ₦{amount} failed to process. Reason: {reason}',
    type: 'PAYOUT_PROCESSED', // Reusing existing type
    getSubstitutions: (data) => ({
      amount: data.amount?.toLocaleString() || '0',
      reason: data.reason || 'Processing error'
    })
  },

  PAYOUT_ON_HOLD: {
    title: 'Payout On Hold',
    message: 'Your payout of ₦{amount} has been placed on hold. Reason: {reason}',
    type: 'PAYOUT_ON_HOLD' as any,
    getSubstitutions: (data) => ({
      amount: data.amount?.toLocaleString() || '0',
      reason: data.reason || 'Administrative review'
    })
  },

  PAYOUT_HOLD_RELEASED: {
    title: 'Payout Hold Released',
    message: 'The hold on your payout of ₦{amount} has been released.',
    type: 'PAYOUT_HOLD_RELEASED' as any,
    getSubstitutions: (data) => ({
      amount: data.amount?.toLocaleString() || '0'
    })
  },

  MINIMUM_PAYOUT_REACHED: {
    title: 'Minimum Payout Threshold Reached',
    message: 'Your earnings of ₦{currentEarnings} have reached the minimum payout threshold of ₦{minimumThreshold}. You can now request a payout.',
    type: 'MINIMUM_PAYOUT_REACHED' as any,
    getSubstitutions: (data) => ({
      currentEarnings: data.currentEarnings?.toLocaleString() || '0',
      minimumThreshold: data.minimumThreshold?.toLocaleString() || '0'
    })
  },

  COMMISSION_RATE_CHANGED: {
    title: 'Commission Rate Updated',
    message: 'Your commission rate has been updated from {oldRate}% to {newRate}%.',
    type: 'COMMISSION_RATE_CHANGED' as any,
    getSubstitutions: (data) => ({
      oldRate: data.oldRate || '0',
      newRate: data.newRate || '0'
    })
  },

  PAYMENT_SUCCESS: {
    title: 'Payment Successful',
    message: 'Your payment of ₦{totalAmount} for order #{orderId} was processed successfully using {paymentMethod}.',
    type: 'ORDER_STATUS_CHANGE', // Reusing existing type
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      totalAmount: data.totalAmount?.toLocaleString() || '0',
      paymentMethod: data.paymentMethod || 'N/A'
    })
  },
  
  // Additional Order templates
  ORDER_SHIPPED: {
    title: 'Order Shipped',
    message: 'Your order #{orderId} has been shipped and is on its way.',
    type: 'ORDER_SHIPPED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },

  ORDER_DELIVERED: {
    title: 'Order Delivered',
    message: 'Your order #{orderId} has been delivered successfully.',
    type: 'ORDER_DELIVERED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },

  ORDER_CANCELLED: {
    title: 'Order Cancelled',
    message: 'Your order #{orderId} has been cancelled.',
    type: 'ORDER_STATUS_CHANGE',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },

  PAYMENT_FAILED: {
    title: 'Payment Failed',
    message: 'Payment for order #{orderId} failed. Reason: {reason}',
    type: 'PAYMENT_FAILED',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      reason: data.reason || 'Payment processing error'
    })
  },

  // Vendor Payment template
  PAYMENT_RECEIVED: {
    title: 'Payment Received',
    message: 'Payment received for order #{orderId}. Your earnings: ₦{amount}',
    type: 'PAYMENT_RECEIVED' as any,
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      amount: data.amount?.toLocaleString() || '0'
    })
  },
  
  // Agent templates
  NEW_PICKUP_ASSIGNMENT: {
    title: 'New Pickup Assignment',
    message: 'You have been assigned a new pickup for order #{orderId} at {pickupLocation}.',
    type: 'NEW_PICKUP_ASSIGNMENT',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      pickupLocation: data.pickupLocation || 'Location TBD'
    })
  },

  PICKUP_COMPLETED: {
    title: 'Pickup Completed',
    message: 'Pickup for order #{orderId} has been completed successfully.',
    type: 'NEW_PICKUP_ASSIGNMENT', // Reusing existing type
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },

  RETURN_PICKUP_ASSIGNMENT: {
    title: 'Return Pickup Assignment',
    message: 'You have been assigned to pickup return #{returnId} for order #{orderId}.',
    type: 'RETURN_PICKUP_ASSIGNMENT',
    getSubstitutions: (data) => ({
      returnId: data.returnId?.substring(0, 8) || 'N/A',
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },

  REFUND_PICKUP_REMINDER: {
    title: 'Refund Pickup Reminder',
    message: 'Reminder: Please pickup return #{returnId} for order #{orderId}.',
    type: 'RETURN_PICKUP_ASSIGNMENT', // Reusing existing type
    getSubstitutions: (data) => ({
      returnId: data.returnId?.substring(0, 8) || 'N/A',
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },

  AGENT_LOCATION_NAME_UPDATE: {
    title: 'Location Updated',
    message: 'Your service location has been updated to: {locationName}',
    type: 'AGENT_LOCATION_NAME_UPDATE' as any,
    getSubstitutions: (data) => ({
      locationName: data.locationName || 'Unknown Location'
    })
  },
  
  // Admin templates
  HIGH_VALUE_ORDER_ALERT: {
    title: 'High Value Order Alert',
    message: 'A high-value order #{orderId} (₦{amount}) has been placed.',
    type: 'HIGH_VALUE_ORDER_ALERT',
    getSubstitutions: (data) => ({
      orderId: data.orderId?.substring(0, 8) || 'N/A',
      amount: data.amount?.toLocaleString() || '0'
    })
  },

  NEW_VENDOR_APPLICATION: {
    title: 'New Vendor Application',
    message: '{applicantName} applied to become a vendor with store "{storeName}". Review required.',
    type: 'NEW_VENDOR_APPLICATION',
    getSubstitutions: (data) => ({
      applicantName: data.applicantName || 'Unknown User',
      storeName: data.storeName || 'Unknown Store'
    })
  },

  // Inventory Management Templates
  OUT_OF_STOCK_ALERT: {
    title: 'Product Out of Stock',
    message: 'Your product "{productName}" is out of stock and needs restocking.',
    type: 'LOW_STOCK_ALERT', // Reusing existing type
    getSubstitutions: (data) => ({
      productName: data.productName || 'Unknown Product'
    })
  },

  INVENTORY_UPDATE: {
    title: 'Inventory Updated',
    message: 'Your product "{productName}" has been restocked. New stock: {newStock}',
    type: 'LOW_STOCK_ALERT', // Reusing existing type
    getSubstitutions: (data) => ({
      productName: data.productName || 'Unknown Product',
      newStock: data.newStock?.toString() || '0'
    })
  },

  // Wishlist & Product Templates
  PRODUCT_BACK_IN_STOCK: {
    title: 'Product Back in Stock!',
    message: '"{productName}" from your wishlist is back in stock!',
    type: 'PRODUCT_BACK_IN_STOCK',
    getSubstitutions: (data) => ({
      productName: data.productName || 'Unknown Product'
    })
  },

  PRODUCT_PRICE_DROP: {
    title: 'Price Drop Alert!',
    message: '"{productName}" from your wishlist price dropped from ₦{oldPrice} to ₦{newPrice}!',
    type: 'PRODUCT_PRICE_DROP',
    getSubstitutions: (data) => ({
      productName: data.productName || 'Unknown Product',
      oldPrice: data.oldPrice?.toLocaleString() || '0',
      newPrice: data.newPrice?.toLocaleString() || '0'
    })
  },

  WISHLIST_REMINDER: {
    title: 'Your Wishlist Summary',
    message: 'You have {itemCount} items in your wishlist. Don\'t miss out on your favorites!',
    type: 'WISHLIST_REMINDER',
    getSubstitutions: (data) => ({
      itemCount: data.itemCount?.toString() || '0'
    })
  },

  // Coupon Lifecycle Templates
  COUPON_CREATED: {
    title: 'Coupon Created Successfully',
    message: 'Your coupon "{couponCode}" has been created! Offering {discountText}, expires {expiryDate}. Usage limit: {usageLimit}',
    type: 'COUPON_CREATED',
    getSubstitutions: (data) => ({
      couponCode: data.couponCode || 'Unknown Code',
      discountText: data.discountText || 'Unknown Discount',
      expiryDate: data.expiryDate || 'Never',
      usageLimit: data.usageLimit || 'Unlimited'
    })
  },

  COUPON_EXPIRED: {
    title: 'Coupon Expiring Soon',
    message: 'Your coupon "{couponCode}" expires in {daysUntilExpiry} day(s). Used {usageCount}/{usageLimit} times.',
    type: 'COUPON_EXPIRED',
    getSubstitutions: (data) => ({
      couponCode: data.couponCode || 'Unknown Code',
      daysUntilExpiry: data.daysUntilExpiry?.toString() || '0',
      usageCount: data.usageCount?.toString() || '0',
      usageLimit: data.usageLimit || 'Unlimited'
    })
  },

  COUPON_USAGE_THRESHOLD: {
    title: 'Coupon Usage Alert',
    message: 'Your coupon "{couponCode}" is {usagePercentage}% used ({usageCount}/{usageLimit}). {remainingUses} uses remaining.',
    type: 'COUPON_USAGE_THRESHOLD',
    getSubstitutions: (data) => ({
      couponCode: data.couponCode || 'Unknown Code',
      usagePercentage: data.usagePercentage?.toString() || '0',
      usageCount: data.usageCount?.toString() || '0',
      usageLimit: data.usageLimit?.toString() || 'Unlimited',
      remainingUses: data.remainingUses?.toString() || '0'
    })
  },

  COUPON_APPLIED: {
    title: 'Coupon Applied Successfully!',
    message: 'Coupon "{couponCode}" applied! You saved ₦{discountAmount} on your order.',
    type: 'COUPON_APPLIED',
    getSubstitutions: (data) => ({
      couponCode: data.couponCode || 'Unknown Code',
      discountAmount: data.discountAmount || '0',
      orderId: data.orderId?.substring(0, 8) || 'N/A'
    })
  },

  COUPON_FAILED: {
    title: 'Coupon Application Failed',
    message: 'Unable to apply coupon "{couponCode}". Reason: {reason}',
    type: 'COUPON_FAILED',
    getSubstitutions: (data) => ({
      couponCode: data.couponCode || 'Unknown Code',
      reason: data.reason || 'Invalid coupon'
    })
  },

  // Review System Templates
  NEW_PRODUCT_REVIEW: {
    title: 'New Review Received',
    message: '{customerName} left a {rating}-star review for "{productName}": {reviewComment}',
    type: 'NEW_PRODUCT_REVIEW',
    getSubstitutions: (data) => ({
      customerName: data.customerName || 'A customer',
      productName: data.productName || 'Unknown Product',
      rating: data.rating?.toString() || '0',
      ratingStars: data.ratingStars || '☆☆☆☆☆',
      reviewComment: data.reviewComment || 'No comment provided'
    })
  },

  REVIEW_RESPONSE: {
    title: 'Review Response Received',
    message: '{vendorName} responded to your {rating}-star review for "{productName}": {responseText}',
    type: 'REVIEW_RESPONSE',
    getSubstitutions: (data) => ({
      vendorName: data.vendorName || 'The vendor',
      productName: data.productName || 'Unknown Product',
      rating: data.rating?.toString() || '0',
      responseText: data.responseText || 'Thank you for your review'
    })
  },

  REVIEW_MILESTONE: {
    title: 'Review Milestone Achieved!',
    message: 'Congratulations! "{productName}" has reached {milestoneCount} reviews with an average rating of {averageRating} stars {ratingStars}',
    type: 'REVIEW_MILESTONE',
    getSubstitutions: (data) => ({
      productName: data.productName || 'Unknown Product',
      milestoneCount: data.milestoneCount?.toString() || '0',
      averageRating: data.averageRating || '0.0',
      ratingStars: data.ratingStars || '☆☆☆☆☆'
    })
  }
};

/**
 * Apply template substitutions to a string
 */
function applyTemplateSubstitutions(template: string, substitutions: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(substitutions)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Create notification from template
 */
export async function createNotificationFromTemplate(
  templateKey: string,
  userId: string,
  data: any,
  options?: {
    orderId?: string | null;
    returnId?: string | null;
    referenceUrl?: string | null;
  }
): Promise<{ success: boolean; notification?: any; error?: string }> {
  try {
    const template = notificationTemplates[templateKey];
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    const substitutions = template.getSubstitutions ? template.getSubstitutions(data) : {};
    
    const title = applyTemplateSubstitutions(template.title, substitutions);
    const message = applyTemplateSubstitutions(template.message, substitutions);

    return await createNotification({
      userId,
      title,
      message,
      type: template.type,
      orderId: options?.orderId,
      returnId: options?.returnId,
      referenceUrl: options?.referenceUrl
    });
  } catch (error) {
    console.error("[Notification Service] Error creating notification from template:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create notification from template" };
  }
}

/**
 * Create multiple notifications in batch
 */
export async function createBatchNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    orderId?: string | null;
    returnId?: string | null;
    referenceUrl?: string | null;
  }>
): Promise<{ success: boolean; created?: number; errors?: string[] }> {
  const supabase = getSupabaseClient();
  const errors: string[] = [];
  let created = 0;

  try {
    console.log(`[Notification Service] Creating batch of ${notifications.length} notifications`);
    
    // Map to database format
    const insertData = notifications.map(notification => ({
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      order_id: notification.orderId || null,
      return_id: notification.returnId || null,
      reference_url: notification.referenceUrl || null,
      is_read: false
    }));

    const { data, error } = await supabase
      .from('Notification')
      .insert(insertData)
      .select();

    if (error) {
      console.error("[Notification Service] Error creating batch notifications:", error.message);
      throw new Error(`Failed to create batch notifications: ${error.message}`);
    }

    created = data?.length || 0;
    console.log(`[Notification Service] Successfully created ${created} notifications`);

    return { success: true, created };
  } catch (error) {
    console.error("[Notification Service] Error in createBatchNotifications:", error);
    errors.push(error instanceof Error ? error.message : "Failed to create batch notifications");
    return { success: false, created, errors };
  }
}

/**
 * Create a new notification
 */
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string | null;
  returnId?: string | null;
  referenceUrl?: string | null;
}): Promise<{ success: boolean; notification?: any; error?: string }> {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Creating notification for user ID: ${data.userId}`);
    
    // Check user preference first
    const prefEnabled = await isPreferenceEnabled(data.userId, data.type, 'IN_APP');
    if (!prefEnabled) {
      console.log(`[Notification Service] Preference disabled for user ${data.userId} and type ${data.type}`);
      return { success: true }; // Not an error, just skip
    }
    
    // Map camelCase to snake_case for database fields
    const insertData = {
      user_id: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      order_id: data.orderId || null,
      return_id: data.returnId || null,
      reference_url: data.referenceUrl || null,
      is_read: false // Default to unread
    };

    const { data: notification, error } = await supabase
      .from('Notification')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("[Notification Service] Error creating notification:", error.message);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return { success: true, notification };
  } catch (error) {
    console.error("[Notification Service] Error in createNotification:", error);
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
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Getting notifications for user ID: ${userId}, options:`, options);
    
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
      console.error("[Notification Service] Error fetching user notifications:", fetchError.message);
      throw fetchError;
    }

    console.log(`[Notification Service] Found ${notifications?.length || 0} notifications for user ID: ${userId}`);
    
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
    console.error("[Notification Service] Error in getUserNotifications:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to get user notifications",
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
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Getting unread notification count for user ID: ${userId}`);
    
    const { count, error } = await supabase
      .from('Notification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error("[Notification Service] Error getting unread notification count:", error.message);
      throw error;
    }

    console.log(`[Notification Service] Found ${count || 0} unread notifications for user ID: ${userId}`);
    
    return { success: true, count };
  } catch (error) {
    console.error("[Notification Service] Error in getUnreadNotificationCount:", error);
    return { success: false, error: "Failed to get unread notification count" };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Marking notification as read: ${notificationId}`);
    
    const { data: notification, error } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error("[Notification Service] Error marking notification as read:", error.message);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return { success: true, notification };
  } catch (error) {
    console.error("[Notification Service] Error in markNotificationAsRead:", error);
    return { error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Marking all notifications as read for user ID: ${userId}`);
    
    const { error } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error("[Notification Service] Error marking all notifications as read:", error.message);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Notification Service] Error in markAllNotificationsAsRead:", error);
    return { error: "Failed to mark all notifications as read" };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const supabase = getSupabaseClient();
  try {
    console.log(`[Notification Service] Deleting notification: ${notificationId}`);
    
    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error("[Notification Service] Error deleting notification:", error.message);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Notification Service] Error in deleteNotification:", error);
    return { error: "Failed to delete notification" };
  }
}

/**
 * Helper to check if a notification preference is enabled (IN_APP or PUSH channels only)
 */
export async function isPreferenceEnabled(userId: string, type: NotificationType, channel: SupportedNotificationChannel = 'IN_APP'): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('NotificationPreference')
      .select('enabled')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('channel', channel)
      .single();
    if (error && error.code !== 'PGRST116') {
      // PGRST116 => no rows found
      console.error('[Notification Service] Error fetching preference:', error.message);
    }
    // If no row, default to enabled
    return data ? data.enabled : true;
  } catch (err) {
    console.error('[Notification Service] Preference check error', err);
    return true;
  }
}

/**
 * Get notification categories for filtering
 */
export function getNotificationCategories(): Array<{ value: NotificationType; label: string; description: string }> {
  return [
    { value: 'ORDER_STATUS_CHANGE', label: 'Order Updates', description: 'Order status changes and updates' },
    { value: 'PICKUP_READY', label: 'Pickup Ready', description: 'Order ready for pickup' },
    { value: 'ORDER_PICKED_UP', label: 'Order Picked Up', description: 'Order successfully picked up' },
    { value: 'RETURN_REQUESTED', label: 'Return Requests', description: 'Return and refund requests' },
    { value: 'RETURN_APPROVED', label: 'Return Approved', description: 'Return requests approved' },
    { value: 'RETURN_REJECTED', label: 'Return Rejected', description: 'Return requests rejected' },
    { value: 'REFUND_PROCESSED', label: 'Refund Processed', description: 'Refunds processed successfully' },
    { value: 'PAYMENT_FAILED', label: 'Payment Issues', description: 'Payment failures and issues' },
    { value: 'NEW_ORDER_VENDOR', label: 'New Orders', description: 'New orders received (vendors)' },
    { value: 'PAYOUT_PROCESSED', label: 'Payouts', description: 'Payout processing updates' },
    { value: 'LOW_STOCK_ALERT', label: 'Stock Alerts', description: 'Low stock and inventory alerts' },
    { value: 'NEW_PICKUP_ASSIGNMENT', label: 'Pickup Assignments', description: 'New pickup assignments (agents)' },
    { value: 'COUPON_CREATED', label: 'Coupon Created', description: 'Coupon creation confirmations' },
    { value: 'COUPON_EXPIRED', label: 'Coupon Expiry', description: 'Coupon expiration warnings' },
    { value: 'COUPON_USAGE_THRESHOLD', label: 'Coupon Usage', description: 'Coupon usage threshold alerts' },
    { value: 'COUPON_APPLIED', label: 'Coupon Applied', description: 'Successful coupon applications' },
    { value: 'COUPON_FAILED', label: 'Coupon Failed', description: 'Failed coupon application attempts' },
    { value: 'NEW_PRODUCT_REVIEW', label: 'New Reviews', description: 'New product reviews received (vendors)' },
    { value: 'REVIEW_RESPONSE', label: 'Review Responses', description: 'Responses to your reviews (customers)' },
    { value: 'REVIEW_MILESTONE', label: 'Review Milestones', description: 'Product review milestone achievements (vendors)' }
  ];
}

// Export legacy functions for backward compatibility
export {
  createNotification as createTypedNotification,
  createNotificationFromTemplate as createOrderStatusNotification,
  createNotificationFromTemplate as createReturnStatusNotification,
  createNotificationFromTemplate as createPickupStatusNotification
};
