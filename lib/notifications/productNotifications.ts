import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';

// Define types for product notifications
interface Product {
  id: string;
  vendor_id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  inventory: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  created_at: string;
  Product?: Product;
}

interface Wishlist {
  id: string;
  customer_id: string;
  Customer?: {
    user_id: string;
  };
}

interface Customer {
  id: string;
  user_id: string;
}

interface PriceTracker {
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  customerUserId: string;
}

// Configuration for price drop notifications
const PRICE_DROP_CONFIG = {
  MINIMUM_PERCENTAGE_DROP: 10, // Minimum 10% price drop to trigger notification
  MINIMUM_AMOUNT_DROP: 1000, // Minimum ₦1000 drop to trigger notification
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
 * Get customer user IDs for multiple customers
 */
async function getCustomerUserIds(customerIds: string[]): Promise<Record<string, string>> {
  const supabase = await createSupabaseClient();
  const userIds: Record<string, string> = {};

  if (customerIds.length === 0) return userIds;

  const { data: customers } = await supabase
    .from('Customer')
    .select('id, user_id')
    .in('id', customerIds);
    
  customers?.forEach(customer => {
    userIds[customer.id] = customer.user_id;
  });

  return userIds;
}

/**
 * Get all customers who have a specific product in their wishlist
 */
async function getCustomersWithProductInWishlist(productId: string): Promise<Array<{ customerId: string; userId: string }>> {
  const supabase = await createSupabaseClient();
  
  const { data: wishlistItems } = await supabase
    .from('WishlistItem')
    .select(`
      wishlist_id,
      Wishlist!inner (
        customer_id,
        Customer!inner (
          user_id
        )
      )
    `)
    .eq('product_id', productId);

  if (!wishlistItems) return [];

  return wishlistItems.map(item => ({
    customerId: (item.Wishlist as any).customer_id,
    userId: (item.Wishlist as any).Customer.user_id
  }));
}

/**
 * Send back in stock notification to customers who have the product in their wishlist
 */
export async function sendBackInStockNotification(
  productId: string
): Promise<{ success: boolean; notificationsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get product details
    const { data: product } = await supabase
      .from('Product')
      .select('name, inventory, is_published')
      .eq('id', productId)
      .single();
      
    if (!product || !product.is_published || product.inventory <= 0) {
      return { success: true, notificationsSent: 0 };
    }

    // Get customers who have this product in their wishlist
    const customersWithProduct = await getCustomersWithProductInWishlist(productId);
    
    if (customersWithProduct.length === 0) {
      console.log(`[Product Notifications] No customers have product ${productId} in wishlist`);
      return { success: true, notificationsSent: 0 };
    }

    // Create notifications for each customer
    const notifications = customersWithProduct.map(customer => ({
      userId: customer.userId,
      title: 'Product Back in Stock!',
      message: `"${product.name}" from your wishlist is back in stock!`,
      type: 'PRODUCT_BACK_IN_STOCK' as const,
      referenceUrl: `/products/${productId}`
    }));

    const result = await createBatchNotifications(notifications);
    console.log(`[Product Notifications] Sent ${result.created || 0} back in stock notifications for product ${productId}`);
    
    return { success: result.success, notificationsSent: result.created };
  } catch (error) {
    console.error('[Product Notifications] Error sending back in stock notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send back in stock notification' };
  }
}

/**
 * Send price drop notification to customers who have the product in their wishlist
 */
