"use server";

import { auth } from "../auth";
import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { getVendorByUserId } from "../lib/services/vendor";

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(limit = 8) {
  try {
    // Fetch products that are published and have inventory > 0
    // Sort by comparePrice (for products on sale) and createdAt (for new products)
    const products = await db.product.findMany({
      where: {
        isPublished: true,
        inventory: {
          gt: 0,
        },
      },
      include: {
        images: {
          orderBy: {
            order: 'asc'
          },
          take: 1,
        },
        category: true,
        vendor: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: [
        {
          comparePrice: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      take: limit,
    });

    // Format the data
    return products.map(product => {
      // Calculate average rating
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
        slug: product.slug,
        image: product.images[0]?.url || '/placeholder-product.jpg',
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: product.reviews.length,
        isNew: new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days
        vendor: product.vendor?.storeName || 'Unknown',
        category: product.category?.name
      };
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

/**
 * Add a new product
 */
export async function addProduct(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Verify user is a vendor
    if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
      return { error: "Only vendors can add products" };
    }
    
    // Get vendor ID
    let vendorId: string;
    
    if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      
      if (!vendor) {
        return { error: "Vendor profile not found" };
      }
      
      vendorId = vendor.id;
    } else {
      // Admin is adding a product for a vendor
      const vendorIdFromForm = formData.get("vendorId") as string;
      
      if (!vendorIdFromForm) {
        return { error: "Vendor ID is required" };
      }
      
      vendorId = vendorIdFromForm;
    }
    
    // Get form data
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const comparePrice = formData.get("comparePrice") 
      ? parseFloat(formData.get("comparePrice") as string) 
      : null;
    const categoryId = formData.get("categoryId") as string;
    const inventory = parseInt(formData.get("inventory") as string || "0");
    const isPublished = formData.get("isPublished") === "true";
    const imagesJson = formData.get("images") as string;
    
    // Validate required fields
    if (!name || !price || !categoryId) {
      return { error: "Name, price, and category are required" };
    }
    
    // Validate numeric fields
    if (isNaN(price) || price <= 0) {
      return { error: "Price must be greater than 0" };
    }
    
    if (comparePrice !== null && (isNaN(comparePrice) || comparePrice <= 0)) {
      return { error: "Compare price must be greater than 0" };
    }
    
    if (isNaN(inventory) || inventory < 0) {
      return { error: "Inventory must be 0 or greater" };
    }
    
    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });
    
    if (!category) {
      return { error: "Category not found" };
    }
    
    // Parse images
    let images = [];
    try {
      if (imagesJson) {
        images = JSON.parse(imagesJson);
      }
    } catch (e) {
      return { error: "Invalid images format" };
    }
    
    // Generate slug
    const slug = slugify(`${name}-${Date.now()}`, { lower: true });
    
    // Create product
    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price,
        comparePrice: comparePrice || undefined,
        categoryId,
        inventory,
        isPublished,
        vendorId,
      },
    });
    
    // Add images if provided
    if (images.length > 0) {
      await Promise.all(
        images.map((image: { url: string; alt?: string }, index: number) =>
          db.productImage.create({
            data: {
              productId: product.id,
              url: image.url,
              alt: image.alt || product.name,
              order: index,
            },
          })
        )
      );
    }
    
    revalidatePath("/vendor/products");
    return { success: true, productId: product.id };
  } catch (error) {
    console.error("Error adding product:", error);
    return { error: "Failed to add product" };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const productId = formData.get("id") as string;
    
    if (!productId) {
      return { error: "Product ID is required" };
    }
    
    // Get the product
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true,
      },
    });
    
    if (!product) {
      return { error: "Product not found" };
    }
    
    // Check authorization
    if (
      session.user.role !== "ADMIN" &&
      (session.user.role !== "VENDOR" || product.vendor.userId !== session.user.id)
    ) {
      return { error: "Not authorized to update this product" };
    }
    
    // Get form data
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const comparePrice = formData.get("comparePrice") 
      ? parseFloat(formData.get("comparePrice") as string) 
      : null;
    const categoryId = formData.get("categoryId") as string;
    const inventory = parseInt(formData.get("inventory") as string || "0");
    const isPublished = formData.get("isPublished") === "true";
    const imagesJson = formData.get("images") as string;
    
    // Validate required fields
    if (!name || !price || !categoryId) {
      return { error: "Name, price, and category are required" };
    }
    
    // Validate numeric fields
    if (isNaN(price) || price <= 0) {
      return { error: "Price must be greater than 0" };
    }
    
    if (comparePrice !== null && (isNaN(comparePrice) || comparePrice <= 0)) {
      return { error: "Compare price must be greater than 0" };
    }
    
    if (isNaN(inventory) || inventory < 0) {
      return { error: "Inventory must be 0 or greater" };
    }
    
    // Generate new slug if name changed
    const slug = name !== product.name 
      ? slugify(`${name}-${Date.now()}`, { lower: true }) 
      : product.slug;
    
    // Update product
    await db.product.update({
      where: { id: productId },
      data: {
        name,
        slug,
        description,
        price,
        comparePrice: comparePrice || undefined,
        categoryId,
        inventory,
        isPublished,
      },
    });
    
    // Handle images update if provided
    if (imagesJson) {
      try {
        const images = JSON.parse(imagesJson);
        
        // Delete existing images
        await db.productImage.deleteMany({
          where: { productId },
        });
        
        // Add new images
        if (images.length > 0) {
          await Promise.all(
            images.map((image: { url: string; alt?: string }, index: number) =>
              db.productImage.create({
                data: {
                  productId,
                  url: image.url,
                  alt: image.alt || name,
                  order: index,
                },
              })
            )
          );
        }
      } catch (e) {
        console.error("Error updating product images:", e);
        return { error: "Invalid images format" };
      }
    }
    
    revalidatePath(`/vendor/products/${productId}`);
    revalidatePath(`/vendor/products`);
    revalidatePath(`/products/${slug}`);
    
    return { success: true, productId };
  } catch (error) {
    console.error("Error updating product:", error);
    return { error: "Failed to update product" };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const productId = formData.get("id") as string;
    
    if (!productId) {
      return { error: "Product ID is required" };
    }
    
    // Get the product
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true,
      },
    });
    
    if (!product) {
      return { error: "Product not found" };
    }
    
    // Check authorization
    if (
      session.user.role !== "ADMIN" &&
      (session.user.role !== "VENDOR" || product.vendor.userId !== session.user.id)
    ) {
      return { error: "Not authorized to delete this product" };
    }
    
    // Check if product is in any cart or order
    const cartItem = await db.cartItem.findFirst({
      where: { productId },
    });
    
    if (cartItem) {
      return { error: "Cannot delete product as it exists in a cart" };
    }
    
    const orderItem = await db.orderItem.findFirst({
      where: { productId },
    });
    
    if (orderItem) {
      return { error: "Cannot delete product as it exists in an order" };
    }
    
    // Delete product images first
    await db.productImage.deleteMany({
      where: { productId },
    });
    
    // Delete product reviews
    await db.review.deleteMany({
      where: { productId },
    });
    
    // Delete product
    await db.product.delete({
      where: { id: productId },
    });
    
    revalidatePath("/vendor/products");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { error: "Failed to delete product" };
  }
} 