"use server";

import { auth } from "../auth";
import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import { getCustomerByUserId, getCustomerCart } from "../lib/services/customer";

/**
 * Add a product to the user's cart
 */
export async function addToCart(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    const productId = formData.get("productId") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    
    // Validate input
    if (!productId) {
      return { error: "Product ID is required" };
    }
    
    if (!quantity || quantity <= 0) {
      return { error: "Quantity must be greater than 0" };
    }
    
    // Check if product exists and is available
    const product = await db.product.findUnique({
      where: {
        id: productId,
        isPublished: true,
      },
    });
    
    if (!product) {
      return { error: "Product not found or not available" };
    }
    
    // Check if product has enough inventory
    if (product.inventory < quantity) {
      return { error: "Not enough inventory available" };
    }
    
    // Get or create cart
    let cart = await db.cart.findUnique({
      where: { customerId: customer.id },
    });
    
    if (!cart) {
      cart = await db.cart.create({
        data: {
          customerId: customer.id,
        },
      });
    }
    
    // Check if item already exists in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });
    
    if (existingItem) {
      // Update existing item
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity,
        },
      });
    } else {
      // Create new item
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }
    
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { error: "Failed to add to cart" };
  }
}

/**
 * Update the quantity of a cart item
 */
export async function updateCartItem(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    const cartItemId = formData.get("cartItemId") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    
    // Validate input
    if (!cartItemId) {
      return { error: "Cart item ID is required" };
    }
    
    if (!quantity || quantity <= 0) {
      return { error: "Quantity must be greater than 0" };
    }
    
    // Get cart
    const cart = await db.cart.findUnique({
      where: { customerId: customer.id },
    });
    
    if (!cart) {
      return { error: "Cart not found" };
    }
    
    // Check if cart item exists and belongs to the customer
    const cartItem = await db.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
      include: {
        product: true,
      },
    });
    
    if (!cartItem) {
      return { error: "Cart item not found" };
    }
    
    // Check if product has enough inventory
    if (cartItem.product.inventory < quantity) {
      return { error: "Not enough inventory available" };
    }
    
    // Update cart item
    await db.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity,
      },
    });
    
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return { error: "Failed to update cart item" };
  }
}

/**
 * Remove an item from the cart
 */
export async function removeFromCart(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    const cartItemId = formData.get("cartItemId") as string;
    
    if (!cartItemId) {
      return { error: "Cart item ID is required" };
    }
    
    // Get cart
    const cart = await db.cart.findUnique({
      where: { customerId: customer.id },
    });
    
    if (!cart) {
      return { error: "Cart not found" };
    }
    
    // Check if cart item exists and belongs to the customer
    const cartItem = await db.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });
    
    if (!cartItem) {
      return { error: "Cart item not found" };
    }
    
    // Delete cart item
    await db.cartItem.delete({
      where: { id: cartItemId },
    });
    
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return { error: "Failed to remove from cart" };
  }
}

/**
 * Clear the cart
 */
export async function clearCart() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    // Get cart
    const cart = await db.cart.findUnique({
      where: { customerId: customer.id },
    });
    
    if (!cart) {
      return { success: true }; // No cart to clear
    }
    
    // Delete all cart items
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { error: "Failed to clear cart" };
  }
} 