export async function sendPriceDropNotification(
  productId: string,
  oldPrice: number,
  newPrice: number
): Promise<{ success: boolean; notificationsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Check if the price drop is significant enough
    const priceDropAmount = oldPrice - newPrice;
    const priceDropPercentage = (priceDropAmount / oldPrice) * 100;
    
    if (priceDropAmount < PRICE_DROP_CONFIG.MINIMUM_AMOUNT_DROP && 
        priceDropPercentage < PRICE_DROP_CONFIG.MINIMUM_PERCENTAGE_DROP) {
      console.log(`[Product Notifications] Price drop not significant enough for product ${productId}`);
      return { success: true, notificationsSent: 0 };
    }

    // Get product details
    const { data: product } = await supabase
      .from('Product')
      .select('name, is_published')
      .eq('id', productId)
      .single();
      
    if (!product || !product.is_published) {
      return { success: true, notificationsSent: 0 };
    }

    // Get customers who have this product in their wishlist
    const customersWithProduct = await getCustomersWithProductInWishlist(productId);
    
    if (customersWithProduct.length === 0) {
      console.log(`[Product Notifications] No customers have product ${productId} in wishlist`);
      return { success: true, notificationsSent: 0 };
    }

    // Create notifications for each customer
    const notifications = customersWithProduct.map(customer => ({
      userId: customer.userId,
      title: 'Price Drop Alert!',
      message: `"${product.name}" from your wishlist price dropped from ₦${oldPrice.toLocaleString()} to ₦${newPrice.toLocaleString()}!`,
      type: 'PRODUCT_PRICE_DROP' as const,
      referenceUrl: `/products/${productId}`
    }));

    const result = await createBatchNotifications(notifications);
    console.log(`[Product Notifications] Sent ${result.created || 0} price drop notifications for product ${productId}`);
    
    return { success: result.success, notificationsSent: result.created };
  } catch (error) {
    console.error('[Product Notifications] Error sending price drop notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send price drop notification' };
  }
}

/**
 * Send weekly wishlist reminder to a customer
 */
export async function sendWishlistReminder(
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get customer user ID
    const customerUserId = await getCustomerUserId(customerId);
    if (!customerUserId) {
      throw new Error('Customer user not found');
    }

    // Get wishlist item count
    const { data: wishlist } = await supabase
      .from('Wishlist')
      .select(`
        id,
        WishlistItem (count)
      `)
      .eq('customer_id', customerId)
      .single();

    if (!wishlist || !wishlist.WishlistItem) {
      console.log(`[Product Notifications] No wishlist found for customer ${customerId}`);
      return { success: true };
    }

    const itemCount = (wishlist.WishlistItem as any).length || 0;
    
    if (itemCount === 0) {
      console.log(`[Product Notifications] Wishlist is empty for customer ${customerId}`);
      return { success: true };
    }

    const result = await createNotificationFromTemplate(
      'WISHLIST_REMINDER',
      customerUserId,
      {
        itemCount
      },
      {
        referenceUrl: '/wishlist'
      }
    );

    console.log(`[Product Notifications] Sent wishlist reminder to customer ${customerId}, items: ${itemCount}`);
    return result;
  } catch (error) {
    console.error('[Product Notifications] Error sending wishlist reminder:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send wishlist reminder' };
  }
}

/**
 * Send weekly wishlist reminders to all customers with items in their wishlist
 */
export async function sendWeeklyWishlistReminders(): Promise<{ success: boolean; remindersSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get all customers who have items in their wishlist
    const { data: wishlists } = await supabase
      .from('Wishlist')
      .select(`
        customer_id,
        Customer!inner (user_id),
        WishlistItem (count)
      `);

    if (!wishlists || wishlists.length === 0) {
      console.log('[Product Notifications] No wishlists found');
      return { success: true, remindersSent: 0 };
    }

    // Filter wishlists that have items and create notifications
    const notifications = wishlists
      .filter(wishlist => {
        const itemCount = (wishlist.WishlistItem as any)?.length || 0;
        return itemCount > 0;
      })
      .map(wishlist => {
        const itemCount = (wishlist.WishlistItem as any).length || 0;
        return {
          userId: (wishlist.Customer as any).user_id,
          title: 'Your Wishlist Summary',
          message: `You have ${itemCount} items in your wishlist. Don't miss out on your favorites!`,
          type: 'WISHLIST_REMINDER' as const,
          referenceUrl: '/wishlist'
        };
      });

    if (notifications.length === 0) {
      console.log('[Product Notifications] No customers with wishlist items found');
      return { success: true, remindersSent: 0 };
    }

    const result = await createBatchNotifications(notifications);
    console.log(`[Product Notifications] Sent ${result.created || 0} wishlist reminders`);
    
    return { success: result.success, remindersSent: result.created };
  } catch (error) {
    console.error('[Product Notifications] Error sending weekly wishlist reminders:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send weekly wishlist reminders' };
  }
}

