'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// Validation schemas
const updateProductStatusSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  status: z.enum(['ACTIVE', 'PENDING', 'REJECTED', 'DRAFT', 'OUT_OF_STOCK']),
  rejectionReason: z.string().optional(),
});

const updateProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive').optional(),
  compareAtPrice: z.number().positive('Compare at price must be positive').optional().nullable(),
  sku: z.string().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'REJECTED', 'DRAFT', 'OUT_OF_STOCK']).optional(),
  categoryIds: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

const deleteProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

type UpdateProductStatusInput = z.infer<typeof updateProductStatusSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;
type DeleteProductInput = z.infer<typeof deleteProductSchema>;

/**
 * Check if the current user has admin permissions
 */
async function checkAdminPermission() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return session.user;
}

/**
 * Approve a pending product
 */
export async function approveProduct(productId: string) {
  await checkAdminPermission();
  
  try {
    // Check if product exists and is pending
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    
    if (existingProduct.status !== 'PENDING') {
      throw new Error('Only pending products can be approved');
    }
    
    // Update product status to active
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        status: 'ACTIVE',
        // Add approved date if necessary
        // approvedAt: new Date(),
      },
    });
    
    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: existingProduct.userId,
        title: 'Product Approved',
        message: `Your product "${existingProduct.name}" has been approved and is now live.`,
        type: 'PRODUCT_APPROVED',
        data: { productId: existingProduct.id },
      },
    });
    
    // Revalidate products page
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    
    return { success: true, product };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Reject a pending product
 */
export async function rejectProduct(productId: string, rejectionReason: string) {
  await checkAdminPermission();
  
  try {
    // Check if product exists and is pending
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    
    if (existingProduct.status !== 'PENDING') {
      throw new Error('Only pending products can be rejected');
    }
    
    // Update product status to rejected
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        status: 'REJECTED',
        // Store rejection reason
        metadata: {
          ...(existingProduct.metadata as object || {}),
          rejectionReason,
        },
      },
    });
    
    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: existingProduct.userId,
        title: 'Product Rejected',
        message: `Your product "${existingProduct.name}" has been rejected. Reason: ${rejectionReason}`,
        type: 'PRODUCT_REJECTED',
        data: { 
          productId: existingProduct.id,
          rejectionReason,
        },
      },
    });
    
    // Revalidate products page
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    
    return { success: true, product };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Update product status
 */
