import { createTypedNotification } from './notification';

/**
 * Extended notification generators for Phase 2 implementation
 * These generators cover all the additional notification types from the comprehensive plan
 */

// === MISSING NOTIFICATION GENERATORS ===

/**
 * Create Delivery Notification
 */
export async function createDeliveryNotification(userId: string, orderId: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId,
    title: 'Order Delivered',
    message: 'Your order has been successfully delivered.',
    type: 'ORDER_DELIVERED',
    orderId,
    referenceUrl: `/customer/orders/${orderId}`,
  });
}

/**
 * Create Vendor Return Notification
 */
export async function createVendorReturnNotification(vendorUserId: string, returnId: string, orderId: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Return Action Required',
    message: 'A customer has requested a return for one of your products. Please review and respond.',
    type: 'RETURN_VENDOR_ACTION_REQUIRED',
    returnId,
    orderId,
    referenceUrl: `/vendor/returns/${returnId}`,
  });
}

/**
 * Create Vendor Payout Notification
 */
export async function createVendorPayoutNotification(vendorUserId: string, payoutId: string, amount: number): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Payout Processed',
    message: `Your payout of ₦${amount.toLocaleString()} has been processed and will be transferred to your account.`,
    type: 'PAYOUT_PROCESSED',
    referenceUrl: `/vendor/payouts/${payoutId}`,
  });
}

/**
 * Create Agent Assignment Notification
 */
export async function createAgentAssignmentNotification(agentUserId: string, orderId: string, type: 'pickup' | 'return'): Promise<{ success: boolean; error?: string }> {
  const isReturn = type === 'return';
  return createTypedNotification({
    userId: agentUserId,
    title: isReturn ? 'Return Pickup Assignment' : 'New Pickup Assignment',
    message: isReturn 
      ? 'You have been assigned to pick up a return from a customer.' 
      : 'You have been assigned a new pickup task.',
    type: isReturn ? 'RETURN_PICKUP_ASSIGNMENT' : 'NEW_PICKUP_ASSIGNMENT',
    orderId,
    referenceUrl: `/agent/orders/${orderId}`,
  });
}

/**
 * Create Admin Vendor Application Notification
 */
export async function createAdminVendorApplicationNotification(adminUserId: string, vendorId: string, vendorName: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: adminUserId,
    title: 'New Vendor Application',
    message: `New vendor application from ${vendorName} requires your review.`,
    type: 'NEW_VENDOR_APPLICATION',
    referenceUrl: `/admin/vendors/${vendorId}`,
  });
}

/**
 * Create Admin High Value Order Notification
 */
export async function createAdminHighValueOrderNotification(adminUserId: string, orderId: string, amount: number): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: adminUserId,
    title: 'High Value Order Alert',
    message: `A high-value order of ₦${amount.toLocaleString()} has been placed and requires attention.`,
    type: 'HIGH_VALUE_ORDER_ALERT',
    orderId,
    referenceUrl: `/admin/orders/${orderId}`,
  });
}

/**
 * Create Admin Low Stock Notification
 */
export async function createAdminLowStockNotification(adminUserId: string, productId: string, productName: string, currentStock: number): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: adminUserId,
    title: 'Low Stock Alert',
    message: `Product "${productName}" is running low with only ${currentStock} items remaining.`,
    type: 'LOW_STOCK_ALERT',
    referenceUrl: `/admin/products/${productId}`,
  });
}

// === COUPON NOTIFICATIONS ===

/**
 * Create Coupon Created Notification
 */
export async function createCouponCreatedNotification(vendorUserId: string, couponCode: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Coupon Created',
    message: `Your coupon "${couponCode}" has been successfully created and is now active.`,
    type: 'COUPON_CREATED',
    referenceUrl: `/vendor/coupons`,
  });
}

/**
 * Create Coupon Expired Notification
 */
export async function createCouponExpiredNotification(vendorUserId: string, couponCode: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Coupon Expired',
    message: `Your coupon "${couponCode}" has expired and is no longer available for use.`,
    type: 'COUPON_EXPIRED',
    referenceUrl: `/vendor/coupons`,
  });
}

/**
 * Create Coupon Usage Threshold Notification
 */
