import { createClient } from '@supabase/supabase-js';
import type { Review, Customer, Product, OrderItem } from '../../types/supabase'; // Assuming these types exist

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Ensure keys are available
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for review service.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Create a new product review
 * @param data - The review data
 * @returns The created review object (or null on error)
 */
export async function createReview(data: {
  customerId: string;
  productId: string;
  rating: number;
  comment?: string;
}): Promise<Review | null> { // Return type adjusted for potential errors
  try {
    const { customerId, productId, rating, comment } = data;

    // Validate rating (1-5)
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if product exists
    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select('id')
      .eq('id', productId)
      .maybeSingle();
    if (productError) throw new Error(`Product check failed: ${productError.message}`);
    if (!productData) throw new Error("Product not found");

    // Check if customer exists
    const { data: customerData, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('id', customerId) // Assuming customerId is the UUID primary key of the Customer table
      .maybeSingle();
    if (customerError) throw new Error(`Customer check failed: ${customerError.message}`);
    if (!customerData) throw new Error("Customer not found");

    // Check if customer has already reviewed this product
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from('Review')
      .select('id', { head: true }) // More efficient check
      .eq('customerId', customerId)
      .eq('productId', productId)
      .maybeSingle();
    if (reviewCheckError) throw new Error(`Review check failed: ${reviewCheckError.message}`);
    if (existingReview) throw new Error("You have already reviewed this product");

    // Check if customer has purchased the product
    // This requires joining Order and OrderItem or a dedicated check logic
    // Assuming 'Order' has 'customerId' and 'status', 'OrderItem' has 'orderId' and 'productId'
    const { data: orderedItem, error: orderCheckError } = await supabase
        .from('Order')
        .select('id, OrderItem!inner(id)') // Check if an inner join works based on FKs
        .eq('customerId', customerId)
        // Add status check based on your Order table's status values
        // .in('status', ['DELIVERED', 'COMPLETED']) // Example status check
        .eq('OrderItem.productId', productId)
        .limit(1) // We just need to know if at least one exists
        .maybeSingle();

    if (orderCheckError) {
        console.error("Order check error:", orderCheckError.message); // Log but maybe don't block? Depends on policy
        // throw new Error(`Order check failed: ${orderCheckError.message}`);
    }
    // If we require purchase, throw error if no matching item found
    // if (!orderedItem) {
    //     throw new Error("You can only review products you have purchased");
    // }
    // --- OR --- Alternative check if the above join is complex/doesn't work:
    // Fetch orders for customer, then check items (less efficient)
    // const { data: orders } = await supabase.from('Order').select('id').eq('customerId', customerId).in('status', ['DELIVERED']);
    // if (orders && orders.length > 0) {
    //    const orderIds = orders.map(o => o.id);
    //    const { data: item } = await supabase.from('OrderItem').select('id').eq('productId', productId).in('orderId', orderIds).limit(1);
    //    if (!item) throw new Error("You can only review products you have purchased");
    // } else {
    //    throw new Error("You can only review products you have purchased");
    // }


    // Create review
    const { data: newReview, error: insertError } = await supabase
      .from('Review')
      .insert({
        customerId,
        productId,
        rating,
        comment,
        // createdAt/updatedAt should be handled by DB defaults
      })
      .select(`
          *,
          Customer:customerId ( User:userId ( name ) ),
          Product:productId ( name, slug )
      `) // Fetch related data needed by the action layer
      .single();

    if (insertError || !newReview) {
        console.error("Error creating review:", insertError?.message);
        return null; // Return null on error instead of throwing maybe?
        // throw new Error(`Failed to create review: ${insertError?.message}`);
    }

    // Structure the result to match Prisma include if necessary
    // Example: (Adjust based on actual Supabase response and Review type)
    const formattedReview = {
        ...newReview,
        customer: {
            user: { name: (newReview as any)?.Customer?.User?.name || null }
        },
        product: {
            name: (newReview as any)?.Product?.name || null,
            slug: (newReview as any)?.Product?.slug || null,
        }
    };
    // Remove nested helper objects if the type doesn't expect them
    delete (formattedReview as any).Customer;
    delete (formattedReview as any).Product;


    return formattedReview as Review; // Cast might be needed depending on type definition

  } catch (error) {
    console.error("Error in createReview service:", error);
    if (error instanceof Error && (error.message.includes("already reviewed") || error.message.includes("purchased"))) {
        throw error; // Rethrow specific validation errors for action layer
    }
    // Consider returning null or a specific error object instead of rethrowing generic errors
    return null;
  }
}

/**
 * Update an existing review
 * @param id - The review ID
 * @param data - The review data to update
 * @returns The updated review or null on error
 */
export async function updateReview(
  id: string,
  data: {
    rating?: number;
    comment?: string;
  }
): Promise<Review | null> {
  try {
    const { rating, comment } = data;

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if review exists before updating
    const { data: reviewExists, error: checkError } = await supabase
        .from('Review')
        .select('id', { head: true })
        .eq('id', id)
        .maybeSingle();

    if (checkError) throw new Error(`Review check failed: ${checkError.message}`);
    if (!reviewExists) throw new Error("Review not found");


    // Prepare update payload
    const updateData: { rating?: number; comment?: string; updatedAt: string } = {
        updatedAt: new Date().toISOString()
    };
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    // Update review
    const { data: updatedReview, error: updateError } = await supabase
      .from('Review')
      .update(updateData)
      .eq('id', id)
      .select(`
          *,
          Customer:customerId ( User:userId ( name ) ),
          Product:productId ( name, slug )
      `) // Fetch related data needed by the action layer
      .single();

    if (updateError || !updatedReview) {
        console.error("Error updating review:", updateError?.message);
        return null;
        // throw new Error(`Failed to update review: ${updateError?.message}`);
    }

     // Structure the result similar to createReview
    const formattedReview = {
        ...updatedReview,
        customer: {
            user: { name: (updatedReview as any)?.Customer?.User?.name || null }
        },
        product: {
            name: (updatedReview as any)?.Product?.name || null,
            slug: (updatedReview as any)?.Product?.slug || null,
        }
    };
    delete (formattedReview as any).Customer;
    delete (formattedReview as any).Product;

    return formattedReview as Review;

  } catch (error) {
    console.error("Error in updateReview service:", error);
     if (error instanceof Error && (error.message.includes("Rating must be") || error.message.includes("Review not found"))) {
        throw error; // Rethrow specific validation errors
    }
    return null;
  }
}

/**
 * Delete a review
 * @param id - The review ID
 * @returns boolean indicating success
 */
export async function deleteReview(id: string): Promise<boolean> {
  try {
    // Check if review exists before deleting
    const { data: reviewExists, error: checkError } = await supabase
        .from('Review')
        .select('id', { head: true })
        .eq('id', id)
        .maybeSingle();

    if (checkError) throw new Error(`Review check failed: ${checkError.message}`);
    if (!reviewExists) throw new Error("Review not found");

    // Delete review
    const { error: deleteError } = await supabase
      .from('Review')
      .delete()
      .eq('id', id);

    if (deleteError) {
        console.error("Error deleting review:", deleteError.message);
        throw new Error(`Failed to delete review: ${deleteError.message}`);
    }

    return true; // Indicate success

  } catch (error) {
    console.error("Error in deleteReview service:", error);
     if (error instanceof Error && error.message.includes("Review not found")) {
        throw error; // Rethrow specific validation errors
    }
    return false; // Indicate failure
  }
}

/**
 * Get reviews for a product
 * @param productId - The product ID
 * @param params - Query parameters (page, limit, sortBy)
 * @returns Object with reviews, pagination metadata, and average rating
 */
export async function getProductReviews(
  productId: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: string; // e.g., "createdAt_desc", "rating_asc"
  } = {}
): Promise<{
    data: Review[]; // Assuming Review type includes customer name
    meta: { page: number; limit: number; total: number; pages: number };
    avgRating: number;
    ratingDistribution: { [key: number]: number };
} | null> {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt_desc" } = params;
    const skip = (page - 1) * limit;

    // Parse sort option
    const [sortFieldInput, sortOrderInput] = sortBy.split("_");
    const validSortFields = ['createdAt', 'rating']; // Allowed sort fields
    const sortField = validSortFields.includes(sortFieldInput) ? sortFieldInput : 'createdAt';
    const ascending = sortOrderInput === 'asc';

    // Get reviews with pagination and count
    const { data: reviewsData, error: reviewsError, count } = await supabase
      .from('Review')
      .select(`
          *,
          Customer:customerId ( User:userId ( name ) )
      `, { count: 'exact' })
      .eq('productId', productId)
      .order(sortField, { ascending })
      .range(skip, skip + limit - 1);

    if (reviewsError) {
        console.error("Error fetching product reviews:", reviewsError.message);
        throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
    }

    // Format reviews to include customer name directly if needed by type
    const reviews = reviewsData?.map(r => {
        const formatted = {
            ...r,
            customer: { user: { name: (r as any)?.Customer?.User?.name || null } }
        };
        delete (formatted as any).Customer; // Clean up nested helper object
        return formatted as Review; // Cast to final type
    }) || [];

    const total = count ?? 0;

    // Calculate average rating and distribution (requires fetching all ratings or using DB function)
    // Inefficient way: Fetch all ratings
    const { data: allRatingsData, error: ratingsError } = await supabase
        .from('Review')
        .select('rating')
        .eq('productId', productId);

    let avgRating = 0;
    let ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (ratingsError) {
         console.error("Error fetching ratings for stats:", ratingsError.message);
         // Handle error, maybe return stats as null or default
    } else if (allRatingsData && allRatingsData.length > 0) {
        const numRatings = allRatingsData.length;
        const sumRatings = allRatingsData.reduce((sum, r) => sum + r.rating, 0);
        avgRating = parseFloat((sumRatings / numRatings).toFixed(1));
        allRatingsData.forEach(r => {
             if (r.rating >= 1 && r.rating <= 5) {
                ratingDistribution[r.rating]++;
             }
        });
    }
    // More efficient way would be using Supabase edge functions or DB functions
    // for aggregation if performance becomes an issue.

    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      avgRating,
      ratingDistribution,
    };

  } catch (error) {
    console.error("Error in getProductReviews service:", error);
    return null;
  }
}

