# Notification System Integration Examples

This document provides examples of how to integrate the new notification generators into existing business logic flows.

## Import the Notification Generators

First, import the relevant generators in your action files:

```typescript
import { 
  createCouponAppliedNotification,
  createCouponFailedNotification,
  createProductBackInStockNotification,
  createProductPriceDropNotification,
  createNewProductReviewNotification,
  createReviewResponseNotification,
  createVendorNewOrderNotification,
  createAdminHighValueOrderNotification,
  // ... other generators as needed
} from '@/lib/services/notification-generators';
```

## 1. Coupon Notifications (actions/coupon.ts)

### Successful Coupon Application

```typescript
// In applyCoupon function, after successful validation
if (validationResult.success) {
  // ... existing logic ...
  
  // Create notification for successful coupon application
  if (session?.user) {
    try {
      await createCouponAppliedNotification(
        session.user.id,
        couponCode,
        validationResult.discount || 0,
        orderId // if available from context
      );
    } catch (error) {
      console.error('Error creating coupon applied notification:', error);
      // Don't fail the main operation if notification fails
    }
  }
  
  return {
    success: true,
    message: `Coupon "${couponCode}" applied! You saved ₦${validationResult.discount?.toLocaleString()}.`,
    discount: validationResult.discount,
    couponCode
  };
}
```

### Failed Coupon Application

```typescript
// In applyCoupon function, when validation fails
if (!validationResult.success) {
  // Create notification for failed coupon application
  if (session?.user) {
    try {
      await createCouponFailedNotification(
        session.user.id,
        couponCode,
        validationResult.error || 'Invalid coupon'
      );
    } catch (error) {
      console.error('Error creating coupon failed notification:', error);
    }
  }
  
  return {
    success: false,
    message: validationResult.error || "Failed to apply coupon",
    error: validationResult.error
  };
}
```

## 2. Wishlist Notifications (actions/wishlist.ts)

### Product Back in Stock

```typescript
// In a background job or when product inventory is updated
export async function notifyWishlistCustomersProductBackInStock(productId: string) {
  try {
    const supabase = createSupabaseServerActionClient();
    
    // Get all customers who have this product in their wishlist
    const { data: wishlistItems, error } = await supabase
      .from('WishlistItem')
      .select(`
        wishlist_id,
        product_id,
        Wishlist (customer_id),
        Product (name)
      `)
      .eq('product_id', productId);
    
    if (error || !wishlistItems) return;
    
    // Notify each customer
    for (const item of wishlistItems) {
      if (item.Wishlist && item.Product) {
        // Get customer's user_id
        const { data: customer } = await supabase
          .from('Customer')
          .select('user_id')
          .eq('id', item.Wishlist.customer_id)
          .single();
        
        if (customer) {
          await createProductBackInStockNotification(
            customer.user_id,
            productId,
            item.Product.name
          );
        }
      }
    }
  } catch (error) {
    console.error('Error notifying wishlist customers:', error);
  }
}
```

### Product Price Drop

```typescript
// In a background job when product prices are updated
export async function notifyWishlistCustomersPriceDrop(
  productId: string, 
  productName: string,
  oldPrice: number, 
  newPrice: number
) {
  try {
    const supabase = createSupabaseServerActionClient();
    
    // Get all customers who have this product in their wishlist
    const { data: wishlistItems, error } = await supabase
      .from('WishlistItem')
      .select(`
        wishlist_id,
        product_id,
        Wishlist (
          customer_id,
          Customer (user_id)
        )
      `)
      .eq('product_id', productId);
    
    if (error || !wishlistItems) return;
    
    // Notify each customer about the price drop
    for (const item of wishlistItems) {
      if (item.Wishlist?.Customer) {
        await createProductPriceDropNotification(
          item.Wishlist.Customer.user_id,
          productId,
          productName,
          oldPrice,
          newPrice
        );
      }
    }
  } catch (error) {
    console.error('Error notifying price drop:', error);
  }
}
```

## 3. Review Notifications (actions/reviews.ts)

### New Product Review

```typescript
// In createReview action, after successful review creation
export async function createReview(formData: FormData) {
  try {
    // ... existing review creation logic ...
    
    if (result.success && result.review) {
      // Notify the vendor about the new review
      const { data: product } = await supabase
        .from('Product')
        .select(`
          vendor_id,
          name,
          Vendor (user_id)
        `)
        .eq('id', productId)
        .single();
      
      if (product?.Vendor) {
        await createNewProductReviewNotification(
          product.Vendor.user_id,
          productId,
          product.name,
          rating
        );
      }
      
      // Check if this is a review milestone (5, 10, 25, 50, 100 reviews)
      const { count } = await supabase
        .from('Review')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);
      
      const milestones = [5, 10, 25, 50, 100];
      if (count && milestones.includes(count) && product?.Vendor) {
        await createReviewMilestoneNotification(
          product.Vendor.user_id,
          productId,
          product.name,
          count
        );
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in createReview:', error);
    return { success: false, error: 'Failed to create review' };
  }
}
```