export async function updateProductStatus(data: UpdateProductStatusInput) {
  await checkAdminPermission();
  
  try {
    // Validate input data
    const validatedData = updateProductStatusSchema.parse(data);
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: validatedData.id },
    });
    
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    
    const updateData: any = {
      status: validatedData.status,
    };
    
    // If rejecting, include rejection reason in metadata
    if (validatedData.status === 'REJECTED' && validatedData.rejectionReason) {
      updateData.metadata = {
        ...(existingProduct.metadata as object || {}),
        rejectionReason: validatedData.rejectionReason,
      };
    }
    
    // Update product status
    const product = await prisma.product.update({
      where: { id: validatedData.id },
      data: updateData,
    });
    
    // Create notification for vendor based on status update
    let notificationType, notificationTitle, notificationMessage;
    
    switch (validatedData.status) {
      case 'ACTIVE':
        notificationType = 'PRODUCT_APPROVED';
        notificationTitle = 'Product Approved';
        notificationMessage = `Your product "${existingProduct.name}" has been approved and is now live.`;
        break;
      case 'REJECTED':
        notificationType = 'PRODUCT_REJECTED';
        notificationTitle = 'Product Rejected';
        notificationMessage = `Your product "${existingProduct.name}" has been rejected.${validatedData.rejectionReason ? ` Reason: ${validatedData.rejectionReason}` : ''}`;
        break;
      default:
        notificationType = 'PRODUCT_STATUS_UPDATED';
        notificationTitle = 'Product Status Updated';
        notificationMessage = `Your product "${existingProduct.name}" status has been updated to ${validatedData.status}.`;
    }
    
    await prisma.notification.create({
      data: {
        userId: existingProduct.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        data: { 
          productId: existingProduct.id,
          status: validatedData.status,
          rejectionReason: validatedData.rejectionReason,
        },
      },
    });
    
    // Revalidate products page
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${validatedData.id}`);
    
    return { success: true, product };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(data: UpdateProductInput) {
  await checkAdminPermission();
  
  try {
    // Validate input data
    const validatedData = updateProductSchema.parse(data);
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: validatedData.id },
      include: {
        categories: true,
      },
    });
    
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    
    // Build update object
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.compareAtPrice !== undefined) updateData.compareAtPrice = validatedData.compareAtPrice;
    if (validatedData.sku !== undefined) updateData.sku = validatedData.sku;
    if (validatedData.stock !== undefined) updateData.stock = validatedData.stock;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.images !== undefined) updateData.images = validatedData.images;
    
    // Handle category updates if provided
    let categoryConnect;
    if (validatedData.categoryIds) {
      // Get current category IDs to compare
      const currentCategoryIds = existingProduct.categories.map(cat => cat.id);
      const newCategoryIds = validatedData.categoryIds;
      
      // Disconnect categories that are no longer included
      const categoriesToDisconnect = currentCategoryIds.filter(id => !newCategoryIds.includes(id));
      // Connect new categories
      const categoriesToConnect = newCategoryIds.filter(id => !currentCategoryIds.includes(id));
      
      updateData.categories = {
        disconnect: categoriesToDisconnect.map(id => ({ id })),
        connect: categoriesToConnect.map(id => ({ id })),
      };
    }
    
    // Update product
    const product = await prisma.product.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        categories: true,
      },
    });
    
    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: existingProduct.userId,
        title: 'Product Updated',
        message: `Your product "${existingProduct.name}" has been updated by an administrator.`,
        type: 'PRODUCT_UPDATED',
        data: { productId: existingProduct.id },
      },
    });
    
    // Revalidate products page
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${validatedData.id}`);
    
    return { success: true, product };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(data: DeleteProductInput) {
  await checkAdminPermission();
  
  try {
    // Validate input data
    const validatedData = deleteProductSchema.parse(data);
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: validatedData.id },
    });
    
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    
    // Delete product
    await prisma.product.delete({
      where: { id: validatedData.id },
    });
    
    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: existingProduct.userId,
        title: 'Product Deleted',
        message: `Your product "${existingProduct.name}" has been deleted by an administrator.`,
        type: 'PRODUCT_DELETED',
        data: { productName: existingProduct.name },
      },
    });
    
    // Revalidate products page
    revalidatePath('/admin/products');
    
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Get product details
 */
export async function getProductDetails(productId: string) {
  await checkAdminPermission();
  
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        categories: true,
        reviews: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return { success: true, product };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Get products with filtering and pagination
 */
export async function getProducts({
  page = 1,
  limit = 10,
  search = '',
  category = '',
  status = '',
  vendor = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  vendor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  await checkAdminPermission();
  
  try {
    const skip = (page - 1) * limit;
    
    // Build the where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.categories = {
        some: {
          name: { equals: category, mode: 'insensitive' },
        },
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (vendor) {
      where.storeId = vendor;
    }
    
    // Validate and sanitize sortBy to prevent SQL injection
    const validSortFields = ['createdAt', 'name', 'price', 'stock', 'status'];
    if (!validSortFields.includes(sortBy)) {
      sortBy = 'createdAt';
    }
    
    // Count total products for pagination
    const totalProducts = await prisma.product.count({ where });
    
    // Get products with pagination, filtering, and sorting
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });
    
    return {
      success: true,
      products,
      pagination: {
        totalItems: totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Get all categories
 */
export async function getCategories() {
  await checkAdminPermission();
  
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return { success: true, categories };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Get product analytics
 */
export async function getProductAnalytics(productId: string) {
  await checkAdminPermission();
  
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Get number of orders
    const totalOrders = await prisma.orderItem.count({
      where: { productId },
    });
    
    // Get total revenue from this product
    const orders = await prisma.orderItem.findMany({
      where: { productId },
      select: {
        quantity: true,
        unitPrice: true,
      },
    });
    
    const totalRevenue = orders.reduce((acc, order) => acc + (order.quantity * order.unitPrice), 0);
    
    // Get review stats
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: {
        rating: true,
      },
    });
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
      : 0;
    
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };
    
    // Get view count if available
    const viewCount = product.metadata?.viewCount || 0;
    
    return {
      success: true,
      analytics: {
        totalOrders,
        totalRevenue,
        totalReviews,
        averageRating,
        ratingDistribution,
        viewCount,
        conversionRate: viewCount > 0 ? (totalOrders / viewCount) * 100 : 0,
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
} 