import { createClient } from '@supabase/supabase-js';
// Import from the central types index file
import type { Customer, Order, Review, Cart, CartItem, Product, Vendor, ProductImage } from '@/types/index'; 

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Ensure keys are available
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for customer service.");
  // Handle missing keys appropriately
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Get a customer by user ID
 * @param userId - The ID of the user (should match Supabase Auth user ID)
 * @returns The customer profile or null if not found
 */
export async function getCustomerByUserId(userId: string): Promise<Customer | null> {
  try {
    console.log(`Fetching customer with user_id: ${userId}`);
    
    // First try with 'user_id' (snake_case, which is Supabase's default convention)
    let { data, error } = await supabase
      .from('Customer')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching customer with user_id:", error.message, error.code);
      
      // If not found, try with 'userId' (camelCase, which might be used in some schemas)
      const result = await supabase
        .from('Customer')
        .select('*')
        .eq('userId', userId)
        .maybeSingle();
        
      data = result.data;
      error = result.error;
      
      if (error) {
        console.error("Error fetching customer with userId:", error.message, error.code);
        throw error;
      }
    }
    
    if (!data) {
      console.log(`No customer found for user_id: ${userId}`);
      return null;
    }
    
    console.log(`Customer found: ${data.id}`);
    return data as Customer;
  } catch (error) {
    console.error("Unexpected error in getCustomerByUserId:", error);
    throw error;
  }
}

/**
 * Get a customer by ID
 * @param id - The ID of the customer
 * @returns The customer profile or null if not found
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
     const { data, error } = await supabase
      .from('Customer')
      .select(`*, User:userId (id, name, email)`)
      .eq('id', id)
      .maybeSingle();

     if (error && error.code !== 'PGRST116') {
        console.error("Error fetching customer by ID:", error.message);
        throw error;
     }
    return data as Customer | null;
  } catch (error) {
    console.error("Unexpected error fetching customer by ID:", error);
    throw error;
  }
}

/**
 * Create a customer profile for a user
 * @param userId - The ID of the user
 * @param data - The customer profile data
 * @returns The created customer profile
 */
export async function createCustomerProfile(
  userId: string,
  data: {
    phone?: string | null;
    address?: string | null;
    hostel?: string | null;
    room?: string | null;
    college?: string | null;
  }
): Promise<Customer | null> {
  try {
    // Check if customer profile already exists for this userId
    const { data: existingCustomer, error: checkError } = await supabase
        .from('Customer')
        .select('id', { head: true })
        .eq('userId', userId)
        .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
         console.error("Error checking existing customer profile:", checkError.message);
         throw checkError;
    }
    if (existingCustomer) {
      throw new Error("Customer profile already exists for this user");
    }

    // Check if user exists in the custom 'User' table (or rely on FK constraint)
    // const { data: userData, error: userCheckError } = await supabase.from('User').select('id').eq('id', userId).maybeSingle();
    // if (userCheckError || !userData) throw new Error("User not found");

    // Create customer profile
    const insertData = {
        userId,
        phone: data.phone,
        address: data.address,
        hostel: data.hostel,
        room: data.room,
        college: data.college,
    };
    const { data: newCustomer, error: insertError } = await supabase
        .from('Customer')
        .insert(insertData)
        .select()
        .single();

    if (insertError) {
        console.error("Error creating customer profile:", insertError.message);
        throw insertError;
    }

    return newCustomer as Customer | null;

  } catch (error) {
    console.error("Error in createCustomerProfile service:", error);
    throw error;
  }
}

/**
 * Update a customer profile
 * @param id - The ID of the customer
 * @param data - The customer profile data to update
 * @returns The updated customer profile
 */
export async function updateCustomerProfile(
  id: string, // Customer ID
  data: {
    phone?: string | null;
    address?: string | null;
    hostel?: string | null;
    room?: string | null;
    college?: string | null;
  }
): Promise<Customer | null> {
  try {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    const { data: updatedCustomer, error } = await supabase
        .from('Customer')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating customer profile:", error.message);
        if (error.code === 'PGRST116') throw new Error("Customer not found");
        throw error;
    }

    return updatedCustomer as Customer | null;

  } catch (error) {
    console.error("Error in updateCustomerProfile service:", error);
    throw error;
  }
}

/**
 * Get order history for a customer
 * @param customerId - The ID of the customer
 * @param params - Query parameters (page, limit, etc.)
 * @returns Orders with pagination
 */
