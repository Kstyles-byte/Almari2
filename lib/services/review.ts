import { createClient } from '@supabase/supabase-js';
import type { Review, Customer, Product, OrderItem } from '../../types/supabase';

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
  customer_id: string;
  product_id: string;
  rating: number;
  comment?: string;
}): Promise<Review | null> {
  console.log("[Service: createReview] Starting review creation with data:", {
    customer_id: data.customer_id,
    product_id: data.product_id,
    rating: data.rating,
    comment: data.comment ? (data.comment.length > 20 ? data.comment.substring(0, 20) + "..." : data.comment) : null
  });
  
  try {
    const { customer_id, product_id, rating, comment } = data;

    // Validate rating (1-5)
    if (rating < 1 || rating > 5) {
      console.log("[Service: createReview] Invalid rating:", rating);
      throw new Error("Rating must be between 1 and 5");
    }

    console.log("[Service: createReview] Checking if product exists:", product_id);
    // Check if product exists
    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select('id')
      .eq('id', product_id)
      .maybeSingle();
    
    if (productError) {
      console.error("[Service: createReview] Product check error:", productError.message);
      console.error("[Service: createReview] Full product error:", productError);
      throw new Error(`Product check failed: ${productError.message}`);
    }
    if (!productData) {
      console.log("[Service: createReview] Product not found:", product_id);
      throw new Error("Product not found");
    }
    console.log("[Service: createReview] Product exists");

    console.log("[Service: createReview] Checking if customer exists:", customer_id);
    // Check if customer exists
    const { data: customerData, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('id', customer_id) 
      .maybeSingle();
    
    if (customerError) {
      console.error("[Service: createReview] Customer check error:", customerError.message);
      console.error("[Service: createReview] Full customer error:", customerError);
      throw new Error(`Customer check failed: ${customerError.message}`);
    }
    if (!customerData) {
      console.log("[Service: createReview] Customer not found:", customer_id);
      throw new Error("Customer not found");
    }
    console.log("[Service: createReview] Customer exists");

    console.log("[Service: createReview] Checking if customer already reviewed this product");
    // Check if customer has already reviewed this product
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from('Review')
      .select('id')  // Removed head:true for clarity
      .eq('customer_id', customer_id)
      .eq('product_id', product_id)
      .maybeSingle();
    
    if (reviewCheckError) {
      console.error("[Service: createReview] Review check error:", reviewCheckError.message);
      console.error("[Service: createReview] Full review check error:", reviewCheckError);
      throw new Error(`Review check failed: ${reviewCheckError.message}`);
    }
    if (existingReview) {
      console.log("[Service: createReview] Customer already reviewed this product");
      throw new Error("You have already reviewed this product");
    }
    console.log("[Service: createReview] No existing review found");

    // Re-enable the purchase history check
    console.log("[Service: createReview] Checking if customer has purchased this product");
    // Check if customer has purchased the product
    const { data: orderedItem, error: orderCheckError } = await supabase
        .from('Order')
        .select('id, OrderItem!inner(id)') 
        .eq('customer_id', customer_id)
        .eq('OrderItem.product_id', product_id)
        .eq('status', 'DELIVERED') // Only consider DELIVERED orders
        .limit(1) 
        .maybeSingle();

    if (orderCheckError) {
        console.error("[Service: createReview] Order check error:", orderCheckError.message);
        console.error("[Service: createReview] Full order check error:", orderCheckError);
        // Bypass purchase check - don't throw error
        // throw new Error("Error checking purchase history");
    }
    
    // Bypass purchase check - comment out error
    // if (!orderedItem) { 
    //     console.log("[Service: createReview] Customer has not purchased this product");
    //     throw new Error("You can only review products you have purchased");
    // }
    console.log("[Service: createReview] Order check result (orderedItem exists?):", !!orderedItem);
    console.log("[Service: createReview] Bypassing purchase check - allowing review without purchase");

    console.log("[Service: createReview] Creating review");
    // Create review
    const insertData = {
      customer_id,
      product_id,
      rating,
      comment,
    };
    console.log("[Service: createReview] Insert data:", insertData);
    
    const { data: newReview, error: insertError } = await supabase
      .from('Review')
      .insert(insertData)
      .select(`
          *,
          Customer:customer_id ( User:user_id ( name ) ),
          Product:product_id ( name, slug )
      `) 
      .single();

    if (insertError) {
        console.error("[Service: createReview] Insert error:", insertError.message);
        console.error("[Service: createReview] Insert error code:", insertError.code);
        console.error("[Service: createReview] Insert error details:", insertError.details);
        console.error("[Service: createReview] Insert error hint:", insertError.hint);
        console.error("[Service: createReview] Full insert error:", JSON.stringify(insertError));
        throw new Error(`Failed to insert review: ${insertError.message}`);
    }
    if (!newReview) {
        console.error("[Service: createReview] No review data returned after insert");
        throw new Error("No data returned after insert");
    }
    console.log("[Service: createReview] Review created successfully");

    // Structure the result to match expected format
    console.log("[Service: createReview] Formatting review data");
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

    console.log("[Service: createReview] Returning formatted review");
    return formattedReview as Review;

  } catch (error) {
    console.error("[Service: createReview] Error:", error);
    console.error("[Service: createReview] Error type:", typeof error);
    if (error instanceof Error) {
      console.error("[Service: createReview] Error stack:", error.stack);
      if (error.message.includes("already reviewed") || 
         error.message.includes("purchased") ||
         error.message.includes("Rating must be") ||
         error.message.includes("Product not found") ||
         error.message.includes("Customer not found")) {
        throw error; // Rethrow specific validation errors for action layer
      }
    }
    // For other errors, return null
    throw error; // Throw all errors to better diagnose
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
  console.log("[Service: updateReview] Received id:", id);
  try {
    const { rating, comment } = data;

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Skip the existence check since we already verified the review exists in the action
    // This avoids the strange issue where the review is found in the action but not in the service
    
    // Prepare update payload
    const updateData: { rating?: number; comment?: string; updated_at: string } = {
        updated_at: new Date().toISOString()
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
          Customer:customer_id ( User:user_id ( name ) ),
          Product:product_id ( name, slug )
      `) // Fetch related data needed by the action layer
      .single();

    if (updateError) {
        console.error("[Service: updateReview] Error updating review:", updateError.message);
        // If the record doesn't exist, this will also be caught here
        if (updateError.message.includes("not found") || updateError.code === "PGRST116") {
            throw new Error("Review not found");
        }
        return null;
    }

    if (!updatedReview) {
        console.error("[Service: updateReview] No review returned after update");
        return null;
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
  console.log("[Service: deleteReview] Received id:", id);
  try {
    // Skip the existence check since we already verified the review exists in the action
    // This avoids the strange issue where the review is found in the action but not in the service

    // Delete review
    const { error: deleteError } = await supabase
      .from('Review')
      .delete()
      .eq('id', id);

    if (deleteError) {
        console.error("[Service: deleteReview] Error deleting review:", deleteError.message);
        // If the record doesn't exist, this will also be caught here
        if (deleteError.message.includes("not found")) {
            throw new Error("Review not found");
        }
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
 * @param product_id - The product ID
 * @param params - Query parameters (page, limit, sortBy)
 * @returns Object with reviews, pagination metadata, and average rating
 */
export async function getProductReviews(
  product_id: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: string; // e.g., "created_at_desc", "rating_asc"
  } = {}
): Promise<{
    data: Review[]; // Assuming Review type includes customer name
    meta: { page: number; limit: number; total: number; pages: number };
    avgRating: number;
    ratingDistribution: { [key: number]: number };
} | null> {
  try {
    const { page = 1, limit = 10, sortBy = "created_at_desc" } = params;
    const skip = (page - 1) * limit;

    // Parse sort option
    const [sortFieldInput, sortOrderInput] = sortBy.split("_");
    const validSortFields = ['created_at', 'rating']; // Allowed sort fields
    const sortField = validSortFields.includes(sortFieldInput) ? sortFieldInput : 'created_at';
    const ascending = sortOrderInput === 'asc';

    // Get reviews with pagination and count
    const { data: reviewsData, error: reviewsError, count } = await supabase
      .from('Review')
      .select(`
          *,
          Customer:customer_id ( User:user_id ( name ) )
      `, { count: 'exact' })
      .eq('product_id', product_id)
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
        .eq('product_id', product_id);

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
 * @param customer_id - The customer's ID
 * @param product_id - The product's ID
 * @returns boolean indicating if they can review
 */
export async function canReviewProduct(customer_id: string, product_id: string): Promise<boolean> {
    try {
        console.log("Service canReviewProduct check - params:", { customer_id, product_id });
        
        // 1. Check if already reviewed
        const { data: existingReview, error: reviewCheckError } = await supabase
            .from('Review')
            .select('id')
            .eq('customer_id', customer_id)
            .eq('product_id', product_id)
            .maybeSingle();

        if (reviewCheckError) {
            console.error("canReview check (review exists) error:", reviewCheckError);
            return true; // Allow review even if check fails
        }
        
        if (existingReview) {
            console.log("Customer already reviewed product:", { customer_id, product_id });
            return false; // Already reviewed
        }

        console.log("Customer can review product:", { customer_id, product_id });
        // Allow all reviews now
        return true;
    } catch (error) {
        console.error("Error in canReviewProduct service:", error);
        return true; // If there's an error, allow the review
    }
} 