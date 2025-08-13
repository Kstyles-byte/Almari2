import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';

// Define types for inventory notifications
interface Product {
  id: string;
  vendor_id: string;
  name: string;
  inventory: number;
  price: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
}

interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  vendorId: string;
  threshold?: number;
}

// Configurable thresholds
const INVENTORY_THRESHOLDS = {
  LOW_STOCK: 10,
  OUT_OF_STOCK: 0,
  POPULAR_PRODUCT_ORDER_COUNT: 20, // Number of orders in last 24h to consider popular
  RESTOCK_THRESHOLD: 5 // Minimum stock to send restock notification
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
 * Send low stock alert to vendor
 */
export async function sendLowStockAlert(
  productId: string, 
  vendorId: string, 
  currentStock: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get product details
    const { data: product } = await supabase
      .from('Product')
      .select('name')
      .eq('id', productId)
      .single();
      
    if (!product) {
      throw new Error('Product not found');
    }

    // Get vendor user ID
    const vendorUserId = await getVendorUserId(vendorId);
    if (!vendorUserId) {
      throw new Error('Vendor user not found');
    }

    const result = await createNotificationFromTemplate(
      'LOW_STOCK_ALERT',
      vendorUserId,
      {
        productName: product.name,
        currentStock
      },
      {
        referenceUrl: `/vendor/products/${productId}`
      }
    );

    console.log(`[Inventory Notifications] Low stock alert sent for product ${productId}, stock: ${currentStock}`);
    return result;
  } catch (error) {
    console.error('[Inventory Notifications] Error sending low stock alert:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send low stock alert' };
  }
}

/**
 * Send out of stock alert to vendor
 */
export async function sendOutOfStockAlert(
  productId: string, 
  vendorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get product details
    const { data: product } = await supabase
      .from('Product')
      .select('name')
      .eq('id', productId)
      .single();
      
    if (!product) {
      throw new Error('Product not found');
    }

    // Get vendor user ID
    const vendorUserId = await getVendorUserId(vendorId);
    if (!vendorUserId) {
      throw new Error('Vendor user not found');
    }

    const result = await createNotificationFromTemplate(
      'OUT_OF_STOCK_ALERT',
      vendorUserId,
      {
        productName: product.name
      },
      {
        referenceUrl: `/vendor/products/${productId}`
      }
    );

    console.log(`[Inventory Notifications] Out of stock alert sent for product ${productId}`);
    return result;
  } catch (error) {
    console.error('[Inventory Notifications] Error sending out of stock alert:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send out of stock alert' };
  }
}

/**
 * Send restock notification to vendor
 */
export async function sendRestockNotification(
  productId: string, 
  vendorId: string, 
  newStock: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get product details
    const { data: product } = await supabase
      .from('Product')
      .select('name')
      .eq('id', productId)
      .single();
      
    if (!product) {
      throw new Error('Product not found');
    }

    // Get vendor user ID
    const vendorUserId = await getVendorUserId(vendorId);
    if (!vendorUserId) {
      throw new Error('Vendor user not found');
    }

    const result = await createNotificationFromTemplate(
      'INVENTORY_UPDATE',
      vendorUserId,
      {
        productName: product.name,
        newStock
      },
      {
        referenceUrl: `/vendor/products/${productId}`
      }
    );

    console.log(`[Inventory Notifications] Restock notification sent for product ${productId}, new stock: ${newStock}`);
    return result;
  } catch (error) {
    console.error('[Inventory Notifications] Error sending restock notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send restock notification' };
  }
}

/**
 * Send popular product alert to vendor
 */
export async function sendPopularProductAlert(
  productId: string, 
  vendorId: string, 
  orderCount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get product details
    const { data: product } = await supabase
      .from('Product')
      .select('name')
      .eq('id', productId)
      .single();
      
    if (!product) {
      throw new Error('Product not found');
    }

    // Get vendor user ID
    const vendorUserId = await getVendorUserId(vendorId);
    if (!vendorUserId) {
      throw new Error('Vendor user not found');
    }

    const result = await createNotificationFromTemplate(
      'POPULAR_PRODUCT_ALERT',
      vendorUserId,
      {
        productName: product.name,
        orderCount
      },
      {
        referenceUrl: `/vendor/products/${productId}`
      }
    );

    console.log(`[Inventory Notifications] Popular product alert sent for product ${productId}, orders: ${orderCount}`);
    return result;
  } catch (error) {
    console.error('[Inventory Notifications] Error sending popular product alert:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send popular product alert' };
  }
}

