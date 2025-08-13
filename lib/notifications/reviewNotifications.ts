import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';

// Define types for review notifications
interface Review {
  id: string;
  customer_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  order_id: string | null;
}

interface Product {
  id: string;
  vendor_id: string;
  name: string;
  slug: string;
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

interface ReviewResponse {
  id: string;
  review_id: string;
  vendor_id: string;
  response_text: string;
  created_at: string;
}

// Configurable thresholds for review milestones
const REVIEW_MILESTONES = {
  MILESTONE_COUNTS: [5, 10, 25, 50, 100, 250, 500], // Review count milestones
  REMINDER_DAYS_AFTER_DELIVERY: 7, // Days to wait after delivery before sending review request
  HIGH_RATING_THRESHOLD: 4, // 4+ stars considered high rating
  LOW_RATING_THRESHOLD: 2, // 2 or below considered low rating
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
 * Get user IDs for customers, vendors, and admins
 */
async function getUserIds(
  customerIds: string[] = [],
  vendorIds: string[] = [],
  adminIds: string[] = []
): Promise<Record<string, string>> {
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

  // Get admin user IDs
  if (adminIds.length > 0) {
    const { data: admins } = await supabase
      .from('User')
      .select('id')
      .in('id', adminIds)
      .eq('role', 'ADMIN');
      
    admins?.forEach(admin => {
      userIds[`admin_${admin.id}`] = admin.id;
    });
  }

  return userIds;
}

/**
 * Send new review notification to vendor
 */
export async function sendNewReviewNotification(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get review details with product and customer information
    const { data: review } = await supabase
      .from('Review')
      .select(`
        *,
        Product:product_id (
          id, vendor_id, name, slug
        ),
        Customer:customer_id (
          User:user_id (name)
        )
      `)
      .eq('id', reviewId)
      .single();
      
    if (!review) {
      throw new Error('Review not found');
    }

    const product = (review as any).Product;
    const customer = (review as any).Customer;
    
    if (!product?.vendor_id) {
      throw new Error('Product vendor not found');
    }

    // Get vendor user ID
    const userIds = await getUserIds([], [product.vendor_id], []);
    const vendorUserId = userIds[`vendor_${product.vendor_id}`];

    if (!vendorUserId) {
      throw new Error('Vendor user not found');
    }

    const customerName = customer?.User?.name || 'A customer';
    const ratingStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    const result = await createNotificationFromTemplate(
      'NEW_PRODUCT_REVIEW',
      vendorUserId,
      {
        productName: product.name,
        customerName,
        rating: review.rating,
        ratingStars,
        reviewComment: review.comment ? `"${review.comment.substring(0, 100)}${review.comment.length > 100 ? '...' : ''}"` : 'No comment provided'
      },
      {
        referenceUrl: `/vendor/reviews?product=${product.slug}`
      }
    );

    console.log(`[Review Notifications] New review notification sent for product ${product.name}, rating: ${review.rating} stars`);
    return result;
  } catch (error) {
    console.error('[Review Notifications] Error sending new review notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send new review notification' 
    };
  }
}

/**
 * Send review response notification to customer
 */
export async function sendReviewResponseNotification(
  reviewId: string,
  responseText: string,
  vendorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get review details
    const { data: review } = await supabase
      .from('Review')
      .select(`
        *,
        Product:product_id (name, slug),
        Customer:customer_id (user_id)
      `)
      .eq('id', reviewId)
      .single();
      
    if (!review) {
      throw new Error('Review not found');
    }

    const customer = (review as any).Customer;
    const product = (review as any).Product;
    
    if (!customer?.user_id) {
      throw new Error('Customer user not found');
    }

    // Get vendor store name
    const { data: vendor } = await supabase
      .from('Vendor')
      .select('store_name')
      .eq('id', vendorId)
      .single();

    const vendorName = vendor?.store_name || 'The vendor';
    const truncatedResponse = responseText.length > 150 
      ? `${responseText.substring(0, 150)}...`
      : responseText;

    const result = await createNotificationFromTemplate(
      'REVIEW_RESPONSE',
      customer.user_id,
      {
        productName: product?.name || 'Unknown Product',
        vendorName,
        responseText: truncatedResponse,
        rating: review.rating
      },
      {
        referenceUrl: `/product/${product?.slug}#reviews`
      }
    );

    console.log(`[Review Notifications] Review response notification sent to customer for product ${product?.name}`);
    return result;
  } catch (error) {
    console.error('[Review Notifications] Error sending review response notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send review response notification' 
    };
  }
}

/**
 * Send review milestone achievement notification to vendor
 */