/**
 * Check if a customer can review a specific product
 * Checks if they purchased it and haven't reviewed it yet
 * @param customerId - The customer's ID
 * @param productId - The product's ID
 * @returns boolean indicating if they can review
 */
export async function canReviewProduct(customerId: string, productId: string): Promise<boolean> {
    try {
        // 1. Check if already reviewed
        const { data: existingReview, error: reviewCheckError } = await supabase
            .from('Review')
            .select('id', { head: true })
            .eq('customerId', customerId)
            .eq('productId', productId)
            .maybeSingle();

        if (reviewCheckError) {
            console.error("canReview check (review exists) error:", reviewCheckError.message);
            return false; // Fail safe
        }
        if (existingReview) {
            return false; // Already reviewed
        }

        // 2. Check if purchased (using the same logic as createReview)
        const { data: orderedItem, error: orderCheckError } = await supabase
            .from('Order')
            .select('id, OrderItem!inner(id)')
            .eq('customerId', customerId)
            // .in('status', ['DELIVERED', 'COMPLETED']) // Example status check
            .eq('OrderItem.productId', productId)
            .limit(1)
            .maybeSingle();

         if (orderCheckError) {
            console.error("canReview check (order exists) error:", orderCheckError.message);
            return false; // Fail safe
        }

        return !!orderedItem; // Return true if an ordered item was found, false otherwise

    } catch (error) {
        console.error("Error in canReviewProduct service:", error);
        return false;
    }
} 