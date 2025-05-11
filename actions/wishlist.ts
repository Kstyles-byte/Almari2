"use server";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { getCustomerByUserId } from "../lib/services/customer";
import { getCustomerWishlist, getWishlistItemsWithProducts } from "../lib/services/wishlist";

/**
 * Get the wishlist items for the authenticated user
 */
export async function getWishlistItems() {
  try {
    // Get cookies for server client
    const cookieStore = await cookies();
    
    // Create a Supabase client that has access to the user's session via cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get session using the cookie-based client
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { error: "Unauthorized", items: [] };
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    if (!customer) {
      return { error: "Customer profile not found", items: [] };
    }
    
    // Get or create the customer's wishlist
    const wishlistResult = await getCustomerWishlist(customer.id);
    if (!wishlistResult) {
      return { error: "Failed to retrieve wishlist", items: [] };
    }
    
    // Get the wishlist items with product details
    const items = await getWishlistItemsWithProducts(wishlistResult.wishlist.id);
    
    return { items, success: true };
  } catch (error) {
    console.error("Error in getWishlistItems:", error);
    return { error: error instanceof Error ? error.message : "Failed to get wishlist items", items: [] };
  }
}

/**
 * Add a product to the user's wishlist
 */
export async function addToWishlist(formData: FormData) {
  try {
    // Get cookies for server client
    const cookieStore = await cookies();
    
    // Create a Supabase client that has access to the user's session via cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get session using the cookie-based client
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    const productId = formData.get("productId") as string;
    
    if (!productId) {
      return { error: "Product ID is required" };
    }
    
    // Check if product exists and is published
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('id, is_published')
      .eq('id', productId)
      .single();
      
    if (productError || !product) {
      console.error("Error fetching product:", productError?.message);
      return { error: "Product not found" };
    }
    
    if (!product.is_published) {
      return { error: "Product is not available" };
    }
    
    // Get or create the customer's wishlist
    const wishlistResult = await getCustomerWishlist(customer.id);
    if (!wishlistResult) {
      return { error: "Failed to retrieve or create wishlist" };
    }
    
    // Add the product to the wishlist
    const { error: insertError } = await supabase
      .from('WishlistItem')
      .upsert({
        wishlist_id: wishlistResult.wishlist.id,
        product_id: productId
      }, {
        onConflict: 'wishlist_id, product_id'
      });
      
    if (insertError) {
      console.error("Error adding item to wishlist:", insertError.message);
      return { error: "Failed to add item to wishlist" };
    }
    
    revalidatePath('/customer/wishlist');
    revalidatePath(`/product/${productId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error in addToWishlist:", error);
    return { error: error instanceof Error ? error.message : "Failed to add to wishlist" };
  }
}

/**
 * Remove a product from the user's wishlist
 */
export async function removeFromWishlist(formData: FormData) {
  try {
    // Get cookies for server client
    const cookieStore = await cookies();
    
    // Create a Supabase client that has access to the user's session via cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get session using the cookie-based client
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Using wishlistItemId is more efficient than finding by productId
    const wishlistItemId = formData.get("wishlistItemId") as string;
    
    if (!wishlistItemId) {
      return { error: "Wishlist item ID is required" };
    }
    
    // Delete the item directly by ID (RLS policies will ensure only own items can be deleted)
    const { error: deleteError } = await supabase
      .from('WishlistItem')
      .delete()
      .eq('id', wishlistItemId);
      
    if (deleteError) {
      console.error("Error removing item from wishlist:", deleteError.message);
      return { error: "Failed to remove item from wishlist" };
    }
    
    revalidatePath('/customer/wishlist');
    
    return { success: true };
  } catch (error) {
    console.error("Error in removeFromWishlist:", error);
    return { error: error instanceof Error ? error.message : "Failed to remove from wishlist" };
  }
}

/**
 * Check if a product is in the user's wishlist
 */
export async function isInWishlist(productId: string) {
  try {
    // Get cookies for server client
    const cookieStore = await cookies();
    
    // Create a Supabase client that has access to the user's session via cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get session using the cookie-based client
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { inWishlist: false };
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    if (!customer) {
      return { inWishlist: false };
    }
    
    // Get the customer's wishlist
    const wishlistResult = await getCustomerWishlist(customer.id);
    if (!wishlistResult) {
      return { inWishlist: false };
    }
    
    // Check if the product is in the wishlist
    const { data, error } = await supabase
      .from('WishlistItem')
      .select('id')
      .eq('wishlist_id', wishlistResult.wishlist.id)
      .eq('product_id', productId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error("Error checking wishlist:", error.message);
      return { inWishlist: false, error: error.message };
    }
    
    return { inWishlist: !!data, wishlistItemId: data?.id };
  } catch (error) {
    console.error("Error in isInWishlist:", error);
    return { inWishlist: false, error: error instanceof Error ? error.message : "Failed to check wishlist" };
  }
}

/**
 * Add or remove a product from the wishlist
 */
export async function toggleWishlistItem(productId: string) {
  try {
    // Check if the product is already in the wishlist
    const { inWishlist, wishlistItemId, error: checkError } = await isInWishlist(productId);
    
    if (checkError) {
      return { error: checkError };
    }
    
    // If the product is in the wishlist, remove it
    if (inWishlist && wishlistItemId) {
      const formData = new FormData();
      formData.append("wishlistItemId", wishlistItemId);
      return await removeFromWishlist(formData);
    }
    
    // Otherwise, add it
    const formData = new FormData();
    formData.append("productId", productId);
    return await addToWishlist(formData);
  } catch (error) {
    console.error("Error in toggleWishlistItem:", error);
    return { error: error instanceof Error ? error.message : "Failed to toggle wishlist item" };
  }
} 