/**
 * Check and send low stock alerts for all products
 */
export async function checkAndSendLowStockAlerts(): Promise<{ success: boolean; alertsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get all published products with low stock
    const { data: lowStockProducts } = await supabase
      .from('Product')
      .select('id, vendor_id, name, inventory')
      .eq('is_published', true)
      .gt('inventory', INVENTORY_THRESHOLDS.OUT_OF_STOCK)
      .lte('inventory', INVENTORY_THRESHOLDS.LOW_STOCK);

    if (!lowStockProducts || lowStockProducts.length === 0) {
      console.log('[Inventory Notifications] No low stock products found');
      return { success: true, alertsSent: 0 };
    }

    // Get vendor user IDs
    const vendorIds = [...new Set(lowStockProducts.map(p => p.vendor_id))];
    const vendorUserIds = await getVendorUserIds(vendorIds);

    // Create notifications for each low stock product
    const notifications = lowStockProducts.map(product => ({
      userId: vendorUserIds[product.vendor_id],
      title: 'Low Stock Alert',
      message: `Your product "${product.name}" is running low on stock (current: ${product.inventory}).`,
      type: 'LOW_STOCK_ALERT' as const,
      referenceUrl: `/vendor/products/${product.id}`
    })).filter(notification => notification.userId); // Filter out products with missing vendor user IDs

    if (notifications.length > 0) {
      const result = await createBatchNotifications(notifications);
      console.log(`[Inventory Notifications] Sent ${result.created || 0} low stock alerts`);
      return { success: result.success, alertsSent: result.created };
    }

    return { success: true, alertsSent: 0 };
  } catch (error) {
    console.error('[Inventory Notifications] Error checking low stock:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check low stock' };
  }
}

/**
 * Check and send out of stock alerts for all products
 */
export async function checkAndSendOutOfStockAlerts(): Promise<{ success: boolean; alertsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get all published products that are out of stock
    const { data: outOfStockProducts } = await supabase
      .from('Product')
      .select('id, vendor_id, name, inventory')
      .eq('is_published', true)
      .eq('inventory', INVENTORY_THRESHOLDS.OUT_OF_STOCK);

    if (!outOfStockProducts || outOfStockProducts.length === 0) {
      console.log('[Inventory Notifications] No out of stock products found');
      return { success: true, alertsSent: 0 };
    }

    // Get vendor user IDs
    const vendorIds = [...new Set(outOfStockProducts.map(p => p.vendor_id))];
    const vendorUserIds = await getVendorUserIds(vendorIds);

    // Create notifications for each out of stock product
    const notifications = outOfStockProducts.map(product => ({
      userId: vendorUserIds[product.vendor_id],
      title: 'Out of Stock Alert',
      message: `Your product "${product.name}" is out of stock and needs restocking.`,
      type: 'LOW_STOCK_ALERT' as const, // Reusing existing type
      referenceUrl: `/vendor/products/${product.id}`
    })).filter(notification => notification.userId);

    if (notifications.length > 0) {
      const result = await createBatchNotifications(notifications);
      console.log(`[Inventory Notifications] Sent ${result.created || 0} out of stock alerts`);
      return { success: result.success, alertsSent: result.created };
    }

    return { success: true, alertsSent: 0 };
  } catch (error) {
    console.error('[Inventory Notifications] Error checking out of stock:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check out of stock' };
  }
}

/**
 * Check and send popular product alerts
 */