## 4. Order Notifications (actions/orders.ts)

### High Value Order Alert

```typescript
// In order creation, after successful order placement
export async function createOrder(orderData: OrderCreateData) {
  try {
    // ... existing order creation logic ...
    
    if (order.success && order.data) {
      const totalAmount = order.data.total_amount;
      const HIGH_VALUE_THRESHOLD = 500000; // ₦500,000
      
      // Notify admins if this is a high-value order
      if (totalAmount >= HIGH_VALUE_THRESHOLD) {
        // Get all admin users
        const { data: adminUsers } = await supabase
          .from('User')
          .select('id')
          .eq('role', 'ADMIN');
        
        if (adminUsers) {
          for (const admin of adminUsers) {
            await createAdminHighValueOrderNotification(
              admin.id,
              order.data.id,
              totalAmount
            );
          }
        }
      }
      
      // Notify vendors about new orders
      const { data: orderItems } = await supabase
        .from('OrderItem')
        .select(`
          vendor_id,
          Vendor (user_id)
        `)
        .eq('order_id', order.data.id);
      
      if (orderItems) {
        const uniqueVendors = new Set();
        for (const item of orderItems) {
          if (item.Vendor && !uniqueVendors.has(item.vendor_id)) {
            uniqueVendors.add(item.vendor_id);
            await createVendorNewOrderNotification(
              item.Vendor.user_id,
              order.data.id
            );
          }
        }
      }
    }
    
    return order;
  } catch (error) {
    console.error('Error in createOrder:', error);
    return { success: false, error: 'Failed to create order' };
  }
}
```

## 5. Vendor Coupon Management (actions/vendor-coupons.ts)

### Coupon Created Notification

```typescript
// In createCoupon action, after successful coupon creation
export async function createCoupon(formData: FormData) {
  try {
    // ... existing coupon creation logic ...
    
    if (result.success && session?.user) {
      await createCouponCreatedNotification(
        session.user.id,
        couponCode
      );
    }
    
    return result;
  } catch (error) {
    console.error('Error in createCoupon:', error);
    return { success: false, error: 'Failed to create coupon' };
  }
}
```

## 6. Background Jobs for Automated Notifications

### Coupon Expiry Check (Run Daily)

```typescript
// Create a background job or Edge Function
export async function checkExpiredCoupons() {
  try {
    const supabase = createSupabaseServerActionClient();
    
    // Find coupons that expire today
    const today = new Date().toISOString().split('T')[0];
    const { data: expiringCoupons } = await supabase
      .from('Coupon')
      .select(`
        id,
        code,
        vendor_id,
        Vendor (user_id)
      `)
      .eq('expiry_date', today)
      .eq('is_active', true);
    
    if (expiringCoupons) {
      for (const coupon of expiringCoupons) {
        if (coupon.Vendor) {
          await createCouponExpiredNotification(
            coupon.Vendor.user_id,
            coupon.code
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking expired coupons:', error);
  }
}
```

### Low Stock Alerts (Run Hourly)

```typescript
export async function checkLowStockProducts() {
  try {
    const supabase = createSupabaseServerActionClient();
    const LOW_STOCK_THRESHOLD = 5;
    
    // Find products with low stock
    const { data: lowStockProducts } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        inventory,
        vendor_id,
        Vendor (user_id)
      `)
      .lte('inventory', LOW_STOCK_THRESHOLD)
      .eq('is_published', true);
    
    if (lowStockProducts) {
      // Notify vendors about their low stock products
      for (const product of lowStockProducts) {
        if (product.Vendor) {
          await createAdminLowStockNotification(
            product.Vendor.user_id, // Could also notify admins
            product.id,
            product.name,
            product.inventory
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
}
```

## Integration Best Practices

1. **Error Handling**: Always wrap notification calls in try-catch blocks. Notification failures should not break main business logic.

2. **Async Operations**: Use `await` for notification calls but consider making them non-blocking for better performance.

3. **User Preferences**: The notification generators already check user preferences internally.

4. **Rate Limiting**: Be mindful of notification frequency to avoid spam.

5. **Background Jobs**: Use Edge Functions or scheduled jobs for automated notifications like reminders and alerts.

6. **Testing**: Create test scenarios for each notification type to ensure they work correctly.

## Next Steps

1. Implement these integrations incrementally
2. Test each notification type thoroughly
3. Monitor notification delivery and user engagement
4. Add more sophisticated rules for when to send notifications
5. Consider implementing notification batching for better UX
