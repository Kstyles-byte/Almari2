'use client';

import { addToCart as serverAddToCart } from './cart';
import { 
  addProductToGuestCart, 
  updateGuestCartItem, 
  removeGuestCartItem,
  getGuestCart
} from '@/lib/services/guest-cart';

/**
 * Add a product to cart - works for both authenticated and non-authenticated users
 */
export async function addToCart(product: {
  id: string;
  name: string;
  price: number;
  image?: string;
  vendorName?: string;
}, quantity: number) {
  try {
    // First try server-side add to cart (for authenticated users)
    const result = await serverAddToCart({
      productId: product.id,
      quantity: quantity
    });

    // Check if successful
    if (result.success) {
      return result;
    }

    // If unauthorized or customer profile not found, use guest cart
    if (result.error === "Unauthorized" || result.error === "Customer profile not found") {
      console.log("Using guest cart as fallback due to:", result.error);
      addProductToGuestCart(product, quantity);
      return { success: true };
    }

    // For other errors, return the original error
    return result;

  } catch (error) {
    console.error('Error adding to cart:', error);
    
    // Fallback to guest cart on error
    try {
      console.log("Falling back to guest cart after error");
      addProductToGuestCart(product, quantity);
      return { success: true };
    } catch (fallbackError) {
      console.error('Error adding to guest cart:', fallbackError);
      return { error: 'Failed to add to cart' };
    }
  }
}

/**
 * Update cart item quantity - works for both authenticated and non-authenticated users
 */
export async function updateCartItemClient(cartItemId: string, quantity: number) {
  try {
    // Check if this is a guest cart item (ID starts with a specific prefix or format)
    const guestCart = getGuestCart();
    const isGuestCartItem = guestCart.items.some(item => item.id === cartItemId);

    if (isGuestCartItem) {
      // Update guest cart item
      updateGuestCartItem(cartItemId, quantity);
      return { success: true };
    } else {
      // Use FormData for server action
      const formData = new FormData();
      formData.append('cartItemId', cartItemId);
      formData.append('quantity', quantity.toString());

      // Call server action for authenticated user
      const response = await fetch('/api/cart/items', {
        method: 'PATCH',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: data.error || 'Failed to update cart item' };
      }

      return { success: true };
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    return { error: 'Failed to update cart item' };
  }
}

/**
 * Remove cart item - works for both authenticated and non-authenticated users
 */
export async function removeCartItemClient(cartItemId: string) {
  try {
    // Check if this is a guest cart item
    const guestCart = getGuestCart();
    const isGuestCartItem = guestCart.items.some(item => item.id === cartItemId);

    if (isGuestCartItem) {
      // Remove from guest cart
      removeGuestCartItem(cartItemId);
      return { success: true };
    } else {
      // Use FormData for server action
      const formData = new FormData();
      formData.append('cartItemId', cartItemId);

      // Call server action for authenticated user
      const response = await fetch('/api/cart/items', {
        method: 'DELETE',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: data.error || 'Failed to remove cart item' };
      }

      return { success: true };
    }
  } catch (error) {
    console.error('Error removing cart item:', error);
    return { error: 'Failed to remove cart item' };
  }
}

/**
 * Get combined cart (merges server cart and guest cart)
 */
export async function getClientCart() {
  try {
    // Try to get server cart first (for authenticated users)
    const response = await fetch('/api/cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const serverCart = await response.json();
      return serverCart;
    } 

    // If server cart fetch failed or user is not authenticated, return guest cart
    const guestCart = getGuestCart();
    
    // Format to match server cart structure
    return {
      id: guestCart.id,
      items: guestCart.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image || '/placeholder-product.jpg',
        vendorName: item.vendorName || 'Unknown Vendor',
      })),
      cartTotal: guestCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    
    // On error, fallback to guest cart
    const guestCart = getGuestCart();
    
    return {
      id: guestCart.id,
      items: guestCart.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image || '/placeholder-product.jpg',
        vendorName: item.vendorName || 'Unknown Vendor',
      })),
      cartTotal: guestCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
  }
} 