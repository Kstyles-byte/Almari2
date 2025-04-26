'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// Validation schemas
const updateVendorSchema = z.object({
  id: z.string().min(1, 'Vendor ID is required'),
  name: z.string().min(1, 'Store name is required').optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'VERIFIED']).optional(),
  logo: z.string().url('Invalid logo URL').optional().nullable(),
  banner: z.string().url('Invalid banner URL').optional().nullable(),
  contactEmail: z.string().email('Invalid contact email').optional(),
  contactPhone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  address: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

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
 * Update vendor store information
 */
export async function updateVendor(data: UpdateVendorInput) {
  await checkAdminPermission();
  
  try {
    // Validate input data
    const validatedData = updateVendorSchema.parse(data);
    
    // Check if vendor exists
    const existingVendor = await prisma.store.findUnique({
      where: { id: validatedData.id },
    });
    
    if (!existingVendor) {
      throw new Error('Vendor store not found');
    }
    
    // Update vendor
    const vendor = await prisma.store.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status,
        logo: validatedData.logo,
        banner: validatedData.banner,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone,
        website: validatedData.website,
        address: validatedData.address,
      },
    });
    
    // Update store categories if provided
    if (validatedData.categories && validatedData.categories.length > 0) {
      // First delete existing connections
      await prisma.categoriesOnStores.deleteMany({
        where: { storeId: vendor.id },
      });
      
      // Then add new connections
      for (const categoryId of validatedData.categories) {
        await prisma.categoriesOnStores.create({
          data: {
            store: { connect: { id: vendor.id } },
            category: { connect: { id: categoryId } },
          },
        });
      }
    }
    
    // Revalidate admin vendors page
    revalidatePath('/admin/vendors');
    revalidatePath(`/admin/vendors/${vendor.id}`);
    
    return { success: true, vendor };
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
 * Change vendor status
 */
export async function changeVendorStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'VERIFIED') {
  await checkAdminPermission();
  
  try {
    // Check if vendor exists
    const existingVendor = await prisma.store.findUnique({
      where: { id },
    });
    
    if (!existingVendor) {
      throw new Error('Vendor store not found');
    }
    
    // Update vendor status
    const vendor = await prisma.store.update({
      where: { id },
      data: { status },
    });
    
    // Revalidate admin vendors page
    revalidatePath('/admin/vendors');
    revalidatePath(`/admin/vendors/${vendor.id}`);
    
    return { success: true, vendor };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Delete vendor
 */
export async function deleteVendor(id: string) {
  await checkAdminPermission();
  
  try {
    // Check if vendor exists
    const existingVendor = await prisma.store.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
    
    if (!existingVendor) {
      throw new Error('Vendor store not found');
    }
    
    // First check if vendor has products
    if (existingVendor.products.length > 0) {
      throw new Error('Cannot delete vendor with existing products. Please delete products first or deactivate the vendor instead.');
    }
    
    // Delete store's category connections
    await prisma.categoriesOnStores.deleteMany({
      where: { storeId: id },
    });
    
    // Delete store
    await prisma.store.delete({
      where: { id },
    });
    
    // Revalidate admin vendors page
    revalidatePath('/admin/vendors');
    
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Get vendors with filtering and pagination
 */
export async function getVendors({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  await checkAdminPermission();
  
  try {
    const skip = (page - 1) * limit;
    
    // Build the where clause
    const where: any = {
      user: {
        role: 'VENDOR',
      },
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    // Count total vendors for pagination
    const totalVendors = await prisma.store.count({ where });
    
    // Get vendors with pagination
    const vendors = await prisma.store.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
    
    // Get rating for each vendor
    const vendorsWithRating = await Promise.all(
      vendors.map(async (vendor) => {
        const reviews = await prisma.review.findMany({
          where: {
            product: {
              storeId: vendor.id,
            },
          },
          select: {
            rating: true,
          },
        });
        
        let avgRating = 0;
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          avgRating = parseFloat((totalRating / reviews.length).toFixed(1));
        }
        
        return {
          ...vendor,
          rating: avgRating,
        };
      })
    );
    
    return {
      success: true,
      vendors: vendorsWithRating,
      pagination: {
        totalItems: totalVendors,
        totalPages: Math.ceil(totalVendors / limit),
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
 * Get vendor details by ID
 */
export async function getVendorById(id: string) {
  await checkAdminPermission();
  
  try {
    const vendor = await prisma.store.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        products: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            status: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    // Get store rating
    const reviews = await prisma.review.findMany({
      where: {
        product: {
          storeId: vendor.id,
        },
      },
      select: {
        rating: true,
      },
    });
    
    let rating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      rating = parseFloat((totalRating / reviews.length).toFixed(1));
    }
    
    // Get orders associated with this vendor
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              storeId: vendor.id,
            },
          },
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    
    return { 
      success: true, 
      vendor: {
        ...vendor,
        rating,
        recentOrders: orders,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
} 