export async function createCouponUsageThresholdNotification(vendorUserId: string, couponCode: string, usageCount: number, usageLimit: number): Promise<{ success: boolean; error?: string }> {
  const percentage = Math.round((usageCount / usageLimit) * 100);
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Coupon Usage Alert',
    message: `Your coupon "${couponCode}" has reached ${percentage}% of its usage limit (${usageCount}/${usageLimit}).`,
    type: 'COUPON_USAGE_THRESHOLD',
    referenceUrl: `/vendor/coupons`,
  });
}

/**
 * Create Coupon Applied Notification
 */
export async function createCouponAppliedNotification(customerUserId: string, couponCode: string, discount: number, orderId: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: customerUserId,
    title: 'Coupon Applied',
    message: `Coupon "${couponCode}" applied successfully! You saved ₦${discount.toLocaleString()}.`,
    type: 'COUPON_APPLIED',
    orderId,
    referenceUrl: `/customer/orders/${orderId}`,
  });
}

/**
 * Create Coupon Failed Notification
 */
export async function createCouponFailedNotification(customerUserId: string, couponCode: string, reason: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: customerUserId,
    title: 'Coupon Application Failed',
    message: `Coupon "${couponCode}" could not be applied: ${reason}`,
    type: 'COUPON_FAILED',
    referenceUrl: `/customer/cart`,
  });
}

// === WISHLIST NOTIFICATIONS ===

/**
 * Create Product Back in Stock Notification
 */
export async function createProductBackInStockNotification(customerUserId: string, productId: string, productName: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: customerUserId,
    title: 'Product Back in Stock',
    message: `Good news! "${productName}" is back in stock and ready to order.`,
    type: 'PRODUCT_BACK_IN_STOCK',
    referenceUrl: `/products/${productId}`,
  });
}

/**
 * Create Product Price Drop Notification
 */
export async function createProductPriceDropNotification(customerUserId: string, productId: string, productName: string, oldPrice: number, newPrice: number): Promise<{ success: boolean; error?: string }> {
  const savings = oldPrice - newPrice;
  return createTypedNotification({
    userId: customerUserId,
    title: 'Price Drop Alert',
    message: `Great news! "${productName}" price dropped from ₦${oldPrice.toLocaleString()} to ₦${newPrice.toLocaleString()}. Save ₦${savings.toLocaleString()}!`,
    type: 'PRODUCT_PRICE_DROP',
    referenceUrl: `/products/${productId}`,
  });
}

/**
 * Create Wishlist Reminder Notification
 */
export async function createWishlistReminderNotification(customerUserId: string, itemCount: number): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: customerUserId,
    title: 'Wishlist Reminder',
    message: `You have ${itemCount} item${itemCount > 1 ? 's' : ''} in your wishlist. Check for price drops and availability!`,
    type: 'WISHLIST_REMINDER',
    referenceUrl: `/customer/wishlist`,
  });
}

// === REVIEW NOTIFICATIONS ===

/**
 * Create New Product Review Notification
 */
export async function createNewProductReviewNotification(vendorUserId: string, productId: string, productName: string, rating: number): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'New Product Review',
    message: `Your product "${productName}" received a ${rating}-star review from a customer.`,
    type: 'NEW_PRODUCT_REVIEW',
    referenceUrl: `/vendor/products/${productId}/reviews`,
  });
}

/**
 * Create Review Response Notification
 */
export async function createReviewResponseNotification(customerUserId: string, productId: string, productName: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: customerUserId,
    title: 'Review Response',
    message: `The vendor has responded to your review of "${productName}".`,
    type: 'REVIEW_RESPONSE',
    referenceUrl: `/products/${productId}#reviews`,
  });
}

/**
 * Create Review Milestone Notification
 */
export async function createReviewMilestoneNotification(vendorUserId: string, productId: string, productName: string, reviewCount: number): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Review Milestone',
    message: `Congratulations! Your product "${productName}" has reached ${reviewCount} reviews.`,
    type: 'REVIEW_MILESTONE',
    referenceUrl: `/vendor/products/${productId}/reviews`,
  });
}

// === FINANCIAL NOTIFICATIONS ===

/**
 * Create Commission Rate Changed Notification
 */