export async function checkAndSendPopularProductAlerts(): Promise<{ success: boolean; alertsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get products with high order count in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: popularProducts } = await supabase
      .from('OrderItem')
      .select(`
        product_id,
        vendor_id,
        Product!inner (
          name,
          is_published
        )
      `)
      .gte('created_at', twentyFourHoursAgo)
      .eq('Product.is_published', true);

    if (!popularProducts || popularProducts.length === 0) {
      console.log('[Inventory Notifications] No recent orders found');
      return { success: true, alertsSent: 0 };
    }

    // Group by product and count orders
    const productOrderCounts: Record<string, { count: number; vendorId: string; productName: string }> = {};
    
    popularProducts.forEach(item => {
      if (!productOrderCounts[item.product_id]) {
        productOrderCounts[item.product_id] = {
          count: 0,
          vendorId: item.vendor_id,
          productName: (item.Product as any).name
        };
      }
      productOrderCounts[item.product_id].count++;
    });

    // Filter products that meet the popular threshold
    const popularProductsToAlert = Object.entries(productOrderCounts)
      .filter(([_, data]) => data.count >= INVENTORY_THRESHOLDS.POPULAR_PRODUCT_ORDER_COUNT)
      .map(([productId, data]) => ({ productId, ...data }));

    if (popularProductsToAlert.length === 0) {
      console.log('[Inventory Notifications] No popular products found');
      return { success: true, alertsSent: 0 };
    }

    // Get vendor user IDs
    const vendorIds = [...new Set(popularProductsToAlert.map(p => p.vendorId))];
    const vendorUserIds = await getVendorUserIds(vendorIds);

    // Create notifications for each popular product
    const notifications = popularProductsToAlert.map(product => ({
      userId: vendorUserIds[product.vendorId],
      title: 'Popular Product Alert',
      message: `Your product "${product.productName}" is trending with ${product.count} orders in the last 24 hours!`,
      type: 'POPULAR_PRODUCT_ALERT' as const,
      referenceUrl: `/vendor/products/${product.productId}`
    })).filter(notification => notification.userId);

    if (notifications.length > 0) {
      const result = await createBatchNotifications(notifications);
      console.log(`[Inventory Notifications] Sent ${result.created || 0} popular product alerts`);
      return { success: result.success, alertsSent: result.created };
    }

    return { success: true, alertsSent: 0 };
  } catch (error) {
    console.error('[Inventory Notifications] Error checking popular products:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check popular products' };
  }
}

/**
 * Monitor inventory changes and send appropriate notifications
 */
export async function handleInventoryUpdate(
  productId: string,
  oldInventory: number,
  newInventory: number
): Promise<{ success: boolean; notificationsSent?: number; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get product details
    const { data: product } = await supabase
      .from('Product')
      .select('vendor_id, name, is_published')
      .eq('id', productId)
      .single();
      
    if (!product || !product.is_published) {
      return { success: true, notificationsSent: 0 };
    }

    let notificationsSent = 0;

    // Check if product went from having stock to being out of stock
    if (oldInventory > INVENTORY_THRESHOLDS.OUT_OF_STOCK && newInventory === INVENTORY_THRESHOLDS.OUT_OF_STOCK) {
      const result = await sendOutOfStockAlert(productId, product.vendor_id);
      if (result.success) notificationsSent++;
    }
    // Check if product went from out of stock to having stock (restock)
    else if (oldInventory === INVENTORY_THRESHOLDS.OUT_OF_STOCK && newInventory > INVENTORY_THRESHOLDS.RESTOCK_THRESHOLD) {
      const result = await sendRestockNotification(productId, product.vendor_id, newInventory);
      if (result.success) notificationsSent++;
    }
    // Check if product went from normal stock to low stock
    else if (oldInventory > INVENTORY_THRESHOLDS.LOW_STOCK && newInventory > INVENTORY_THRESHOLDS.OUT_OF_STOCK && newInventory <= INVENTORY_THRESHOLDS.LOW_STOCK) {
      const result = await sendLowStockAlert(productId, product.vendor_id, newInventory);
      if (result.success) notificationsSent++;
    }

    console.log(`[Inventory Notifications] Processed inventory update for product ${productId}: ${oldInventory} -> ${newInventory}, sent ${notificationsSent} notifications`);
    return { success: true, notificationsSent };
  } catch (error) {
    console.error('[Inventory Notifications] Error handling inventory update:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to handle inventory update' };
  }
}

/**
 * Run comprehensive inventory check (for cron jobs)
 */
export async function runInventoryCheck(): Promise<{ success: boolean; totalAlerts?: number; error?: string }> {
  try {
    console.log('[Inventory Notifications] Starting comprehensive inventory check');
    
    const [lowStockResult, outOfStockResult, popularProductResult] = await Promise.all([
      checkAndSendLowStockAlerts(),
      checkAndSendOutOfStockAlerts(),
      checkAndSendPopularProductAlerts()
    ]);

    const totalAlerts = (lowStockResult.alertsSent || 0) + 
                       (outOfStockResult.alertsSent || 0) + 
                       (popularProductResult.alertsSent || 0);

    console.log(`[Inventory Notifications] Inventory check completed. Total alerts sent: ${totalAlerts}`);
    
    return { 
      success: lowStockResult.success && outOfStockResult.success && popularProductResult.success, 
      totalAlerts 
    };
  } catch (error) {
    console.error('[Inventory Notifications] Error in comprehensive inventory check:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to run inventory check' };
  }
}

// Export inventory thresholds for configuration
export { INVENTORY_THRESHOLDS };
