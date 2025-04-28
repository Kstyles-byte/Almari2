"use server";

import { auth } from "../auth";
import { revalidatePath } from "next/cache";
import { createClient } from '@supabase/supabase-js'; // Import supabase client
// Import migrated service functions
import { createReview, updateReview, deleteReview } from "../lib/services/review";
import { getCustomerByUserId } from "../lib/services/customer";
import type { Review, Customer } from '../types/supabase'; // Import types

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
    const session = await auth();

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Get customer profile using migrated service
    const customer = await getCustomerByUserId(session.user.id);

    if (!customer) {
      return { error: "Customer profile not found" };
    }

    const productId = formData.get("productId") as string;
    const ratingStr = formData.get("rating") as string;
    const comment = formData.get("comment") as string;

    // Validate input
    if (!productId || !ratingStr) {
      return { error: "Product ID and rating are required" };
    }
    const rating = parseInt(ratingStr);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return { error: "Rating must be between 1 and 5" };
    }

    try {
      // Create review using migrated service
      const newReview = await createReview({
        customerId: customer.id, // Use the customer's UUID primary key
        productId,
        rating,
        comment,
      });

      if (!newReview) {
           // The service function returns null on internal error now
           throw new Error("Review service failed to create review.");
      }

      // Get product slug for revalidation using Supabase
      const { data: product, error: slugError } = await supabase
          .from('Product')
          .select('slug')
          .eq('id', productId)
          .maybeSingle();

      if (slugError) console.error("Error fetching product slug for revalidation:", slugError.message);

      if (product?.slug) {
          revalidatePath(`/products/${product.slug}`);
      }
      revalidatePath(`/product/${productId}`); // Also revalidate by ID
      revalidatePath(`/customer/reviews`); // Revalidate customer's reviews page

      return { success: true, reviewId: newReview.id };
    } catch (error: any) {
        // Catch specific errors thrown by the service
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
      console.error("Unexpected error during review creation service call:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error submitting review action:", error);
    return { error: "Failed to submit review" };
  }
}

/**
 * Update an existing review
 */
export async function editReview(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const reviewId = formData.get("reviewId") as string;
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
            customerId,
            Product:productId ( slug )
        `)
        .eq('id', reviewId)
        .maybeSingle();

    if (fetchReviewError) {
        console.error("Error fetching review for edit check:", fetchReviewError.message);
        return { error: "Failed to fetch review for update." };
    }
    if (!review) {
      return { error: "Review not found" };
    }

    // Check authorization
    const customer = await getCustomerByUserId(session.user.id);
    if (
      session.user.role !== "ADMIN" &&
      (!customer || customer.id !== review.customerId)
    ) {
      return { error: "Not authorized to update this review" };
    }

    // Update review using migrated service
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
    const session = await auth();

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
            customerId,
            Product:productId ( slug )
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
      (!customer || customer.id !== review.customerId)
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