/**
 * Monitor product changes and send appropriate notifications
 */
export async function handleProductUpdate(
  productId: string,
  oldProduct: { price: number; inventory: number; is_published: boolean },
  newProduct: { price: number; inventory: number; is_published: boolean }
): Promise<{ success: boolean; notificationsSent?: number; error?: string }> {
  try {
    let notificationsSent = 0;

    // Only send notifications if product is published
    if (!newProduct.is_published) {
      return { success: true, notificationsSent: 0 };
    }

    // Check for back in stock notification
    if (oldProduct.inventory === 0 && newProduct.inventory > 0) {
      const backInStockResult = await sendBackInStockNotification(productId);
      if (backInStockResult.success && backInStockResult.notificationsSent) {
        notificationsSent += backInStockResult.notificationsSent;
      }
    }

    // Check for price drop notification (only if price decreased)
    if (oldProduct.price > newProduct.price) {
      const priceDropResult = await sendPriceDropNotification(productId, oldProduct.price, newProduct.price);
      if (priceDropResult.success && priceDropResult.notificationsSent) {
        notificationsSent += priceDropResult.notificationsSent;
      }
    }

    console.log(`[Product Notifications] Processed product update for product ${productId}, sent ${notificationsSent} notifications`);
    return { success: true, notificationsSent };
  } catch (error) {
    console.error('[Product Notifications] Error handling product update:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to handle product update' };
  }
}

/**
 * Check all wishlisted products for stock and price updates (for cron jobs)
 */
export async function checkWishlistedProductUpdates(): Promise<{ success: boolean; notificationsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    let totalNotificationsSent = 0;
    
    console.log('[Product Notifications] Starting wishlisted product updates check');

    // Get all products that are in wishlists and recently updated
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentlyUpdatedProducts } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        price,
        inventory,
        is_published,
        updated_at,
        WishlistItem!inner (
          wishlist_id
        )
      `)
      .gte('updated_at', oneHourAgo)
      .eq('is_published', true);

    if (!recentlyUpdatedProducts || recentlyUpdatedProducts.length === 0) {
      console.log('[Product Notifications] No recently updated wishlisted products found');
      return { success: true, notificationsSent: 0 };
    }

    // Process each product for potential notifications
    for (const product of recentlyUpdatedProducts) {
      // For back in stock notifications, we check if inventory > 0
      // (we can't easily determine previous inventory state in this context)
      if (product.inventory > 0) {
        const backInStockResult = await sendBackInStockNotification(product.id);
        if (backInStockResult.success && backInStockResult.notificationsSent) {
          totalNotificationsSent += backInStockResult.notificationsSent;
        }
      }
    }

    console.log(`[Product Notifications] Wishlisted product updates check completed. Notifications sent: ${totalNotificationsSent}`);
    return { success: true, notificationsSent: totalNotificationsSent };
  } catch (error) {
    console.error('[Product Notifications] Error checking wishlisted product updates:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check wishlisted product updates' };
  }
}

/**
 * Get product price tracking data for analytics
 */
export async function getProductPriceTrackingData(productId: string): Promise<{
  success: boolean;
  wishlistCustomers?: number;
  averageWishlistAge?: number;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get wishlist data for the product
    const { data: wishlistItems } = await supabase
      .from('WishlistItem')
      .select('created_at')
      .eq('product_id', productId);

    if (!wishlistItems || wishlistItems.length === 0) {
      return { success: true, wishlistCustomers: 0, averageWishlistAge: 0 };
    }

    // Calculate average wishlist age in days
    const now = new Date();
    const totalAge = wishlistItems.reduce((sum, item) => {
      const itemAge = (now.getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return sum + itemAge;
    }, 0);

    const averageAge = totalAge / wishlistItems.length;

    return {
      success: true,
      wishlistCustomers: wishlistItems.length,
      averageWishlistAge: Math.round(averageAge)
    };
  } catch (error) {
    console.error('[Product Notifications] Error getting price tracking data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get price tracking data' };
  }
}

// Export configuration for external use
export { PRICE_DROP_CONFIG };
