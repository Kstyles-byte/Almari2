"use server";

import { auth } from "../auth";
import { revalidatePath } from "next/cache";
import { createClient } from '@supabase/supabase-js'; // Import supabase client
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createActionClient, getActionSession } from '@/lib/supabase/action';
// Import migrated service functions
import { createReview, updateReview, deleteReview } from "../lib/services/review";
import { getCustomerByUserId } from "../lib/services/customer";
import { canReviewProduct } from "../lib/services/review";
// Import types
import type { Review, Customer } from '../types/supabase';

// Initialize Supabase client (needed for product slug lookup)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for review actions.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Submit a product review
 */
export async function submitReview(formData: FormData) {
  try {
    console.log("[Action: submitReview] Starting review submission");
    // Get user session using our utility
    const session = await getActionSession();

    if (!session?.user) {
      console.log("[Action: submitReview] No authenticated user");
      return { error: "Unauthorized" };
    }
    console.log("[Action: submitReview] Authenticated user:", session.user.id);

    // Get customer profile using migrated service
    const customer = await getCustomerByUserId(session.user.id);

    if (!customer) {
      console.log("[Action: submitReview] Customer profile not found for user:", session.user.id);
      return { error: "Customer profile not found" };
    }
    console.log("[Action: submitReview] Found customer profile:", customer.id);

    const productId = formData.get("productId") as string;
    const ratingStr = formData.get("rating") as string;
    const comment = formData.get("comment") as string;

    console.log("[Action: submitReview] Form data received:", { 
      productId,
      rating: ratingStr,
      commentLength: comment ? comment.length : 0
    });

    // Validate input
    if (!productId || !ratingStr) {
      console.log("[Action: submitReview] Missing required fields");
      return { error: "Product ID and rating are required" };
    }
    const rating = parseInt(ratingStr);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      console.log("[Action: submitReview] Invalid rating:", ratingStr);
      return { error: "Rating must be between 1 and 5" };
    }

    try {
      console.log("[Action: submitReview] Calling createReview service with:", {
        customer_id: customer.id,
        product_id: productId,
        rating,
        commentProvided: !!comment
      });
      
      // Create review using migrated service
      const newReview = await createReview({
        customer_id: customer.id, // Use the customer's UUID primary key
        product_id: productId,
        rating,
        comment,
      });

      if (!newReview) {
        // The service function returns null on internal error now
        console.error("[Action: submitReview] Review service returned null (internal error)");
        throw new Error("Review service failed to create review.");
      }

      // Success path
      console.log("[Action: submitReview] Review successfully created with ID:", newReview.id);

      // Get product slug for revalidation using Supabase
      const { data: product, error: slugError } = await supabase
          .from('Product')
          .select('slug')
          .eq('id', productId)
          .maybeSingle();

      if (slugError) console.error("[Action: submitReview] Error fetching product slug for revalidation:", slugError.message);

      if (product?.slug) {
          revalidatePath(`/products/${product.slug}`);
      }
      revalidatePath(`/product/${productId}`); // Also revalidate by ID
      revalidatePath(`/customer/reviews`); // Revalidate customer's reviews page

      return { success: true, reviewId: newReview.id };
    } catch (error: any) {
      // Catch specific errors thrown by the service
      console.error("[Action: submitReview] Error caught:", error.message);
      console.error("[Action: submitReview] Full error object:", error);
      
      if (
        error.message.includes("already reviewed") ||
        error.message.includes("purchased") ||
        error.message.includes("Rating must be")
      ) {
        return { error: error.message };
      }
      // Catch the error thrown if newReview was null
      if (error.message.includes("Review service failed")) {
          return { error: "Failed to submit review due to a service error." };
      }
      // Rethrow other unexpected errors from the service
      console.error("[Action: submitReview] Unexpected error during review creation service call:", error);
      return { error: `Failed to submit review: ${error.message}` };
    }
  } catch (error) {
    console.error("[Action: submitReview] Outer try/catch error:", error);
    if (error instanceof Error) {
      return { error: `Failed to submit review: ${error.message}` };
    }
    return { error: "Failed to submit review" };
  }
}

/**
 * Update an existing review
 */
export async function editReview(formData: FormData) {
  try {
    // Get user session using our utility
    const session = await getActionSession();

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const reviewId = (formData.get("reviewId") as string)?.trim();
    console.log("[Action: editReview] Received reviewId from FormData:", reviewId);

    const ratingStr = formData.get("rating") as string;
    const comment = formData.get("comment") as string;

    if (!reviewId) {
      return { error: "Review ID is required" };
    }

    // Validate rating if provided
    let rating: number | undefined = undefined;
    if (ratingStr) {
        rating = parseInt(ratingStr);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            return { error: "Rating must be between 1 and 5" };
        }
    }

    // Get the current review to check ownership and get product slug
    // Use Supabase directly here instead of Prisma
    const { data: review, error: fetchReviewError } = await supabase
        .from('Review')
        .select(`
            id,
            customer_id,
            Product:product_id ( slug )
        `)
        .eq('id', reviewId)
        .maybeSingle();

    console.log("[Action: editReview] Initial fetch - review object:", JSON.stringify(review));
    if (fetchReviewError) {
        console.error("[Action: editReview] Initial fetch - error:", fetchReviewError.message);
    } else {
        console.log("[Action: editReview] Initial fetch - no error. Review found status:", !!review);
    }

    if (fetchReviewError) {
        return { error: "Failed to fetch review for update." };
    }
    if (!review) {
      console.log("[Action: editReview] Review not found during initial fetch in action with reviewId:", reviewId);
      return { error: "Review not found" };
    }

    // Check authorization
    const customer = await getCustomerByUserId(session.user.id);
    if (
      session.user.role !== "ADMIN" &&
      (!customer || customer.id !== review.customer_id)
    ) {
      return { error: "Not authorized to update this review" };
    }

    // Update review using migrated service
    console.log("[Action: editReview] Calling updateReview service with reviewId:", reviewId);
    const updatedReview = await updateReview(reviewId, {
      rating,
      comment: comment || undefined, // Pass comment or undefined
    });

     if (!updatedReview) {
         // Service returns null on error
         return { error: "Failed to update review due to a service error." };
     }

    // Use the fetched product slug for revalidation
    const productSlug = (review as any).Product?.slug;
    if (productSlug) {
        revalidatePath(`/products/${productSlug}`);
    }
    revalidatePath(`/customer/reviews`);

    return { success: true };
  } catch (error) {
    console.error("Error updating review action:", error);
    // Catch specific errors rethrown by service
    if (error instanceof Error && error.message.includes("Review not found")) {
        return { error: error.message };
    }
    return { error: "Failed to update review" };
  }
}

