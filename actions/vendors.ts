"use server";

import { db } from "../lib/db";

/**
 * Get featured vendors for homepage
 */
export async function getFeaturedVendors(limit = 3) {
  try {
    // Fetch approved vendors
    const vendors = await db.vendor.findMany({
      where: {
        isApproved: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        products: {
          select: {
            id: true,
            categoryId: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Get reviews data for these vendors
    const vendorIds = vendors.map(vendor => vendor.id);
    const reviewsData = await db.review.groupBy({
      by: ['productId'],
      where: {
        product: {
          vendorId: {
            in: vendorIds,
          },
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // Create a map of vendor IDs to review data
    const vendorReviews = new Map();
    for (const review of reviewsData) {
      const product = await db.product.findUnique({
        where: { id: review.productId },
        select: { vendorId: true },
      });
      
      if (product) {
        const vendorId = product.vendorId;
        if (!vendorReviews.has(vendorId)) {
          vendorReviews.set(vendorId, { totalRating: 0, totalReviews: 0 });
        }
        
        const data = vendorReviews.get(vendorId);
        const avgRating = review._avg.rating ?? 0; // Handle null case with nullish coalescing
        data.totalRating += avgRating * review._count.rating;
        data.totalReviews += review._count.rating;
        vendorReviews.set(vendorId, data);
      }
    }

    // Get category data for each vendor
    const vendorCategories = new Map();
    for (const vendor of vendors) {
      const categories = await db.category.findMany({
        where: {
          products: {
            some: {
              vendorId: vendor.id,
            },
          },
        },
        distinct: ['id'],
        take: 3,
      });
      vendorCategories.set(vendor.id, categories);
    }

    // Format the data
    return vendors.map(vendor => {
      const reviewData = vendorReviews.get(vendor.id) || { totalRating: 0, totalReviews: 0 };
      const avgRating = reviewData.totalReviews > 0 
        ? reviewData.totalRating / reviewData.totalReviews 
        : 4.5; // Default rating if no reviews
        
      const categories = vendorCategories.get(vendor.id) || [];
      
      return {
        id: vendor.id,
        name: vendor.storeName,
        description: vendor.description || '',
        image: vendor.banner || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070',
        logo: vendor.logo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=1938',
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: reviewData.totalReviews,
        productCount: vendor._count.products,
        slug: `${vendor.storeName.toLowerCase().replace(/\s+/g, '-')}-${vendor.id.slice(0, 8)}`,
        categories: categories.map((category: { name: string; id: string }) => category.name),
      };
    });
  } catch (error) {
    console.error("Error fetching featured vendors:", error);
    return [];
  }
}