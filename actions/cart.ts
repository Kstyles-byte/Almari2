"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import { getCustomerByUserId, getCustomerCart } from "../lib/services/customer";
import type { Product, CartItem, Cart, Customer, ProductImage, Vendor } from '@/types';
import { z } from "zod";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Initialize Supabase client directly in this file for server actions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in cart actions.");
  // Handle appropriately - perhaps throw an error or return error states
}
// Initialize the service role client for actions requiring elevated privileges
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define the expected input type when called directly
interface AddToCartInput {
  productId: string;
  quantity: number;
}

// Define the return type
interface AddToCartResult {
  error?: string;
  success?: boolean;
}

/**
 * Add a product to the user's cart.
 * Can accept FormData from a form or an object for direct calls.
 */
export async function addToCart(input: FormData | AddToCartInput): Promise<AddToCartResult> {
  console.log("--- addToCart action started ---"); // Log start
  try {
    // Get cookies for server client
    const cookieStore = await cookies();
    
    // Create a Supabase client that has access to the user's session via cookies
    const supabaseAuth = createServerClient(
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
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Get session using the cookie-based client
    const { data: { session } } = await supabaseAuth.auth.getSession();
    console.log("Session object in addToCart:", JSON.stringify(session, null, 2)); // Log session object

    if (!session?.user) {
      // Guest user – rely on client-side store; skip server processing
      console.log("Guest addToCart call – skipping server action and returning success");
      return { success: true };
    }
    console.log("User ID from session:", session.user.id); // Log user ID

    const customer = await getCustomerByUserId(session.user.id);
    console.log("Customer profile fetched:", customer); // Log customer profile result

    if (!customer) {
      console.error(`Customer profile check failed for user ${session.user.id}.`); // Specific log
      return { error: "Customer profile not found" };
    }
    console.log("Customer profile found, ID:", customer.id); // Log success

    let productId: string | null | undefined;
    let quantity: number | undefined;

    // Extract data based on input type
    if (input instanceof FormData) {
      productId = input.get("productId") as string;
      const quantityStr = input.get("quantity") as string;
      quantity = quantityStr ? parseInt(quantityStr) : undefined;
    } else {
      productId = input.productId;
      quantity = input.quantity;
    }

    console.log(`Attempting to add Product ID: ${productId}, Quantity: ${quantity}`); // Log input

    // Validate input
    if (!productId) {
      console.error("Validation failed: Product ID missing.");
      return { error: "Product ID is required" };
    }
    if (quantity === undefined || isNaN(quantity) || quantity <= 0) {
      console.error(`Validation failed: Invalid quantity (${quantity}).`);
      return { error: "Quantity must be a positive number" };
    }
    
    // Check product existence, availability, and inventory
    console.log(`Fetching product details for ID: ${productId}`);
    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select('id, name, inventory, is_published')
      .eq('id', productId)
      .single();

    if (productError) {
        console.error("Error fetching product:", productError.message);
        return { error: "Failed to find product." };
    }
    console.log("Product data fetched:", productData);
    if (!productData) {
      console.error("Product not found in DB.");
      return { error: "Product not found." };
    }
    if (!productData.is_published) {
        console.error("Product is not published.");
        return { error: "Product is not available." };
    }
    if (productData.inventory < quantity) {
      console.error(`Insufficient inventory. Needed: ${quantity}, Available: ${productData.inventory}`);
      return { error: `Not enough inventory available for ${productData.name}. Only ${productData.inventory} left.` };
    }
    
    // Get or create cart
    console.log(`Getting cart for customer ID: ${customer.id}`);
    const cartResult = await getCustomerCart(customer.id);
    if (!cartResult) {
        console.error(`Failed to get or create cart for customer ${customer.id}.`);
        return { error: "Failed to retrieve or create cart." };
    }
    const cartId = cartResult.cart.id;
    console.log(`Cart ID: ${cartId}. Upserting item...`);

    // Upsert cart item
    const { error: upsertError } = await supabase
        .from('CartItem')
        .upsert({
            cart_id: cartId, // Ensure snake_case
            product_id: productId, // Ensure snake_case
            quantity: quantity,
        }, { 
            onConflict: 'cart_id, product_id', // Ensure snake_case
        });

    if (upsertError) {
        console.error("Error upserting cart item:", upsertError.message);
        return { error: "Failed to add item to cart." };
    }
    
    console.log("Item successfully added/updated in cart. Revalidating paths...");
    revalidatePath("/cart");
    revalidatePath(`/product/${productId}`); // Also revalidate product page if needed
    
    console.log("--- addToCart action finished successfully ---");
    return { success: true };

  } catch (error) {
    console.error("--- addToCart action failed with error: ---", error);
    return { error: error instanceof Error ? error.message : "Failed to add to cart" };
  }
}

/**
 * Update the quantity of an item in the user's cart
 */
export async function updateCartItem(formData: FormData) {
  try {
    // Get cookies for server client
    const cookieStore = await cookies();
    
    // Create a Supabase client that has access to the user's session via cookies
    const supabaseAuth = createServerClient(
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
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Get session using the cookie-based client
    const { data: { session } } = await supabaseAuth.auth.getSession();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    const cartItemId = formData.get("cartItemId") as string;
    const quantityStr = formData.get("quantity") as string;
    const quantity = parseInt(quantityStr);
    
    if (!cartItemId) {
      return { error: "Cart item ID is required" };
    }
    
    if (!quantityStr || isNaN(quantity) || quantity <= 0) {
      return { error: "Quantity must be a positive number" };
    }

    // Get customer's cart ID
    const cartResult = await getCustomerCart(customer.id);
    if (!cartResult) {
        return { error: "Failed to retrieve cart." };
    }
    const cartId = cartResult.cart.id;

    // Fetch the specific cart item and its product using Supabase
    const { data: cartItemData, error: fetchError } = await supabase
        .from('CartItem')
        .select(`
            id,
            quantity,
            cart_id,
            Product (
                id,
                name,
                inventory
            )
        `)
        .eq('id', cartItemId)
        .eq('cart_id', cartId)
        .single();

    if (fetchError) {
        console.error("Error fetching cart item:", fetchError.message);
        return { error: "Failed to find cart item." };
    }

    if (!cartItemData) {
      return { error: "Cart item not found or does not belong to user." };
    }

    // We need to assert the type for the nested product and handle array response
    // Supabase might return the related record as an array
    const productData = Array.isArray(cartItemData.Product) ? cartItemData.Product[0] : cartItemData.Product;
    const product = productData as Product | null;

    if (!product) {
        // This shouldn't happen if DB constraints are set up correctly, but check anyway
        console.error("Product data missing for cart item:", cartItemId);
        return { error: "Associated product not found for cart item." };
    }
    
    // Check if product has enough inventory
    if (product.inventory < quantity) {
      return { error: `Not enough inventory available for ${product.name}. Only ${product.inventory} left.` };
    }

    // Update cart item quantity using Supabase
    const { error: updateError } = await supabase
        .from('CartItem')
        .update({ quantity: quantity })
        .eq('id', cartItemId);

    if (updateError) {
        console.error("Error updating cart item:", updateError.message);
        return { error: "Failed to update cart item quantity." };
    }
    
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return { error: error instanceof Error ? error.message : "Failed to update cart item" };
  }
}

// Schema for removing an item
const removeFromCartSchema = z.object({
  cartItemId: z.string().uuid("Invalid cart item ID format."),
});

/**
 * Removes an item completely from the customer's cart.
 * @param prevState Previous form state (unused)
 * @param formData FormData containing cartItemId
 * @returns Object with success/error message or null on success
 */
export async function removeFromCart(
  prevState: any,
  formData: FormData
): Promise<{ error?: string } | null> {
  console.log("removeFromCart action initiated (Supabase)");

  // Validate input
  const validatedFields = removeFromCartSchema.safeParse({
    cartItemId: formData.get("cartItemId"),
  });

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return {
      error: `Invalid input: ${firstError || "Please provide a valid cart item ID."}`,
    };
  }

  const { cartItemId } = validatedFields.data;
  console.log(`Attempting to remove cart item: ${cartItemId}`);

  // Check user authentication
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
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
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  // Get session using the cookie-based client
  const { data: { session } } = await supabaseAuth.auth.getSession();
  
  if (!session?.user) {
    console.error("Authentication failed: No user session found.");
    return { error: "Authentication required." };
  }
  const userId = session.user.id;

  try {
    // Get customer profile using the helper function (expecting Customer | null)
    const customer: Customer | null = await getCustomerByUserId(userId); // Corrected handling

    // Check if customer exists
    if (!customer) {
      console.error(`Failed to get customer profile for user ${userId}.`);
      return { error: "Customer profile not found." };
    }

    // Get the customer's cart ID using the service function
    const cartResult = await getCustomerCart(customer.id);
    if (!cartResult) {
        console.error(`Failed to retrieve cart for customer ${userId}.`);
        return { error: "Customer cart not found." };
    }
    const customerCartId = cartResult.cart.id; // Use the fetched cart ID

    console.log(`Customer ${userId} cart ID: ${customerCartId}`);

    // Fetch the specific cart item to verify ownership
    const { data: cartItemData, error: fetchError } = await supabase
      .from("CartItem") // Use correct table name 'CartItem' based on types/prisma?
      .select("id, cart_id") // Adjust field name if needed (cart_id vs cartId)
      .eq("id", cartItemId)
      .single();

    if (fetchError) {
      console.error(`Error fetching cart item ${cartItemId}:`, fetchError);
      // Handle specific errors like P2025 (Not Found) if Supabase provides similar codes
      if (fetchError.code === 'PGRST116') { // PGRST116: "The result contains 0 rows"
         console.log(`Cart item ${cartItemId} not found during fetch.`);
         return { error: "Cart item not found." };
      }
      return { error: "Failed to retrieve cart item. Please try again." };
    }

    // This check might be redundant if single() throws PGRST116 on not found
    if (!cartItemData) {
      console.log(`Cart item ${cartItemId} not found (post-fetch check).`);
      return { error: "Cart item not found." };
    }

    // Verify the item belongs to the customer's cart using the fetched cart ID
    // Adjust field name if needed (cart_id vs cartId)
    if (cartItemData.cart_id !== customerCartId) { 
      console.error(
        `Security check failed: Cart item ${cartItemId} (cart ${cartItemData.cart_id}) does not belong to customer ${userId}'s cart (${customerCartId}).`
      );
      return { error: "Unauthorized action. Cannot remove this item." };
    }

    console.log(`Ownership verified. Cart item ${cartItemId} belongs to customer ${userId}. Proceeding with deletion.`);

    // Delete the cart item
    const { error: deleteError } = await supabase
      .from("CartItem") // Use correct table name
      .delete()
      .eq("id", cartItemId);

    if (deleteError) {
      console.error(`Error deleting cart item ${cartItemId}:`, deleteError);
      return { error: "Failed to remove item from cart. Please try again." };
    }

    console.log(`Successfully removed cart item ${cartItemId} for user ${userId}`);

    // Revalidate relevant paths to update UI
    revalidatePath("/cart");

    return null; // Indicate success
  } catch (error) {
    console.error("Unexpected error in removeFromCart:", error);
    return {
      error:
        "An unexpected error occurred while removing the item. Please try again later.",
    };
  }
}

/**
 * Clear all items from the user's cart
 */
export async function clearCart() {
  try {
    // Get cookies for server client
    const cookieStore = await cookies();
    
    // Create a Supabase client that has access to the user's session via cookies
    const supabaseAuth = createServerClient(
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
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Get session using the cookie-based client
    const { data: { session } } = await supabaseAuth.auth.getSession();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    // Get cart ID using the service function
    const cartResult = await getCustomerCart(customer.id);

    // If cart doesn't exist or failed to fetch, there's nothing to clear
    if (!cartResult) {
      console.log("No cart found or error fetching cart for customer:", customer.id);
      return { success: true }; // Nothing to clear, operation is 'successful'
    }
    const cartId = cartResult.cart.id;

    // Delete all cart items associated with the cart ID
    const { error: deleteError } = await supabase
      .from('CartItem') // Use correct table name
      .delete()
      .eq('cart_id', cartId); // Use correct field name (cart_id vs cartId)

    if (deleteError) {
        console.error(`Error clearing cart items for cart ${cartId}:`, deleteError.message);
        throw new Error("Failed to clear cart items.");
    }
  
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { error: error instanceof Error ? error.message : "Failed to clear cart" };
  }
}

export async function getCart(): Promise<{ success: boolean; cart?: any; message: string }> {
  console.log("Attempting to get cart...");
  // Add await here
  const cookieStore = await cookies(); 
  // This supabase instance is created with cookies for RLS based on the user session
  const supabaseRLS = createServerClient( 
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Add set and remove if needed by createServerClient operations later
        // set(name: string, value: string, options: CookieOptions) {
        //   cookieStore.set({ name, value, ...options })
        // },
        // remove(name: string, options: CookieOptions) {
        //   cookieStore.delete({ name, ...options })
        // },
      },
    }
  );

  const {
    data: { session },
  } = await supabaseRLS.auth.getSession(); // Use supabaseRLS here

  if (!session?.user) {
    console.log("No user session found.");
    return { success: false, message: "User not authenticated." };
  }

  const userId = session.user.id;
  console.log("User ID:", userId);

  try {
    // Fetch customer profile first using the separate function
    // Use the service-role client `supabase` for fetching potentially restricted data
    const customerProfile = await getCustomerByUserId(userId);

    if (!customerProfile) {
      console.error(`Customer profile not found for user ID: ${userId}`);
      return { success: false, message: "Customer profile not found." };
    }
    console.log("Customer profile found:", customerProfile.id);

    // Now, fetch the cart using the customer ID
    // Use the service-role client `supabase` for this fetch as well
    const { data: cartData, error: cartError } = await supabase 
      .from('Cart') // Use correct table name 'Cart'
      .select('id') // Select only the cart ID
      .eq('customer_id', customerProfile.id) // Fixed: use snake_case 'customer_id' instead of 'customerId'
      .maybeSingle(); // Expect one or zero carts

    if (cartError) {
      console.error("Error fetching cart:", cartError);
      return { success: false, message: `Error fetching cart: ${cartError.message}` };
    }

    if (!cartData) {
      console.log("No cart found for customer:", customerProfile.id);
      // Optionally create a cart here if one doesn't exist, or return empty
      return { success: true, cart: { items: [] }, message: "Cart is empty." }; // Return empty cart structure
    }

    const cartId = cartData.id; // Get the cart ID
    console.log("Cart ID found:", cartId);

    // Define the type for the structure returned by THIS SPECIFIC QUERY
    // Adjusting to expect product as an OBJECT or null
    type CartItemQueryResult = {
      id: string;
      quantity: number;
      product: ({
        // Explicitly list fields selected in the query
        id: string;
        name: string;
        price: number;
        inventory: number;
        is_published: boolean;
        // Relations are nested objects/arrays
        images: Pick<ProductImage, 'url' | 'alt_text'>[] | null;
        // Expect vendor relation within product to also be an object
        vendor: Pick<Vendor, 'id' | 'store_name'> | null; 
      }) | null; 
    };

    // Fetch cart items with product details (including images and vendor)
    // Use the service-role client `supabase`
    const { data: cartItems, error: itemsError } = await supabase 
      .from("CartItem") // Use correct table name
      .select(`
        id,
        quantity,
        product: Product!inner (
          id,
          name,
          price,
          inventory,
          is_published,
          images: ProductImage ( url, alt_text ),
          vendor: Vendor ( id, store_name )
        )
      `)
      .eq("cart_id", cartId); // Fixed: use snake_case 'cart_id' instead of 'cartId'

    if (itemsError) {
      console.error("Error fetching cart items:", itemsError);
      return { success: false, message: `Error fetching cart items: ${itemsError.message}` };
    }

    console.log("Cart items fetched:", cartItems);

    // Flatten the structure slightly for easier frontend consumption
    const formattedItems = cartItems?.map((item: any) => { // Use 'any' for item type here
      // Safely access nested properties
      const product = item.product; // Access product directly 
      const images = product?.images;
      const vendor = product?.vendor; 

      return {
        id: item.id,
        quantity: item.quantity,
        productId: product ? product.id : '',
        name: product ? product.name : 'Product not found',
        slug: product ? product.name.replace(/\s+/g, '-').toLowerCase() : '#',
        price: product ? product.price : 0,
        inventory: product ? product.inventory : 0,
        image: images?.[0]?.url ?? '/placeholder-product.jpg', 
        imageAlt: images?.[0]?.alt_text ?? 'Product image', 
        vendorId: vendor ? vendor.id : 'N/A',
        vendorName: vendor ? vendor.store_name : 'N/A',
      };
    }) ?? [];

    const validItems = formattedItems ?? [];

    // Calculate totals based on validItems
    const totalQuantity = validItems.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = validItems.reduce((total, item) => total + (item.quantity * item.price), 0);

    console.log("Data being returned by getCart:", JSON.stringify({ id: cartId, items: validItems }, null, 2)); // Log returned data

    return {
      success: true,
      cart: { id: cartId, items: validItems },
      message: "Cart retrieved successfully.",
    };

  } catch (error: any) {
    console.error("Unexpected error in getCart:", error);
    return { success: false, message: `An unexpected error occurred: ${error.message}` };
  }
} 