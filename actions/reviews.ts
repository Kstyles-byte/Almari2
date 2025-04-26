"use server";

import { auth } from "../auth";
import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import { createReview, updateReview, deleteReview } from "../lib/services/review";
import { getCustomerByUserId } from "../lib/services/customer";

/**
 * Submit a product review
 */
export async function submitReview(formData: FormData) {
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
    const rating = parseInt(formData.get("rating") as string);
    const comment = formData.get("comment") as string;
    
    // Validate input
    if (!productId || !rating) {
      return { error: "Product ID and rating are required" };
    }
    
    if (rating < 1 || rating > 5) {
      return { error: "Rating must be between 1 and 5" };
    }
    
    try {
      // Create review
      const review = await createReview({
        customerId: customer.id,
        productId,
        rating,
        comment,
      });
      
      // Get product slug for revalidation
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { slug: true },
      });
      
      revalidatePath(`/products/${product?.slug}`);
      return { success: true, reviewId: review.id };
    } catch (error: any) {
      if (
        error.message.includes("You have already reviewed this product") ||
        error.message.includes("You can only review products you have purchased")
      ) {
        return { error: error.message };
      }
      throw error;
    }
  } catch (error) {
    console.error("Error submitting review:", error);
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
    const rating = parseInt(formData.get("rating") as string);
    const comment = formData.get("comment") as string;
    
    if (!reviewId) {
      return { error: "Review ID is required" };
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return { error: "Rating must be between 1 and 5" };
    }
    
    // Get the review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: true,
        product: true,
      },
    });
    
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
    
    // Update review
    await updateReview(reviewId, {
      rating,
      comment,
    });
    
    revalidatePath(`/products/${review.product.slug}`);
    revalidatePath(`/customer/reviews`);
    
    return { success: true };
  } catch (error) {
    console.error("Error updating review:", error);
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
    
    // Get the review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: true,
        product: true,
      },
    });
    
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
    
    // Delete review
    await deleteReview(reviewId);
    
    revalidatePath(`/products/${review.product.slug}`);
    revalidatePath(`/customer/reviews`);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { error: "Failed to delete review" };
  }
} 