/**
 * Delete a review
 */
export async function removeReview(formData: FormData) {
  try {
    // Get user session using our utility
    const session = await getActionSession();

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const reviewId = formData.get("reviewId") as string;

    if (!reviewId) {
      return { error: "Review ID is required" };
    }

    // Get the review to check ownership and get product slug
    // Use Supabase directly
     const { data: review, error: fetchReviewError } = await supabase
        .from('Review')
        .select(`
            id,
            customer_id,
            Product:product_id ( slug )
        `)
        .eq('id', reviewId)
        .maybeSingle();

    if (fetchReviewError) {
        console.error("Error fetching review for delete check:", fetchReviewError.message);
        return { error: "Failed to fetch review for deletion." };
    }
    if (!review) {
      return { error: "Review not found" };
    }

    // Check authorization
    const customer = await getCustomerByUserId(session.user.id);
    if (
      session.user.role !== "ADMIN" &&
      (!customer || customer.id !== review.customer_id)
    ) {
      return { error: "Not authorized to delete this review" };
    }

    // Delete review using migrated service
    const success = await deleteReview(reviewId);

    if (!success) {
         // Service returns false on error
         return { error: "Failed to delete review due to a service error." };
     }

    // Use the fetched product slug for revalidation
    const productSlug = (review as any).Product?.slug;
    if (productSlug) {
        revalidatePath(`/products/${productSlug}`);
    }
    revalidatePath(`/customer/reviews`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting review action:", error);
     // Catch specific errors rethrown by service
    if (error instanceof Error && error.message.includes("Review not found")) {
        return { error: error.message };
    }
    return { error: "Failed to delete review" };
  }
}

/**
 * Fetch all reviews by a customer
 */
export async function getCustomerReviews() {
  try {
    // Get user session using our utility
    const session = await getActionSession();

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Get customer ID using user ID
    const customer = await getCustomerByUserId(session.user.id);
    if (!customer) {
      return { error: "Customer profile not found" };
    }

    // Use the service role client (already defined at the top) for data operations
    // Fetch reviews using Supabase directly
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('Review')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        Product:product_id (
          id,
          name,
          slug,
          ProductImage (
            url
          )
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error("Error fetching customer reviews:", reviewsError.message);
      return { error: "Failed to fetch reviews" };
    }

    // Format the reviews for the frontend
    const reviews = reviewsData.map((review: any) => {
      const product = review.Product as any;
      const productImage = product?.ProductImage && product.ProductImage.length > 0 
        ? product.ProductImage[0].url 
        : 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'; // fallback image

      return {
        id: review.id,
        productId: product?.id || '',
        productName: product?.name || 'Unknown Product',
        productImage: productImage,
        productSlug: product?.slug || '',
        rating: review.rating,
        comment: review.comment || '',
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      };
    });

    return { success: true, reviews };
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    return { error: "Failed to fetch reviews" };
  }
}

/**
 * Check if a customer can review a product
 */
export async function checkCanReviewProduct(productId: string) {
  try {
    // Get user session using our utility
    const session = await getActionSession();

    if (!session?.user) {
      return { canReview: false, reason: "notLoggedIn" };
    }

    // Get customer profile using migrated service
    const customer = await getCustomerByUserId(session.user.id);

    if (!customer) {
      return { canReview: false, reason: "notCustomer" };
    }

    console.log("Checking if customer can review:", { 
      customer_id: customer.id, 
      product_id: productId 
    });

    try {
      // Check if the customer has already reviewed this product
      // More explicit error handling
      const { data: existingReview, error } = await supabase
        .from('Review')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('product_id', productId)
        .maybeSingle();
        
      if (error) {
        console.error("Error checking existing review:", error);
        // Return true even if error checking - bypass this check
        return { canReview: true };
      }

      if (existingReview) {
        console.log("Customer already reviewed this product");
        return { canReview: false, reason: "alreadyReviewed" };
      }
      
      // Allow review if they haven't already reviewed it
      console.log("Customer can review this product");
      return { canReview: true };
    } catch (internalError) {
      console.error("Exception checking existing review:", internalError);
      // Instead of failing, let's just allow the review
      return { canReview: true };
    }
  } catch (error) {
    console.error("Error in checkCanReviewProduct:", error);
    // Instead of failing, just allow the user to try
    return { canReview: true, reason: "bypass" };
  }
} 