export async function sendReviewMilestoneNotification(
  productId: string,
  milestoneCount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get product details
    const { data: product } = await supabase
      .from('Product')
      .select('id, vendor_id, name, slug')
      .eq('id', productId)
      .single();
      
    if (!product) {
      throw new Error('Product not found');
    }

    // Get vendor user ID
    const userIds = await getUserIds([], [product.vendor_id], []);
    const vendorUserId = userIds[`vendor_${product.vendor_id}`];

    if (!vendorUserId) {
      throw new Error('Vendor user not found');
    }

    // Calculate average rating for the milestone message
    const { data: reviews } = await supabase
      .from('Review')
      .select('rating')
      .eq('product_id', productId);

    const avgRating = reviews && reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

    const result = await createNotificationFromTemplate(
      'REVIEW_MILESTONE',
      vendorUserId,
      {
        productName: product.name,
        milestoneCount: milestoneCount.toString(),
        averageRating: avgRating,
        ratingStars: '★'.repeat(Math.floor(parseFloat(avgRating))) + '☆'.repeat(5 - Math.floor(parseFloat(avgRating)))
      },
      {
        referenceUrl: `/vendor/reviews?product=${product.slug}`
      }
    );

    console.log(`[Review Notifications] Milestone notification sent for product ${product.name}, ${milestoneCount} reviews milestone reached`);
    return result;
  } catch (error) {
    console.error('[Review Notifications] Error sending review milestone notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send review milestone notification' 
    };
  }
}

/**
 * Send review request reminder to customers who have received their orders
 */
export async function sendReviewRequestReminders(): Promise<{ success: boolean; remindersSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Calculate the date for review requests (orders delivered X days ago)
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() - REVIEW_MILESTONES.REMINDER_DAYS_AFTER_DELIVERY);
    
    // Get delivered orders that don't have reviews yet
    const { data: eligibleOrders } = await supabase
      .from('Order')
      .select(`
        id,
        customer_id,
        OrderItem:id (
          id,
          product_id,
          Product:product_id (
            id, name, slug
          )
        )
      `)
      .eq('status', 'DELIVERED')
      .lte('updated_at', reminderDate.toISOString());

    if (!eligibleOrders || eligibleOrders.length === 0) {
      console.log('[Review Notifications] No eligible orders found for review reminders');
      return { success: true, remindersSent: 0 };
    }

    // Get customer user IDs
    const customerIds = [...new Set(eligibleOrders.map(order => order.customer_id))];
    const userIds = await getUserIds(customerIds, [], []);

    let remindersSent = 0;
    const notifications = [];

    for (const order of eligibleOrders) {
      const customerUserId = userIds[`customer_${order.customer_id}`];
      if (!customerUserId) continue;

      const orderItems = (order as any).OrderItem || [];
      
      for (const item of orderItems) {
        const product = item.Product;
        if (!product) continue;

        // Check if customer has already reviewed this product
        const { data: existingReview } = await supabase
          .from('Review')
          .select('id')
          .eq('customer_id', order.customer_id)
          .eq('product_id', product.id)
          .single();

        if (existingReview) continue; // Already reviewed

        notifications.push({
          userId: customerUserId,
          title: 'How was your purchase?',
          message: `We'd love to hear about your experience with "${product.name}". Your review helps other customers!`,
          type: 'REVIEW_RESPONSE' as const, // Reusing existing type
          referenceUrl: `/product/${product.slug}#review-form`
        });
      }
    }

    if (notifications.length > 0) {
      const result = await createBatchNotifications(notifications);
      remindersSent = result.created || 0;
      console.log(`[Review Notifications] Sent ${remindersSent} review request reminders`);
    }

    return { success: true, remindersSent };
  } catch (error) {
    console.error('[Review Notifications] Error sending review request reminders:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send review request reminders' };
  }
}

/**
 * Check and send review milestone notifications
 */
export async function checkAndSendReviewMilestones(): Promise<{ success: boolean; milestonesSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get review counts for all products
    const { data: reviewCounts } = await supabase
      .from('Review')
      .select('product_id')
      .order('product_id');

    if (!reviewCounts || reviewCounts.length === 0) {
      console.log('[Review Notifications] No reviews found for milestone checking');
      return { success: true, milestonesSent: 0 };
    }

    // Count reviews per product
    const productReviewCounts: Record<string, number> = {};
    reviewCounts.forEach(review => {
      productReviewCounts[review.product_id] = (productReviewCounts[review.product_id] || 0) + 1;
    });

    let milestonesSent = 0;

    for (const [productId, count] of Object.entries(productReviewCounts)) {
      // Check if this count is a milestone
      if (REVIEW_MILESTONES.MILESTONE_COUNTS.includes(count)) {
        const result = await sendReviewMilestoneNotification(productId, count);
        if (result.success) milestonesSent++;
      }
    }

    console.log(`[Review Notifications] Sent ${milestonesSent} milestone notifications`);
    return { success: true, milestonesSent };
  } catch (error) {
    console.error('[Review Notifications] Error checking review milestones:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check review milestones' };
  }
}