export async function getCustomerOrders(
  customerId: string,
  params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}
) {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const statusFilter = params.status;
    const skip = (page - 1) * limit;

    // Start building Supabase query
    let query = supabase
      .from('Order')
      .select(`
        *,
        Agent:agent_id ( name, location ),
        OrderItem ( *, Product:product_id ( *, ProductImage!ProductImage_productId_fkey(url, order) ), Vendor:vendor_id(id, store_name) )
      `, { count: 'exact' })
      .eq('customer_id', customerId);

    // Apply status filter if provided
    if (statusFilter) {
      type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED' | 'PARTIALLY_FULFILLED';
      query = query.eq('status', statusFilter as OrderStatus);
    }

    // Apply sorting and pagination
    query = query.order('created_at', { ascending: false })
                 .range(skip, skip + limit - 1);

    // Execute the query
    const { data: ordersData, error, count } = await query;

    if (error) {
        console.error("Error fetching customer orders:", error.message);
        throw error;
    }

    // Format the data slightly
    const orders = ordersData?.map((order: any) => {
        const items = order.OrderItem?.map((item: any) => {
            const productImages = (item.Product?.ProductImage || []).sort((a:any, b:any) => a.order - b.order);
            return {
                ...item,
                product: {
                    ...item.Product,
                    images: productImages,
                    ProductImage: undefined // Remove original ProductImage array if desired
                },
                 vendor: item.Vendor // Include vendor info
            };
        });

        return {
            ...order,
            items: items || [],
            OrderItem: undefined // Remove original OrderItem array
        };
    }) || [];


    return {
      data: orders,
      meta: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error in getCustomerOrders service:", error);
    return {
        data: [],
        meta: { page: 1, limit: 10, total: 0, pages: 0 },
    };
  }
}

/**
 * Get customer's cart or create one if it doesn't exist
 * @param customerId - The ID of the customer
 * @returns The customer's cart with items
 */
export async function getCustomerCart(customerId: string): Promise<{ cart: Cart; items: any[]; cartTotal: number } | null> {
  try {
    // Try fetching existing cart with items and products
    let { data: cart, error: fetchCartError } = await supabase
      .from('Cart')
      .select(`
        *,
        CartItem ( *, Product:product_id ( *, ProductImage(url, display_order), Vendor:vendor_id(id, store_name) ) )
      `)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (fetchCartError && fetchCartError.code !== 'PGRST116') {
        console.error("Error fetching cart:", fetchCartError.message);
        throw fetchCartError;
    }

    // If cart doesn't exist, create it
    if (!cart) {
        const { data: newCart, error: createCartError } = await supabase
            .from('Cart')
            .insert({ customer_id: customerId })
            .select()
            .single();
        
        if (createCartError || !newCart) {
             console.error("Error creating cart:", createCartError?.message);
             throw new Error("Could not create cart for customer.");
        }
        cart = { ...newCart, CartItem: [] }; // Initialize with empty items array
    }

    // Define a more specific type for cart items after processing
    type ProcessedCartItem = CartItem & {
        product: Product & { images: ProductImage[], vendor: Vendor | null };
        vendor: Vendor | null; // Add vendor property directly to item
    };

    // Format items and calculate total
    const items: ProcessedCartItem[] = ((cart as any).CartItem || [])
        .map((item: any): ProcessedCartItem | null => { // Add return type to map callback
            const product = item.Product;
            if (!product) return null; // Skip item if product data is missing

            const productImages = (product.ProductImage || []).sort((a: any, b: any) => a.order - b.order);
            const vendorInfo = product.Vendor;
            
            // Remove nested relations before spreading
            delete product.ProductImage;
            delete product.Vendor;

            return {
                ...item,
                product: {
                    ...product,
                    images: productImages.slice(0, 1), // Keep only the first image
                    vendor: vendorInfo // Assign vendor here
                },
                vendor: vendorInfo // Assign vendor here as well if needed top-level
            };
        })
        .filter((item: ProcessedCartItem | null): item is ProcessedCartItem => item !== null); // Filter out null items

    // Calculate total with explicit types for reducer
    const cartTotal = items.reduce(
      (sum: number, item: ProcessedCartItem) => sum + (item.product?.price || 0) * item.quantity,
      0
    );

    // Remove the nested CartItem property before returning
    const cartResult = { ...(cart as any) };
    delete cartResult.CartItem;

    return {
      cart: cartResult as Cart,
      items: items, // Return the processed items
      cartTotal: parseFloat(cartTotal.toFixed(2)),
    };

  } catch (error) {
    console.error("Error in getCustomerCart service:", error);
    throw error; // Rethrow for action layer to handle
  }
}

/**
 * Get customer's reviews
 * @param customerId - The ID of the customer
 * @param params - Query parameters (page, limit, etc.)
 * @returns Reviews with pagination
 */
export async function getCustomerReviews(
  customerId: string,
  params: {
    page?: number;
    limit?: number;
  } = {}
) {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Get reviews using Supabase
    const { data: reviewsData, error, count } = await supabase
      .from('Review')
      .select(`
        *,
        Product:product_id ( id, name, slug, ProductImage!ProductImage_productId_fkey(url, order) )
      `, { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

     if (error) {
        console.error("Error fetching customer reviews:", error.message);
        throw error;
    }

    // Format data
    const reviews = reviewsData?.map((review: any) => {
        const productImages = (review.Product?.ProductImage || []).sort((a: any, b: any) => a.order - b.order);
        return {
            ...review,
            product: {
                ...review.Product,
                images: productImages.slice(0, 1), // Take first image
                ProductImage: undefined
            }
        };
    }) || [];

    return {
      data: reviews,
      meta: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
     return {
        data: [],
        meta: { page: 1, limit: 10, total: 0, pages: 0 },
    };
  }
} 