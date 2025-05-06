// Guest cart service for non-authenticated users
// Manages cart items in localStorage

import { v4 as uuidv4 } from 'uuid';

// Type definitions
type GuestCartItem = {
  id: string;
  productId: string;
  quantity: number;
  name: string;
  price: number;
  image?: string;
  vendorName?: string;
};

type GuestCart = {
  id: string;
  items: GuestCartItem[];
  updatedAt: string;
};

// Local storage key
const GUEST_CART_KEY = 'almari_guest_cart';

/**
 * Initialize or get the guest cart from localStorage
 */
export function getGuestCart(): GuestCart {
  if (typeof window === 'undefined') {
    return { id: '', items: [], updatedAt: new Date().toISOString() };
  }
  
  try {
    const cartData = localStorage.getItem(GUEST_CART_KEY);
    if (cartData) {
      return JSON.parse(cartData);
    }
    
    // Create new cart if one doesn't exist
    const newCart: GuestCart = {
      id: uuidv4(),
      items: [],
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(newCart));
    return newCart;
  } catch (error) {
    console.error('Error getting guest cart:', error);
    return { id: uuidv4(), items: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * Save the guest cart to localStorage
 */
export function saveGuestCart(cart: GuestCart): void {
  if (typeof window === 'undefined') return;
  
  try {
    cart.updatedAt = new Date().toISOString();
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
}

/**
 * Add a product to the guest cart
 */
export function addProductToGuestCart(product: {
  id: string;
  name: string;
  price: number;
  image?: string;
  vendorName?: string;
}, quantity: number): GuestCart {
  const cart = getGuestCart();
  
  // Check if product already exists in cart
  const existingItemIndex = cart.items.findIndex(item => item.productId === product.id);
  
  if (existingItemIndex >= 0) {
    // Update quantity of existing item
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cart.items.push({
      id: uuidv4(),
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
      vendorName: product.vendorName
    });
  }
  
  saveGuestCart(cart);
  return cart;
}

/**
 * Update the quantity of an item in the guest cart
 */
export function updateGuestCartItem(cartItemId: string, quantity: number): GuestCart | null {
  const cart = getGuestCart();
  
  const itemIndex = cart.items.findIndex(item => item.id === cartItemId);
  if (itemIndex === -1) return null;
  
  cart.items[itemIndex].quantity = quantity;
  saveGuestCart(cart);
  
  return cart;
}

/**
 * Remove an item from the guest cart
 */
export function removeGuestCartItem(cartItemId: string): GuestCart {
  const cart = getGuestCart();
  
  cart.items = cart.items.filter(item => item.id !== cartItemId);
  saveGuestCart(cart);
  
  return cart;
}

/**
 * Clear the guest cart
 */
export function clearGuestCart(): void {
  if (typeof window === 'undefined') return;
  
  const emptyCart: GuestCart = {
    id: uuidv4(),
    items: [],
    updatedAt: new Date().toISOString()
  };
  
  saveGuestCart(emptyCart);
}

/**
 * Calculate the total amount for the guest cart
 */
export function getGuestCartTotal(): number {
  const cart = getGuestCart();
  
  return cart.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
}

/**
 * Get the total number of items in the guest cart
 */
export function getGuestCartItemCount(): number {
  const cart = getGuestCart();
  
  return cart.items.reduce((sum, item) => {
    return sum + item.quantity;
  }, 0);
}

/**
 * Transfer guest cart items to user's cart after login
 * This will be called after user logs in
 */
export function getGuestCartItems(): GuestCartItem[] {
  const cart = getGuestCart();
  return cart.items;
} 