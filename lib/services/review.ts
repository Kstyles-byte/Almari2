import { db } from "../db";

/**
 * Create a new product review
 * @param data - The review data
 * @returns The created review
 */
export async function createReview(data: {
  customerId: string;
  productId: string;
  rating: number;
  comment?: string;
}) {
  try {
    const { customerId, productId, rating, comment } = data;
    
    // Validate rating (1-5)
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Check if customer exists
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    // Check if customer has already reviewed this product
    const existingReview = await db.review.findFirst({
      where: {
        customerId,
        productId,
      },
    });
    
    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }
    
    // Check if customer has purchased the product
    const hasOrdered = await db.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId,
          status: {
            in: ["DELIVERED", "COMPLETED"],
          },
        },
      },
    });
    
    if (!hasOrdered) {
      throw new Error("You can only review products you have purchased");
    }
    
    // Create review
    return await db.review.create({
      data: {
        customerId,
        productId,
        rating,
        comment,
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
}

/**
 * Update an existing review
 * @param id - The review ID
 * @param data - The review data to update
 * @returns The updated review
 */
export async function updateReview(
  id: string,
  data: {
    rating?: number;
    comment?: string;
  }
) {
  try {
    const { rating, comment } = data;
    
    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    // Check if review exists
    const review = await db.review.findUnique({
      where: { id },
    });
    
    if (!review) {
      throw new Error("Review not found");
    }
    
    // Update review
    return await db.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
}

/**
 * Delete a review
 * @param id - The review ID
 * @returns void
 */
export async function deleteReview(id: string) {
  try {
    // Check if review exists
    const review = await db.review.findUnique({
      where: { id },
    });
    
    if (!review) {
      throw new Error("Review not found");
    }
    
    // Delete review
    await db.review.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
}

/**
 * Get reviews for a product
 * @param productId - The product ID
 * @param params - Query parameters (page, limit, etc.)
 * @returns Reviews with pagination
 */
export async function getProductReviews(
  productId: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: string;
  } = {}
) {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt_desc" } = params;
    const skip = (page - 1) * limit;
    
    // Parse sort option
    const [sortField, sortOrder] = sortBy.split("_");
    const orderBy: { [key: string]: "asc" | "desc" } = {};
    orderBy[sortField] = sortOrder as "asc" | "desc";
    
    // Get reviews
    const reviews = await db.review.findMany({
      where: { productId },
      take: limit,
      skip: skip,
      orderBy,
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    
    // Get total count
    const total = await db.review.count({ where: { productId } });
    
    // Calculate average rating
    const ratingStats = await db.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: {
        rating: true,
      },
    });
    
    // Get average rating
    const avgRating = await db.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
    });
    
    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        avgRating: avgRating._avg.rating || 0,
        ratingStats,
      },
    };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    throw error;
  }
}

/**
 * Check if a customer has purchased a product (eligible to review)
 * @param customerId - The customer ID
 * @param productId - The product ID
 * @returns Boolean indicating if customer can review
 */
export async function canReviewProduct(customerId: string, productId: string) {
  try {
    // Check if customer has already reviewed this product
    const existingReview = await db.review.findFirst({
      where: {
        customerId,
        productId,
      },
    });
    
    if (existingReview) {
      return false;
    }
    
    // Check if customer has purchased the product
    const hasOrdered = await db.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId,
          status: {
            in: ["DELIVERED", "COMPLETED"],
          },
        },
      },
    });
    
    return !!hasOrdered;
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    throw error;
  }
} 