export async function createCommissionRateChangedNotification(vendorUserId: string, oldRate: number, newRate: number): Promise<{ success: boolean; error?: string }> {
  const change = newRate > oldRate ? 'increased' : 'decreased';
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Commission Rate Updated',
    message: `Your commission rate has been ${change} from ${oldRate}% to ${newRate}%.`,
    type: 'COMMISSION_RATE_CHANGED',
    referenceUrl: `/vendor/earnings`,
  });
}

/**
 * Create Payout On Hold Notification
 */
export async function createPayoutOnHoldNotification(vendorUserId: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Payout On Hold',
    message: `Your payout of ₦${amount.toLocaleString()} has been temporarily held: ${reason}`,
    type: 'PAYOUT_ON_HOLD',
    referenceUrl: `/vendor/payouts`,
  });
}

/**
 * Create Payout Hold Released Notification
 */
export async function createPayoutHoldReleasedNotification(vendorUserId: string, amount: number): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Payout Hold Released',
    message: `Great news! Your held payout of ₦${amount.toLocaleString()} has been released and will be processed.`,
    type: 'PAYOUT_HOLD_RELEASED',
    referenceUrl: `/vendor/payouts`,
  });
}

/**
 * Create Minimum Payout Reached Notification
 */
export async function createMinimumPayoutReachedNotification(vendorUserId: string, currentEarnings: number, minimumAmount: number): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Minimum Payout Reached',
    message: `You've reached the minimum payout amount! Current earnings: ₦${currentEarnings.toLocaleString()} (Min: ₦${minimumAmount.toLocaleString()})`,
    type: 'MINIMUM_PAYOUT_REACHED',
    referenceUrl: `/vendor/payouts`,
  });
}

// === PRODUCT NOTIFICATIONS ===

/**
 * Create Popular Product Alert Notification
 */
export async function createPopularProductAlertNotification(vendorUserId: string, productId: string, productName: string, views: number): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: vendorUserId,
    title: 'Popular Product Alert',
    message: `Your product "${productName}" is trending with ${views.toLocaleString()} views this week!`,
    type: 'POPULAR_PRODUCT_ALERT',
    referenceUrl: `/vendor/products/${productId}`,
  });
}

// === AGENT NOTIFICATIONS ===

/**
 * Create Agent Location Name Update Notification
 */
export async function createAgentLocationNameUpdateNotification(agentUserId: string, newLocationName: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId: agentUserId,
    title: 'Location Name Updated',
    message: `Your pickup location name has been updated to "${newLocationName}".`,
    type: 'AGENT_LOCATION_NAME_UPDATE',
    referenceUrl: `/agent/profile`,
  });
}

// === SYSTEM NOTIFICATIONS ===

/**
 * Create Account Verification Notification
 */
export async function createAccountVerificationNotification(userId: string, userType: 'customer' | 'vendor' | 'agent'): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId,
    title: 'Account Verification Required',
    message: `Please verify your ${userType} account to continue using all features.`,
    type: 'ACCOUNT_VERIFICATION',
    referenceUrl: `/${userType}/profile/verify`,
  });
}

/**
 * Create Password Reset Notification
 */
export async function createPasswordResetNotification(userId: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId,
    title: 'Password Reset Successful',
    message: 'Your password has been successfully reset. If this wasn\'t you, please contact support immediately.',
    type: 'PASSWORD_RESET',
    referenceUrl: `/profile/security`,
  });
}

/**
 * Create Security Alert Notification
 */
export async function createSecurityAlertNotification(userId: string, alertType: string, description: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId,
    title: 'Security Alert',
    message: `Security alert: ${alertType}. ${description}`,
    type: 'SECURITY_ALERT',
    referenceUrl: `/profile/security`,
  });
}

/**
 * Create Maintenance Notice Notification
 */
export async function createMaintenanceNoticeNotification(userId: string, maintenanceDate: string, duration: string): Promise<{ success: boolean; error?: string }> {
  return createTypedNotification({
    userId,
    title: 'Scheduled Maintenance',
    message: `Scheduled maintenance on ${maintenanceDate} for approximately ${duration}. Some features may be temporarily unavailable.`,
    type: 'MAINTENANCE_NOTICE',
    referenceUrl: `/announcements`,
  });
}
