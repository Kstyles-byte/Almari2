'use client';

import { getGuestCartItems, clearGuestCart } from '@/lib/services/guest-cart';
import { addToCart } from '@/actions/cart';

/**
 * Transfer items from guest cart to user cart after login
 * Call this function after successful authentication
 */
export async function transferGuestCartToUserCart(): Promise<{
  success: boolean;
  message: string;
  transferredItems: number;
}> {
  try {
    const guestCartItems = getGuestCartItems();
    
    if (!guestCartItems.length) {
      return {
        success: true,
        message: 'No guest cart items to transfer',
        transferredItems: 0
      };
    }
    
    // Track successful transfers
    let successCount = 0;
    
    // Process each item
    for (const item of guestCartItems) {
      try {
        const result = await addToCart({
          productId: item.productId,
          quantity: item.quantity
        });
        
        if (result.success) {
          successCount++;
        }
      } catch (itemError) {
        console.error('Error transferring item', item, itemError);
        // Continue with next item even if there's an error
      }
    }
    
    // Clear guest cart after transfer
    if (successCount > 0) {
      clearGuestCart();
    }
    
    return {
      success: true,
      message: `${successCount} item(s) transferred to your cart`,
      transferredItems: successCount
    };
  } catch (error) {
    console.error('Error transferring guest cart:', error);
    return {
      success: false,
      message: 'Failed to transfer guest cart items',
      transferredItems: 0
    };
  }
} 