/**
 * Send review moderation notification to admin
 */
export async function sendReviewModerationNotification(
  reviewId: string,
  moderationType: 'flagged' | 'reported' | 'inappropriate'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get review details
    const { data: review } = await supabase
      .from('Review')
      .select(`
        *,
        Product:product_id (name, slug),
        Customer:customer_id (
          User:user_id (name)
        )
      `)
      .eq('id', reviewId)
      .single();
      
    if (!review) {
      throw new Error('Review not found');
    }

    const product = (review as any).Product;
    const customer = (review as any).Customer;

    // Get admin user IDs
    const { data: admins } = await supabase
      .from('User')
      .select('id')
      .eq('role', 'ADMIN');

    if (!admins || admins.length === 0) {
      throw new Error('No admin users found');
    }

    const adminIds = admins.map(admin => admin.id);
    const userIds = await getUserIds([], [], adminIds);

    const notifications = adminIds.map(adminId => ({
      userId: userIds[`admin_${adminId}`] || adminId,
      title: `Review ${moderationType.charAt(0).toUpperCase() + moderationType.slice(1)}`,
      message: `A review for "${product?.name || 'Unknown Product'}" by ${customer?.User?.name || 'Unknown Customer'} has been ${moderationType} and requires moderation.`,
      type: 'NEW_PRODUCT_REVIEW' as const, // Reusing existing type for admin notifications
      referenceUrl: `/admin/reviews/moderate/${reviewId}`
    }));

    const result = await createBatchNotifications(notifications);
    console.log(`[Review Notifications] Sent ${result.created || 0} moderation notifications for ${moderationType} review`);
    
    return { success: result.success };
  } catch (error) {
    console.error('[Review Notifications] Error sending review moderation notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send review moderation notification' 
    };
  }
}

/**
 * Handle review creation and send appropriate notifications
 */
export async function handleNewReviewNotification(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Review Notifications] Handling new review notification for review ${reviewId}`);

    const result = await sendNewReviewNotification(reviewId);
    
    if (result.success) {
      // Check for milestones after new review
      await checkAndSendReviewMilestones();
    }

    return result;
  } catch (error) {
    console.error('[Review Notifications] Error handling new review notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle new review notification' 
    };
  }
}

/**
 * Comprehensive review notification handler
 */
export async function handleReviewNotification(
  eventType: 'new_review' | 'review_response' | 'milestone_reached' | 'moderation_required',
  data: {
    reviewId?: string;
    productId?: string;
    responseText?: string;
    vendorId?: string;
    milestoneCount?: number;
    moderationType?: 'flagged' | 'reported' | 'inappropriate';
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Review Notifications] Handling ${eventType}`, data);

    switch (eventType) {
      case 'new_review':
        if (!data.reviewId) {
          throw new Error('Review ID is required for new_review event');
        }
        return await handleNewReviewNotification(data.reviewId);
      
      case 'review_response':
        if (!data.reviewId || !data.responseText || !data.vendorId) {
          throw new Error('Review ID, response text, and vendor ID are required for review_response event');
        }
        return await sendReviewResponseNotification(data.reviewId, data.responseText, data.vendorId);
      
      case 'milestone_reached':
        if (!data.productId || !data.milestoneCount) {
          throw new Error('Product ID and milestone count are required for milestone_reached event');
        }
        return await sendReviewMilestoneNotification(data.productId, data.milestoneCount);
      
      case 'moderation_required':
        if (!data.reviewId || !data.moderationType) {
          throw new Error('Review ID and moderation type are required for moderation_required event');
        }
        return await sendReviewModerationNotification(data.reviewId, data.moderationType);
      
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

  } catch (error) {
    console.error('[Review Notifications] Error handling review notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle review notification' 
    };
  }
}

/**
 * Run comprehensive review checks (for cron jobs)
 */
export async function runReviewNotificationChecks(): Promise<{ success: boolean; totalNotifications?: number; error?: string }> {
  try {
    console.log('[Review Notifications] Starting comprehensive review notification checks');
    
    const [reminderResult, milestoneResult] = await Promise.all([
      sendReviewRequestReminders(),
      checkAndSendReviewMilestones()
    ]);

    const totalNotifications = (reminderResult.remindersSent || 0) + (milestoneResult.milestonesSent || 0);

    console.log(`[Review Notifications] Review notification checks completed. Total notifications sent: ${totalNotifications}`);
    
    return { 
      success: reminderResult.success && milestoneResult.success, 
      totalNotifications 
    };
  } catch (error) {
    console.error('[Review Notifications] Error in comprehensive review notification checks:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to run review notification checks' };
  }
}

// Export review thresholds for configuration
export { REVIEW_MILESTONES };
